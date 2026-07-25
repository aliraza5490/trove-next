import { clientAPI } from '@/lib/client-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      const { data } = await clientAPI.post(
        `/chat/create?message=${encodeURIComponent(message)}`,
      );
      return data;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create chat');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-list'] });
      toast.success('Chat created');
    },
  });
};

export const deleteChatMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chatId: string) => {
      const { data } = await clientAPI.delete(`/chat/${chatId}`);
      return data;
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete chat');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-list'] });
      toast.success('Chat deleted');
    },
  });
};

export const updateChatMutation = () => {
  const queryClient = useQueryClient();
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
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update chat title');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-list'] });
      toast.success('Chat updated');
    },
  });
};

export const useUpdateChatAgentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      chatId,
      agent,
    }: {
      chatId: string;
      agent: string | null;
    }) => {
      const { data } = await clientAPI.patch(`/chat/${chatId}/agent`, {
        agent,
      });
      return data;
    },
    onError: (error: any) => {
      console.error('Failed to update chat agent:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-list'] });
    },
  });
};

export const useUploadFileMutation = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await clientAPI.post('/chat/upload', formData);
      return data;
    },
    onError: (error: any) => {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    },
  });
};
