"use client";

import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  Monitor,
  Moon,
  Sun,
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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Theme, useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "@tanstack/react-router";

export function NavUser() {
  const { isMobile } = useSidebar();

  const { theme, setTheme } = useTheme();
  const { current_user, logout } = useAuth();

  const user = {
    name: current_user?.user_metadata?.full_name,
    email: current_user?.email,
    avatar: current_user?.user_metadata?.avatar_url ?? "/avatars/shadcn.jpg",
  };

  const handleLogout = () => {
    logout().then(() => window.location.reload());
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-300">
                  CN
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link to="/account">
                <DropdownMenuItem>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <ToggleGroup
                type="single"
                size="sm"
                className="w-full"
                value={theme}
                onValueChange={(value) => setTheme(value as Theme)}
              >
                <ToggleGroupItem value="light" className="w-1/3 h-8">
                  <Sun className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" className="w-1/3 h-8">
                  <Moon className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="system" className="w-1/3 h-8">
                  <Monitor className="size-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
