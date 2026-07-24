'use client';

import { usePathname } from "next/navigation";
import Meeples from './_components/Meeples';
import Logo from "@/components/logo";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isSignup = pathname === '/signup';

  return (
    <div className={`relative flex min-h-screen transition-colors duration-500 ${isSignup ? 'dark bg-background text-foreground' : 'bg-background text-foreground'}`}>
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-xl flex flex-col gap-6">
          <div className="flex items-center justify-center">
            <Logo size="lg" className="justify-center px-0 py-0" />
          </div>
          <main className="w-full">
            {children}
          </main>
        </div>
      </div>
      <div className="hidden lg:block w-1/2 h-screen sticky top-0 transition-colors duration-500 bg-muted border-l border-border">
        <Meeples />
      </div>
    </div>
  );
};

export default AuthLayout;
