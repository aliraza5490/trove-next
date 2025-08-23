import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Message } from "../types";

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

function ChatBubble({ role, content }: { role: Message["role"]; content: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex w-full items-start gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar>
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        {content}
      </div>
      {isUser && (
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}