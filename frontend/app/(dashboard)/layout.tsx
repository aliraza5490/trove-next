import Logo from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import * as jwt from 'jsonwebtoken';
import { FolderKanban, Plus } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavButton from './dashboard/components/NavButton';
import { NavUser } from './dashboard/components/NavUser';
import RecentChats from './dashboard/components/RecentChats';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const user = cookieStore.get('token');

  if (!user) {
    return redirect('/login');
  }

  try {
    jwt.verify(user?.value || '', process.env.SECRET_KEY || '');
  } catch (error) {
    return redirect('/login');
  }

  const avatar = '/images/max.jpg';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo link="/dashboard" />
          <NavButton
            icon={<Plus className="size-4" />}
            link="/dashboard"
            text="New chat"
          />
          <NavButton
            icon={<FolderKanban className="size-4" />}
            link="/dashboard/knowledge-base"
            text="Manage Knowledge Base"
            variant="outline"
          />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Recent chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <RecentChats />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />
        <SidebarFooter>
          <NavUser
            user={{
              name: user?.name ?? 'User',
              email: (user as any)?.email ?? 'user@example.com',
              avatar,
            }}
          />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <div className="flex h-12 items-center gap-2 border-b px-3">
          <SidebarTrigger />
          <div className="text-sm text-muted-foreground">Dashboard</div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
        <div className="min-h-[calc(100dvh-3rem)]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
