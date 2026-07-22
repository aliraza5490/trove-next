'use server';

import { serverAPI } from '@/lib/server-api';
import { revalidatePath } from 'next/cache';

export async function renameChat(chatId: string, title: string) {
  try {
    await serverAPI.patch(`/chat/${chatId}/update`, { new_title: title });
    revalidatePath('/dashboard');
  } catch (err: any) {
    console.error('Failed to rename chat:', err?.response?.data || err.message);
    throw new Error('Failed to rename chat');
  }
}

export async function deleteChat(chatId: string) {
  try {
    await serverAPI.delete(`/chat/${chatId}`);
    revalidatePath('/dashboard');
  } catch (err: any) {
    console.error('Failed to delete chat:', err?.response?.data || err.message);
    throw new Error('Failed to delete chat');
  }
}

