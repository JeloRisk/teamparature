"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useOrgStore } from "@/app/stores/orgs/useTeamStore"

import {
    Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/app/components/ui/table"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/app/components/ui/dialog"
import { Mail, Users, UserPlus, Search, ShieldCheck } from "lucide-react"
import MemberActions from "./MemberActions"
import WorkspaceAction from "../WorkspaceAction"
import { Label } from "@/app/components/ui/label"

export default function MembersPage() {
    const { orgId } = useParams<{ orgId: string }>()
    const { organization, membership, memberships, invitations, loading, error, fetchOrganizationDetails } = useOrgStore()
    // console.log(memberships)

    const [tab, setTab] = useState<"members" | "invitations">("members")
    const [now, setNow] = useState(() => Date.now())
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState<"owner" | "member">("member")
    const [inviteOpen, setInviteOpen] = useState(false)
    const [sending, setSending] = useState(false)

    const role = membership?.role

    useEffect(() => {
        if (orgId) fetchOrganizationDetails(orgId)
    }, [orgId, fetchOrganizationDetails])

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30000)
        return () => clearInterval(timer)
    }, [])

    const invitationExpiry = (invite: typeof invitations[number]) =>
        new Date(invite.expiresAt ?? new Date(new Date(invite.createdAt).getTime() + 86400000)).getTime()
    const invitationStatus = (invite: typeof invitations[number]) =>
        invite.status === "cancelled" ? "Cancelled" : invite.status === "accepted" ? "Accepted"
            : invite.status === "expired" || invitationExpiry(invite) <= now ? "Expired" : "Pending"

    const getInitials = (first?: string, last?: string) => {
        if (!first && !last) return "NA"
        if (first && last) return `${first[0]}${last[0]}`.toUpperCase()
        return (first || last || "NA").slice(0, 2).toUpperCase()
    }

    const filteredMembers = memberships.filter((m) => {
        const userName = `${m.user?.firstName || ""} ${m.user?.lastName || ""}`.trim()
        const userEmail = m.user?.email || ""
        const matchesSearch =
            userName.toLowerCase().includes(search.toLowerCase()) ||
            userEmail.toLowerCase().includes(search.toLowerCase())
        const matchesRole = roleFilter === "all" || m.role === roleFilter
        return matchesSearch && matchesRole
    })
    const pendingInvitations = invitations.filter(invite => invitationStatus(invite) === "Pending")
    const filteredInvitations = invitations.filter(invite =>
        invite.email.toLowerCase().includes(search.toLowerCase()) &&
        (roleFilter === "all" || invite.role === roleFilter)
    )

    function getErrorMessage(err: unknown): string {
        return err instanceof Error ? err.message : String(err)
    }
    const handleInvite = async () => {
        if (!inviteEmail) return alert("Enter a valid email")
        if (sending) return

        setSending(true)
        try {
            const res = await fetch(`/api/orgs/${orgId}/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to send invite")
            setInviteOpen(false)
            setTab("invitations")
            setNow(Date.now())
            await fetchOrganizationDetails(orgId, true)
            setInviteEmail("")
            setInviteRole("member")
        } catch (err: unknown) {
            alert(getErrorMessage(err))
        } finally {
            setSending(false)
        }
    }

    if (loading) return <p>Loading...</p>
    if (error) return <p className="text-red-500">{error}</p>
    if (!organization) return <p>No organization found</p>

    return (
        <div className="max-w-6xl space-y-6 py-2 sm:py-4">
            {/* header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700">{organization.name}</p>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950">People & invitations</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage workspace access and keep track of your invitations.
                    </p>
                </div>

                {/* invite dialog only for owners */}
                {role === "owner" && (
                    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl bg-blue-700 px-4 text-white hover:bg-blue-800">
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

                            <div className="space-y-4 py-2">
                                <div className="grid gap-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        placeholder="jane@example.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Role</Label>
                                    <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as "owner" | "member")}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="owner">Owner</SelectItem>
                                            <SelectItem value="member">Member</SelectItem>
                                        </SelectContent>
                                    </Select>

                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    onClick={handleInvite}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={sending}
                                >
                                    {sending ? "Sending..." : "Send Invite"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                {[
                    { label: "Active members", value: memberships.length, icon: Users, color: "bg-blue-50 text-blue-700" },
                    { label: "Pending invitations", value: pendingInvitations.length, icon: Mail, color: "bg-orange-50 text-orange-700" },
                    { label: "Owners", value: memberships.filter(member => member.role === "owner").length, icon: ShieldCheck, color: "bg-violet-50 text-violet-700" },
                ].map(({ label, value, icon: Icon, color }) => <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <span className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon className="size-5" aria-hidden="true" /></span>
                    <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900">{value}</p></div>
                </div>)}
            </div>

            <div role="tablist" aria-label="Workspace people" className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit">
                {(["members", "invitations"] as const).map(item => (
                    <button key={item} role="tab" id={item + "-tab"} aria-selected={tab === item}
                        aria-controls={item + "-panel"} onClick={() => setTab(item)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium capitalize focus-visible:ring-2 focus-visible:ring-blue-600 ${tab === item ? "bg-[#EEF2FE] text-[#4934c7]" : "text-slate-600"}`}>
                        {item} ({item === "members" ? memberships.length : invitations.length})
                    </button>
                ))}
            </div>

            {/* filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" aria-hidden="true" />
                <Input
                    aria-label="Search members and invitations"
                    placeholder={tab === "members" ? "Search name or email…" : "Search invitation email…"}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rounded-xl border-slate-200 bg-white pl-9 focus-visible:ring-blue-200"
                />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40 rounded-xl border-slate-200 bg-white focus:ring-blue-200">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {tab === "invitations" ? (
                <div role="tabpanel" id="invitations-panel" aria-labelledby="invitations-tab" className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <Table>
                        <TableCaption>Invitation history for {organization.name}. Invitations expire after 24 hours.</TableCaption>
                        <TableHeader><TableRow className="bg-slate-50/80">
                            <TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Sent</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {filteredInvitations.map(invite => {
                                const status = invitationStatus(invite)
                                return <TableRow key={invite._id}>
                                    <TableCell>{invite.email}</TableCell>
                                    <TableCell className="capitalize">{invite.role}</TableCell>
                                    <TableCell className="whitespace-nowrap">{new Date(invite.createdAt).toLocaleString()}</TableCell>
                                    <TableCell className="whitespace-nowrap">{new Date(invitationExpiry(invite)).toLocaleString()}</TableCell>
                                    <TableCell><Badge variant="outline" className={status === "Accepted" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : (status === "Expired" || status === "Cancelled") ? "border-slate-200 bg-slate-100 text-slate-700" : "border-amber-200 bg-amber-50 text-amber-800"}>{status}</Badge></TableCell>
                                    <TableCell>{status === "Pending" && <WorkspaceAction orgId={orgId} action="cancel_invitation" id={invite._id} label="Cancel invitation" description={`Cancel the invitation to ${invite.email}? Its link will stop working.`} />}</TableCell>
                                </TableRow>
                            })}
                            {!filteredInvitations.length && <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">No invitations found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            ) : (
            /* members table */
            <div role="tabpanel" id="members-panel" aria-labelledby="members-tab" className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <Table>
                    <TableCaption className="text-sm text-muted-foreground">
                        Members in{" "}
                        <span className="font-semibold text-blue-700">{organization.name}</span>
                    </TableCaption>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80">
                            <TableHead className="w-20 text-xs font-semibold text-slate-500">Initials</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</TableHead><TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.map((m) => (

                                <TableRow key={m._id} className="hover:bg-blue-50/50 transition">
                                    <TableCell>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FE] text-[#4934c7] font-semibold">
                                            {getInitials(m.user.firstName, m.user.lastName)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {m.user.firstName} {m.user.lastName}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{m.user.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`capitalize border ${m.role === "owner"
                                                ? "border-orange-100 bg-orange-50 text-orange-800"
                                                : "border-blue-100 bg-blue-50 text-blue-800"
                                                }`}
                                        >
                                            {m.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Joined</Badge></TableCell>
                                    <TableCell className="text-right"><MemberActions orgId={orgId} id={m._id} role={m.role} email={m.user.email} /></TableCell>
                                </TableRow>
                            ))}
                        {filteredMembers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground italic py-6">
                                    No members found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            )}
        </div>
    )
}
