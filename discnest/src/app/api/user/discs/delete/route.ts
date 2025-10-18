import { NextResponse } from 'next/server';
import User from '@/models/User';
import Disc from '@/models/Disc';
import { connectToDatabase } from '@/lib/mongodb';
import { withUserAuth } from '@/lib/auth/withUserAuth';
import { recalcDiscCount } from '@/lib/updateDiscCount';

export const POST = withUserAuth(async (req, session) => {
  const { discId, target } = await req.json();

  if (!discId || !target || !['discShelf', 'bag'].includes(target)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findById(session.user.id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Remove disc from user's shelf or bag
  await User.updateOne(
    { _id: user._id },
    { $pull: { [target]: discId } }
  );

  // Delete the disc document belonging to this user
  await Disc.deleteOne({ _id: discId, userId: user._id });

  // ✅ Update discCount after modification
  await recalcDiscCount(session.user.id);

  return NextResponse.json({ success: true });
});
