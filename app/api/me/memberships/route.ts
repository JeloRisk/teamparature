import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { Membership } from "@/models/Membership";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const memberships = await Membership.find(
            { user: session.user.id },
        ).lean();

        return new Response(JSON.stringify({ memberships }), { status: 200 });
    } catch (err) {
        console.error("Memberships API error:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch memberships" }), { status: 500 });
    }
}
