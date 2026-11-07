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
        invite.status === "accepted" ? "Accepted"
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
        <div className="space-y-6">
            {/* header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-blue-800">
                        {organization.name} Members
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {memberships.length} member{memberships.length !== 1 && "s"} · {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 && "s"}
                    </p>
                </div>

                {/* invite dialog only for owners */}
                {role === "owner" && (
                    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                                Invite Member
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

            <div role="tablist" aria-label="Workspace people" className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
                {(["members", "invitations"] as const).map(item => (
                    <button key={item} role="tab" id={item + "-tab"} aria-selected={tab === item}
                        aria-controls={item + "-panel"} onClick={() => setTab(item)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium capitalize focus-visible:ring-2 focus-visible:ring-blue-600 ${tab === item ? "bg-white text-blue-800 shadow-sm" : "text-slate-600"}`}>
                        {item} ({item === "members" ? memberships.length : invitations.length})
                    </button>
                ))}
            </div>

            {/* filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <Input
                    placeholder="Search members and invitations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="sm:w-64 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40 border-blue-200 focus:ring-blue-500">
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
                <div role="tabpanel" id="invitations-panel" aria-labelledby="invitations-tab" className="rounded-xl border border-blue-100 bg-white overflow-hidden">
                    <Table>
                        <TableCaption>Invitation history for {organization.name}. Invitations expire after 24 hours.</TableCaption>
                        <TableHeader><TableRow className="bg-blue-50">
                            <TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Sent</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {filteredInvitations.map(invite => {
                                const status = invitationStatus(invite)
                                return <TableRow key={invite._id}>
                                    <TableCell>{invite.email}</TableCell>
                                    <TableCell className="capitalize">{invite.role}</TableCell>
                                    <TableCell className="whitespace-nowrap">{new Date(invite.createdAt).toLocaleString()}</TableCell>
                                    <TableCell className="whitespace-nowrap">{new Date(invitationExpiry(invite)).toLocaleString()}</TableCell>
                                    <TableCell><Badge variant="outline" className={status === "Accepted" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : status === "Expired" ? "border-slate-200 bg-slate-100 text-slate-700" : "border-amber-200 bg-amber-50 text-amber-800"}>{status}</Badge></TableCell>
                                </TableRow>
                            })}
                            {!filteredInvitations.length && <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">No invitations found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            ) : (
            /* members table */
            <div role="tabpanel" id="members-panel" aria-labelledby="members-tab" className="rounded-lg border border-blue-100 shadow-sm overflow-hidden">
                <Table>
                    <TableCaption className="text-sm text-muted-foreground">
                        Members in{" "}
                        <span className="font-semibold text-blue-700">{organization.name}</span>
                    </TableCaption>
                    <TableHeader>
                        <TableRow className="bg-blue-50">
                            <TableHead className="w-24 text-blue-700">Initials</TableHead>
                            <TableHead className="text-blue-700">Name</TableHead>
                            <TableHead className="text-blue-700">Email</TableHead>
                            <TableHead className="text-blue-700">Role</TableHead>
                            <TableHead className="text-blue-700">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.map((m) => (

                                <TableRow key={m._id} className="hover:bg-blue-50/50 transition">
                                    <TableCell>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-semibold shadow-sm">
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
                                                ? "border-orange-500 text-orange-600"
                                                : "border-blue-500 text-blue-600"
                                                }`}
                                        >
                                            {m.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Joined</Badge></TableCell>
                                </TableRow>
                            ))}
                        {filteredMembers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground italic py-6">
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
