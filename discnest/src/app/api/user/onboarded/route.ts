import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: Request) {
  const { email } = await req.json();
  await connectToDatabase();

  await User.updateOne({ email }, { hasOnboarded: true });

  return NextResponse.json({ success: true });
}