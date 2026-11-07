'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
  BarChart3,
  CalendarDays,
  Settings,
  History
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
      { title: "Activity history", url: `/${orgId}/activity`, icon: History },
    ] : role === "member" ? [
      { title: "Mood Overview", url: `/${orgId}/mood-overview`, icon: CalendarDays },
    ] : []),
  ] : []

  const navigationGroups = [
    { title: "Workspace", items: menuItems },
    ...(orgId && role === "owner" ? [{
      title: "Settings",
      items: [{ title: "Workspace settings", url: `/${orgId}/settings`, icon: Settings }],
    }] : []),
  ]

  const pathname = usePathname();
  const user = useUserStore((state) => state.user)

  if (!user) return null;

  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader className="px-4 pb-6 pt-5 group-data-[collapsible=icon]:px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <MembershipSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-8 px-4 py-3 group-data-[collapsible=icon]:px-2">
        {navigationGroups.map(section => (
        <SidebarGroup key={section.title} className="p-0">
          <SidebarGroupLabel className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {section.items.map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={[
                        "group h-11 w-full rounded-xl transition-colors",
                        "flex items-center gap-3 px-3.5 py-3 text-[13px]",
                        isActive
                          ? "bg-accent dark:bg-sidebar-accent font-semibold text-accent-foreground dark:text-sidebar-accent-foreground hover:bg-accent dark:hover:bg-accent hover:text-accent-foreground dark:hover:text-accent-foreground"
                          : "text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted "
                      ].join(" ")}
                    >
                      <Link href={item.url} prefetch={true}>
                        <Icon
                          className={[
                            "h-5 w-5",
                            isActive ? "text-accent-foreground dark:text-sidebar-accent-foreground" : "text-primary dark:text-primary"
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
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-4 group-data-[collapsible=icon]:px-2">
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
