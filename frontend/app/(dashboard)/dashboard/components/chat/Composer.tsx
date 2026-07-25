'use client';
import { SelectedDoc } from '../types';
import React, { useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Paperclip,
  Send,
  Upload,
  Image as ImageIcon,
  FileText,
  Wrench,
  X,
  Loader2Icon,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AgentDropdown,
  useAgentTrigger,
  getActiveAgentFromInput,
  ActiveAgentBadge,
  AgentOption,
} from './AgentDropdown';



function Composer(props: {
  input: string;
  setInput: (v: string) => void;
  onSend: (textOverride?: string) => void;
  disabled: boolean;
  webSearch: boolean;
  setWebSearch: (v: boolean) => void;
  onUploadClick: () => void;
  selectedDocs: SelectedDoc[];
  onRemoveDoc: (id: string) => void;
  selectedAgent?: AgentOption | null;
  setSelectedAgent?: React.Dispatch<React.SetStateAction<AgentOption | null>>;
}) {
  const {
    input,
    setInput,
    onSend,
    disabled,
    webSearch,
    setWebSearch,
    onUploadClick,
    selectedDocs,
    onRemoveDoc,
    selectedAgent: propSelectedAgent,
    setSelectedAgent: propSetSelectedAgent,
  } = props;

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    showDropdown,
    filterQuery,
    triggerChar,
    selectedIndex,
    filteredOptions,
    selectedAgent,
    setSelectedAgent,
    checkTrigger,
    selectOption,
    handleKeyDown: processAgentKeyDown,
  } = useAgentTrigger(input, setInput, textareaRef, propSelectedAgent, propSetSelectedAgent);

  const handleComposerSend = () => {
    if (!input.trim() || disabled) return;
    const messageText = selectedAgent ? `@${selectedAgent.tag} ${input.trim()}` : input.trim();
    onSend(messageText);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const handled = processAgentKeyDown(e, handleComposerSend);
    if (!handled && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComposerSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    checkTrigger(val, e.target.selectionStart);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const iconFor = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="size-3.5" />;
    return <FileText className="size-3.5" />;
  };

  const placeholder = useMemo(
    () => (webSearch ? 'Ask anything or type @ or / for agents... (Web Search ON)' : 'Ask anything or type @ or / for agents...'),
    [webSearch],
  );

  const handleWebsearchChange = (v: boolean) => {
    setWebSearch(Boolean(v));
    localStorage.setItem('webSearch', Boolean(v) ? 'true' : 'false');
  };

  return (
    <div className="relative bg-background/80 supports-[backdrop-filter]:backdrop-blur-md border shadow-lg rounded-xl p-2 sm:p-3">
      <AgentDropdown
        visible={showDropdown}
        filterQuery={filterQuery}
        triggerChar={triggerChar}
        selectedIndex={selectedIndex}
        onSelect={selectOption}
        filteredOptions={filteredOptions}
      />

      {selectedDocs.length > 0 && (
        <div className="flex overflow-x-auto items-center gap-2 px-1 pb-2 font-sans">
          {selectedDocs.map((d) => (
            <div
              key={d.id}
              className="group inline-flex items-center gap-2 rounded-full bg-accent/60 text-xs text-foreground px-2.5 py-1.5 border"
            >
              <span className="text-muted-foreground">{iconFor(d.type)}</span>
              <span
                className="max-w-[14rem] truncate"
                title={`${d.name} • ${formatBytes(d.size)}`}
              >
                {d.name}
              </span>
              <span className="hidden sm:inline text-muted-foreground min-w-fit">
                · {formatBytes(d.size)}
              </span>
              <button
                type="button"
                onClick={() => onRemoveDoc(d.id)}
                className="ml-0.5 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors"
                aria-label={`Remove ${d.name}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex flex-col w-full rounded-lg bg-background/50 border border-border/50 p-3 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        {selectedAgent && (
          <div className="flex items-center gap-2 pb-2.5 px-0.5">
            <ActiveAgentBadge
              agent={selectedAgent}
              onRemove={() => setSelectedAgent(null)}
            />
          </div>
        )}
        <div className="relative flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="max-h-32 min-h-[38px] flex-1 resize-none bg-transparent dark:bg-transparent border-0 p-0 pt-1.5 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 outline-none"
            aria-label="Chat input"
          />

          <Button
            onClick={handleComposerSend}
            disabled={!input.trim() || disabled}
            className="shrink-0 rounded-lg"
          >

          {disabled ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="size-4" />
              <span>Send</span>
            </>
          )}
        </Button>
      </div>
    </div>

      <div className="mt-2 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Attach"
            onClick={onUploadClick}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-accent border bg-secondary flex items-center justify-center h-8 gap-1.5 px-3 has-[>svg]:px-2.5 text-xs"
          >
            Files
            <Paperclip className="size-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                Tools
                <Wrench className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  onUploadClick();
                }}
              >
                <Upload className="size-4" /> Upload Document
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem
                checked={webSearch}
                onCheckedChange={handleWebsearchChange}
              >
                {webSearch ? (
                  <>
                    <span className="text-sm">Disable Web Search</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm">Enable Web Search</span>
                  </>
                )}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70 select-none">
          <Info className="size-3.5 text-muted-foreground/70 shrink-0" />
          <span>
            <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-muted/80 border border-border/60 rounded shadow-2xs">Enter</kbd> will send and <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-muted/80 border border-border/60 rounded shadow-2xs">Shift + Enter</kbd> will add new line
          </span>
        </div>
      </div>
    </div>
  );
}

export default Composer;
