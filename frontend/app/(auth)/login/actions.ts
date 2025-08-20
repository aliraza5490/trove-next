'use server';
import { serverAPI } from '@/lib/server-api';
import { cookies } from 'next/headers';

export const handleLogin = async (formData: FormData) => {
  const input = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  try {
    const { data } = await serverAPI.post('/auth/login', {
      ...input,
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'token',
      value: data.access_token,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
    });

    return {
      error: '',
      success: true,
      message: 'Login successful',
    };
  } catch (error) {
    console.error('Login failed:', error);
    return {
      error: 'Login failed. Please check your credentials.',
      prevInputs: input,
      validationErrors: {},
    };
  }
};
