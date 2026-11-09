"use client"

import { invitationExpiry as expiryDate, invitationStatus as statusOf } from "@/lib/invitation-status"
import { MembersSkeleton, TableSkeletonRows } from "@/app/components/loading/WorkspaceSkeletons"
import { useEffect, useState, type FormEvent } from "react"
import { useParams } from "next/navigation"
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
import { UserPlus, Search } from "lucide-react"
import MemberActions from "./MemberActions"
import WorkspaceAction from "../WorkspaceAction"
import { Label } from "@/app/components/ui/label"

export default function MembersPage() {
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
    const [memberStatus, setMemberStatus] = useState("active")
    const [roleFilter, setRoleFilter] = useState("all")
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState<"owner" | "member">("member")
    const [inviteOpen, setInviteOpen] = useState(false)
    const [inviteError, setInviteError] = useState("")
    const [sending, setSending] = useState(false)

    const role = membership?.role

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
        return name && name.toLowerCase() !== user.email?.toLowerCase() && !emailName ? name : "Name not provided"
    }

    const activeMembers = memberships.filter(member => member.isActive !== false)
    const removedMembers = memberships.filter(member => member.isActive === false)
    const filteredMembers = memberships.filter((m) => {
        const userName = `${m.user?.firstName || ""} ${m.user?.lastName || ""}`.trim()
        const userEmail = m.user?.email || ""
        const matchesSearch =
            userName.toLowerCase().includes(search.toLowerCase()) ||
            userEmail.toLowerCase().includes(search.toLowerCase())
        const matchesRole = roleFilter === "all" || m.role === roleFilter
        const matchesStatus = memberStatus === "all" ||
            (memberStatus === "removed" ? m.isActive === false : m.isActive !== false)
        return matchesSearch && matchesRole && matchesStatus
    })
    const hasActiveFilters = Boolean(search) || roleFilter !== "all" ||
        (tab === "members" ? memberStatus !== "active" : statusFilter !== "all")
    const clearFilters = () => {
        setSearch("")
        setRoleFilter("all")
        setMemberStatus("active")
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
                body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
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
            setInviteRole("member")
        } catch (err: unknown) {
            setInviteError(getErrorMessage(err))
        } finally {
            setSending(false)
        }
    }

    if (loading) return <MembersSkeleton />
    if (error) return <p className="text-red-500">{error}</p>
    if (!organization) return <p>No organization found</p>

    return (
        <div className="-m-4 flex-1 bg-background px-4 py-6 md:-mx-10 md:px-10 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-6 sm:space-y-7">
            {/* header */}
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
                <div>
                    <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">People</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">{organization.name}</p>
                </div>

                {/* invite dialog only for owners */}
                {role === "owner" && (
                    <Dialog open={inviteOpen} onOpenChange={(open) => {
                        setInviteOpen(open)
                        if (open) setInviteError("")
                    }}>
                        <DialogTrigger asChild>
                            <Button className="min-h-11 rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary/90">
                                <UserPlus className="mr-2 size-4" aria-hidden="true" />Invite member
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
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
                                    <div className="grid gap-2">
                                        <Label htmlFor="invite-role">Workspace role</Label>
                                        <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as "owner" | "member")}>
                                            <SelectTrigger id="invite-role">
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="owner">Owner</SelectItem>
                                                <SelectItem value="member">Member</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            {inviteRole === "owner"
                                                ? "Owners can manage workspace access and invitations."
                                                : "Members can participate in the workspace without managing access."}
                                        </p>
                                    </div>
                                    {inviteError && <p id="invite-error" role="alert" className="text-sm text-destructive">{inviteError}</p>}
                                </div>

                                <DialogFooter>
                                    <Button type="submit" className="bg-primary hover:bg-primary text-primary-foreground" disabled={sending}>
                                        {sending ? "Sending…" : "Send invitation"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </header>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div role="tablist" aria-label="Workspace people" className="flex w-fit shrink-0 gap-1 rounded-xl border border-border bg-card p-1">
                {(["members", "invitations"] as const).map(item => (
                    <button key={item} role="tab" id={item + "-tab"} aria-selected={tab === item}
                        tabIndex={tab === item ? 0 : -1}
                        aria-controls={item + "-panel"} onClick={() => setTab(item)}
                        onKeyDown={(event) => {
                            const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])
                            const currentIndex = tabs.indexOf(event.currentTarget)
                            const nextIndex = event.key === "ArrowRight" ? (currentIndex + 1) % tabs.length
                                : event.key === "ArrowLeft" ? (currentIndex - 1 + tabs.length) % tabs.length
                                    : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1
                            if (nextIndex < 0) return
                            event.preventDefault()
                            const nextTab = tabs[nextIndex]
                            setTab(nextTab.id.replace("-tab", "") as "members" | "invitations")
                            nextTab.focus()
                        }}
                        className={`min-h-11 rounded-lg px-4 py-2 text-sm font-medium capitalize focus-visible:ring-2 focus-visible:ring-ring ${tab === item ? "bg-accent dark:bg-[#35313f] text-accent-foreground dark:text-accent-foreground" : "text-muted-foreground dark:text-muted-foreground"}`}>
                        <span>{item}</span>
                        {item === "invitations" && <span className={`ml-2 text-xs tabular-nums ${tab === item ? "text-accent-foreground/75" : "text-muted-foreground"}`}>{pendingCount} pending</span>}
                    </button>
                ))}
            </div>

            {/* filters */}
            <div className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:flex xl:items-center xl:justify-end">
                <div className="relative col-span-1 w-full min-[420px]:col-span-2 xl:col-span-1 xl:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" aria-hidden="true" />
                <Input
                    aria-label="Search members and invitations"
                    placeholder={tab === "members" ? "Search name or email…" : "Search invitation email…"}
                    value={search}
                    onChange={(e) => { setPage(1); setSearch(e.target.value) }}
                    className="min-h-11 rounded-xl border-border dark:border-border bg-card dark:bg-card pl-9 focus-visible:ring-ring/25"
                />
                </div>
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
                {tab === "members" && <Select value={memberStatus} onValueChange={value => { setPage(1); setMemberStatus(value) }}>
                    <SelectTrigger aria-label="Filter members by access" className="min-h-11 w-full min-w-0 rounded-xl bg-card xl:w-52"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Active members ({activeMembers.length})</SelectItem>
                        <SelectItem value="removed">Removed members ({removedMembers.length})</SelectItem>
                        <SelectItem value="all">All members ({memberships.length})</SelectItem>
                    </SelectContent>
                </Select>}
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

            {notice && <p role="status" className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">{notice}</p>}
            {resendError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{resendError}</p>}

            {tab === "invitations" ? (
                <div role="tabpanel" id="invitations-panel" aria-labelledby="invitations-tab" className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card overflow-hidden">
                    <div className="divide-y divide-border lg:hidden">
                        <p className="px-4 py-3 text-xs text-muted-foreground">Invitations expire after 24 hours.</p>
                        {listLoading && <div role="status" className="divide-y divide-border">
                            <span className="sr-only">Loading invitations</span>
                            {Array.from({ length: 3 }, (_, index) => <div key={index} aria-hidden="true" className="space-y-3 p-4">
                                <Skeleton className="h-4 w-48 max-w-full" />
                                <div className="grid grid-cols-2 gap-3"><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
                            </div>)}
                        </div>}
                        {listError && <div className="p-4 text-sm">
                            <p role="alert">{listError}</p>
                            <Button variant="outline" size="sm" className="mt-3 min-h-11" onClick={() => setRevision(value => value + 1)}>Retry</Button>
                        </div>}
                        {!listLoading && !listError && invitations.map(invite => {
                            const status = invitationStatus(invite)
                            const cooldownSeconds = Math.ceil(Math.max(0, new Date(invite.lastSentAt ?? invite.createdAt).getTime() + 60000 - now) / 1000)
                            const statusClass = status === "Accepted"
                                ? "border-emerald-200 dark:border-[#43605a] bg-emerald-50 dark:bg-[#2e3c3b] text-emerald-800 dark:text-[#a6c9bf]"
                                : (status === "Expired" || status === "Cancelled")
                                    ? "border-border bg-muted text-slate-700 dark:text-muted-foreground"
                                    : "border-amber-200 dark:border-[#66543b] bg-amber-50 dark:bg-[#423c30] text-amber-800 dark:text-[#e1c590]"
                            return <article key={invite._id} className="space-y-3 p-4">
                                <div className="flex min-w-0 items-start justify-between gap-3">
                                    <p className="min-w-0 break-all text-sm font-medium leading-5">{invite.email}</p>
                                    <Badge variant="outline" className={`shrink-0 ${statusClass}`}>{status}</Badge>
                                </div>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                    <div><dt className="text-xs text-muted-foreground">Role</dt><dd className="mt-1 capitalize">{invite.role}</dd></div>
                                    <div><dt className="text-xs text-muted-foreground">Sent</dt><dd className="mt-1 break-words tabular-nums">{new Date(invite.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</dd></div>
                                    <div><dt className="text-xs text-muted-foreground">Expires</dt><dd className="mt-1 break-words tabular-nums">{new Date(invitationExpiry(invite)).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</dd></div>
                                </dl>
                                {(status === "Pending" || status === "Expired") && <div className="flex flex-wrap items-center gap-2 pt-1 [&_button]:min-h-11">
                                    <Button variant="outline" size="sm" className="min-h-11" disabled={resending !== null || cooldownSeconds > 0}
                                        onClick={() => resend(invite)}>{resending === invite._id ? "Sending…" : "Resend"}</Button>
                                    {cooldownSeconds > 0 && <span className="text-xs text-muted-foreground">Available in {cooldownSeconds}s</span>}
                                    {status === "Pending" && <WorkspaceAction orgId={orgId} action="cancel_invitation" id={invite._id} label="Cancel invitation" description={`Cancel the invitation to ${invite.email}? Its link will stop working.`} />}
                                </div>}
                            </article>
                        })}
                        {!listLoading && !listError && !invitations.length && <div className="p-5 text-center text-sm text-muted-foreground">
                            <p>{hasActiveFilters ? "No invitations match these filters." : "No invitations found."}</p>
                            {hasActiveFilters && <Button variant="link" size="sm" className="mt-2 min-h-11" onClick={clearFilters}>Clear filters</Button>}
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
                                            {cooldownSeconds > 0 && <span className="text-xs text-muted-foreground">Available in {cooldownSeconds}s</span>}
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
                    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                        <p aria-live="polite" className="text-muted-foreground">{total ? `${(page - 1) * 10 + 1}–${Math.min(page * 10, total)} of ${total} invitations` : "0 invitations"}</p>
                        <div className="flex items-center justify-between gap-3 sm:justify-start">
                            <Button variant="outline" size="sm" className="min-h-11" disabled={listLoading || page <= 1} onClick={() => setPage(value => value - 1)}>Previous</Button>
                            <span>Page {page} of {Math.max(1, Math.ceil(total / 10))}</span>
                            <Button variant="outline" size="sm" className="min-h-11" disabled={listLoading || page * 10 >= total} onClick={() => setPage(value => value + 1)}>Next</Button>
                        </div>
                    </div>
                </div>
            ) : (
            /* members table */
            <div role="tabpanel" id="members-panel" aria-labelledby="members-tab" className="rounded-2xl border border-border dark:border-border bg-card dark:bg-card overflow-hidden">
                <div className="divide-y divide-border lg:hidden">
                    {filteredMembers.map((m) => (
                        <div key={m._id} className="flex min-w-0 items-center justify-between gap-3 px-3 py-4">
                            <div className="flex min-w-0 items-start gap-3">
                                <div aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-xs font-semibold text-accent-foreground">
                                    {getInitials(m.user?.firstName, m.user?.lastName, m.user?.email)}
                                </div>
                                <div className="min-w-0 space-y-1">
                                    <p className="truncate font-medium">{getMemberName(m.user)}</p>
                                    <p className="break-all text-sm text-muted-foreground">{m.user?.email ?? "—"}</p>
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <Badge variant="outline" className="capitalize">{m.role}</Badge>
                                        <Badge variant="outline" className={m.isActive === false ? "border-border bg-muted text-muted-foreground" : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"}>
                                            {m.isActive === false ? "Removed" : "Active"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="shrink-0">{m.user ? <MemberActions orgId={orgId} id={m._id} role={m.role} email={m.user.email} isActive={m.isActive !== false} /> : null}</div>
                        </div>
                    ))}
                    {filteredMembers.length === 0 && (
                        <div className="p-5 text-center text-sm text-muted-foreground">
                            <p>{memberStatus === "removed" ? "No removed members match these filters." : "No members match these filters."}</p>
                            {hasActiveFilters && <Button variant="link" size="sm" className="mt-1" onClick={clearFilters}>Clear filters</Button>}
                        </div>
                    )}
                </div>
                <div className="hidden lg:block">
                <Table>
                    <TableCaption className="sr-only">Members in {organization.name}</TableCaption>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 dark:bg-muted/80">
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">Member</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">Email</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">Role</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">Status</TableHead><TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.map((m) => (

                                <TableRow key={m._id} className="hover:bg-accent/50 dark:hover:bg-[#303740]/50 transition">
                                    <TableCell>
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-xs font-semibold text-accent-foreground">
                                                {getInitials(m.user?.firstName, m.user?.lastName, m.user?.email)}
                                            </div>
                                            <span className="min-w-0 truncate font-medium">
                                                {getMemberName(m.user)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{m.user?.email ?? "—"}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`capitalize border ${m.role === "owner"
                                                ? "border-orange-100 dark:border-[#66543b] bg-orange-50 dark:bg-[#423c30] text-orange-800 dark:text-[#e1c590]"
                                                : "border-border dark:border-border bg-accent dark:bg-accent text-primary dark:text-primary"
                                                }`}
                                        >
                                            {m.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className={m.isActive === false ? "border-border bg-muted text-muted-foreground" : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"}>{m.isActive === false ? "Removed" : "Active"}</Badge></TableCell>
                                    <TableCell className="text-right">{m.user ? <MemberActions orgId={orgId} id={m._id} role={m.role} email={m.user.email} isActive={m.isActive !== false} /> : <span className="text-xs text-muted-foreground">Account unavailable</span>}</TableCell>
                                </TableRow>
                            ))}
                        {filteredMembers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground italic py-6">
                                    {memberStatus === "removed" ? "No removed members match these filters." : "No members match these filters."}
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
