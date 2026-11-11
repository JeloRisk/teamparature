"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Check, ChevronRight, Settings, UserRoundCog } from "lucide-react"
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
        <div className="dashboard-reference-theme -m-4 min-w-0 flex-1 bg-background px-4 py-5 sm:py-8 md:-mx-10 md:px-10">
            <div className="mx-auto min-w-0 max-w-3xl space-y-4 sm:space-y-5">
                <header className="pb-2">
                    <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Profile</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">Your account and workspaces</p>
                </header>

                <section className="flex min-w-0 items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-base font-semibold text-accent-foreground" aria-hidden="true">{initials}</span>
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold">{fullName}</h2>
                        <p className="truncate text-sm text-muted-foreground">{user?.email ?? "Account details"}</p>
                    </div>
                </section>

                <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="workspaces-heading">
                    <div className="mb-2">
                        <h2 id="workspaces-heading" className="text-base font-semibold">Workspaces</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Choose a workspace to switch to.</p>
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
                                    <span className="block text-xs capitalize text-muted-foreground">{membership.role}</span>
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
                        <h2 id="workspace-tools-heading" className="text-base font-semibold">Workspace</h2>
                        <p className="mt-1 truncate text-sm text-muted-foreground">Settings for {organization.name}</p>
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

                <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="personal-settings-heading">
                    <div className="mb-2">
                        <h2 id="personal-settings-heading" className="text-base font-semibold">Your account</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Personal details used across your workspaces</p>
                    </div>
                    <Link href={`/${organization._id}/profile/account`} className="flex min-h-16 items-center gap-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><UserRoundCog className="size-4" aria-hidden="true" /></span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">Account settings</span>
                            <span className="block text-xs text-muted-foreground">Name and profile details</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </Link>
                </section>

                <InstallAppCard />
            </div>
        </div>
    )
}
