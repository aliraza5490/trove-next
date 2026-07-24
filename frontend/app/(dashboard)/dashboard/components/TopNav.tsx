"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Search,
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { logout } from "@/app/(dashboard)/dashboard/actions";
import { clearAuthToken } from "@/lib/auth";

interface TopNavProps {
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
}

export function TopNav({ user }: TopNavProps) {
  const handleLogout = async () => {
    clearAuthToken();
    await logout();
    window.location.href = "/login";
  };

  const name = user?.name || "User";
  const email = user?.email || "user@example.com";
  const avatar = user?.avatar;

  return (
    <header className="flex h-13 items-center justify-between gap-3 border-b bg-background/80 px-3.5 backdrop-blur-md sticky top-0 z-10 transition-all">
      <div className="flex items-center gap-2.5 min-w-0">
        <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground transition-colors" />

        <div className="h-4 w-px bg-border/60 shrink-0" />

        {/* Dashboard Title with 20px (size-5) Icon */}
        <div className="flex items-center gap-2 shrink-0 text-sm font-medium text-foreground">
          <LayoutDashboard className="size-5 text-primary shrink-0" />
          <span className="font-semibold text-foreground">Dashboard</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Quick Search Button */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-command-menu"));
          }}
          className="hidden md:flex items-center gap-2 h-8 px-2.5 text-xs text-muted-foreground bg-accent/40 hover:bg-accent border border-border/50 rounded-lg transition-all hover:text-foreground cursor-pointer shadow-2xs"
        >
          <Search className="size-3.5 text-muted-foreground/80" />
          <span>Search chats...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-background border border-border/70 rounded text-muted-foreground font-mono shadow-2xs">
            ⌘K
          </kbd>
        </button>

        <ThemeToggle />

        {/* Profile Dropdown Circle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative flex items-center justify-center rounded-full p-0.5 outline-none ring-offset-background hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer transition-opacity"
            >
              <Avatar className="h-8 w-8 rounded-full border border-border/60 shadow-2xs">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white font-semibold text-xs">
                  {name ? name[0].toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-xl p-1" align="end" sideOffset={8}>
            <DropdownMenuLabel className="p-1.5 font-normal">
              <div className="flex items-center gap-2 text-left">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={avatar} alt={name} />
                  <AvatarFallback className="rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white font-semibold text-xs">
                    {name ? name[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-medium text-foreground">{name}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer gap-2">
                <Sparkles className="size-4 text-amber-500" />
                <span>Upgrade to Pro</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer gap-2">
                <BadgeCheck className="size-4 text-muted-foreground" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2">
                <Bell className="size-4 text-muted-foreground" />
                <span>Notifications</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
              <LogOut className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

