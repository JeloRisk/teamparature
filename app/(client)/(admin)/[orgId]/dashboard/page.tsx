import { redirect } from "next/navigation"

export default async function LegacyDashboardPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params
    redirect(`/${orgId}`)
}
