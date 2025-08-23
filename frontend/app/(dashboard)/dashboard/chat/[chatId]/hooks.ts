import { clientAPI } from '@/lib/client-api';
import { useQuery } from '@tanstack/react-query';

export const useChatQuery = (chatId: string | null) => {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const { data } = await clientAPI.get(`/chat/${chatId}`);
      return data;
    },
    enabled: !!chatId,
  });
};
