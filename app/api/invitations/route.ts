import { NextResponse } from "next/server"
import { Types } from "mongoose"
import { POST as sendInvitation } from "../orgs/[orgId]/invite/route"

export async function POST(req: Request) {
    const body = await req.json()
    if (typeof body.orgId !== "string" || !Types.ObjectId.isValid(body.orgId))
        return NextResponse.json({ error: "Invalid workspace" }, { status: 400 })
    const url = new URL(`/api/orgs/${body.orgId}/invite`, req.url)
    return sendInvitation(new Request(url, {
        method: "POST", headers: req.headers, body: JSON.stringify({ email: body.email, role: body.role }),
    }))
}
