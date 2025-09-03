'use client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Message } from '../types';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="mx-auto w-full overflow-y-auto">
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

function isImageFile(nameOrPath: string) {
  return /\.(png|jpe?g|gif|webp|svg|bmp|tiff)$/i.test(nameOrPath);
}

function formatBytes(bytes?: number) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let i = -1;
  do {
    bytes = bytes / 1024;
    i++;
  } while (bytes >= 1024 && i < units.length - 1);
  return `${bytes.toFixed(1)} ${units[i]}`;
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
            <div className="flex items-start gap-3 p-3">
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
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md',
        )}
      >
        {content ? (
          <div suppressHydrationWarning className="overflow-x-auto">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                html: (props) => <html suppressHydrationWarning {...props} />,
                table: (props) => (
                  <table
                    className="w-full border-collapse text-left my-2"
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
                code: ({ inline, className, children, ...props }: any) =>
                  inline ? (
                    <code
                      className={cn(
                        'rounded bg-muted-foreground/10 px-1.5 py-0.5',
                        className,
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <span className="my-2 overflow-x-auto rounded bg-muted-foreground/10 p-3 text-xs">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </span>
                  ),
              }}
            >
              {content}
            </Markdown>
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
