"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { updateChatMutation, deleteChatMutation } from '../dashboard/hooks';
import { Pencil, Trash2, Check, X, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export type Chat = {
  id: string;
  title: string;
  updatedAt: string;
};

export default function RecentChatsClient({ initialChats }: { initialChats: Chat[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const updateChat = updateChatMutation();
  const deleteChat = deleteChatMutation();

  useEffect(() => {
    setChats(initialChats);
  }, [initialChats]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const startEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setDraftTitle(currentTitle);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftTitle('');
  };

  const saveEdit = async (id: string) => {
    const next = draftTitle.trim();
    if (!next) {
      toast.error('Title cannot be empty');
      return;
    }
    try {
      await updateChat.mutateAsync({ chatId: id, newTitle: next });
      setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: next } : c)));
      setEditingId(null);
      setDraftTitle('');
      router.refresh();
    } catch {
      /* handled in hook */
    }
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;
    setIsDeleting(true);
    try {
      await deleteChat.mutateAsync(chatToDelete.id);
      setChats((prev) => prev.filter((c) => c.id !== chatToDelete.id));
      if (pathname === `/dashboard/${chatToDelete.id}`) {
        router.push('/dashboard');
      }
      router.refresh();
    } catch {
      /* handled in hook */
    } finally {
      setIsDeleting(false);
      setChatToDelete(null);
    }
  };

  return (
    <>
      {chats.map((c) => {
        const isEditing = editingId === c.id;
        const isActive = pathname === `/dashboard/${c.id}`;
        return (
          <SidebarMenuItem key={c.id}>
            {isEditing ? (
              <div className="flex items-center gap-1.5 rounded-md p-1 h-8.5">
                <Input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(c.id);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  aria-label="Chat title"
                  className="h-7 text-xs px-2"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => saveEdit(c.id)}>
                  <Check className="h-3.5 w-3.5" />
                  <span className="sr-only">Save</span>
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={cancelEdit}>
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Cancel</span>
                </Button>
              </div>
            ) : (
              <>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    "h-8.5 pl-2 pr-7! rounded-md transition-all duration-150 ease-in-out flex items-center justify-between gap-1 group/row min-w-0",
                    "hover:bg-sidebar-accent/70 dark:hover:bg-white/[0.06]",
                    "active:scale-[0.985] active:bg-sidebar-accent/80",
                    isActive && "bg-sidebar-accent/90 text-sidebar-accent-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)] border-l-2 border-primary pl-1.5"
                  )}
                >
                  <Link href={`/dashboard/${c.id}`} className="flex min-w-0 w-full items-center justify-between gap-1">
                    <span className="truncate min-w-0 flex-1 text-xs font-medium">{c.title}</span>
                    <span className="text-[10px] font-normal text-muted-foreground/60 shrink-0 text-right tracking-tight pl-1">{c.updatedAt}</span>
                  </Link>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction aria-label="More actions" showOnHover className="right-1 h-6 w-6">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end">
                    <DropdownMenuItem onSelect={() => startEdit(c.id, c.title)}>
                      <Pencil className="h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setChatToDelete(c)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </SidebarMenuItem>
        );
      })}

      <ConfirmModal
        open={!!chatToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setChatToDelete(null);
        }}
        title="Delete Chat"
        description={
          <>
            Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{chatToDelete?.title}&quot;</span>? This action cannot be undone.
          </>
        }
        confirmText="Delete Chat"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
