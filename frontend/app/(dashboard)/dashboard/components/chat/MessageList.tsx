'use client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatBytes } from '@/lib/utils';
import { Message } from '../types';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { AGENT_OPTIONS } from './AgentDropdown';

function renderUserMessageContent(content: string) {
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

export default function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="mx-auto w-full overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <ul className="space-y-6 max-w-3xl mx-auto">
        {messages.map((m) => (
          <li key={m.id}>
            <ChatBubble
              role={m.role}
              content={m.content}
              attachments={m.attachments}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function BlinkingCursor() {
  return <span className="animate-pulse">|</span>;
}

// Helpers for attachment rendering
function toPublicUrl(path: string) {
  if (!path) return '#';
  // return path.startsWith('http') ? path : `/${path.replace(/^\/+/, '')}`;
  const pathname = path.startsWith('http')
    ? new URL(path).pathname
    : `/${path.replace(/^\/+/, '')}`;
  return `${process.env.NEXT_PUBLIC_BACKEND_URL}${pathname}`;
}

// Added: helpers for file extension display
function getFileExt(nameOrPath: string) {
  const m = nameOrPath.toLowerCase().match(/\.([a-z0-9]+)(?:\?.*)?$/i);
  return m ? m[1] : '';
}

function extBadgeClass(ext: string) {
  switch (ext) {
    case 'pdf':
      return 'border-rose-300 text-rose-700 dark:text-rose-300';
    case 'csv':
    case 'xls':
    case 'xlsx':
      return 'border-emerald-300 text-emerald-700 dark:text-emerald-300';
    case 'doc':
    case 'docx':
      return 'border-sky-300 text-sky-700 dark:text-sky-300';
    case 'zip':
    case 'tar':
    case 'gz':
      return 'border-amber-300 text-amber-700 dark:text-amber-300';
    default:
      return 'border-muted-foreground/30 text-muted-foreground';
  }
}

function AttachmentList({
  attachments,
}: {
  attachments: NonNullable<Message['attachments']>;
}) {
  if (!attachments?.length) return null;

  return (
    <div className="mt-3">
      <ul className="divide-y rounded-md border bg-card">
        {attachments.map((file: any) => {
          const url = toPublicUrl(file.file_path || file.url || '');
          const name = file.file_name || file.name || 'attachment';
          const size = formatBytes(file.file_size);
          const ext = getFileExt(name || url);
          const isDisabled = !url || url === '#';

          const itemInner = (
            <div className="bg-background rounded-lg flex items-start gap-3 p-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-foreground font-semibold">
                {(ext || name).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate font-medium" title={name}>
                    {name}
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide',
                      extBadgeClass(ext),
                    )}
                  >
                    {ext || 'file'}
                  </span>
                </div>
                {size ? (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {size}
                  </div>
                ) : null}
              </div>
            </div>
          );

          return (
            <li key={file.id ?? `${name}-${url}`}>
              {isDisabled ? (
                <div className="opacity-60 cursor-not-allowed">{itemInner}</div>
              ) : (
                <a
                  href={url}
                  download
                  className="block hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition"
                  aria-label={`Download ${name}`}
                >
                  {itemInner}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ChatBubble({
  role,
  content,
  attachments,
}: {
  role: Message['role'];
  content: string;
  attachments: Message['attachments'];
}) {
  const isUser = role === 'user';
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <Avatar>
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl text-sm shadow-sm',
          isUser
            ? 'bg-muted text-primary-foreground rounded-br-md  py-3  px-4'
            : 'bg-none text-foreground rounded-bl-md',
        )}
      >
        {content ? (
          <div suppressHydrationWarning className="break-words">
            {isUser ? (
              renderUserMessageContent(content)
            ) : (
              <Markdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeRaw]}
                skipHtml={false}
              // linkTarget="_blank"
              components={{
                // Text & headings
                p: (props) => (
                  <p className="mb-3 leading-7 last:mb-0" {...props} />
                ),
                h1: (props) => (
                  <h1 className="mt-0 mb-3 text-2xl font-semibold" {...props} />
                ),
                h2: (props) => (
                  <h2 className="mt-0 mb-3 text-xl font-semibold" {...props} />
                ),
                h3: (props) => (
                  <h3 className="mt-0 mb-2 text-lg font-semibold" {...props} />
                ),
                h4: (props) => (
                  <h4
                    className="mt-0 mb-2 text-base font-semibold"
                    {...props}
                  />
                ),
                h5: (props) => (
                  <h5 className="mt-0 mb-2 text-sm font-semibold" {...props} />
                ),
                h6: (props) => (
                  <h6
                    className="mt-0 mb-2 text-sm font-semibold opacity-80"
                    {...props}
                  />
                ),

                // Lists
                ul: (props) => (
                  <ul className="my-3 ml-6 list-disc space-y-1" {...props} />
                ),
                ol: (props) => (
                  <ol className="my-3 ml-6 list-decimal space-y-1" {...props} />
                ),
                li: (props) => (
                  <li className="marker:text-muted-foreground" {...props} />
                ),

                // Links & media
                a: (props) => (
                  <a
                    className="underline underline-offset-4 text-primary hover:opacity-80"
                    rel="noreferrer noopener"
                    {...props}
                  />
                ),
                img: (props) => (
                  // Allow images to scale down within bubbles
                  <img className="my-2 max-h-96 w-auto rounded" {...props} />
                ),

                // Blockquote & hr
                blockquote: (props) => (
                  <blockquote
                    className="my-3 border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground"
                    {...props}
                  />
                ),
                hr: (props) => <hr className="my-4 border-muted" {...props} />,

                // Tables
                table: (props) => (
                  <table
                    className="w-full border-collapse text-left my-3 text-sm"
                    {...props}
                  />
                ),
                thead: (props) => <thead className="bg-muted/60" {...props} />,
                tr: (props) => (
                  <tr className="border-b last:border-b-0" {...props} />
                ),
                th: (props) => (
                  <th className="border px-3 py-2 font-medium" {...props} />
                ),
                td: (props) => (
                  <td className="border px-3 py-2 align-top" {...props} />
                ),

                // Code
                pre: (props) => (
                  <pre
                    className="my-3 overflow-x-auto rounded bg-muted-foreground/10 p-3 text-xs leading-relaxed shadow-sm"
                    {...props}
                  />
                ),
                code: ({ inline, className, children, ...props }: any) =>
                  inline ? (
                    <code
                      className={cn(
                        'font-mono rounded bg-muted-foreground/10 px-1.5 py-0.5',
                        className,
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    // For fenced code blocks, let <pre> handle the container styling.
                    <code className={cn('font-mono', className)} {...props}>
                      {children}
                    </code>
                  ),
              }}
            >
              {content}
            </Markdown>
            )}
          </div>
        ) : !hasAttachments ? (
          <BlinkingCursor />
        ) : null}

        {hasAttachments ? (
          <AttachmentList
            attachments={attachments as NonNullable<Message['attachments']>}
          />
        ) : null}
      </div>
      {isUser && (
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
