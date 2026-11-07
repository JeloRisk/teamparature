import { Building2, Trash2 } from "lucide-react"
import { notFound } from "next/navigation"
import { getWorkspaceMembership } from "../workspace-access"
import { Organization } from "@/models/Organization"
import WorkspaceAction from "../WorkspaceAction"

export default async function SettingsPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params
    const membership = await getWorkspaceMembership(orgId)
    if (membership?.role !== "owner") notFound()
    const organization = await Organization.findById(orgId).select("name").lean<{ name: string }>()
    if (!organization) notFound()
    return <div className="max-w-3xl space-y-7 py-2 sm:py-4">
        <div><h1 className="text-2xl font-semibold text-slate-950">Workspace settings</h1><p className="mt-1 text-sm text-slate-600">{organization.name}</p></div>
        <section className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#EEF2FE] text-blue-700"><Building2 className="size-6" aria-hidden="true" /></span>
            <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Workspace</p><p className="mt-1 text-lg font-semibold text-slate-950">{organization.name}</p></div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-red-200 bg-white">
            <div className="flex items-center gap-3 border-b border-red-100 bg-red-50/60 px-6 py-4">
                <Trash2 className="size-4 text-red-700" aria-hidden="true" /><span className="text-sm font-semibold text-red-800">Danger zone</span>
            </div>
            <div className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-red-800">Delete workspace</h2>
            <p className="text-sm leading-6 text-slate-600">Permanently delete this workspace and its teams, memberships, invitations, and mood check-ins. All members will lose access. This action cannot be undone.</p>
            <WorkspaceAction orgId={orgId} action="delete_workspace" name={organization.name} label="Delete workspace"
                description="All workspace data will be permanently deleted. Member accounts will remain available for their other workspaces." />
            </div>
        </section>
    </div>
}
