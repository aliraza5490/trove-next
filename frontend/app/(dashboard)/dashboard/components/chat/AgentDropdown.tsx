'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Globe,
  PenTool,
  CheckSquare,
  Compass,
  History,
  BookOpen,
  Sparkles,
  Bot,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';

export type AgentOption = {
  key: string;
  tag: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

export const AGENT_OPTIONS: AgentOption[] = [
  {
    key: 'scout',
    tag: 'scout',
    name: 'Scout',
    category: 'Online Research Agent',
    description: 'Search the web for up-to-date facts, tech comparisons & citations',
    icon: Globe,
    color: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30',
  },
  {
    key: 'draft',
    tag: 'draft',
    name: 'Draft',
    category: 'Writing Agent',
    description: 'Write, edit & polish emails, articles, posts and documents',
    icon: PenTool,
    color: 'text-purple-500 bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30',
  },
  {
    key: 'brief',
    tag: 'brief',
    name: 'Brief',
    category: 'Meeting Agent',
    description: 'Summarize meeting transcripts, extract decisions & action items',
    icon: CheckSquare,
    color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30',
  },
  {
    key: 'plan',
    tag: 'plan',
    name: 'Plan',
    category: 'Ask & Planning Agent',
    description: 'Break goals into tasks, organize ideas & build project roadmaps',
    icon: Compass,
    color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30',
  },
  {
    key: 'recall',
    tag: 'recall',
    name: 'Recall',
    category: 'Knowledge Agent',
    description: 'Search past conversation history & retrieve previous decisions',
    icon: History,
    color: 'text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/30',
  },
  {
    key: 'read',
    tag: 'read',
    name: 'Read',
    category: 'Document Agent',
    description: 'Deep RAG analysis, summaries & Q&A on uploaded files',
    icon: BookOpen,
    color: 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30',
  },
  {
    key: 'default',
    tag: 'default',
    name: 'Default Assistant',
    category: 'General AI Assistant',
    description: 'Reset active agent selection to default Trove AI',
    icon: Sparkles,
    color: 'text-slate-500 bg-slate-500/10 dark:bg-slate-500/20 border-slate-500/30',
  },
];

export function useAgentTrigger(
  input: string,
  setInput: (v: string) => void,
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  externalSelectedAgent?: AgentOption | null,
  externalSetSelectedAgent?: React.Dispatch<React.SetStateAction<AgentOption | null>>
) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [triggerChar, setTriggerChar] = useState<'@' | '/'>('@');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerPos, setTriggerPos] = useState<number>(-1);
  const [internalSelectedAgent, setInternalSelectedAgent] = useState<AgentOption | null>(null);

  const selectedAgent = externalSelectedAgent !== undefined ? externalSelectedAgent : internalSelectedAgent;
  const setSelectedAgent = externalSetSelectedAgent || setInternalSelectedAgent;

  const filteredOptions = useMemo(() => {
    if (!filterQuery) return AGENT_OPTIONS;
    const q = filterQuery.toLowerCase();
    return AGENT_OPTIONS.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        opt.tag.toLowerCase().includes(q) ||
        opt.category.toLowerCase().includes(q)
    );
  }, [filterQuery]);

  const checkTrigger = useCallback(
    (text: string, selectionStart: number) => {
      // 1. Check if user typed a complete tag like @scout or /scout in text manually
      for (const opt of AGENT_OPTIONS) {
        if (opt.key === 'default') continue;
        const regex = new RegExp(`(?:^|\\s)[@/]${opt.tag}(?:\\s|$)`, 'i');
        if (regex.test(text)) {
          setSelectedAgent(opt);
          const cleanText = text.replace(new RegExp(`[@/]${opt.tag}\\s?`, 'gi'), '').trimStart();
          setInput(cleanText);
          setShowDropdown(false);
          return;
        }
      }

      // 2. Check if user is typing trigger character @ or /
      const textBeforeCursor = text.slice(0, selectionStart);
      const match = textBeforeCursor.match(/(?:^|\s)([@/])([a-zA-Z]*)$/);

      if (match) {
        const char = match[1] as '@' | '/';
        const query = match[2];
        const lastTrigger = textBeforeCursor.lastIndexOf(char);

        setTriggerChar(char);
        setFilterQuery(query);
        setTriggerPos(lastTrigger);
        setSelectedIndex(0);
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    },
    [setInput, setSelectedAgent]
  );

  const selectOption = useCallback(
    (option: AgentOption) => {
      const el = textareaRef.current;
      const cursorPos = el?.selectionStart ?? input.length;

      let beforeTrigger = input;
      let afterCursor = '';

      if (triggerPos >= 0) {
        beforeTrigger = input.slice(0, triggerPos);
        afterCursor = input.slice(cursorPos);
      }

      const newInput = (beforeTrigger + afterCursor).trimStart();
      setInput(newInput);
      setShowDropdown(false);

      if (option.key === 'default') {
        setSelectedAgent(null);
      } else {
        setSelectedAgent(option);
      }

      setTimeout(() => {
        if (el) {
          el.focus();
          const newPos = Math.min(beforeTrigger.length, newInput.length);
          el.setSelectionRange(newPos, newPos);
        }
      }, 10);
    },
    [input, setInput, textareaRef, triggerPos, setSelectedAgent]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, onSend: () => void) => {
      if (showDropdown && filteredOptions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredOptions.length);
          return true;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length
          );
          return true;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          const targetOption = filteredOptions[selectedIndex] || filteredOptions[0];
          if (targetOption) {
            selectOption(targetOption);
          }
          return true;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowDropdown(false);
          return true;
        }
      }

      // Handle Backspace on empty input to clear active selected agent tag
      if (e.key === 'Backspace' && input === '' && selectedAgent) {
        setSelectedAgent(null);
        return true;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
        return true;
      }
      return false;
    },
    [showDropdown, filteredOptions, selectedIndex, selectOption, input, selectedAgent, setSelectedAgent]
  );

  return {
    showDropdown,
    filterQuery,
    triggerChar,
    selectedIndex,
    filteredOptions,
    selectedAgent,
    setSelectedAgent,
    checkTrigger,
    selectOption,
    handleKeyDown,
    setShowDropdown,
  };
}

interface AgentDropdownProps {
  visible: boolean;
  filterQuery: string;
  triggerChar: '@' | '/';
  selectedIndex: number;
  onSelect: (option: AgentOption) => void;
  filteredOptions: AgentOption[];
}

export function AgentDropdown({
  visible,
  filterQuery,
  triggerChar,
  selectedIndex,
  onSelect,
  filteredOptions,
}: AgentDropdownProps) {
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    if (visible && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex, visible]);

  if (!visible || filteredOptions.length === 0) return null;

  return (
    <div
      className={cn(
        'absolute bottom-full left-0 right-0 mb-2 z-50 overflow-hidden',
        'rounded-xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl',
        'animate-in fade-in slide-in-from-bottom-2 duration-150',
      )}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30 text-[10px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Bot className="size-3 text-primary" />
          <span>Select Agent ({triggerChar})</span>
        </span>
        <span>Use ↑ ↓ to navigate, Enter to select</span>
      </div>

      <ul className="max-h-44 overflow-y-auto p-1 space-y-0.5">
        {filteredOptions.map((option, index) => {
          const Icon = option.icon;
          const isSelected = index === selectedIndex;
          const tagDisplay = `${triggerChar}${option.tag}`;

          return (
            <li key={option.key}>
              <button
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                onClick={() => onSelect(option)}
                className={cn(
                  'w-full flex items-center justify-between gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors',
                  isSelected
                    ? 'bg-accent text-accent-foreground shadow-2xs'
                    : 'hover:bg-accent/50 text-foreground',
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      'p-1 rounded-md border shrink-0 flex items-center justify-center',
                      option.color,
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs tracking-tight">
                        {option.name}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground font-mono">
                        {tagDisplay}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate max-w-xs leading-tight">
                      {option.description}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-medium text-muted-foreground shrink-0 hidden sm:inline-block">
                  {option.category}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function getActiveAgentFromInput(input: string): AgentOption | null {
  if (!input) return null;
  const inputLower = input.toLowerCase();
  for (const opt of AGENT_OPTIONS) {
    if (opt.key === 'default') continue;
    if (
      inputLower.includes(`@${opt.tag}`) ||
      inputLower.includes(`/${opt.tag}`)
    ) {
      return opt;
    }
  }
  return null;
}

export function ActiveAgentBadge({
  agent,
  onRemove,
}: {
  agent: AgentOption;
  onRemove?: () => void;
}) {
  const Icon = agent.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold border shadow-2xs transition-all animate-in fade-in zoom-in-95 duration-150 select-none shrink-0',
        agent.color,
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span>@{agent.tag}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer"
          title={`Remove ${agent.name} tag`}
          aria-label={`Remove ${agent.name} tag`}
        >
          <X className="size-3.5" />
        </button>
      )}
    </span>
  );
}


