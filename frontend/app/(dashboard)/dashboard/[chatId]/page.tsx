import React from 'react';
import { redirect } from 'next/navigation';
import ChatClient from '../components/ChatClient';
import { serverAPI } from '@/lib/server-api';

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;

  let initialMessages: any[] = [];
  let initialAgent: string | null = null;
  try {
    const res = await serverAPI.get(`/chat/${chatId}`);
    const data = res.data;
    if (data?.chat?.agent) {
      initialAgent = data.chat.agent;
    }
    if (data?.messages) {
      initialMessages = data.messages.map((m: any) => ({
        id: m.id,
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content || m.message || '',
        attachments: (m.attachments || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          url: a.url,
          googleUri: a.googleUri,
          mimeType: a.mimeType,
          size: a.size,
        })),
      }));
    }
  } catch (err) {
    console.error(`Failed to load chat ${chatId}:`, err);
    return redirect('/dashboard');
  }

  return <ChatClient chatId={chatId} initialMessages={initialMessages} initialAgent={initialAgent} key={chatId} />;
}


