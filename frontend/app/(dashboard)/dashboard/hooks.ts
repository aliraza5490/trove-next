import { clientAPI } from '@/lib/client-api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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

export const deleteChatMutation = () => {
  return useMutation({
    mutationFn: async (chatId: string) => {
      const { data } = await clientAPI.delete(`/chat/${chatId}/delete`);
      return data;
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success('Chat deleted');
    },
  });
};

export const updateChatMutation = () => {
  return useMutation({
    mutationFn: async ({
      chatId,
      newTitle,
    }: {
      chatId: string;
      newTitle: string;
    }) => {
      const { data } = await clientAPI.patch(`/chat/${chatId}/update`, {
        new_title: newTitle,
      });
      return data;
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success('Chat updated');
    },
  });
};
