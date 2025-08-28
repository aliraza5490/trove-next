'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Pencil, Trash2, Check, X, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
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
import useChatListStore from '@/store/chatList';
import {
  deleteChatMutation,
  updateChatMutation,
  useChatListQuery,
} from '../hooks';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

export type Chat = {
  id: string;
  title: string;
  user_id: string;
};

export default function RecentChats() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useChatListQuery();
  const router = useRouter();
  const { mutateAsync: deleteChat, isPending: isDeleting } =
    deleteChatMutation();
  const { mutateAsync: updateChat, isPending: isUpdating } =
    updateChatMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

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
    await updateChat({
      chatId: id,
      newTitle: next,
    });
    await queryClient.invalidateQueries({
      queryKey: ['chat-list'],
    });
    setEditingId(null);
    setDraftTitle('');
  };

  const handleDeleteChat = async (id: string) => {
    if (isDeleting) return;
    const target = data.find((c: any) => c.id === id);
    if (!target) return;
    const ok = window.confirm(`Delete chat "${target.title}"?`);
    if (!ok) return;
    await deleteChat(id);
    await queryClient.invalidateQueries({
      queryKey: ['chat-list'],
    });
    if (window.location.pathname.includes(id)) {
      router.push('/dashboard');
    }
  };

  if (!data || isLoading) {
    return <div className="px-3 my-4">Loading...</div>;
  }

  return (
    <>
      {data.map((c: any) => {
        const isEditing = editingId === c.id;
        return (
          <SidebarMenuItem key={c.id}>
            {isEditing ? (
              <div className="flex items-center gap-2 rounded-md p-2">
                <Input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(c.id);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  aria-label="Chat title"
                  className="h-8"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => saveEdit(c.id)}
                >
                  <Check className="h-4 w-4" />
                  <span className="sr-only">Save</span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={cancelEdit}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cancel</span>
                </Button>
              </div>
            ) : (
              <>
                <SidebarMenuButton asChild>
                  <Link href={`/dashboard/chat/${c.id}`}>
                    <span className="line-clamp-1">{c.title}</span>
                    <span className="text-muted-foreground text-xs"></span>
                  </Link>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction aria-label="More actions" showOnHover>
                      <MoreVertical className="h-4 w-4" />
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end">
                    <DropdownMenuItem onSelect={() => startEdit(c.id, c.title)}>
                      <Pencil className="h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => handleDeleteChat(c.id)}
                    >
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
    </>
  );
}
