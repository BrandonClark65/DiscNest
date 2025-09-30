import { NextResponse } from 'next/server';
import User from '@/models/User';
import Disc from '@/models/Disc';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: Request) {
  const { email, discId, target } = await req.json();

  if (!email || !discId || !target || !['discShelf', 'bag'].includes(target)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await User.updateOne(
    { email },
    { $pull: { [target]: discId } }
  );

  await Disc.deleteOne({ _id: discId, userId: user._id });

  return NextResponse.json({ success: true });
}