"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Image as ImageIcon, FileText, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENT_OPTIONS } from "./AgentDropdown";
import { Message, Attachment } from "./types";

export interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  return (
    <div className="mx-auto w-full max-w-[800px]">
      <ul className="space-y-6 pb-2">
        {messages.map((m, idx) => {
          const isLast = idx === messages.length - 1;
          const isStreamingMessage = isLast && m.role === "assistant" && !!isStreaming;
          return (
            <li key={m.id}>
              <ChatBubble
                role={m.role}
                content={m.content}
                attachments={m.attachments}
                status={m.status}
                isStreamingMessage={isStreamingMessage}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AttachmentPill({ attachment, isUser }: { attachment: Attachment; isUser: boolean }) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getFileIcon = (mime?: string | null, filename?: string) => {
    const m = mime?.toLowerCase() || "";
    const name = filename?.toLowerCase() || "";

    if (m.startsWith("image/") || name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".gif")) {
      return <ImageIcon className="size-4 shrink-0 text-sky-500" />;
    }
    if (m.includes("pdf") || name.endsWith(".pdf")) {
      return <FileText className="size-4 shrink-0 text-rose-500" />;
    }
    if (m.includes("csv") || m.includes("spreadsheet") || name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls")) {
      return <FileText className="size-4 shrink-0 text-emerald-500" />;
    }
    if (m.includes("json") || name.endsWith(".json")) {
      return <FileText className="size-4 shrink-0 text-amber-500" />;
    }
    return <FileText className="size-4 shrink-0 text-muted-foreground" />;
  };

  const baseClasses = cn(
    "flex items-center gap-2 rounded-lg border p-2 text-xs transition-all duration-200 max-w-[200px] sm:max-w-[240px] font-sans",
    isUser
      ? "bg-black/15 border-white/20 text-primary-foreground hover:bg-black/25"
      : "bg-background border-border text-foreground hover:bg-accent"
  );

  return (
    <a
      href={attachment.url}
      download={attachment.name}
      target="_blank"
      rel="noopener noreferrer"
      className={baseClasses}
      title={`Download ${attachment.name}`}
    >
      {getFileIcon(attachment.mimeType, attachment.name)}
      <div className="overflow-hidden min-w-0 flex-1">
        <p className="truncate font-medium hover:underline">{attachment.name}</p>
        {attachment.size && (
          <p className={cn("text-[10px]", isUser ? "text-primary-foreground/75" : "text-muted-foreground")}>
            {formatBytes(attachment.size)}
          </p>
        )}
      </div>
    </a>
  );
}

export function renderUserMessageContent(content: string) {
  const parts = content.split(/((?:`@[a-zA-Z0-9_-]+`|@[a-zA-Z0-9_-]+))/g);

  return (
    <div className="whitespace-pre-wrap break-words leading-relaxed">
      {parts.map((part, index) => {
        const cleanTag = part.replace(/`/g, '');
        if (cleanTag.startsWith('@') && cleanTag.length > 1) {
          const tagName = cleanTag.slice(1).toLowerCase();
          const isKnownAgent = AGENT_OPTIONS.some((a) => a.tag.toLowerCase() === tagName);
          if (isKnownAgent || ['draft', 'scout', 'brief', 'plan', 'recall', 'read'].includes(tagName)) {
            return (
              <code
                key={index}
                className="inline-flex items-center font-mono text-xs px-2 py-0.5 rounded bg-black/25 dark:bg-white/20 border border-white/25 font-semibold my-0.5 mr-1 select-none shadow-2xs"
              >
                {cleanTag}
              </code>
            );
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}

export function ChatBubble({
  role,
  content,
  attachments,
  status,
  isStreamingMessage,
}: {
  role: Message["role"];
  content: string;
  attachments?: Attachment[];
  status?: string;
  isStreamingMessage?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex w-full items-start gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="size-8 border border-emerald-500/20 shadow-2xs ring-1 ring-background shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white font-medium flex items-center justify-center size-full">
            <Bot className="size-4 text-white" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[80%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm flex flex-col gap-2 transition-all",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md shadow-[0_2px_10px_rgba(99,102,241,0.18)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.3)]"
            : "bg-muted/65 dark:bg-zinc-900/80 border border-border/60 dark:border-white/[0.06] text-foreground rounded-bl-md shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
        )}
      >
        {status && (
          <div
            className={cn(
              "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border w-fit shadow-2xs transition-all duration-200",
              isStreamingMessage
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 animate-pulse"
                : "bg-accent/80 text-muted-foreground border-border/60"
            )}
          >
            <Sparkles className="size-3.5 text-emerald-500 shrink-0" />
            <span className="truncate max-w-[280px] sm:max-w-[360px]">{status}</span>
          </div>
        )}

        {isUser ? (
          renderUserMessageContent(content)
        ) : content === "" ? (
          <div className="flex items-center gap-1.5 py-1 px-0.5" aria-label="Researching">
            {isStreamingMessage || status ? (
              <span className="inline-block w-[2px] h-4 rounded-full bg-emerald-500 animate-cursor-blink shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
            ) : null}
          </div>
        ) : (
          <div>
            <div
              className="prose dark:prose-invert max-w-none text-sm leading-relaxed
                [&_a]:text-primary-600 [&_a]:underline hover:[&_a]:text-primary-500
                [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-2
                [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-2
                [&_p]:my-1.5 [&_p]:first:mt-0 [&_p]:last:mb-0
                [&_code]:bg-accent/80 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                [&_pre]:bg-black/90 [&_pre]:text-white [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-2 [&_pre]:overflow-x-auto
                [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-white
                [&_h1]:text-lg [&_h1]:font-bold [&_h1]:my-2
                [&_h2]:text-base [&_h2]:font-bold [&_h2]:my-2
                [&_h3]:text-sm [&_h3]:font-bold [&_h3]:my-1.5
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2
                [&_table]:w-full [&_table]:border-collapse [&_table]:my-3
                [&_th]:border [&_th]:border-border [&_th]:p-1.5 [&_th]:bg-accent [&_th]:font-semibold
                [&_td]:border [&_td]:border-border [&_td]:p-1.5"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
            {isStreamingMessage && (
              <span className="inline-block w-[2px] h-4 ml-1 translate-y-[2px] align-middle rounded-full bg-emerald-500 animate-cursor-blink shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
            )}
          </div>
        )}

        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {attachments.map((att) => (
              <AttachmentPill key={att.id} attachment={att} isUser={isUser} />
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <Avatar className="size-8 border border-white/20 shadow-2xs ring-1 ring-background shrink-0">
          <AvatarFallback className="bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white font-semibold text-xs flex items-center justify-center size-full">
            U
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export default MessageList;
