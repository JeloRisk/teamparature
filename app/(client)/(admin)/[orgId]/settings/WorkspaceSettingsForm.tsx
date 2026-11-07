"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Globe2, LoaderCircle, Save } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { useOrgStore } from "@/app/stores/orgs/useTeamStore"
import { useMembershipStore } from "@/app/stores/useMembershipStore"

export default function WorkspaceSettingsForm({ orgId, initial, timezones }: {
    orgId: string
    initial: { name: string; description: string; timezone: string }
    timezones: string[]
}) {
    const router = useRouter()
    const [form, setForm] = useState(initial)
    const [saved, setSaved] = useState(initial)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const dirty = JSON.stringify(form) !== JSON.stringify(saved)

    async function submit(event: FormEvent) {
        event.preventDefault()
        setBusy(true)
        setError("")
        setSuccess(false)
        try {
            const res = await fetch(`/api/orgs/${orgId}/manage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update_workspace", ...form }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Could not save workspace settings")
            const updated = { ...form, name: form.name.trim(), description: form.description.trim() }
            setForm(updated)
            setSaved(updated)
            setSuccess(true)
            useOrgStore.getState().clearOrganization()
            useMembershipStore.setState({ memberships: [], activeMembership: null })
            await useMembershipStore.getState().fetchMemberships()
            router.refresh()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not save workspace settings")
        } finally {
            setBusy(false)
        }
    }

    return <form onSubmit={submit} className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-6">
            <h2 className="font-semibold">Workspace details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Set up the name and local day your team shares.</p>
        </div>
        <fieldset disabled={busy} className="space-y-5 p-6">
            <div className="space-y-2">
                <label htmlFor="workspace-name" className="text-sm font-medium">Workspace name</label>
                <Input id="workspace-name" value={form.name} required maxLength={100} onChange={event => { setSuccess(false); setForm({ ...form, name: event.target.value }) }} />
            </div>
            <div className="space-y-2">
                <label htmlFor="workspace-description" className="text-sm font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
                <Textarea id="workspace-description" rows={3} maxLength={1000} value={form.description} onChange={event => { setSuccess(false); setForm({ ...form, description: event.target.value }) }} placeholder="What does your team do?" />
                <p className="text-right text-xs text-muted-foreground">{form.description.length}/1,000</p>
            </div>
            <div className="space-y-2">
                <label htmlFor="workspace-timezone" className="flex items-center gap-2 text-sm font-medium"><Globe2 className="size-4 text-primary" />Workspace timezone</label>
                <select id="workspace-timezone" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring" value={form.timezone} onChange={event => { setSuccess(false); setForm({ ...form, timezone: event.target.value }) }}>
                    {timezones.map(zone => <option key={zone} value={zone}>{zone.replaceAll("_", " ")}</option>)}
                </select>
                <p className="text-xs leading-5 text-muted-foreground">Daily check-ins and reports follow midnight in this timezone. Changing it can move past entries between reporting days.</p>
            </div>
        </fieldset>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
            <div aria-live="polite">{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}{success && <p role="status" className="text-sm text-primary">Settings saved.</p>}</div>
            <Button type="submit" disabled={busy || !dirty || !form.name.trim()}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{busy ? "Saving…" : "Save changes"}</Button>
        </div>
    </form>
}
