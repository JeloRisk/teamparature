import { Trash2 } from "lucide-react"
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
    return <div className="workspace-page-surface mx-auto w-full max-w-3xl space-y-4 text-foreground sm:space-y-5">
        <header>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">Workspace settings</h1>
            <p className="mt-1 break-words text-sm text-muted-foreground">{organization.name}</p>
        </header>
        <WorkspaceSettingsForm orgId={orgId} initial={{ name: organization.name, description: organization.description ?? "", timezone: organization.timezone ?? "UTC" }}
            timezones={Array.from(new Set(["UTC", organization.timezone ?? "UTC", ...Intl.supportedValuesOf("timeZone")])).sort()} />
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="delete-workspace-heading">
            <div className="space-y-3">
            <h2 id="delete-workspace-heading" className="flex items-center gap-2 text-sm font-semibold text-destructive"><Trash2 className="size-4" aria-hidden="true" />Delete workspace</h2>
            <p className="max-w-prose text-sm leading-6 text-muted-foreground">Permanently delete this workspace and its teams, memberships, invitations, and mood check-ins. All members will lose access. This action cannot be undone.</p>
            <WorkspaceAction orgId={orgId} action="delete_workspace" name={organization.name} label="Delete workspace"
                description="All workspace data will be permanently deleted. Member accounts will remain available for their other workspaces." />
            </div>
        </section>
    </div>
}
