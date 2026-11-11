import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import AccountSettingsForm from "./AccountSettingsForm"

export default async function ManageAccountPage() {
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

    return <div className="dashboard-reference-theme min-h-svh bg-background px-4 py-6 sm:py-10">
        <main className="mx-auto w-full max-w-xl">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Account settings</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Keep your profile details up to date.</p>
            <AccountSettingsForm initial={{
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                birthday: user.birthday ? user.birthday.toISOString().slice(0, 10) : "",
            }} />
        </main>
    </div>
}
