import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import VerificationToken from '@/models/VerificationToken';

export async function GET() {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await User.findById(session.user.id).select('isVerified');
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if a valid verification token exists in the separate collection
  const tokenExists = await VerificationToken.exists({ userId: session.user.id });

  return NextResponse.json({
    isVerified: user.isVerified,
    hasValidToken: !!tokenExists // true if still in DB (TTL not expired)
  });
}
