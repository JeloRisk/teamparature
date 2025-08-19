import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    const { name, email, password } = await req.json();
    await connectMongo();

    const existing = await User.findOne({ email });
    if (existing) return NextResponse.json({ error: "User exists" }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    return NextResponse.json({ userId: user._id, name: user.name, email: user.email });
}
