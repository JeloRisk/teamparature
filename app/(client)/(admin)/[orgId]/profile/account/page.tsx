import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import AccountSettingsForm from "@/app/(client)/manage-account/AccountSettingsForm"

interface AccountPageProps {
    params: Promise<{ orgId: string }>
}

export default async function WorkspaceAccountPage({ params }: AccountPageProps) {
    const { orgId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) redirect("/login")

    await connectDB()
    const user = await User.findById(session.user.id).select("firstName lastName email birthday").lean<{
        firstName: string
        lastName: string
        email: string
        birthday?: Date | null
    }>()
    if (!user) redirect("/login")

    return <div className="workspace-page-surface min-w-0 flex-1 text-foreground">
        <main className="mx-auto w-full max-w-xl">
            <header>
                <h1 className="text-2xl font-semibold leading-tight tracking-tight">Account settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">Keep your Teamparature profile up to date.</p>
            </header>
            <AccountSettingsForm returnHref={`/${orgId}/profile`} initial={{
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                birthday: user.birthday ? user.birthday.toISOString().slice(0, 10) : "",
            }} />
        </main>
    </div>
}
