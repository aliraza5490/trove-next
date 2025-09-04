'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';
import { useEffect, useState } from 'react';

const Header = () => {
  const [isUser, setIsUser] = useState(false);
  const user = getAuthToken();

  useEffect(() => {
    setIsUser(!!user);
  }, [user]);

  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Bot aria-hidden className="size-6 text-primary" />
          <span className="font-semibold">Trove</span>
        </Link>
        <nav
          aria-label="Primary"
          className="flex flex-wrap items-center gap-2 sm:gap-3"
        >
          <Link
            href="#features"
            className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground"
          >
            How it works
          </Link>
          {!isUser && (
            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="ghost">Sign in</Button>
            </Link>
          )}
          <Link
            href={isUser ? '/dashboard' : '/signup'}
            className="inline-flex cursor-pointer"
          >
            <Button size="lg">
              {!isUser ? <>Get started</> : <>Dashboard</>}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
