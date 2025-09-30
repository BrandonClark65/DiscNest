import { NextResponse } from 'next/server';
import User from '@/models/User';
import Disc from '@/models/Disc';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: Request) {
  const { email, discId, target } = await req.json();
  if (!email || !discId || !target || !['shelf', 'bag'].includes(target)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
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

  // Add to user's shelf or bag using $addToSet
  const updateField = target === 'shelf' ? 'discShelf' : 'bag';
  await User.updateOne(
    { email },
    { $push: { [updateField]: userDisc._id } }
  );

  return NextResponse.json({ success: true });
}