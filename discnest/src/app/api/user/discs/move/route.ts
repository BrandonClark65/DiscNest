import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: Request) {
  const { email, discId, from, to } = await req.json();
  if (!email || !discId || !from || !to) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const disc = user[from]?.find((d: any) => d.id === discId);
  if (!disc) return NextResponse.json({ error: 'Disc not found in source' }, { status: 404 });

  user[from] = user[from].filter((d: any) => d.id !== discId);
  user[to].push(disc);
  await user.save();

  return NextResponse.json({ success: true });
}