'use server';
import { cookies } from 'next/headers';
import z from 'zod';
import { serverAPI } from '@/lib/server-api';

export const handleSignUpAction = async (prevState: any, formData: FormData) => {
  const input = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
  };

  const signUpSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(255),
    lastName: z.string().min(1, 'Last name is required').max(255),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  });

  // Validate the form data
  const validationResult = signUpSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      error: 'Validation failed. Please check your inputs.',
      prevInputs: input,
      validationErrors: validationResult.error.flatten().fieldErrors,
    };
  }

  // Check if passwords match
  if (input.password !== input.confirmPassword) {
    return {
      error: 'Passwords do not match.',
      prevInputs: input,
    };
  }

  try {
    await serverAPI.post('/auth/register', {
      email: input.email,
      password: input.password,
      first_name: input.firstName,
      last_name: input.lastName,
    });

    // Auto-login after successful registration
    const loginRes = await serverAPI.post('/auth/login', {
      email: input.email,
      password: input.password,
    });

    const access_token = loginRes.data?.access_token;
    if (access_token) {
      const cookieStore = await cookies();
      cookieStore.set('token', access_token, {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 8,
      });
    }

    return {
      error: '',
      success: true,
      message: 'Sign up successful',
    };
  } catch (error: any) {
    console.error('Sign up failed:', error?.response?.data || error.message);
    const rawDetail = error?.response?.data?.detail;
    let detailMessage = 'Sign up failed. Please try again.';

    if (typeof rawDetail === 'string') {
      detailMessage = rawDetail;
    } else if (Array.isArray(rawDetail)) {
      detailMessage = rawDetail
        .map((item: any) => (typeof item === 'string' ? item : item?.msg || JSON.stringify(item)))
        .join('; ');
    } else if (rawDetail && typeof rawDetail === 'object') {
      detailMessage = rawDetail.msg || rawDetail.message || JSON.stringify(rawDetail);
    } else if (error?.message && typeof error.message === 'string') {
      detailMessage = error.message;
    }

    return {
      error: detailMessage,
      prevInputs: input,
    };
  }
};

