"use client"

import { useState } from "react"
import { MoreHorizontal, ShieldCheck, UserMinus } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu"
import WorkspaceAction from "../WorkspaceAction"

export default function MemberActions({ orgId, id, role, email }: {
    orgId: string; id: string; role: string; email: string
}) {
    const [action, setAction] = useState<"change_role" | "remove_member" | null>(null)
    return <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Manage ${email}`} className="size-9 rounded-lg text-muted-foreground dark:text-muted-foreground hover:bg-accent dark:hover:bg-accent hover:text-primary dark:hover:text-primary">
                    <MoreHorizontal className="size-5" aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
                <DropdownMenuItem className="rounded-lg py-2" onSelect={() => setAction("change_role")}>
                    <ShieldCheck className="mr-2 size-4" />{role === "owner" ? "Make member" : "Make owner"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-lg py-2 text-red-700 dark:text-[#eea09a] focus:bg-red-50 dark:focus:bg-red-950 focus:text-red-800 dark:focus:text-red-300" onSelect={() => setAction("remove_member")}>
                    <UserMinus className="mr-2 size-4" />Remove member
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        {action && <WorkspaceAction key={action} orgId={orgId} id={id} action={action}
            role={role === "owner" ? "member" : "owner"} initialOpen onClosed={() => setAction(null)}
            label={action === "remove_member" ? "Remove member" : role === "owner" ? "Make member" : "Make owner"}
            description={action === "remove_member"
                ? `Remove ${email} from this workspace? They will lose access. Their past check-ins will remain in reporting.`
                : `Change the workspace role for ${email}? Owners can manage people, invitations, and delete the workspace.`} />}
    </>
}
