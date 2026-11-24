"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { Check, ChevronDown, Plus, Building2 } from "lucide-react"
import Image from "next/image"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/app/components/ui/sidebar"
import { useMembershipStore } from "../stores/useMembershipStore"

export function MembershipSwitcher() {
    const router = useRouter()
    const params = useParams() // orgId from URL
    const { isMobile } = useSidebar()

    const {
        memberships,
        activeMembership,
        setActiveMembership,
        loading,
    } = useMembershipStore()

    React.useEffect(() => {
        if (!loading && memberships.length > 0 && params.orgId) {
            const match = memberships.find((m) => m.organization._id === params.orgId)
            if (match && activeMembership?._id !== match._id) {
                setActiveMembership(match)
            }
        }
    }, [params.orgId, memberships, loading, setActiveMembership, activeMembership])

    if (loading) {
        return <div className="px-4 py-2 text-sm text-muted-foreground">Loading...</div>
    }

    if (!activeMembership) {
        return <div className="px-4 py-2 text-sm text-muted-foreground">No memberships</div>
    }

    const handleSwitch = (membership: typeof activeMembership) => {
        setActiveMembership(membership)
        router.push(`/${membership.organization._id}`)
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            aria-label={`Switch workspace. Current workspace: ${activeMembership.organization.name}`}
                            className="border border-sidebar-border data-[state=open]:bg-sidebar-accent"
                        >
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                {activeMembership.organization.logoUrl ? (
                                    <Image
                                        src={activeMembership.organization.logoUrl}
                                        alt=""
                                        width={16}
                                        height={16}
                                        className="size-4 rounded"
                                    />
                                ) : (
                                    <Building2 className="size-4" aria-hidden="true" />
                                )}
                            </div>

                            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {activeMembership.organization.name}
                                </span>
                                <span className="truncate text-xs capitalize text-muted-foreground">
                                    {activeMembership.role}
                                </span>
                            </div>

                            <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Your workspaces
                        </DropdownMenuLabel>

                        {memberships.map((m) => (
                            <DropdownMenuItem
                                key={m._id}
                                onClick={() => handleSwitch(m)}
                                className={`min-h-11 gap-2 p-2 ${activeMembership._id === m._id ? "bg-accent text-accent-foreground" : ""}`}
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border bg-card dark:bg-card">
                                    {m.organization.logoUrl ? (

                                        <Image
                                            src={m.organization.logoUrl}
                                            alt=""
                                            width={14}
                                            height={14}
                                            className="rounded"
                                        />

                                    ) : (
                                        <Building2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                    )}
                                </div>

                                <div className="flex min-w-0 flex-1 flex-col text-sm">
                                    <span className="truncate font-medium">{m.organization.name}</span>
                                    <span className="text-xs capitalize text-muted-foreground">
                                        {m.role}
                                    </span>
                                </div>

                                {activeMembership._id === m._id && <Check className="size-4 shrink-0 text-primary" aria-label="Current workspace" />}
                            </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild className="min-h-11 gap-2 p-2">
                            <Link href="/new/onboarding" className="font-medium">
                                <Plus className="size-4 text-primary" aria-hidden="true" />
                                Add workspace
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
