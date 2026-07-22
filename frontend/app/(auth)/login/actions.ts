'use server';
import { cookies } from 'next/headers';
import z from 'zod';
import { serverAPI } from '@/lib/server-api';

export const handleLogin = async (formData: FormData) => {
  const input = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  });

  // Validate the form data
  const validationResult = loginSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      error: 'Validation failed. Please check your inputs.',
      prevInputs: input,
      validationErrors: validationResult.error.flatten().fieldErrors,
    };
  }

  try {
    const res = await serverAPI.post('/auth/login', {
      email: input.email,
      password: input.password,
    });

    const access_token = res.data?.access_token;
    if (access_token) {
      const cookieStore = await cookies();
      cookieStore.set('token', access_token, {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 8, // 8 days
      });
      return {
        error: '',
        success: true,
        message: 'Login successful',
      };
    } else {
      return {
        error: 'Login failed. Invalid token received.',
        prevInputs: input,
      };
    }
  } catch (error: any) {
    console.error('Login failed:', error?.response?.data || error.message);
    const detail = error?.response?.data?.detail || 'Login failed. Please check your credentials.';
    return {
      error: detail,
      prevInputs: input,
    };
  }
};

