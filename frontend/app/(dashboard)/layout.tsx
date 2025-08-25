import NewConversation from '@/app/(dashboard)/dashboard/components/NewConversation';
import RecentChats from '@/app/(dashboard)/dashboard/components/RecentChats';
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
import { NavUser } from '@/app/(dashboard)/dashboard/components/NavUser';
import { ThemeToggle } from '@/components/theme-toggle';
import Logo from '@/components/logo';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';

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
