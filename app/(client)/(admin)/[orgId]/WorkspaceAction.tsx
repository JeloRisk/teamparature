"use client"

import { AlertTriangle, ShieldCheck, LoaderCircle } from "lucide-react"
import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/app/components/ui/dialog"
import { useOrgStore } from "@/app/stores/orgs/useTeamStore"
import { useMembershipStore } from "@/app/stores/useMembershipStore"

interface Props {
    orgId: string
    action: "restore_member" | "remove_member" | "change_role" | "cancel_invitation" | "delete_workspace"
    id?: string
    role?: "owner" | "member"
    name?: string
    label: string
    description: string
    initialOpen?: boolean
    onClosed?: () => void
}

export default function WorkspaceAction({ label, description, initialOpen = false, onClosed, ...payload }: Props) {
    const [open, setOpen] = useState(initialOpen)
    const [busy, setBusy] = useState(false)
    const [confirmation, setConfirmation] = useState("")
    const [error, setError] = useState("")
    const grantingAccess = payload.action === "change_role" || payload.action === "restore_member"
    const deleting = payload.action === "delete_workspace"

    async function submit() {
        setBusy(true)
        setError("")
        try {
            const res = await fetch(`/api/orgs/${payload.orgId}/manage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...payload, name: deleting ? confirmation : payload.name }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Could not update workspace")
            useOrgStore.getState().clearOrganization()
            useMembershipStore.setState({ memberships: [], activeMembership: null, organization: null })
            // Reload server role checks and invalidate all workspace-specific client state.
            window.location.assign(deleting ? "/dashboard" : `/${payload.orgId}/members`)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not update workspace")
            setBusy(false)
        }
    }

    return <Dialog open={open} onOpenChange={value => { if (!busy) { setOpen(value); setError(""); setConfirmation(""); if (!value) onClosed?.() } }}>
        {!initialOpen && <DialogTrigger asChild><Button variant="outline" size="sm" className={grantingAccess ? "rounded-lg" : "rounded-lg border-red-200 dark:border-[#654749] text-red-700 dark:text-[#eea09a] hover:bg-red-50 dark:hover:bg-[#443436]"}>{label}</Button></DialogTrigger>}
        <DialogContent className="rounded-2xl border-border dark:border-border p-6 sm:max-w-md">
            <div className={`mb-1 grid size-12 place-items-center rounded-2xl ${grantingAccess ? "bg-accent dark:bg-accent text-primary dark:text-primary" : "bg-red-50 dark:bg-[#443436] text-red-700 dark:text-[#eea09a]"}`}>
                {grantingAccess ? <ShieldCheck className="size-6" aria-hidden="true" /> : <AlertTriangle className="size-6" aria-hidden="true" />}
            </div>
            <DialogHeader className="text-left"><DialogTitle>{label}</DialogTitle><DialogDescription className="leading-6">{description}</DialogDescription></DialogHeader>
            {deleting && <div className="space-y-2">
                <label htmlFor="delete-workspace-name" className="text-sm font-medium">Type {payload.name} to confirm</label>
                <Input id="delete-workspace-name" autoComplete="off" value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} />
            </div>}
            {error && <p role="alert" className="rounded-xl bg-red-50 dark:bg-[#443436] p-3 text-sm text-red-800 dark:text-[#eea09a]">{error}</p>}
            <DialogFooter className="mt-2 gap-2 border-t border-border dark:border-border pt-5">
                <Button variant="outline" disabled={busy} onClick={() => { setOpen(false); onClosed?.() }}>Cancel</Button>
                <Button disabled={busy || (deleting && confirmation !== payload.name)} onClick={submit}
                    className={grantingAccess ? "bg-primary text-primary-foreground" : "bg-red-700 text-white hover:bg-red-800"}>
                    {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}{busy ? "Saving…" : label}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
}
