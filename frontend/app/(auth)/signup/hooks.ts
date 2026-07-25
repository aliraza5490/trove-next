import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { clientAPI } from '@/lib/client-api';

export const signupSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(255),
    lastName: z.string().min(1, 'Last name is required').max(255),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof signupSchema>;

const setAuthCookie = (token: string) => {
  document.cookie = `token=${token}; path=/; max-age=691200`;
};

export const useSignupMutation = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: SignupInput) => {
      await clientAPI.post('/auth/register', {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      });

      // Auto-login after registration
      const loginRes = await clientAPI.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      return loginRes.data;
    },
    onSuccess: (data) => {
      const token = data?.access_token;
      if (token) {
        setAuthCookie(token);
      }
      toast.success('Sign up successful! Redirecting...');
      router.push('/dashboard');
    },
    onError: (error: any) => {
      console.error('Sign up failed:', error);
      const detail = error?.response?.data?.detail || error.message || 'Sign up failed. Please try again.';
      const message = typeof detail === 'string' ? detail : JSON.stringify(detail);
      toast.error(message);
    },
  });
};
