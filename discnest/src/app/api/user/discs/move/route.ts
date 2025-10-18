import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import { withUserAuth } from '@/lib/auth/withUserAuth';

export const POST = withUserAuth(async (req, session) => {
  const { discId, from, to } = await req.json();

  if (
    !discId ||
    !from ||
    !to ||
    !['discShelf', 'bag'].includes(from) ||
    !['discShelf', 'bag'].includes(to)
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findById(session.user.id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Check if disc exists in source array
  const existsInSource = user[from]?.some((d: any) => d.toString() === discId);
  if (!existsInSource) {
    return NextResponse.json({ error: 'Disc not found in source' }, { status: 404 });
  }

  // Move disc: remove from source, add to target
  await User.updateOne(
    { _id: user._id },
    {
      $pull: { [from]: discId },
      $push: { [to]: discId },
    }
  );

  return NextResponse.json({ success: true });
});
