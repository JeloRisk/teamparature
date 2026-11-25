"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Check, ChevronRight, LogOut, Settings } from "lucide-react"
import { signOut } from "next-auth/react"
import { useWorkspace } from "../ClientDashboardLayout"
import { useMembershipStore } from "@/app/stores/useMembershipStore"
import { useUserStore } from "@/app/stores/useUserStore"
import InstallAppCard from "@/app/components/InstallAppCard"

export default function ProfilePage() {
    const { organization, role } = useWorkspace()
    const router = useRouter()
    const user = useUserStore(state => state.user)
    const { memberships, loading, setActiveMembership } = useMembershipStore()
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Your profile"
    const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "TM"

    const switchWorkspace = (membership: (typeof memberships)[number]) => {
        if (membership.organization._id === organization._id) return
        setActiveMembership(membership)
        router.push(`/${membership.organization._id}`)
    }

    return (
        <div className="workspace-page-surface mobile-page min-w-0 flex-1 text-foreground">
            <div className="mobile-page-content mx-auto min-w-0 max-w-3xl space-y-4 sm:space-y-5">
                <header className="mobile-page-header">
                    <h1 className="text-2xl font-semibold leading-tight tracking-tight">Profile</h1>
                </header>

                <Link href={`/${organization._id}/profile/account`} aria-label={`Account settings for ${fullName}`} className="flex min-w-0 items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground" aria-hidden="true">{initials}</span>
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-base font-semibold">{fullName}</h2>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email ?? "Account details"}</p>
                        <p className="mt-1 text-xs font-medium text-primary">Account settings</p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>

                <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="workspaces-heading">
                    <div className="mb-2">
                        <h2 id="workspaces-heading" className="text-sm font-semibold">Workspaces</h2>
                        <p className="mt-1 text-xs text-muted-foreground">Choose a workspace to switch to.</p>
                    </div>
                    <div className="divide-y divide-border/70">
                        {memberships.map(membership => {
                            const isCurrent = membership.organization._id === organization._id
                            return <button
                                key={membership._id}
                                type="button"
                                onClick={() => switchWorkspace(membership)}
                                aria-current={isCurrent ? "true" : undefined}
                                disabled={isCurrent}
                                className="flex min-h-14 w-full items-center gap-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default"
                            >
                                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${isCurrent ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                                    <Building2 className="size-4" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">{membership.organization.name}</span>
                                    <span className="mt-0.5 block text-xs capitalize text-muted-foreground">{membership.role}</span>
                                </span>
                                {isCurrent ? <Check className="size-4 shrink-0 text-primary" aria-label="Current workspace" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                            </button>
                        })}
                        {!loading && memberships.length === 0 && <div className="flex min-h-14 items-center gap-3 py-2">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><Building2 className="size-4" aria-hidden="true" /></span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{organization.name}</span>
                            <Check className="size-4 shrink-0 text-primary" aria-label="Current workspace" />
                        </div>}
                        {loading && memberships.length === 0 && <p className="py-3 text-sm text-muted-foreground">Loading workspaces…</p>}
                    </div>
                </section>

                {role === "owner" && <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="workspace-tools-heading">
                    <div className="mb-2">
                        <h2 id="workspace-tools-heading" className="text-sm font-semibold">Workspace</h2>
                        <p className="mt-1 truncate text-xs text-muted-foreground">Settings for {organization.name}</p>
                    </div>
                    <div className="divide-y divide-border/70">
                        <Link href={`/${organization._id}/settings`} className="flex min-h-16 items-center gap-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><Settings className="size-4" aria-hidden="true" /></span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">Workspace settings</span>
                                <span className="block text-xs text-muted-foreground">Name, timezone, and workspace details</span>
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        </Link>
                    </div>
                </section>}

                <InstallAppCard />
                <button
                    type="button"
                    onClick={() => void signOut({ callbackUrl: "/login" })}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden"
                >
                    <LogOut className="size-4 shrink-0" aria-hidden="true" />
                    Log out
                </button>
            </div>
        </div>
    )
}
