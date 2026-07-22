import { serverAPI } from '@/lib/server-api';
import RecentChatsClient from "./RecentChatsClient";

type Chat = {
  id: string;
  title: string;
  updatedAt: string;
};

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: 'short' });
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default async function RecentChats() {
  let dbChats: any[] = [];
  try {
    const res = await serverAPI.get('/chat/list');
    dbChats = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('Failed to fetch chat list:', err);
  }

  const chats: Chat[] = dbChats.map((chat: any) => ({
    id: chat.id,
    title: chat.title || 'Untitled Chat',
    updatedAt: formatRelativeTime(chat.updated_at || chat.created_at),
  }));

  if (!chats.length) {
    return (
      <div className="text-sm text-muted-foreground px-2 py-4">No chats yet</div>
    );
  }

  return <RecentChatsClient initialChats={chats} />;
}

