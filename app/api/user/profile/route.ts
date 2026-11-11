import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function PATCH(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => null)
    if (!body || typeof body.firstName !== "string" || typeof body.lastName !== "string") {
        return NextResponse.json({ error: "Enter your first and last name." }, { status: 400 })
    }

    const firstName = body.firstName.trim()
    const lastName = body.lastName.trim()
    if (!firstName || !lastName || firstName.length > 80 || lastName.length > 80) {
        return NextResponse.json({ error: "Names must be 1 to 80 characters long." }, { status: 400 })
    }

    let birthday: Date | null = null
    if (typeof body.birthday === "string" && body.birthday) {
        const parsed = new Date(`${body.birthday}T00:00:00.000Z`)
        if (Number.isNaN(parsed.getTime())) return NextResponse.json({ error: "Enter a valid birthday." }, { status: 400 })
        birthday = parsed
    } else if (body.birthday !== "" && body.birthday !== null && body.birthday !== undefined) {
        return NextResponse.json({ error: "Enter a valid birthday." }, { status: 400 })
    }

    await connectDB()
    try {
        const user = await User.findByIdAndUpdate(
            session.user.id,
            { $set: { firstName, lastName, birthday } },
            { new: true, runValidators: true },
        ).select("firstName lastName email birthday avatar")

        if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 })
        return NextResponse.json(user)
    } catch (error) {
        console.error("Account profile update failed:", error)
        return NextResponse.json({ error: "Could not save your profile. Please try again." }, { status: 500 })
    }
}
