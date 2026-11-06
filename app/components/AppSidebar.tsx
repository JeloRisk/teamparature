'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from './ui/sidebar';
import { NavUser } from "@/app/components/nav-user"

import {
  LayoutDashboard,
  Users,
  BarChart3
} from "lucide-react";
import { useUserStore } from '../stores/useUserStore';
import { MembershipSwitcher } from './TeamSwitcher';
import type { Role } from '@/lib/rbac';

export function AppSidebar({ orgId, role, ...props }: React.ComponentProps<typeof Sidebar> & {
  orgId?: string
  role?: Role
}) {
  const menuItems = orgId ? [
    { title: "Dashboard", url: `/${orgId}`, icon: LayoutDashboard },
    ...(role === "owner" ? [
      { title: "Members", url: `/${orgId}/members`, icon: Users },
      { title: "Analytics", url: `/${orgId}/analytics`, icon: BarChart3 },
    ] : []),
  ] : []

  const pathname = usePathname();
  const user = useUserStore((state) => state.user)

  if (!user) return null;

  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <MembershipSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="p-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={[
                        "group w-full rounded-lg transition-colors",
                        "flex items-center gap-2 py-[22px] px-[20px]",
                        isActive
                          ? "bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
                          : "text-gray-700 hover:bg-blue-100 "
                      ].join(" ")}
                    >
                      <Link href={item.url}>
                        <Icon
                          className={[
                            "h-5 w-5",
                            isActive ? "text-white" : " text-blue-600 "
                          ].join(" ")}
                        />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={{
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          email: user.email ?? '',
          avatar: user.avatar ?? '',
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
