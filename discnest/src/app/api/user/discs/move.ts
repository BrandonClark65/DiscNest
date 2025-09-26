import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req) {
  const { userId, discId, from, to } = await req.json();
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  user[from] = user[from].filter(id => id.toString() !== discId);
  user[to].push(discId);

  await user.save();
  return NextResponse.json({ success: true });
}