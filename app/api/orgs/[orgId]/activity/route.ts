import { NextResponse } from "next/server"
import { Types } from "mongoose"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { requirePermission } from "@/lib/rbac"
import { Activity } from "@/models/Activity"
import { getWorkspaceTimezone } from "@/lib/workspace-time"
import { fromZonedTime } from "date-fns-tz"
import { activityActions, type ActivityAction } from "@/lib/activity-actions"

export async function GET(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
    const auth = await getServerSession(authOptions)
    if (!auth?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { orgId } = await params
    const query = new URL(req.url).searchParams
    const page = Number(query.get("page") ?? "1")
    const requestedSort = query.get("sort") ?? "createdAt"
    const sort = ["newest", "oldest"].includes(requestedSort) ? "createdAt" : requestedSort
    const order = query.get("order") ?? (requestedSort === "oldest" ? "asc" : "desc")
    const search = (query.get("search") ?? "").trim().slice(0, 254)
    const action = query.get("action") ?? "all"
    if (!Types.ObjectId.isValid(orgId) || !Number.isSafeInteger(page) || page < 1 || page > 100000 ||
        !["actorName", "action", "targetLabel", "createdAt"].includes(sort) || !["asc", "desc"].includes(order) ||
        (action !== "all" && !Object.hasOwn(activityActions, action)))
        return NextResponse.json({ error: "Invalid activity filters" }, { status: 400 })
    try {
        await connectDB()
        const access = await requirePermission(auth.user.id, orgId, "view_activity")
        if (access !== true) return access
        const match: Record<string, unknown> = { organization: new Types.ObjectId(orgId) }
        if (action !== "all") match.action = action as ActivityAction
        const timezone = await getWorkspaceTimezone(orgId)
        const dates: Record<string, Date> = {}
        for (const key of ["start", "end"]) {
            const value = query.get(key)
            if (!value) continue
            const calendar = new Date(value + "T00:00:00Z")
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== value)
                return NextResponse.json({ error: "Choose valid dates" }, { status: 400 })
            if (key === "end") calendar.setUTCDate(calendar.getUTCDate() + 1)
            dates[key === "start" ? "$gte" : "$lt"] = fromZonedTime(calendar.toISOString().slice(0, 10) + "T00:00:00", timezone)
        }
        if (dates.$gte && dates.$lt && dates.$gte >= dates.$lt)
            return NextResponse.json({ error: "End date must be on or after start date" }, { status: 400 })
        if (Object.keys(dates).length) match.createdAt = dates
        if (search) {
            const escaped = Array.from(search, char => "\\^$.*+?()[]{}|".includes(char) ? "\\" + char : char).join("")
            match.$or = [
                { actorName: { $regex: escaped, $options: "i" } },
                { targetLabel: { $regex: escaped, $options: "i" } },
                { action: { $in: Object.entries(activityActions).filter(([, label]) => label.toLowerCase().includes(search.toLowerCase())).map(([key]) => key) } },
            ]
        }
        const direction = order === "asc" ? 1 : -1
        const sortField = sort === "action" ? "actionLabel" : sort
        const [result] = await Activity.aggregate([
            { $match: match },
            { $addFields: { actionLabel: { $switch: {
                branches: Object.entries(activityActions).map(([value, label]) => ({ case: { $eq: ["$action", value] }, then: label })),
                default: "$action",
            } } } },
            { $facet: {
                count: [{ $count: "total" }],
                rows: [
                    { $sort: { [sortField]: direction, _id: direction } },
                    { $skip: (page - 1) * 20 }, { $limit: 20 },
                    { $project: { actorName: 1, action: 1, targetLabel: 1, previousRole: 1, newRole: 1, outcome: 1, createdAt: 1 } },
                ],
            } },
        ]).collation({ locale: "en", strength: 2 })
        return NextResponse.json({ activities: result.rows, total: result.count[0]?.total ?? 0, page, pageSize: 20 })
    } catch (error) {
        console.error("Activity listing failed", error)
        return NextResponse.json({ error: "Could not load activity history" }, { status: 500 })
    }
}
