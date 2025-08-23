import { Membership } from "@/models/Membership"
import { Organization } from "@/models/Organization"
import { Team } from "@/models/Team"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
        }

        // raw memberships
        const memberships = await Membership.find({ user: session.user.id }).lean()

        // fetch org + team manually
        const orgIds = memberships.map((m) => m.organization).filter(Boolean)
        const teamIds = memberships.map((m) => m.team).filter(Boolean)

        const [orgs, teams] = await Promise.all([
            Organization.find({ _id: { $in: orgIds } }).lean(),
            Team.find({ _id: { $in: teamIds } }).lean(),
        ])

        const orgMap = new Map(orgs.map((o) => [String(o._id), o]))
        const teamMap = new Map(teams.map((t) => [String(t._id), t]))

        const formatted = memberships.map((m) => ({
            _id: m._id,
            role: m.role,
            isActive: m.isActive,
            organization: orgMap.get(String(m.organization)) || null,
            team: teamMap.get(String(m.team)) || null,
        }))

        return new Response(JSON.stringify({ memberships: formatted }), { status: 200 })
    } catch (err) {
        console.error("Memberships API error:", err)
        return new Response(JSON.stringify({ error: "Failed to fetch memberships" }), {
            status: 500,
        })
    }
}
