import { create } from 'zustand';

interface NewChatState {
  message: string;
  setMessage: (message: string) => void;
}

const useNewChatStore = create<NewChatState>()((set) => ({
  message: '',
  setMessage: (message: string) => set({ message }),
}));

export default useNewChatStore;
