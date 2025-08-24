"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useOrgStore } from "@/app/stores/orgs/useTeamStore"

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/app/components/ui/table"
import { Input } from "@/app/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/components/ui/dialog"
import { Label } from "@/app/components/ui/label"

export default function MembersPage() {
    const { orgId } = useParams<{ orgId: string }>()
    const { organization, memberships, loading, error, fetchOrganizationDetails } = useOrgStore()

    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState("member")

    useEffect(() => {
        if (orgId) fetchOrganizationDetails(orgId)
    }, [orgId, fetchOrganizationDetails])

    if (loading) return <p>Loading...</p>
    if (error) return <p className="text-red-500">{error}</p>
    if (!organization) return <p>No organization found</p>

    // helper: get initials
    const getInitials = (first?: string, last?: string) => {
        if (!first && !last) return "NA"
        if (first && last) return `${first[0]}${last[0]}`.toUpperCase()
        return (first || last || "NA").slice(0, 2).toUpperCase()
    }

    // filter members
    const filteredMembers = memberships.filter((m) => {
        const userName = `${m.user?.firstName || ""} ${m.user?.lastName || ""}`.trim()
        const userEmail = m.user?.email || ""

        const matchesSearch =
            userName.toLowerCase().includes(search.toLowerCase()) ||
            userEmail.toLowerCase().includes(search.toLowerCase())

        const matchesRole = roleFilter === "all" || m.role === roleFilter
        return matchesSearch && matchesRole
    })

    const handleInvite = async () => {
        if (!inviteEmail) return alert("Enter a valid email");

        try {
            const res = await fetch(`/api/orgs/${orgId}/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to send invite");

            alert(`Invitation sent to ${inviteEmail}!`);
            setInviteEmail("");
            setInviteRole("member");
        } catch (err: any) {
            alert(err.message || "Something went wrong");
        }
    };

    return (
        <div className="space-y-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-blue-800">
                        {organization.name} Members
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {memberships.length} total member{memberships.length !== 1 && "s"}
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite a new member</DialogTitle>
                            <DialogDescription>
                                Send an invitation to join <span className="font-semibold">{organization.name}</span>.
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
                                <Select value={inviteRole} onValueChange={setInviteRole}>
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
                            >
                                Send Invite
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <Input
                    placeholder="Search members..."
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

            <div className="rounded-lg border border-blue-100 shadow-sm overflow-hidden">
                <Table>
                    <TableCaption className="text-sm text-muted-foreground">
                        A list of all members in{" "}
                        <span className="font-semibold text-blue-700">{organization.name}</span>
                    </TableCaption>
                    <TableHeader>
                        <TableRow className="bg-blue-50">
                            <TableHead className="w-24 text-blue-700">Initials</TableHead>
                            <TableHead className="text-blue-700">Name</TableHead>
                            <TableHead className="text-blue-700">Email</TableHead>
                            <TableHead className="text-blue-700">Role</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.length > 0 ? (
                            filteredMembers.map((m) => (
                                <TableRow
                                    key={m._id}
                                    className="hover:bg-blue-50/50 transition"
                                >
                                    <TableCell>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-semibold shadow-sm">
                                            {getInitials(m.user.firstName, m.user.lastName)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {m.user.firstName} {m.user.lastName}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {m.user.email}
                                    </TableCell>
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
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-center text-muted-foreground italic py-6"
                                >
                                    No members found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
