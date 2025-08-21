import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const res = NextResponse.json({ message: "Logged out" });
    // clear NextAuth session cookie
    res.cookies.set("next-auth.session-token", "", { path: "/", maxAge: 0 });
    res.cookies.set("next-auth.callback-url", "", { path: "/", maxAge: 0 });
    return res;
}
