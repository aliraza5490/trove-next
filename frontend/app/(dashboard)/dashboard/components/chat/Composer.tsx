"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Paperclip,
  Send,
  Image as ImageIcon,
  FileText,
  X,
  Globe,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AgentDropdown,
  useAgentTrigger,
  ActiveAgentBadge,
  AgentOption,
} from "./AgentDropdown";
import { SelectedDoc } from "./types";

export interface ComposerProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  input: string;
  setInput: (v: string) => void;
  onSend: (textOverride?: string) => void;
  placeholder?: string;
  isStreaming: boolean;
  webSearch: boolean;
  setWebSearch: (v: boolean) => void;
  onUploadClick: () => void;
  selectedDocs: SelectedDoc[];
  onRemoveDoc: (id: string) => void;
  isAnyFileUploading: boolean;
  onPasteFiles: (files: File[]) => void;
  selectedAgent: AgentOption | null;
  setSelectedAgent: React.Dispatch<React.SetStateAction<AgentOption | null>>;
  dropdownPosition?: "top" | "bottom";
}

export function Composer(props: ComposerProps) {
  const {
    textareaRef,
    input,
    setInput,
    onSend,
    placeholder,
    isStreaming,
    webSearch,
    setWebSearch,
    onUploadClick,
    selectedDocs,
    onRemoveDoc,
    isAnyFileUploading,
    onPasteFiles,
    selectedAgent,
    setSelectedAgent,
    dropdownPosition = "top",
  } = props;

  const {
    showDropdown,
    filterQuery,
    triggerChar,
    selectedIndex,
    filteredOptions,
    checkTrigger,
    selectOption,
    handleKeyDown: processAgentKeyDown,
  } = useAgentTrigger(input, setInput, textareaRef, selectedAgent, setSelectedAgent);

  const handleComposerSend = () => {
    if (!input.trim() || isStreaming || isAnyFileUploading) return;
    const messageText = selectedAgent ? `@${selectedAgent.tag} ${input.trim()}` : input.trim();
    onSend(messageText);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const handled = processAgentKeyDown(e, handleComposerSend);
    if (!handled && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleComposerSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    checkTrigger(val, e.target.selectionStart);
  };

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files);
    if (files.length > 0) {
      e.preventDefault();
      onPasteFiles(files);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const iconFor = (mime: string) => {
    if (mime.startsWith("image/")) return <ImageIcon className="size-3.5" />;
    return <FileText className="size-3.5" />;
  };

  return (
    <div className="relative bg-background/85 supports-[backdrop-filter]:backdrop-blur-md border border-border/70 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] rounded-xl p-2.5 sm:p-3.5 transition-shadow">
      <AgentDropdown
        visible={showDropdown}
        filterQuery={filterQuery}
        triggerChar={triggerChar}
        selectedIndex={selectedIndex}
        onSelect={selectOption}
        filteredOptions={filteredOptions}
        position={dropdownPosition}
      />

      {selectedDocs.length > 0 && (
        <div className="flex overflow-x-auto items-center gap-2 px-1 pb-2 font-sans">
          {selectedDocs.map((d) => (
            <div
              key={d.id}
              className="group inline-flex items-center gap-2 rounded-full bg-accent/60 text-xs text-foreground px-2.5 py-1.5 border"
            >
              <span className="text-muted-foreground flex items-center justify-center">
                {d.isUploading ? (
                  <span className="animate-spin inline-block size-3.5 border-2 border-primary border-t-transparent rounded-full" />
                ) : (
                  iconFor(d.type)
                )}
              </span>
              <span className="max-w-[14rem] truncate" title={`${d.name} • ${formatBytes(d.size)}`}>
                {d.name}
              </span>
              <span className="hidden sm:inline text-muted-foreground min-w-fit">· {formatBytes(d.size)}</span>
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
        <Textarea
          ref={textareaRef}
          autoFocus
          value={input}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={placeholder || "Ask anything or type @ or / to select an agent..."}
          className="max-h-32 min-h-[38px] w-full resize-none border-0 bg-transparent dark:bg-transparent p-0 pt-1.5 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 outline-none"
          aria-label="Chat input"
        />
      </div>

      <div className="mt-2 flex items-center justify-between px-1 gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Attach"
            onClick={onUploadClick}
            disabled={isStreaming}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
            title="Attach document"
          >
            <Paperclip className="size-4.5" />
          </button>

          {/* Web Search Mode Pill */}
          <button
            type="button"
            onClick={() => setWebSearch(!webSearch)}
            disabled={isStreaming}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer select-none",
              webSearch
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-2xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground border-border/40 hover:bg-accent"
            )}
            title={webSearch ? "Disable Web Search" : "Enable Web Search"}
          >
            <Globe className={cn("size-3.5", webSearch && "text-emerald-500")} />
            <span>{webSearch ? "Web Search ON" : "Web Search"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70 select-none">
            <Info className="size-3.5 text-muted-foreground/70 shrink-0" />
            <span>
              <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-muted/80 border border-border/60 rounded shadow-2xs">Enter</kbd> will send and <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-muted/80 border border-border/60 rounded shadow-2xs">Shift + Enter</kbd> will add new line
            </span>
          </div>
          <Button
            onClick={handleComposerSend}
            disabled={!input.trim() || isStreaming || isAnyFileUploading}
            size="icon"
            className="shrink-0 rounded-lg"
          >
            <Send className="size-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Composer;
