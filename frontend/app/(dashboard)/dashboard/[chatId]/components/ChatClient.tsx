"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/auth";
import { useUpdateChatAgentMutation, useUploadFileMutation } from "@/app/(dashboard)/dashboard/hooks";
import { AGENT_OPTIONS, AgentOption } from "./chat/AgentDropdown";
import { Message, SelectedDoc } from "./chat/types";
import HeroHeading from "./chat/HeroHeading";
import SuggestedPrompts from "./chat/SuggestedPrompts";
import Composer from "./chat/Composer";
import MessageList from "./chat/MessageList";
import useAutoResizeTextarea from "./chat/useAutoResizeTextarea";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1";

interface ChatClientProps {
  chatId?: string;
  initialMessages?: Message[];
  initialAgent?: string | null;
}

export default function ChatClient({ chatId, initialMessages = [], initialAgent = null }: ChatClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<SelectedDoc[]>([]);

  const initialAgentOption = useMemo(() => {
    if (!initialAgent) return null;
    return AGENT_OPTIONS.find((opt) => opt.tag.toLowerCase() === initialAgent.toLowerCase()) || null;
  }, [initialAgent]);

  const [selectedAgent, setSelectedAgent] = useState<AgentOption | null>(initialAgentOption);

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current && prevChatIdRef.current !== chatId) {
      setSelectedAgent(initialAgentOption);
    }
    prevChatIdRef.current = chatId;
  }, [chatId, initialAgentOption]);

  const updateChatAgentMutation = useUpdateChatAgentMutation();
  const uploadFileMutation = useUploadFileMutation();

  const handleSetSelectedAgent = useCallback(
    (agentOrFn: React.SetStateAction<AgentOption | null>) => {
      setSelectedAgent((prev) => {
        const next = typeof agentOrFn === "function" ? agentOrFn(prev) : agentOrFn;
        if (chatId) {
          updateChatAgentMutation.mutate({ chatId, agent: next ? next.tag : null });
        }
        return next;
      });
    },
    [chatId, updateChatAgentMutation]
  );

  const isAnyFileUploading = useMemo(
    () => selectedDocs.some((d) => d.isUploading),
    [selectedDocs]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("webSearch");
      if (saved !== null) {
        setWebSearch(saved === "true");
      }
    }
  }, []);

  const handleSetWebSearch = useCallback((value: boolean) => {
    setWebSearch(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("webSearch", String(value));
    }
  }, []);

  const inConversation = messages.length > 0;

  const { ref: textareaRef, resize } = useAutoResizeTextarea<HTMLTextAreaElement>();
  useEffect(() => resize(), [input, resize]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Auto focus input on mount when on new chat page
  useEffect(() => {
    if (!inConversation && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [inConversation, textareaRef]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  const handleSend = useCallback(async (textOverride?: string) => {
    const rawText = textOverride ?? input;
    if (!rawText.trim() || isStreaming || isAnyFileUploading) return;
    const text = rawText.trim();
    setInput("");

    const attachments = selectedDocs.map(d => ({
      name: d.name,
      content: d.content,
      url: d.url,
      googleUri: d.googleUri,
      mimeType: d.type,
      size: d.size
    }));
    setSelectedDocs([]);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      attachments: attachments.map((att, idx) => ({
        id: `att-local-${idx}-${Date.now()}`,
        name: att.name,
        url: att.url || "",
        googleUri: att.googleUri,
        mimeType: att.mimeType,
        size: att.size
      }))
    };
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", status: "" }]);

    setIsStreaming(true);

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          chatId,
          message: text,
          webSearch: selectedAgent?.key === "scout" ? webSearch : false,
          attachments,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }

      const newChatId = response.headers.get("x-chat-id");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let done = false;
      let assistantText = "";
      let currentStatus = "";
      let buffer = "";
      let streamCreatedChatId: string | null = null;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith("data: ")) {
              const dataStr = trimmed.slice(6).trim();
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === "status" && parsed.content) {
                  currentStatus = parsed.content;
                } else if (parsed.type === "message" && parsed.content) {
                  assistantText += parsed.content;
                } else if (parsed.type === "end" && parsed.content) {
                  streamCreatedChatId = parsed.content;
                }
              } catch {
                assistantText += dataStr;
              }
            } else {
              assistantText += trimmed;
            }
          }

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText, status: currentStatus } : m))
          );
          scrollToBottom();
        }
      }

      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith("data: ")) {
          const dataStr = trimmed.slice(6).trim();
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === "status" && parsed.content) {
              currentStatus = parsed.content;
            } else if (parsed.type === "message" && parsed.content) {
              assistantText += parsed.content;
            } else if (parsed.type === "end" && parsed.content) {
              streamCreatedChatId = parsed.content;
            }
          } catch {
            assistantText += dataStr;
          }
        } else {
          assistantText += trimmed;
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText, status: currentStatus } : m))
        );
      }

      const finalChatId = newChatId || streamCreatedChatId;
      if (finalChatId && finalChatId !== chatId) {
        router.push(`/dashboard/${finalChatId}`);
        router.refresh();
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      let errMsg = "Failed to generate AI response";
      if (typeof err?.message === "string") {
        try {
          const parsed = JSON.parse(err.message);
          errMsg = parsed.message || parsed.detail || err.message;
        } catch {
          errMsg = err.message;
        }
      }
      toast.error(errMsg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, isAnyFileUploading, chatId, webSearch, selectedAgent, selectedDocs, router]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const uploadFiles = useCallback((files: File[]) => {
    if (files.length) {
      files.forEach((file) => {
        const docId = crypto.randomUUID();
        setSelectedDocs((prev) => {
          if (prev.some((d) => d.name === file.name && d.size === file.size)) return prev;
          return [...prev, {
            id: docId,
            name: file.name,
            size: file.size,
            type: file.type,
            url: "",
            content: "",
            isUploading: true
          }];
        });

        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setSelectedDocs((prev) =>
            prev.map((d) => (d.id === docId ? { ...d, content: content || "" } : d))
          );
        };

        if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".json") || file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
          reader.readAsText(file);
        } else {
          setSelectedDocs((prev) =>
            prev.map((d) =>
              d.id === docId
                ? { ...d, content: `[Binary/Non-text File content omitted: ${file.name}]` }
                : d
            )
          );
        }

        const formData = new FormData();
        formData.append("file", file);

        uploadFileMutation
          .mutateAsync(formData)
          .then((data) => {
            setSelectedDocs((prev) =>
              prev.map((d) =>
                d.id === docId
                  ? { ...d, url: data.url, googleUri: data.googleUri, isUploading: false }
                  : d
              )
            );
            toast.success(`Uploaded ${file.name}`);
          })
          .catch(() => {
            setSelectedDocs((prev) => prev.filter((d) => d.id !== docId));
          });
      });
    }
  }, []);

  const onFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    uploadFiles(files);
    e.currentTarget.value = "";
  }, [uploadFiles]);

  const removeSelectedDoc = useCallback((id: string) => {
    setSelectedDocs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleSelectSuggestedPrompt = useCallback(
    (promptText: string, agentKey?: string) => {
      setInput(promptText);
      if (agentKey) {
        const matched = AGENT_OPTIONS.find(
          (opt) =>
            opt.key.toLowerCase() === agentKey.toLowerCase() ||
            opt.tag.toLowerCase() === agentKey.toLowerCase()
        );
        if (matched) {
          handleSetSelectedAgent(matched);
        }
      }
      textareaRef.current?.focus();
    },
    [handleSetSelectedAgent, textareaRef]
  );


  // Global key listener to auto-focus input on typing anywhere & handle Enter on new chat page
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputTarget =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest('[role="dialog"]') ||
          target.closest('[role="combobox"]'));

      if (isInputTarget) return;

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Enter" && !e.shiftKey) {
        if (input.trim() && !isStreaming && !isAnyFileUploading) {
          e.preventDefault();
          handleSend();
        } else if (textareaRef.current) {
          textareaRef.current.focus();
        }
        return;
      }

      if (e.key.length === 1 && textareaRef.current) {
        textareaRef.current.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [input, isStreaming, isAnyFileUploading, handleSend, textareaRef]);

  const placeholder = "Ask anything...";

  return (
    <div className="relative min-h-full">
      <div className={cn("mx-auto w-full max-w-[800px]", inConversation ? "pt-4" : "")}>
        {!inConversation ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(82dvh)] py-6 px-2 sm:px-4">
            <div className="w-full max-w-[800px] flex flex-col items-center">
              <HeroHeading />

              <div className="w-full mt-6 mb-6">
                <Composer
                  textareaRef={textareaRef}
                  input={input}
                  setInput={setInput}
                  onSend={handleSend}
                  placeholder={placeholder}
                  isStreaming={isStreaming}
                  webSearch={webSearch}
                  setWebSearch={handleSetWebSearch}
                  onUploadClick={handleUploadClick}
                  selectedDocs={selectedDocs}
                  onRemoveDoc={removeSelectedDoc}
                  isAnyFileUploading={isAnyFileUploading}
                  onPasteFiles={uploadFiles}
                  selectedAgent={selectedAgent}
                  setSelectedAgent={handleSetSelectedAgent}
                  dropdownPosition="bottom"
                />
              </div>

              <SuggestedPrompts onSelectPrompt={handleSelectSuggestedPrompt} />
            </div>
          </div>
        ) : (
          <div className="px-2 sm:px-4">
            <div
              ref={scrollRef}
              className={cn("h-[calc(100dvh-15.6rem)] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1 sm:pr-2 pb-4", selectedDocs.length > 0 && "h-[calc(100dvh-18.6rem)]")}
            >
              <MessageList messages={messages} isStreaming={isStreaming} />
              <div ref={messagesEndRef} className="h-2 w-full shrink-0" />
            </div>
          </div>
        )}
      </div>

      {inConversation && (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 transition-all duration-500 ease-in-out w-full flex justify-center">
          <div className="pointer-events-auto w-full max-w-[800px] px-2 sm:px-4">
            <Composer
              textareaRef={textareaRef}
              input={input}
              setInput={setInput}
              onSend={handleSend}
              placeholder={placeholder}
              isStreaming={isStreaming}
              webSearch={webSearch}
              setWebSearch={handleSetWebSearch}
              onUploadClick={handleUploadClick}
              selectedDocs={selectedDocs}
              onRemoveDoc={removeSelectedDoc}
              isAnyFileUploading={isAnyFileUploading}
              onPasteFiles={uploadFiles}
              selectedAgent={selectedAgent}
              setSelectedAgent={handleSetSelectedAgent}
            />
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileSelected}
        multiple
        accept=".pdf,.txt,.md,.doc,.docx,.csv,.json,.png,.jpg,.jpeg"
      />
    </div>
  );
}
