import { NextResponse } from 'next/server';
import User from '@/models/User';
import Disc from '@/models/Disc';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: Request) {
  const { email, discId, target } = await req.json();
  if (!email || !discId || !target) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await connectToDatabase();

  const catalogDisc = await Disc.findOne({ _id: discId, userId: { $exists: false } });
  if (!catalogDisc) {
    return NextResponse.json({ error: 'Disc not found in catalog' }, { status: 404 });
  }

  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Clone the disc for the user
  const userDisc = new Disc({
    ...catalogDisc.toObject(),
    _id: undefined, // Let MongoDB assign a new ID
    userId: user._id,
    addedAt: new Date(),
  });

  await userDisc.save();
  user[target].push(userDisc);
  await user.save();

  return NextResponse.json({ success: true });
}