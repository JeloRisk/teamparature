"use client"

import React, { createContext, useContext, ReactNode, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { BarChart3, Building2, Check, ChevronDown, History, LayoutDashboard, Menu, UserRound, Users } from "lucide-react"
import { usePathname } from "next/navigation"
import AnalyticsRangePicker from "./analytics/AnalyticsRangePicker"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/app/components/ui/sheet"

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

function MobileWorkspaceSwitcher({ organization }: { organization: Workspace["organization"] }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const memberships = useMembershipStore(state => state.memberships)
    const loading = useMembershipStore(state => state.loading)
    const error = useMembershipStore(state => state.error)
    const setActiveMembership = useMembershipStore(state => state.setActiveMembership)

    const switchWorkspace = (membership: (typeof memberships)[number]) => {
        setActiveMembership(membership)
        setOpen(false)
        router.push(`/${membership.organization._id}`)
    }

    return <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
            <button
                type="button"
                aria-label={`Current workspace: ${organization.name}. Switch workspace.`}
                title={`Current workspace: ${organization.name}`}
                className="flex min-h-11 min-w-0 max-w-[54vw] items-center gap-2 rounded-xl px-1 py-1 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden"
            >
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent text-primary" aria-hidden="true">
                    <Building2 className="size-4" />
                </span>
                <span className="min-w-0 leading-tight">
                    <span className="block text-[10px] text-muted-foreground">Workspace</span>
                    <span className="block truncate text-sm font-semibold tracking-tight">{organization.name}</span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[80svh] rounded-t-2xl px-0 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-0 shadow-none sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2">
            <SheetHeader className="border-b px-5 pb-4 pt-6 text-left">
                <SheetTitle>Switch workspace</SheetTitle>
                <SheetDescription>Choose which team you’re viewing.</SheetDescription>
            </SheetHeader>
            <div className="max-h-[55svh] overflow-y-auto px-3 py-2">
                {memberships.map(membership => {
                    const isCurrent = membership.organization._id === organization._id
                    return <button
                        key={membership._id}
                        type="button"
                        onClick={() => switchWorkspace(membership)}
                        aria-current={isCurrent ? "true" : undefined}
                        disabled={isCurrent}
                        className="flex min-h-16 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-default"
                    >
                        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${isCurrent ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`} aria-hidden="true">
                            <Building2 className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{membership.organization.name}</span>
                            <span className="block text-xs capitalize text-muted-foreground">{membership.role}</span>
                        </span>
                        {isCurrent && <Check className="size-5 shrink-0 text-primary" aria-label="Current workspace" />}
                    </button>
                })}
                {memberships.length === 0 && <p className="px-3 py-6 text-sm text-muted-foreground">
                    {error ? "Couldn’t load workspaces. Try again from Profile." : loading ? "Loading workspaces…" : "No other workspaces available."}
                </p>}
            </div>
            <div className="border-t px-5 pt-3">
                <Link href={`/${organization._id}/profile`} onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">
                    Profile and settings
                </Link>
            </div>
        </SheetContent>
    </Sheet>
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
        profile: "Profile",
        account: "Account settings",
        "mood-overview": "Mood overview",
        settings: "Settings",
    } as Record<string, string>)[section] ?? "Dashboard"
    const { toggleSidebar } = useSidebar()
    const fetchMemberships = useMembershipStore((s) => s.fetchMemberships)
    const mobileOwnerNavigation = [
        { label: "Home", href: `/${organization._id}`, icon: LayoutDashboard },
        { label: "Members", href: `/${organization._id}/members`, icon: Users },
        { label: "Activity", href: `/${organization._id}/activity`, icon: History },
        { label: "Analytics", href: `/${organization._id}/analytics`, icon: BarChart3 },
        { label: "Profile", href: `/${organization._id}/profile`, icon: UserRound },
    ]

    useEffect(() => {
        fetchMemberships()
    }, [fetchMemberships])

    return (
        <>
            <AppSidebar variant="sidebar" orgId={organization._id} role={role} />
            <SidebarInset className="min-w-0">
                <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b bg-card px-4 md:h-16 md:px-10">
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        aria-label="Toggle navigation menu"
                        className="hidden size-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted dark:hover:bg-muted md:inline-flex"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="hidden h-4 w-px shrink-0 bg-border md:block" />
                    <MobileWorkspaceSwitcher organization={organization} />
                    <div className="hidden md:block">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="line-clamp-1">
                                        {breadcrumbLabel}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {isAnalytics && <AnalyticsRangePicker orgId={organization._id} />}
                        <ThemeToggle />
                    </div>
                </header>

                <main className={`flex min-w-0 flex-1 flex-col p-4 md:px-10 ${role === "owner" ? "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4" : ""}`}>
                    {children}
                </main>
            </SidebarInset>
            {role === "owner" && <nav aria-label="Owner navigation" className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden">
                <div className="mx-auto grid min-h-14 w-full max-w-sm grid-cols-5 items-center gap-1 rounded-full border border-slate-200 bg-white p-1 dark:border-slate-200 dark:bg-white">
                    {mobileOwnerNavigation.map(({ label, href, icon: Icon }) => {
                        const isProfileSection = label === "Profile" && (
                            pathname?.startsWith(`/${organization._id}/profile`) ||
                            [
                                `/${organization._id}/settings`,
                            ].includes(pathname ?? "")
                        )
                        const isActive = pathname === href || isProfileSection
                        return <Link
                            key={href}
                            href={href}
                            aria-label={label}
                            title={label}
                            aria-current={isActive ? "page" : undefined}
                            className="flex min-h-12 min-w-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
                        >
                            <span className={`grid size-10 place-items-center rounded-full transition-colors ${isActive ? "bg-[#4f5ed9] text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
                                <Icon className="size-5" aria-hidden="true" />
                            </span>
                        </Link>
                    })}
                </div>
            </nav>}
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
