import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  await connectToDatabase();

  const existingUser = await User.findOne({ email });

  // --------------------------
  // CASE 1: User exists & used OAuth before
  // --------------------------
  if (existingUser && !existingUser.password) {
    return NextResponse.json(
      {
        error:
          'This email is already registered using Google. Please sign in with Google instead.',
      },
      { status: 400 }
    );
  }

  // --------------------------
  // CASE 2: User exists & used password login before
  // --------------------------
  if (existingUser) {
    return NextResponse.json(
      { error: 'An account with this email already exists. Please log in.' },
      { status: 400 }
    );
  }

  // --------------------------
  // CASE 3: Create new user
  // --------------------------
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    hasOnboarded: false,
  });

  return NextResponse.json({ success: true, user: newUser });
}
