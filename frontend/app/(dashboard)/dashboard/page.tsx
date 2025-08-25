import ChatClient from './components/ChatClient';
import NewChatProvider from './context/NewChat';

export default async function DashboardChatPage() {
  return (
    <NewChatProvider>
      <ChatClient />
    </NewChatProvider>
  );
}
