import { create } from 'zustand';

interface NewChatState {
  message: string;
  setMessage: (message: string | ((prev: string) => string)) => void;
  resetMessage: () => void;
}

export const useNewChatStore = create<NewChatState>((set) => ({
  message: '',
  setMessage: (message) =>
    set((state) => ({
      message: typeof message === 'function' ? message(state.message) : message,
    })),
  resetMessage: () => set({ message: '' }),
}));

export const useNewChat = useNewChatStore;

export default useNewChatStore;
