import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { withErrorHandling } from '@/lib/withErrorHandling';

async function handler(req: Request) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json(
      { error: 'Token and password are required' },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Reset link is invalid or expired' },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  user.password = hashedPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  return NextResponse.json({ success: true });
}

export const POST = withErrorHandling(
  handler as (...args: unknown[]) => Promise<NextResponse>
);
