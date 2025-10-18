import { NextResponse } from 'next/server';
import { User, Disc } from '@/models';
import { connectToDatabase } from '@/lib/mongodb';
import { withUserAuth } from '@/lib/auth/withUserAuth';

export const GET = withUserAuth(async (_req, session) => {
  try {
    await connectToDatabase();

    const user = await User.findById(session.user.id).populate('bag');

    if (!user) {
      return NextResponse.json({ bag: [] }, { status: 200 });
    }

    return NextResponse.json({ bag: user.bag || [] }, { status: 200 });
  } catch (err) {
    console.error('❌ Error in bag route:', err);
    return NextResponse.json({ bag: [] }, { status: 500 });
  }
});
