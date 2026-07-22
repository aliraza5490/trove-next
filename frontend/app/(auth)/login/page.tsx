import { LoginForm } from './components/LoginForm';
import { redirect } from 'next/navigation';
import { serverAPI } from '@/lib/server-api';

const LoginPage = async () => {
  try {
    const res = await serverAPI.post('/auth/protected');
    if (res.data?.user) {
      return redirect('/dashboard');
    }
  } catch {
    // Not authenticated
  }

  return <LoginForm />;
};

export default LoginPage;

