import React from 'react';
import ChatClient from "../../components/ChatClient";

export default function ChatPage({ params }: { params: { chatId: string } }) {
  return <ChatClient />;
}
