import NewConversation from '@/app/(dashboard)/components/NewConversation';
import RecentChats from '@/app/(dashboard)/components/RecentChats';
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
import { NavUser } from '@/app/(dashboard)/components/NavUser';
import { ThemeToggle } from '@/components/theme-toggle';
import Logo from "@/components/logo";
import { redirect } from "next/navigation";
import { serverAPI } from '@/lib/server-api';

import { TopNav } from '@/app/(dashboard)/components/TopNav';
import { CommandMenu } from '@/components/command-menu';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: any = null;
  try {
    const res = await serverAPI.post('/auth/protected');
    user = res.data?.user;
  } catch {
    // Unauthenticated
  }

  if (!user) {
    return redirect('/login');
  }

  const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'User';
  const avatar = '/images/max.jpg';
  const userData = { name: userName, email: user?.email ?? 'user@example.com', avatar };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo link="/dashboard" className="justify-start px-2" />
          <NewConversation />
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
          <NavUser user={userData} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <TopNav user={userData} />
        <div className="min-h-[calc(100dvh-3.25rem)]">{children}</div>
      </SidebarInset>
      <CommandMenu />
    </SidebarProvider>
  );
}