import { create } from 'zustand';

interface ChatListState {
  chats: any[];
  addChat: (chat: any) => void;
  updateChat: (chatId: string, title: string) => void;
  updateChats: (chat: any[]) => void;
}

const useChatListStore = create<ChatListState>()((set) => ({
  chats: [],
  addChat: (chat: any) => set((state) => ({ chats: [...state.chats, chat] })),
  updateChat: (chatId: string, title: string) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, title } : chat,
      ),
    })),
  updateChats: (chats: any[]) => set(() => ({ chats })),
}));

export default useChatListStore;
