import React from "react";
import { Globe, FileText, Code2, Lightbulb, Compass, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SuggestedPrompt } from "./types";

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    icon: Globe,
    title: "Web Research",
    subtitle: "Search real-time news & updates",
    prompt: "What are the latest tech trends and web framework updates in 2026?",
    color: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/20",
  },
  {
    icon: FileText,
    title: "Document Analysis",
    subtitle: "Summarize & extract key insights",
    prompt: "Help me analyze key takeaways and structure insights from my uploaded document.",
    color: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/20",
  },
  {
    icon: Code2,
    title: "Code & Debug",
    subtitle: "Generate clean React & TS code",
    prompt: "Write a custom React component with Tailwind CSS and smooth micro-interactions.",
    color: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20",
  },
  {
    icon: Lightbulb,
    title: "Brainstorm Ideas",
    subtitle: "Explore features & architecture",
    prompt: "Give me 5 innovative feature ideas for an AI-powered workspace application.",
    color: "text-purple-500 bg-purple-500/10 dark:bg-purple-500/20",
  },
];

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground font-medium">
        <span className="flex items-center gap-1.5">
          <Compass className="size-3.5 text-primary" />
          Suggested Prompts
        </span>
        <span className="text-[11px] text-muted-foreground/70">Click to fill</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SUGGESTED_PROMPTS.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-border/60 bg-card/40 hover:bg-accent/60 hover:border-border/80 transition-all duration-200 text-left group shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <div className={cn("p-2 rounded-lg shrink-0 transition-transform group-hover:scale-105", item.color)}>
              <item.icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                <span>{item.title}</span>
                <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {item.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Keyboard Shortcuts Footer */}
      <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted-foreground/80">
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-muted/80 border border-border/60 rounded shadow-2xs">Ctrl + K</kbd>
          <span>Search chats</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-muted/80 border border-border/60 rounded shadow-2xs">↵</kbd>
          <span>Send prompt</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-muted/80 border border-border/60 rounded shadow-2xs">Shift + ↵</kbd>
          <span>New line</span>
        </div>
      </div>
    </div>
  );
}

export default SuggestedPrompts;
