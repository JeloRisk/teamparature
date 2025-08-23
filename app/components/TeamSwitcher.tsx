"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, Plus, Building2, Shield, User } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/app/components/ui/sidebar"
import { useMembershipStore } from "../stores/useMembershipStore"
import Link from "next/link"

export function MembershipSwitcher() {
    const { isMobile } = useSidebar()
    const router = useRouter()

    const {
        memberships,
        activeMembership,
        fetchMemberships,
        setActiveMembership,
        loading,
    } = useMembershipStore()

    React.useEffect(() => {
        fetchMemberships()
    }, [fetchMemberships])

    if (loading) {
        return <div className="px-4 py-2 text-sm text-muted-foreground">Loading...</div>
    }

    if (!activeMembership) {
        return <div className="px-4 py-2 text-sm text-muted-foreground">No memberships</div>
    }

    const getRoleIcon = (role: string) => {
        if (role === "owner" || role === "creator") {
            return <Shield className="size-3.5 text-orange-500" />
        }
        if (role === "admin") {
            return <Shield className="size-3.5 text-blue-500" />
        }
        return <User className="size-3.5 text-gray-500" />
    }

    const handleSwitch = (membership: typeof activeMembership) => {
        setActiveMembership(membership)

        // ✅ Redirect to new route based on org
        router.push(`/${membership.organization._id}/dashboard`)
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-orange-500/10 data-[state=open]:text-orange-600"
                        >
                            <div className="bg-orange-500 text-white flex aspect-square size-8 items-center justify-center rounded-lg">
                                {activeMembership.organization.logoUrl ? (
                                    <img
                                        src={activeMembership.organization.logoUrl}
                                        alt={activeMembership.organization.name}
                                        className="size-4 rounded"
                                    />
                                ) : (
                                    <Building2 className="size-4" />
                                )}
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium text-orange-600">
                                    {activeMembership.organization.name}
                                </span>
                                <span className="truncate text-xs text-blue-500 flex items-center gap-1">
                                    {getRoleIcon(activeMembership.role)}
                                    {activeMembership.role}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto text-orange-600" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-xs text-blue-500">
                            Your Organizations
                        </DropdownMenuLabel>
                        {memberships.map((m, index) => (
                            <DropdownMenuItem
                                key={m._id}
                                onClick={() => handleSwitch(m)}
                                className={`gap-2 p-2 ${activeMembership._id === m._id ? "bg-orange-50 text-orange-600" : ""
                                    }`}
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border bg-white">
                                    {m.organization.logoUrl ? (
                                        <img
                                            src={m.organization.logoUrl}
                                            alt={m.organization.name}
                                            className="size-3.5 rounded"
                                        />
                                    ) : (
                                        <Building2 className="size-3.5 shrink-0 text-orange-500" />
                                    )}
                                </div>
                                <div className="flex flex-col text-sm">
                                    <span className="font-medium">{m.organization.name}</span>
                                    <span className="text-xs flex items-center gap-1 text-blue-500">
                                        {getRoleIcon(m.role)} {m.role}
                                    </span>
                                </div>
                                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 p-2">
                            <div className="flex size-6 items-center justify-center rounded-md border bg-transparent text-orange-600">
                                <Plus className="size-4" />
                            </div>
                            <Link href="/new/onboarding" className="font-medium text-blue-500">
                                Add organization
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
