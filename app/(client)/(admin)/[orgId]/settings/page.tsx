import { Building2, Trash2 } from "lucide-react"
import { notFound } from "next/navigation"
import { getWorkspaceMembership } from "../workspace-access"
import { Organization } from "@/models/Organization"
import WorkspaceSettingsForm from "./WorkspaceSettingsForm"
import WorkspaceAction from "../WorkspaceAction"

export default async function SettingsPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params
    const membership = await getWorkspaceMembership(orgId)
    if (membership?.role !== "owner") notFound()
    const organization = await Organization.findById(orgId).select("name description timezone").lean<{ name: string; description?: string; timezone?: string }>()
    if (!organization) notFound()
    return <div className="max-w-3xl space-y-7 py-2 sm:py-4">
        <div><h1 className="text-2xl font-semibold text-foreground dark:text-foreground">Workspace settings</h1><p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">{organization.name}</p></div>
        <section className="flex items-center gap-4 rounded-2xl border border-border dark:border-border bg-card dark:bg-card p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent dark:bg-[#35313f] text-primary dark:text-primary"><Building2 className="size-6" aria-hidden="true" /></span>
            <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">Workspace</p><p className="mt-1 text-lg font-semibold text-foreground dark:text-foreground">{organization.name}</p></div>
        </section>
        <WorkspaceSettingsForm orgId={orgId} initial={{ name: organization.name, description: organization.description ?? "", timezone: organization.timezone ?? "UTC" }}
            timezones={Array.from(new Set(["UTC", organization.timezone ?? "UTC", ...Intl.supportedValuesOf("timeZone")])).sort()} />
        <section className="overflow-hidden rounded-2xl border border-red-200 dark:border-[#654749] bg-card dark:bg-card">
            <div className="flex items-center gap-3 border-b border-red-100 dark:border-[#654749] bg-red-50/60 dark:bg-[#443436]/60 px-6 py-4">
                <Trash2 className="size-4 text-red-700 dark:text-[#eea09a]" aria-hidden="true" /><span className="text-sm font-semibold text-red-800 dark:text-[#eea09a]">Danger zone</span>
            </div>
            <div className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-[#eea09a]">Delete workspace</h2>
            <p className="text-sm leading-6 text-muted-foreground dark:text-muted-foreground">Permanently delete this workspace and its teams, memberships, invitations, and mood check-ins. All members will lose access. This action cannot be undone.</p>
            <WorkspaceAction orgId={orgId} action="delete_workspace" name={organization.name} label="Delete workspace"
                description="All workspace data will be permanently deleted. Member accounts will remain available for their other workspaces." />
            </div>
        </section>
    </div>
}
