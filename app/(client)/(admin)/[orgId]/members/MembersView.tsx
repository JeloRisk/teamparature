"use client"

import { invitationExpiry as expiryDate, invitationStatus as statusOf } from "@/lib/invitation-status"
import { MembersSkeleton, TableSkeletonRows } from "@/app/components/loading/WorkspaceSkeletons"
import { useEffect, useState, type FormEvent } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import type { OrgInvitation } from "@/app/stores/orgs/useTeamStore"
import { useOrgStore } from "@/app/stores/orgs/useTeamStore"

import {
    Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/app/components/ui/table"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Skeleton } from "@/app/components/ui/skeleton"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/app/components/ui/dialog"
import { UserPlus, Search, SlidersHorizontal, MoreVertical, Clock, X } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator } from "@/app/components/ui/dropdown-menu"
import MemberActions from "./MemberActions"
import WorkspaceAction from "../WorkspaceAction"
import { Label } from "@/app/components/ui/label"

export default function MembersPage() {
    const { data: session } = useSession()
    const { orgId } = useParams<{ orgId: string }>()
    const { organization, membership, memberships, loading, error, fetchOrganizationDetails } = useOrgStore()
    // console.log(memberships)

    const [tab, setTab] = useState<"members" | "invitations">("members")
    const [now, setNow] = useState(() => Date.now())
    const [invitations, setInvitations] = useState<OrgInvitation[]>([])
    const [statusFilter, setStatusFilter] = useState("all")
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [pendingCount, setPendingCount] = useState(0)
    const [listLoading, setListLoading] = useState(true)
    const [listError, setListError] = useState("")
    const [revision, setRevision] = useState(0)
    const [resending, setResending] = useState<string | null>(null)
    const [notice, setNotice] = useState("")
    const [resendError, setResendError] = useState("")
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteOpen, setInviteOpen] = useState(false)
    const [inviteError, setInviteError] = useState("")
    const [sending, setSending] = useState(false)
    const [cancelInvitation, setCancelInvitation] = useState<OrgInvitation | null>(null)

    const role = membership?.role

    const changeTab = (next: "members" | "invitations") => {
        setTab(next)
        setSearch("")
        setRoleFilter("all")
        setStatusFilter("all")
        setPage(1)
    }

    useEffect(() => {
        setTab("members")
        setSearch("")
        setRoleFilter("all")
        setStatusFilter("all")
        setPage(1)
        setNotice("")
        setResendError("")
    }, [orgId])

    useEffect(() => {
        if (orgId) fetchOrganizationDetails(orgId)
    }, [orgId, fetchOrganizationDetails])

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        const timer = setTimeout(async () => {
            setListLoading(true)
            setListError("")
            try {
                const query = new URLSearchParams({ page: String(page), status: statusFilter, role: roleFilter, search })
                const res = await fetch(`/api/orgs/${orgId}/invite?${query}`, { signal: controller.signal })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Could not load invitations")
                if (controller.signal.aborted) return
                const pages = Math.max(1, Math.ceil(data.total / 10))
                if (page > pages) { setPage(pages); return }
                setInvitations(data.invitations)
                setTotal(data.total)
                setPendingCount(data.pending)
            } catch (error) {
                if (!controller.signal.aborted) setListError(getErrorMessage(error))
            } finally {
                if (!controller.signal.aborted) setListLoading(false)
            }
        }, 250)
        return () => { clearTimeout(timer); controller.abort() }
    }, [orgId, page, statusFilter, roleFilter, search, revision, now])

    async function resend(invite: OrgInvitation) {
        if (resending) return
        setResending(invite._id)
        setNotice("")
        setResendError("")
        try {
            const res = await fetch(`/api/orgs/${orgId}/invite/${invite._id}/resend`, { method: "POST" })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Could not resend invitation")
            setNotice(`Invitation resent to ${invite.email}. The new link expires in 24 hours.`)
            setStatusFilter("all")
            setPage(1)
            setRevision(value => value + 1)
        } catch (error) {
            setResendError(getErrorMessage(error))
        } finally {
            setResending(null)
        }
    }

    const invitationExpiry = (invite: OrgInvitation) => expiryDate(invite).getTime()
    const invitationStatus = (invite: OrgInvitation) => {
        const status = statusOf(invite, now)
        return status.charAt(0).toUpperCase() + status.slice(1)
    }

    const getInitials = (first?: string, last?: string, email?: string) => {
        if (!first && !last) return "NA"
        if (first && last && (first.toLowerCase() === last.toLowerCase() || `${first} ${last}`.trim().toLowerCase() === email?.toLowerCase())) return first[0].toUpperCase()
        if (first && last) return `${first[0]}${last[0]}`.toUpperCase()
        return (first || last || "NA").slice(0, 2).toUpperCase()
    }
    const getMemberName = (user?: { firstName?: string; lastName?: string; email?: string } | null) => {
        if (!user) return "Account unavailable"
        const nameParts = [user.firstName, user.lastName].filter((part): part is string => Boolean(part))
        const name = nameParts.join(" ").trim()
        const emailName = Boolean(user.email) && nameParts.every(part => part.toLowerCase() === user.email?.toLowerCase())
        return name && name.toLowerCase() !== user.email?.toLowerCase() && !emailName ? name : "Unnamed member"
    }
    const roleBadge = (memberRole: string) => `border-0 px-2 py-1 text-xs capitalize ${memberRole === "owner" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-muted text-muted-foreground"}`

    const filteredMembers = memberships.filter((m) => {
        const userName = `${m.user?.firstName || ""} ${m.user?.lastName || ""}`.trim()
        const userEmail = m.user?.email || ""
        const matchesSearch =
            userName.toLowerCase().includes(search.trim().toLowerCase()) ||
            userEmail.toLowerCase().includes(search.trim().toLowerCase())
        const matchesRole = roleFilter === "all" || m.role === roleFilter
        return matchesSearch && matchesRole
    })
    const hasActiveFilters = Boolean(search) || roleFilter !== "all" || (tab === "invitations" && statusFilter !== "all")
    const clearFilters = () => {
        setSearch("")
        setRoleFilter("all")
        setStatusFilter("all")
        setPage(1)
    }
    function getErrorMessage(err: unknown): string {
        return err instanceof Error ? err.message : String(err)
    }
    const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (sending) return

        setInviteError("")
        setNotice("")
        setResendError("")
        setSending(true)
        try {
            const res = await fetch(`/api/orgs/${orgId}/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail.trim() }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to send invite")
            setNotice(`Invitation sent to ${inviteEmail.trim()}.`)
            setInviteOpen(false)
            setTab("invitations")
            setNow(Date.now())
            setPage(1)
            setStatusFilter("all")
            setRevision(value => value + 1)
            await fetchOrganizationDetails(orgId, true)
            setInviteEmail("")
        } catch (err: unknown) {
            setInviteError(getErrorMessage(err))
        } finally {
            setSending(false)
        }
    }

    if (loading) return <MembersSkeleton />
    if (error) return <div role="alert" className="rounded-xl border border-border bg-card p-4 text-sm"><p className="text-destructive">{error}</p><Button variant="outline" className="mt-3" onClick={() => fetchOrganizationDetails(orgId)}>Try again</Button></div>
    if (!organization) return <p>No organization found</p>

    return (
        <div className="dashboard-reference-theme mobile-page members-page -m-4 min-w-0 flex-1 bg-background px-4 py-5 md:-mx-10 md:px-10 sm:py-8">
        <div className="mobile-page-content mx-auto min-w-0 max-w-7xl space-y-5 sm:space-y-7">
            {/* header */}
            <header className="mobile-page-header flex flex-wrap items-center justify-between gap-3 pb-1 sm:border-b sm:border-border sm:pb-5">
                <div className="hidden sm:block">
                    <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Members</h1>
                    <p className="mt-1.5 text-base sm:text-sm text-muted-foreground">{organization.name}</p>
                </div>
                <div className="min-w-0 flex-1 sm:hidden">
                    <h1 className="break-words text-xl font-semibold leading-6">{organization.name}</h1>
                </div>

                {/* invite dialog only for owners */}
                {role === "owner" && (
                    <Dialog open={inviteOpen} onOpenChange={(open) => {
                        setInviteOpen(open)
                        if (open) setInviteError("")
                    }}>
                        <DialogTrigger asChild>
                            <Button className="min-h-11 shrink-0 rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90">
                                <UserPlus className="size-4" aria-hidden="true" /><span className="sm:hidden">Invite</span><span className="hidden sm:inline">Invite member</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-2xl">
                            <DialogHeader>
                                <DialogTitle>Invite a new member</DialogTitle>
                                <DialogDescription>
                                    Send an invitation to join{" "}
                                    <span className="font-semibold">{organization.name}</span>.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleInvite}>
                                <div className="space-y-4 py-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="invite-email">Email address</Label>
                                        <Input
                                            id="invite-email"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="jane@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {inviteError && <p id="invite-error" role="alert" className="text-base sm:text-sm text-destructive">{inviteError}</p>}
                                </div>

                                <DialogFooter>
                                    <Button type="submit" className="min-h-11 w-full text-sm sm:w-auto bg-primary hover:bg-primary text-primary-foreground" disabled={sending}>
                                        {sending ? "Sending…" : "Send invitation"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </header>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div role="tablist" aria-label="Workspace people" className="grid w-full grid-cols-2 shrink-0 gap-1 rounded-2xl border border-border bg-card p-1 sm:flex sm:w-fit">
                {(["members", "invitations"] as const).map(item => (
                    <button key={item} role="tab" id={item + "-tab"} aria-selected={tab === item}
                        tabIndex={tab === item ? 0 : -1}
                        aria-controls={item + "-panel"} onClick={() => changeTab(item)}
                        onKeyDown={(event) => {
                            const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])
                            const currentIndex = tabs.indexOf(event.currentTarget)
                            const nextIndex = event.key === "ArrowRight" ? (currentIndex + 1) % tabs.length
                                : event.key === "ArrowLeft" ? (currentIndex - 1 + tabs.length) % tabs.length
                                    : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1
                            if (nextIndex < 0) return
                            event.preventDefault()
                            const nextTab = tabs[nextIndex]
                            changeTab(nextTab.id.replace("-tab", "") as "members" | "invitations")
                            nextTab.focus()
                        }}
                        className={`min-h-11 min-w-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium capitalize focus-visible:ring-2 focus-visible:ring-ring ${tab === item ? "bg-accent dark:bg-[#35313f] text-accent-foreground dark:text-accent-foreground" : "text-muted-foreground dark:text-muted-foreground"}`}>
                        <span>{item}</span>
                        {item === "invitations" && pendingCount > 0 && <span aria-label={`${pendingCount} pending`} className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium tabular-nums text-primary">{pendingCount}</span>}
                    </button>
                ))}
            </div>

            {/* filters */}
            <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:gap-3 xl:flex xl:items-center xl:justify-end">
                <div className="col-span-2 flex w-full items-center gap-2 xl:col-span-1 xl:max-w-sm">
                <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
                <Input
                    aria-label="Search members and invitations"
                    placeholder={tab === "members" ? "Search name or email…" : "Search invitation email…"}
                    value={search}
                    onChange={(e) => { setPage(1); setSearch(e.target.value) }}
                    className="min-h-11 rounded-xl border-border dark:border-border bg-card dark:bg-card pl-10 pr-11 text-base sm:text-sm focus-visible:ring-ring/25"
                />
                {search && <button type="button" aria-label="Clear search" className="absolute right-0.5 top-0.5 flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring" onClick={() => { setSearch(""); setPage(1) }}><X className="size-4" aria-hidden="true" /></button>}
                </div>
                {tab === "invitations" && <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label={`Filter invitations: ${statusFilter}`} className={`relative size-11 shrink-0 rounded-xl sm:hidden ${statusFilter !== "all" || roleFilter !== "all" ? "border-primary text-primary" : ""}`}><SlidersHorizontal aria-hidden="true" className="size-4" />{(statusFilter !== "all" || roleFilter !== "all") && <span aria-hidden="true" className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />}</Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-xl p-2">
                        <DropdownMenuLabel>Invitation status</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={statusFilter} onValueChange={value => { setPage(1); setStatusFilter(value); }}>
                            {[{ value: "all", label: "All statuses" }, { value: "pending", label: "Pending" }, { value: "accepted", label: "Accepted" }, { value: "expired", label: "Expired" }, { value: "cancelled", label: "Cancelled" }].map(option => <DropdownMenuRadioItem key={option.value} value={option.value} className="min-h-11 rounded-lg">{option.label}</DropdownMenuRadioItem>)}
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator /><DropdownMenuLabel>Role</DropdownMenuLabel><DropdownMenuRadioGroup value={roleFilter} onValueChange={value => { setPage(1); setRoleFilter(value); }}>{[{ value: "all", label: "All roles" }, { value: "owner", label: "Owner" }, { value: "member", label: "Member" }].map(option => <DropdownMenuRadioItem key={option.value} value={option.value} className="min-h-11 rounded-lg">{option.label}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>}
                </div>
                {tab === "members" && <div role="group" aria-label="Filter members by role" className="col-span-2 flex flex-wrap gap-2 sm:hidden">
                    {[{ value: "all", label: "All", count: memberships.length }, { value: "owner", label: "Owners", count: memberships.filter(member => member.role === "owner").length }, { value: "member", label: "Members", count: memberships.filter(member => member.role === "member").length }].map(option => <button key={option.value} type="button" aria-pressed={roleFilter === option.value} onClick={() => { setRoleFilter(option.value); setPage(1); }} className={`min-h-11 rounded-full border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${roleFilter === option.value ? "border-primary/15 bg-primary/10 text-primary" : "border-border bg-card text-foreground"}`}>{option.label} ({option.count})</button>)}
                </div>}
                <div className="hidden sm:contents">
                <Select value={roleFilter} onValueChange={value => { setPage(1); setRoleFilter(value) }}>
                    <SelectTrigger className="min-h-11 w-full rounded-xl border-border bg-card focus:ring-ring/25 xl:w-40">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                </Select>
                {tab === "invitations" && <Select value={statusFilter} onValueChange={value => { setPage(1); setStatusFilter(value) }}>
                    <SelectTrigger aria-label="Filter invitations by status" className="min-h-11 w-full min-w-0 rounded-xl bg-card xl:w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>}
                </div>

            </div>
            </div>

            {notice && <p role="status" className="rounded-xl bg-accent p-3 text-base sm:text-sm text-accent-foreground">{notice}</p>}
            {resendError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-base sm:text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{resendError}</p>}
            {cancelInvitation && <WorkspaceAction key={cancelInvitation._id} orgId={orgId} action="cancel_invitation" id={cancelInvitation._id} initialOpen onClosed={() => { setCancelInvitation(null); setRevision(value => value + 1); }} label="Cancel invitation" description={`Cancel the invitation to ${cancelInvitation.email}? Its link will stop working.`} />}

            {tab === "invitations" ? (
                <div role="tabpanel" id="invitations-panel" aria-labelledby="invitations-tab" className="min-w-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:bg-card">
                    <div className="overflow-hidden rounded-2xl border border-border bg-card lg:hidden">
                        <p className="border-b border-border px-4 py-3 text-sm sm:text-xs leading-5 text-muted-foreground">Invitation links are valid for 24 hours.</p>
                        {listLoading && <div role="status" className="divide-y divide-border">
                            <span className="sr-only">Loading invitations</span>
                            {Array.from({ length: 3 }, (_, index) => <div key={index} aria-hidden="true" className="space-y-3 p-4">
                                <Skeleton className="h-4 w-48 max-w-full" />
                                <div className="grid grid-cols-2 gap-3"><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
                            </div>)}
                        </div>}
                        {listError && <div className="p-4 text-base sm:text-sm">
                            <p role="alert">{listError}</p>
                            <Button variant="outline" size="sm" className="mt-3 min-h-11 text-sm" onClick={() => setRevision(value => value + 1)}>Retry</Button>
                        </div>}
                        {!listLoading && !listError && invitations.map(invite => {
                            const status = invitationStatus(invite)
                            const cooldownSeconds = Math.ceil(Math.max(0, new Date(invite.lastSentAt ?? invite.createdAt).getTime() + 60000 - now) / 1000)
                            const statusClass = status === "Accepted"
                                ? "border-emerald-200 dark:border-[#43605a] bg-emerald-50 dark:bg-[#2e3c3b] text-emerald-800 dark:text-[#a6c9bf]"
                                : (status === "Expired" || status === "Cancelled")
                                    ? "border-border bg-muted text-slate-700 dark:text-muted-foreground"
                                    : "border-amber-200 dark:border-[#66543b] bg-amber-50 dark:bg-[#423c30] text-amber-800 dark:text-[#e1c590]"
                            const sentAt = new Date(invite.lastSentAt ?? invite.createdAt)
                            const elapsedDays = Math.max(0, Math.floor((now - sentAt.getTime()) / 86400000))
                            const relativeTime = elapsedDays === 0 ? "today" : elapsedDays === 1 ? "yesterday" : `${elapsedDays} days ago`
                            const initials = invite.email.split("@")[0].split(/[._-]+/).filter(Boolean).map(part => part[0]).slice(0, 2).join("").toUpperCase()
                            return <article key={invite._id} aria-label={`Invitation to ${invite.email}`} className="flex min-w-0 items-center gap-2 border-b border-border px-3 py-3 last:border-b-0 sm:gap-3 sm:px-4">
                                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-base sm:text-sm font-semibold text-primary">{initials}</span>
                                <div className="min-w-0 flex-1">
                                    <h3 title={invite.email} className="break-words text-base sm:text-sm font-semibold leading-6 [overflow-wrap:anywhere]">{invite.email}</h3>
                                    <p className="mt-0.5 text-sm sm:text-xs leading-5 text-muted-foreground"><time dateTime={sentAt.toISOString()} title={sentAt.toLocaleString()}>{invite.lastSentAt ? "Resent" : "Invited"} {relativeTime}</time></p>
                                </div>
                                <Badge variant="outline" className={`shrink-0 gap-1 rounded-full border-0 px-2 py-1 text-xs ${statusClass}`}>{status === "Pending" && <Clock aria-hidden="true" className="size-3" />}{status}</Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-11 shrink-0 rounded-lg text-muted-foreground" aria-label={`Invitation options for ${invite.email}`}><MoreVertical aria-hidden="true" className="size-5" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64 rounded-xl p-2">
                                        <DropdownMenuLabel className="break-words font-normal text-sm sm:text-xs text-muted-foreground">{invite.role === "owner" ? "Owner" : "Member"} invitation · {status}</DropdownMenuLabel>
                                        <DropdownMenuLabel className="font-normal text-sm sm:text-xs text-muted-foreground">Link expiry: {new Date(invitationExpiry(invite)).toLocaleDateString()}</DropdownMenuLabel>
                                        {(status === "Pending" || status === "Expired") ? <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="min-h-11 rounded-lg text-sm" disabled={resending !== null || cooldownSeconds > 0} onSelect={() => void resend(invite)}>{resending === invite._id ? "Sending…" : cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : "Resend invitation"}</DropdownMenuItem>
                                            {status === "Pending" && <DropdownMenuItem className="min-h-11 rounded-lg text-sm text-destructive focus:text-destructive" onSelect={() => setCancelInvitation(invite)}>Cancel invitation</DropdownMenuItem>}
                                        </> : <DropdownMenuLabel className="text-sm sm:text-xs font-normal text-muted-foreground">No actions available</DropdownMenuLabel>}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </article>
                        })}
                        {!listLoading && !listError && !invitations.length && <div className="p-5 text-center text-base sm:text-sm text-muted-foreground">
                            <p>{hasActiveFilters ? "No invitations match these filters." : "No invitations found."}</p>
                            {hasActiveFilters && <Button variant="link" size="sm" className="mt-2 min-h-11 text-sm" onClick={clearFilters}>Clear filters</Button>}
                        </div>}
                    </div>
                    <div className="hidden lg:block">
                    <Table>
                        <TableCaption>Invitation history for {organization.name}. Invitations expire after 24 hours.</TableCaption>
                        <TableHeader><TableRow className="bg-slate-50/80 dark:bg-muted/80">
                            <TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Sent</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {!listLoading && !listError && invitations.map(invite => {
                                const status = invitationStatus(invite)
                                const cooldownSeconds = Math.ceil(Math.max(0, new Date(invite.lastSentAt ?? invite.createdAt).getTime() + 60000 - now) / 1000)
                                return <TableRow key={invite._id}>
                                    <TableCell>{invite.email}</TableCell>
                                    <TableCell className="capitalize">{invite.role}</TableCell>
                                    <TableCell className="whitespace-nowrap">{new Date(invite.createdAt).toLocaleString()}</TableCell>
                                    <TableCell className="whitespace-nowrap">{new Date(invitationExpiry(invite)).toLocaleString()}</TableCell>
                                    <TableCell><Badge variant="outline" className={status === "Accepted" ? "border-emerald-200 dark:border-[#43605a] bg-emerald-50 dark:bg-[#2e3c3b] text-emerald-800 dark:text-[#a6c9bf]" : (status === "Expired" || status === "Cancelled") ? "border-border dark:border-border bg-muted dark:bg-muted text-slate-700 dark:text-muted-foreground" : "border-amber-200 dark:border-[#66543b] bg-amber-50 dark:bg-[#423c30] text-amber-800 dark:text-[#e1c590]"}>{status}</Badge></TableCell>
                                    <TableCell><div className="flex flex-wrap items-center gap-2">
                                        {(status === "Pending" || status === "Expired") && <>
                                            <Button variant="outline" size="sm"
                                                disabled={resending !== null || cooldownSeconds > 0}
                                                onClick={() => resend(invite)}>{resending === invite._id ? "Sending…" : "Resend"}</Button>
                                            {cooldownSeconds > 0 && <span className="text-sm sm:text-xs text-muted-foreground">Available in {cooldownSeconds}s</span>}
                                        </>}
                                        {status === "Pending" && <WorkspaceAction orgId={orgId} action="cancel_invitation" id={invite._id} label="Cancel invitation" description={`Cancel the invitation to ${invite.email}? Its link will stop working.`} />}</div></TableCell>
                                </TableRow>
                            })}
                            {listLoading && <TableSkeletonRows columns={6} label="Loading invitations" />}
                            {listError && <TableRow><TableCell colSpan={6} className="py-8 text-center"><p role="alert">{listError}</p><Button variant="outline" size="sm" className="mt-2" onClick={() => setRevision(value => value + 1)}>Retry</Button></TableCell></TableRow>}
                            {!listLoading && !listError && !invitations.length && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground dark:text-muted-foreground">
                                <p>{hasActiveFilters ? "No invitations match these filters." : "No invitations found."}</p>
                                {hasActiveFilters && <Button variant="link" size="sm" className="mt-1" onClick={clearFilters}>Clear filters</Button>}
                            </TableCell></TableRow>}
                        </TableBody>
                    </Table>
                    </div>
                    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-base sm:text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                        <p aria-live="polite" className="text-muted-foreground">{total ? `${(page - 1) * 10 + 1}–${Math.min(page * 10, total)} of ${total} invitations` : "0 invitations"}</p>
                        <div className="flex items-center justify-between gap-3 sm:justify-start">
                            <Button variant="outline" size="sm" className="min-h-11 text-sm" disabled={listLoading || page <= 1} onClick={() => setPage(value => value - 1)}>Previous</Button>
                            <span>Page {page} of {Math.max(1, Math.ceil(total / 10))}</span>
                            <Button variant="outline" size="sm" className="min-h-11 text-sm" disabled={listLoading || page * 10 >= total} onClick={() => setPage(value => value + 1)}>Next</Button>
                        </div>
                    </div>
                </div>
            ) : (
            /* members table */
            <div role="tabpanel" id="members-panel" aria-labelledby="members-tab" className="min-w-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:bg-card">
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card lg:hidden">
                    {filteredMembers.map((m) => (
                        <div key={m._id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 px-3 py-2.5 sm:px-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <div aria-hidden="true" className={`grid size-10 sm:size-11 shrink-0 place-items-center rounded-full text-sm font-semibold ${m.role === "owner" ? "bg-primary/10 text-primary" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"}`}>
                                    {getInitials(m.user?.firstName, m.user?.lastName, m.user?.email)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="break-words text-sm font-semibold leading-5 [overflow-wrap:anywhere]">{getMemberName(m.user)}{m.user?._id === session?.user?.id && <span className="ml-1.5 inline-block text-xs font-normal text-muted-foreground">You</span>}</p><p title={m.user?.email} className="mt-0.5 break-words text-xs leading-[1.125rem] [overflow-wrap:anywhere] text-muted-foreground">{m.user?.email ?? "Email unavailable"}</p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5">
                                <Badge variant="outline" className={roleBadge(m.role)}>{m.role}</Badge>
                                {m.user && m.isActive !== false && <MemberActions orgId={orgId} id={m._id} role={m.role} email={m.user.email} isActive />}
                            </div>
                            {m.isActive === false && <div className="col-span-2 flex items-center justify-between gap-2 border-t border-border pt-2"><span className="text-sm sm:text-xs text-muted-foreground">Removed</span>{m.user && <MemberActions orgId={orgId} id={m._id} role={m.role} email={m.user.email} isActive={false} />}</div>}
                        </div>
                    ))}
                    {filteredMembers.length === 0 && (
                        <div className="p-5 text-center text-base sm:text-sm text-muted-foreground">
                            <p className="font-medium text-foreground">{hasActiveFilters ? "No matching members" : "No members yet"}</p>
                            <p className="mt-1 text-xs">{search.trim() ? "Try another name or email address." : roleFilter !== "all" ? "Choose All to see everyone in this workspace." : "Members will appear here when they join."}</p>
                            {hasActiveFilters && <Button variant="link" size="sm" className="mt-1" onClick={clearFilters}>Clear filters</Button>}
                        </div>
                    )}
                </div>
                <div className="hidden lg:block">
                <Table>
                    <TableCaption className="sr-only">Members in {organization.name}</TableCaption>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 dark:bg-muted/80">
                            <TableHead className="text-sm sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">Member</TableHead>
                            <TableHead className="text-sm sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">Role</TableHead>
                            <TableHead className="text-sm sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">Status</TableHead><TableHead className="pr-4 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.map((m) => (

                                <TableRow key={m._id} className="hover:bg-accent/50 dark:hover:bg-[#303740]/50 transition">
                                    <TableCell className="max-w-sm py-3 pl-4">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-base sm:text-sm font-semibold text-primary">
                                                {getInitials(m.user?.firstName, m.user?.lastName, m.user?.email)}
                                            </div>
                                            <div className="min-w-0"><p className="break-words font-medium [overflow-wrap:anywhere]">{getMemberName(m.user)}{m.user?._id === session?.user?.id && <span className="ml-2 text-sm sm:text-xs font-normal text-muted-foreground">You</span>}</p><p className="mt-1 break-words text-base sm:text-sm text-muted-foreground [overflow-wrap:anywhere]">{m.user?.email ?? "Email unavailable"}</p></div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={roleBadge(m.role)}
                                        >
                                            {m.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className={m.isActive === false ? "border-border bg-muted text-muted-foreground" : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"}>{m.isActive === false ? "Removed" : "Active"}</Badge></TableCell>
                                    <TableCell className="pr-4 text-right">{m.user ? <MemberActions orgId={orgId} id={m._id} role={m.role} email={m.user.email} isActive={m.isActive !== false} /> : <span className="text-sm sm:text-xs text-muted-foreground">Account unavailable</span>}</TableCell>
                                </TableRow>
                            ))}
                        {filteredMembers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                    No members match these filters.
                                    {hasActiveFilters && <div><Button variant="link" size="sm" className="mt-1 not-italic" onClick={clearFilters}>Clear filters</Button></div>}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </div>
            </div>
            )}
        </div>
        </div>
    )
}
