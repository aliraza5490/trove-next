import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { clientAPI } from '@/lib/client-api';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

const setAuthCookie = (token: string) => {
  document.cookie = `token=${token}; path=/; max-age=691200`;
};

export const getAuthErrorMessage = (error: any): string => {
  if (!error) return 'An error occurred during login.';
  if (error?.response?.status === 401 || error?.response?.status === 400) {
    const detail = error?.response?.data?.detail;
    if (typeof detail === 'string' && detail !== 'Incorrect username or password') {
      return detail;
    }
    return 'Invalid email or password.';
  }
  const detail = error?.response?.data?.detail || error?.message;
  if (typeof detail === 'string') {
    return detail;
  }
  return 'Invalid credentials. Please check your email and password.';
};

export const useLoginMutation = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await clientAPI.post('/auth/login', {
        email: data.email,
        password: data.password,
      });
      return res.data;
    },
    onSuccess: (data) => {
      const token = data?.access_token;
      if (token) {
        setAuthCookie(token);
        toast.success('Login successful! Redirecting...');
        router.push('/dashboard');
      } else {
        toast.error('Login failed: Token not received');
      }
    },
    onError: (error: any) => {
      console.error('Login failed:', error);
      const message = getAuthErrorMessage(error);
      toast.error(message);
    },
  });
};
