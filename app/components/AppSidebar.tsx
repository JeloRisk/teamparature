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
import BrandLockup from "@/app/components/BrandLockup"

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
    { title: "Home", url: `/${orgId}`, icon: LayoutDashboard },
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
      <SidebarHeader className="gap-3 border-b border-sidebar-border px-3 pb-3 pt-4 group-data-[collapsible=icon]:px-2">
        <Link href={orgId ? `/${orgId}` : "/"} aria-label="Teamparature home" className="flex min-h-10 items-center rounded-lg px-1 focus-visible:outline-2 focus-visible:outline-ring group-data-[collapsible=icon]:px-0">
          <BrandLockup labelClassName="group-data-[collapsible=icon]:hidden" />
        </Link>
        <MembershipSwitcher />
      </SidebarHeader>

      <SidebarContent className="gap-4 px-3 py-3 group-data-[collapsible=icon]:px-2">
        {navigationGroups.map(section => (
        <SidebarGroup key={section.title} className="p-0">
          <SidebarGroupLabel className="mb-1 px-3 text-xs font-medium text-muted-foreground">{section.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {section.items.map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      className={[
                        "h-11 w-full rounded-xl transition-colors",
                        "flex items-center gap-3 px-3 py-2 text-sm",
                        isActive
                          ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      ].join(" ")}
                    >
                      <Link href={item.url} prefetch={true} aria-current={isActive ? "page" : undefined}>
                        <Icon
                          className={[
                            "h-5 w-5",
                            isActive ? "text-sidebar-accent-foreground" : "text-muted-foreground"
                          ].join(" ")}
                          aria-hidden="true"
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
