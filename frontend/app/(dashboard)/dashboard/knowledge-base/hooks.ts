import { clientAPI } from '@/lib/client-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useStatsQuery = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await clientAPI.get(`/stats`);
      return data;
    },
  });
};

export const useFilesQuery = (page: number) => {
  return useQuery({
    queryKey: ['files', page],
    queryFn: async () => {
      const { data } = await clientAPI.get(`/kb/list?page=${page}`);
      return data;
    },
  });
};

export const useDeleteFileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await clientAPI.delete(`/kb/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('File deleted successfully');
    },
    onError: () => {
      toast.error('Error deleting file');
    },
  });
};

export const useUploadFilesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      await clientAPI.post('/kb/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Files uploaded successfully');
    },
    onError: () => {
      toast.error('Error uploading files');
    },
  });
};
