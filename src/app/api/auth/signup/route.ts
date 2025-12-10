import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { withErrorHandling } from '@/lib/withErrorHandling';

async function handler(req: Request) {
  const { name, email, password } = await req.json();

  // Input validation
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'Name, email, and password are required' },
      { status: 400 }
    );
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Please enter a valid email address' },
      { status: 400 }
    );
  }

  // Password validation
  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters long' },
      { status: 400 }
    );
  }

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

export const POST = withErrorHandling(
  handler as (...args: unknown[]) => Promise<NextResponse>,
  '/api/auth/signup'
);
