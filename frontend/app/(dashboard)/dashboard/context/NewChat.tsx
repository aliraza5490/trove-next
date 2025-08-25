'use client';
import React, { use, useContext, useState } from 'react';
import { createContext } from 'react';

interface NewChatContextType {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}

const NewChatContext = createContext<NewChatContextType>({
  message: '',
  setMessage: () => {},
});

export const useNewChat = () => {
  const context = useContext(NewChatContext);
  if (!context) {
    throw new Error('useNewChat must be used within a NewChatProvider');
  }
  return context;
};

const NewChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState('');
  return (
    <NewChatContext value={{ message, setMessage }}>{children}</NewChatContext>
  );
};

export default NewChatProvider;
