import { SignupForm } from "./components/SignupForm";
import { redirect } from "next/navigation";
import { serverAPI } from "@/lib/server-api";

const SignupPage = async () => {
  try {
    const res = await serverAPI.post('/auth/protected');
    if (res.data?.user) {
      return redirect('/dashboard');
    }
  } catch {
    // Not authenticated
  }
  
  return (
    <div>
      <SignupForm />
    </div>
  );
}

export default SignupPage;