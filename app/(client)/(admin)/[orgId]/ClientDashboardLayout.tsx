"use client"

import React, { createContext, useContext, ReactNode } from "react"
import {
    SidebarProvider,
    SidebarInset,
    useSidebar,
} from "@/app/components/ui/sidebar"
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbPage,
} from "@/app/components/ui/breadcrumb"
import { AppSidebar } from "@/app/components/AppSidebar"
import ThemeToggle from "@/app/components/ThemeToggle"
import { Menu } from "lucide-react"
import { usePathname } from "next/navigation"
import AnalyticsRangePicker from "./analytics/AnalyticsRangePicker"

interface Workspace {
    organization: { _id: string; name: string; slug: string }
    role: "owner" | "member"
    ownerCount: number
    memberCount: number
}

const WorkspaceContext = createContext<Workspace | null>(null)

export function useWorkspace() {
    const workspace = useContext(WorkspaceContext)
    if (!workspace) throw new Error("Workspace layout is missing")
    return workspace
}

import { useEffect } from "react"
import { useMembershipStore } from "@/app/stores/useMembershipStore"
function DashboardContent({ children }: { children: ReactNode }) {
    const { organization, role } = useWorkspace()
    const pathname = usePathname()
    const section = pathname?.split("/").at(-1) ?? ""
    const isAnalytics = pathname?.split("/").at(-1) === "analytics" && role === "owner"
    const breadcrumbLabel = ({
        activity: "Activity",
        analytics: "Analytics",
        members: "Members",
        "mood-overview": "Mood overview",
        settings: "Settings",
    } as Record<string, string>)[section] ?? "Dashboard"
    const { toggleSidebar } = useSidebar()
    const fetchMemberships = useMembershipStore((s) => s.fetchMemberships)

    useEffect(() => {
        fetchMemberships()
    }, [fetchMemberships])

    return (
        <>
            <AppSidebar variant="sidebar" orgId={organization._id} role={role} />
            <SidebarInset className="min-w-0">
                <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-card dark:bg-card px-4 md:px-10">
                    <button
                        onClick={toggleSidebar}
                        aria-label="Toggle navigation menu"
                        className="p-2 hover:bg-muted dark:hover:bg-muted rounded"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="h-4 w-px bg-black" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage className="line-clamp-1">
                                    {breadcrumbLabel}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="ml-auto flex items-center gap-2">
                        {isAnalytics && <AnalyticsRangePicker orgId={organization._id} />}
                        <ThemeToggle />
                    </div>
                </header>

                <main className="flex min-w-0 flex-1 flex-col p-4 md:px-10">{children}</main>
            </SidebarInset>
        </>
    )
}

export default function ClientDashboardLayout({ children, workspace, sidebarDefaultOpen }: { children: ReactNode; workspace: Workspace; sidebarDefaultOpen: boolean }) {
    return (
        <WorkspaceContext.Provider value={workspace}>
            <SidebarProvider defaultOpen={sidebarDefaultOpen}>
                <DashboardContent>{children}</DashboardContent>
            </SidebarProvider>
        </WorkspaceContext.Provider>
    )
}
