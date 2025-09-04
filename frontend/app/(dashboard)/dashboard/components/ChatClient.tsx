'use client';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useChatQuery } from '../chat/[chatId]/hooks';
import { createChatMutation } from '../hooks';
import Composer from './chat/Composer';
import MessageList from './chat/MessageList';
import { Message, SelectedDoc } from './types';
import { getAuthToken } from '@/lib/auth';
import { readAndDeleteFiles, saveFile } from '@/lib/files-db';

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [webSearch, setWebSearch] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<SelectedDoc[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [inConversation, setInConversation] = useState(false);
  const [isNewChat, setIsNewChat] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [files, setFiles] = useState<File[] | null>(null);

  const params = useParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutateAsync: createChat, isPending: isCreatingChat } =
    createChatMutation();
  const { data: chatData, isLoading } = useChatQuery(chatId);

  // for sending first message on new chat
  useEffect(() => {
    const localNewMessage = localStorage.getItem('newMessage');
    if (localNewMessage && chatId && !isStreaming) {
      localStorage.removeItem('newMessage');
      readAndDeleteFiles().then((files) => {
        if (files) {
          setFiles(files);
          sendMessage(localNewMessage, files);
        }
      });
    }
    if (!localNewMessage) {
      setIsNewChat(false);
    }
  }, [chatId]);

  // for updating inConversation state
  useEffect(() => {
    if (params.chatId && messages.length) {
      setInConversation(!!params.chatId || messages.length > 0);
    }
  }, [params.chatId, messages.length]);

  // for setting chatId from params
  useEffect(() => {
    if (params?.chatId && typeof params.chatId === 'string' && !chatId) {
      setChatId(params.chatId);
    }
  }, [params.chatId]);

  // for setting messages from chatData
  useEffect(() => {
    if (chatData && !isNewChat) {
      setMessages(
        chatData.messages.map((m: any) => {
          return {
            ...m,
            content: m.message,
          };
        }),
      );
    }
  }, [chatData, isNewChat]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // for scrolling to bottom on new messages
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isStreaming]);

  const sendMessage = async (text: string, files: File[] | null) => {
    if (!text.trim() || isStreaming || isSending) return;
    setInput('');
    setSelectedDocs([]);
    setIsSending(true);
    if (!chatId) {
      // for new chats - first message
      if (isCreatingChat) return;
      const res = await createChat(text);
      localStorage.setItem('newMessage', text);
      if (files) {
        await Promise.all(files.map((file) => saveFile(file)));
      }
      await queryClient.invalidateQueries({ queryKey: ['chat-list'] });
      return router.push(`/dashboard/chat/${res.id}`);
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      attachments: files
        ? files.map((file) => ({
            name: file.name,
            type: file.type,
            file_size: file.size,
          }))
        : [],
    };
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', attachments: [] },
    ]);

    const data = new FormData();
    data.append('message', text);
    data.append('chat_id', chatId);
    console.log(files);

    if (files) {
      files.forEach((file) => {
        data.append('files', file);
      });
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/message`,
      {
        method: 'POST',
        body: data,
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      },
    );

    if (res.body) {
      setFiles([]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const data = decoder.decode(value);
        const chunks = data
          .split('data: ')
          .filter(Boolean)
          .map((chunk) => JSON.parse(chunk));

        for (const chunk of chunks) {
          if (chunk?.type === 'message') {
            const message = chunk.content;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + message }
                  : m,
              ),
            );
          }
          if (chunk?.type === 'end') {
            (async () => {
              const chatId = chunk.content;
              await queryClient.invalidateQueries({
                queryKey: ['chat', chatId],
              });
              setIsStreaming(false);
              setIsSending(false);
            })();
          }
        }
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      setFiles(files);
      const mapped = files.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type,
      }));
      setSelectedDocs((prev) => {
        const existingKey = new Set(prev.map((d) => `${d.name}:${d.size}`));
        const toAdd = mapped.filter(
          (d) => !existingKey.has(`${d.name}:${d.size}`),
        );
        const next = [...prev, ...toAdd];
        if (toAdd.length)
          toast.success(
            `Added ${toAdd.length} file${toAdd.length > 1 ? 's' : ''}`,
            {
              id: 'add-docs',
            },
          );
        return next;
      });
    }
    e.currentTarget.value = '';
  };

  const removeSelectedDoc = (id: string) => {
    setSelectedDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSend = () => {
    sendMessage(input, files);
  };

  if (isLoading && !isNewChat) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      <div className={cn('mx-auto w-full', inConversation ? 'pt-4' : '')}>
        {!inConversation ? (
          <div className="grid min-h-[calc(60dvh)] place-items-center">
            <div className="w-full max-w-2xl px-4">
              <HeroHeading />
            </div>
          </div>
        ) : (
          <div className="px-2 sm:px-4">
            <div
              ref={scrollRef}
              className={cn(
                'h-[calc(100dvh-15.6rem)] overflow-y-auto',
                selectedDocs.length > 0 && 'h-[calc(100dvh-18.6rem)]',
              )}
            >
              <MessageList messages={messages} />
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 transition-all duration-500 ease-in-out w-full flex justify-center',
          inConversation
            ? 'bottom-5 translate-y-0'
            : 'top-1/2 -translate-y-1/2',
        )}
      >
        <div className="pointer-events-auto w-full max-w-3xl px-4 md:px-0">
          <Composer
            input={input}
            setInput={setInput}
            onSend={handleSend}
            disabled={isSending}
            webSearch={webSearch}
            setWebSearch={setWebSearch}
            onUploadClick={handleUploadClick}
            selectedDocs={selectedDocs}
            onRemoveDoc={removeSelectedDoc}
          />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={onFileSelected}
        accept=".pdf,.txt,.md,.doc,.docx,.csv,.json,.png,.jpg,.jpeg"
      />
    </div>
  );
}

function HeroHeading() {
  return (
    <div className="mx-auto text-center">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground/90">
        Welcome to your chat
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ask questions, analyze docs, and explore the web.
      </p>
    </div>
  );
}
