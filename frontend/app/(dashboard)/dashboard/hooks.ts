import { clientAPI } from '@/lib/client-api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useChatListQuery = () => {
  return useQuery({
    queryKey: ['chat-list'],
    queryFn: async () => {
      const { data } = await clientAPI.get(`/chat/list`);
      return data;
    },
  });
};

export const createChatMutation = () => {
  return useMutation({
    mutationFn: async (message: string) => {
      const { data } = await clientAPI.post(
        `/chat/create?message=${encodeURIComponent(message)}`,
      );
      return data;
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success('Chat created');
    },
  });
};
