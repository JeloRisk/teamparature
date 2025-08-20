import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/users/[id]
export async function POST() {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await User.findOne({ email: session.user.email }).select('-password');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ error: '404' }, { status: 405 });
}

// PUT /api/users/[id]
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    await connectDB();
    const { id } = await context.params;

    try {
        const body = await req.json();

        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                $set: {
                    firstName: body.firstName,
                    lastName: body.lastName,
                    email: body.email,
                    birthday: body.birthday,
                    avatar: body.avatar,
                },
            },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
    }
}


