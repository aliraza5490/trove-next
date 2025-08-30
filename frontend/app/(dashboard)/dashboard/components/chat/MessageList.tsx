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
            <ChatBubble role={m.role} content={m.content} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function BlinkingCursor() {
  return <span className="animate-pulse">|</span>;
}

function ChatBubble({
  role,
  content,
}: {
  role: Message['role'];
  content: string;
}) {
  const isUser = role === 'user';
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
        ) : (
          <BlinkingCursor />
        )}
      </div>
      {isUser && (
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
