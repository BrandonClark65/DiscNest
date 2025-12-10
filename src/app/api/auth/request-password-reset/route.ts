import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { resend } from '@/lib/resend';
import { withErrorHandling } from '@/lib/withErrorHandling';

const RESET_TOKEN_EXPIRY_MS = 1000 * 60 * 60; // 1 hour

async function handler(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findOne({ email });

  // Always respond with 200 (security)
  if (!user) {
    return NextResponse.json({ success: true });
  }

  // Generate reset token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  user.passwordResetToken = tokenHash;
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
  await user.save();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password/${token}`;

  await resend.emails.send({
    from: 'DiscNest <no-reply@discnest.com>',
    to: user.email,
    subject: 'Reset your DiscNest password',
    html: `
      <p>Hi ${user.name || ''},</p>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to reset it. It expires in 1 hour:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <br/>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>- The DiscNest Team</p>
    `,
  });

  return NextResponse.json({ success: true });
}

export const POST = withErrorHandling(
  handler as (...args: unknown[]) => Promise<NextResponse>
);
