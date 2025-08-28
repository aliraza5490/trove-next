import { SelectedDoc } from '../types';
import React, { useMemo } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

function Composer(props: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  webSearch: boolean;
  setWebSearch: (v: boolean) => void;
  onUploadClick: () => void;
  selectedDocs: SelectedDoc[];
  onRemoveDoc: (id: string) => void;
}) {
  const {
    textareaRef,
    input,
    setInput,
    onSend,
    disabled,
    webSearch,
    setWebSearch,
    onUploadClick,
    selectedDocs,
    onRemoveDoc,
  } = props;

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
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
    if (mime.startsWith('image/')) return <ImageIcon className="size-3.5" />;
    return <FileText className="size-3.5" />;
  };

  const placeholder = useMemo(
    () => (webSearch ? 'Ask anything... (Web Search ON)' : 'Ask anything...'),
    [webSearch],
  );

  return (
    <div className="bg-background/80 supports-[backdrop-filter]:backdrop-blur-md border shadow-lg rounded-xl p-2 sm:p-3">
      {selectedDocs.length > 0 && (
        <div className="flex overflow-x-auto items-center gap-2 px-1 pb-2">
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

      <div className="relative flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="max-h-32 min-h-14 flex-1 resize-none bg-transparent"
          aria-label="Chat input"
        />

        <Button
          onClick={onSend}
          disabled={!input.trim() || disabled}
          className="shrink-0 absolute bottom-2 right-2"
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

      <div className="mt-2 flex items-center gap-2 px-1">
        <button
          type="button"
          aria-label="Attach"
          onClick={onUploadClick}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-accent border bg-secondary flex items-center justify-center h-8 gap-1.5 px-3 has-[>svg]:px-2.5"
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
              onCheckedChange={(v) => setWebSearch(Boolean(v))}
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
      <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-2 px-1">
        <span className="inline-flex items-center gap-1">
          <span
            className={cn(
              'inline-block size-2 rounded-full',
              webSearch ? 'bg-emerald-500' : 'bg-muted',
            )}
          ></span>
          Web search {webSearch ? 'enabled' : 'disabled'}
        </span>
        <span>•</span>
        <span>Press Enter to send, Shift+Enter for new line</span>
      </div>
    </div>
  );
}

export default Composer;
