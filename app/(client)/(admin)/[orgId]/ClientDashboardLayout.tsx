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
    const { toggleSidebar } = useSidebar()
    const fetchMemberships = useMembershipStore((s) => s.fetchMemberships)

    useEffect(() => {
        fetchMemberships()
    }, [fetchMemberships])

    return (
        <>
            <AppSidebar variant="sidebar" orgId={organization._id} role={role} />
            <SidebarInset>
                <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-card dark:bg-card px-4 md:px-10">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-muted dark:hover:bg-muted rounded"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="h-4 w-px bg-black" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage className="line-clamp-1">
                                    Dashboard
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="ml-auto"><ThemeToggle /></div>
                </header>

                <main className="flex flex-1 flex-col p-4 md:px-10">{children}</main>
            </SidebarInset>
        </>
    )
}

export default function ClientDashboardLayout({ children, workspace }: { children: ReactNode; workspace: Workspace }) {
    return (
        <WorkspaceContext.Provider value={workspace}>
            <SidebarProvider>
                <DashboardContent>{children}</DashboardContent>
            </SidebarProvider>
        </WorkspaceContext.Provider>
    )
}
