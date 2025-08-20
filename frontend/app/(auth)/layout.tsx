import Meeples from './_components/Meeples';
import Logo from "@/components/logo";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jwt from 'jsonwebtoken';

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
    const cookieStore = await cookies();
    const user = cookieStore.get('token');
  
    if (user) {
      try {
        jwt.verify(user?.value || "", process.env.SECRET_KEY || "");
        return redirect('/dashboard');
      } catch (error: any) {
        if (error?.message === "NEXT_REDIRECT") {
          throw error; // Re-throw to handle the redirect properly
        }
      }
    }
  
  
  
  return (
    <div className="relative flex h-screen">
      <div className="w-full lg:w-1/2 h-full grid place-items-center px-12">
        <div className="w-full">
          <Logo />
          <main className="w-full gap-10 max-w-xl mx-auto">
            {children}
          </main>
        </div>
      </div>
      <div className="hidden w-1/2 h-full lg:block bg-gray-100">
        <Meeples />
      </div>
    </div>
  );
};

export default AuthLayout;
