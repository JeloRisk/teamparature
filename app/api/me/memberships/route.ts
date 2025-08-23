import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { Membership } from "@/models/Membership";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // fetch memberships, populate both org + team
        const memberships = await Membership.find({ user: session.user.id })
            .populate({
                path: "organization",
                select: "_id name createdBy",
            })
            .populate({
                path: "team",
                select: "_id name description createdBy organization",
            })
            .lean();

        const formatted = memberships.map((m: any) => ({
            _id: m._id,
            role: m.role,
            isActive: m.isActive,
            organization: m.organization
                ? {
                    _id: m.organization._id,
                    name: m.organization.name,
                    createdBy: m.organization.createdBy,
                    isCreator:
                        String(m.organization.createdBy) ===
                        String(session.user.id),
                }
                : null,
            team: m.team
                ? {
                    _id: m.team._id,
                    name: m.team.name,
                    description: m.team.description,
                    createdBy: m.team.createdBy,
                    isCreator:
                        String(m.team.createdBy) === String(session.user.id),
                }
                : null,
        }));

        return new Response(JSON.stringify({ memberships: formatted }), {
            status: 200,
        });
    } catch (err) {
        console.error("Memberships API error:", err);
        return new Response(
            JSON.stringify({ error: "Failed to fetch memberships" }),
            { status: 500 }
        );
    }
}
