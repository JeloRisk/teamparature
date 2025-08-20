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

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Teams', url: '/resumes', icon: Group },
  { title: 'Members', url: '/interview-practices', icon: Users },
  { title: 'Moods', url: '/moods', icon: Smile },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
];



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user)

  if (!user) return <p></p>

  return (
    <Sidebar {...props} collapsible="icon">
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Link href="#">
                <div className="flex items-center gap-3 w-full">
                  <div className=" text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Image
                      src="/logo.svg"
                      alt="Logo"
                      width={24}
                      height={24}
                      className="h-12 w-12"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 leading-none">
                    <span className=" text-[20px] font-bold text-orange-600">teamparature</span>
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
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
