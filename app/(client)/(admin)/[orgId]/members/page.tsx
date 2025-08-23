// app/(admin)/[orgId]/members/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/app/components/ui/card"
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/app/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Badge } from "@/app/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useMembershipStore } from "@/app/stores/useMembershipStore"

export default function MembersPage() {
    const { orgId } = useParams<{ orgId: string }>()
    const { organization, loading, error, fetchOrganizationDetails } = useMembershipStore()
    const [orgNotFound, setOrgNotFound] = useState(false)

    useEffect(() => {
        if (!orgId) return
        fetchOrganizationDetails(orgId).then((org) => {
            if (!org) setOrgNotFound(true)
        })
    }, [orgId, fetchOrganizationDetails])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading members...
            </div>
        )
    }

    if (error) return <p className="text-red-500">{error}</p>
    if (orgNotFound) return <p className="text-muted-foreground">Organization not found.</p>
    if (!organization) return null

    const members = organization.memberships || []

    return (
        <div className="space-y-6">
            {/* Organization Header */}
            <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="flex items-center gap-4">
                    {organization.logoUrl ? (
                        <Image
                            src={organization.logoUrl}
                            alt={organization.name}
                            width={56}
                            height={56}
                            className="rounded-md border bg-white p-1"
                        />
                    ) : (
                        <div className="h-14 w-14 rounded-md bg-gray-800 flex items-center justify-center text-lg font-semibold text-white">
                            {organization.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div>
                        <CardTitle className="text-xl font-semibold text-gray-900">
                            {organization.name} – Members
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            {members.length} total member{members.length !== 1 && "s"}
                        </p>
                    </div>
                </CardHeader>
            </Card>

            {/* Members Table */}
            <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Members Directory</CardTitle>
                </CardHeader>
                <CardContent>
                    {members.length === 0 ? (
                        <p className="text-muted-foreground">No members found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Member</TableHead>
                                    <TableHead className="w-[40%]">Email</TableHead>
                                    <TableHead className="w-[20%]">Role</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((m: any) => (
                                    <TableRow key={m.user._id}>
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={m.user.image || ""} alt={m.user.name} />
                                                <AvatarFallback>
                                                    {m.user.name?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-gray-900">
                                                {m.user.name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-gray-600">{m.user.email}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    m.role === "creator"
                                                        ? "border-gray-800 text-gray-800"
                                                        : "border-gray-400 text-gray-600"
                                                }
                                            >
                                                {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
