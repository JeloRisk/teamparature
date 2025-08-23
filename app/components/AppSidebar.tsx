'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  Group,
  Users,
  Smile,
  BarChart3
} from "lucide-react";
import { useUserStore } from '../stores/useUserStore';
import { MembershipSwitcher } from './TeamSwitcher';
import { useMembershipStore } from '../stores/useMembershipStore';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const activeMembership = useMembershipStore((s) => s.activeMembership)
  const orgId = activeMembership?.organization._id

  const menuItems = [
    { title: "Dashboard", url: `/${orgId}/dashboard`, icon: LayoutDashboard },
    { title: "Teams", url: `/${orgId}/teams`, icon: Group },
    { title: "Members", url: `/${orgId}/members`, icon: Users },
    { title: "Moods", url: `/${orgId}/moods`, icon: Smile },
    { title: "Analytics", url: `/${orgId}/analytics`, icon: BarChart3 },
  ]


  const pathname = usePathname();
  const user = useUserStore((state) => state.user)

  if (!user) return <p></p>

  return (
    <Sidebar {...props} collapsible="icon">
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <MembershipSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Menu */}
      <SidebarContent className="p-0">
        <SidebarGroup>
          {/* <SidebarGroupLabel>Manage</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem
                    key={item.title}
                    className={`rounded-lg ${isActive ? 'bg-blue-500 text-white' : ''
                      }`}
                  >
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className="font-medium flex items-center gap-2 w-full py-[22px] px-[20px]"
                      >
                        <Icon className={isActive ? 'text-white' : 'text-gray-500'} />
                        <span>{item.title}</span>
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
