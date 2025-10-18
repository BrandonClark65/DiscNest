import { NextResponse } from 'next/server';
import { User } from '@/models';
import { connectToDatabase } from '@/lib/mongodb';
import { withUserAuth } from '@/lib/auth/withUserAuth';

export const GET = withUserAuth(async (_req, session) => {
  try {
    await connectToDatabase();

    const user = await User.findById(session.user.id).populate('discShelf');

    if (!user) {
      return NextResponse.json({ shelf: [] }, { status: 200 }); // ✅ return empty array instead of error
    }

    return NextResponse.json({ shelf: user.discShelf || [] }, { status: 200 });
  } catch (err) {
    console.error('❌ Error in shelf route:', err);
    return NextResponse.json({ shelf: [] }, { status: 500 }); // ✅ always return JSON
  }
});
