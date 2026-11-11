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

    return <div className="dashboard-reference-theme -m-4 min-w-0 flex-1 bg-background px-4 py-5 sm:py-8 md:-mx-10 md:px-10">
        <main className="mx-auto w-full max-w-xl">
            <header>
                <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Account settings</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Keep your profile details up to date.</p>
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
