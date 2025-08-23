import { serverAPI } from '@/lib/server-api';
import RecentChatsClient from './RecentChatsClient';
import { cookies } from 'next/headers';

type Chat = {
  id: string;
  title: string;
  user_id: string;
};

export default async function RecentChats() {
  const cookieStore = await cookies();
  let chats: Chat[] = [];

  try {
    const token = cookieStore.get('token')?.value || '';
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/list`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: {
          tags: ['chat-list'],
        },
      },
    );
    chats = await data.json();
    console.log(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
  }

  if (!chats.length) {
    return (
      <div className="text-sm text-muted-foreground px-2 py-4">
        No chats yet
      </div>
    );
  }

  return <RecentChatsClient initialChats={chats} />;
}
