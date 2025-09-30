import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import { DiscNestUser } from '@/types/user';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email }).lean<DiscNestUser>();

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // ✅ Patch missing fields with defaults
  const patchedUser: DiscNestUser = {
    _id: user._id, // ✅ required
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    hasOnboarded: user.hasOnboarded,
    favoriteBrands: user.favoriteBrands ?? [],
    preferredTypes: user.preferredTypes ?? [],
    stability: user.stability ?? '',
    throwingStyle: user.throwingStyle ?? '',
    maxDistance: user.maxDistance ?? 0,
    favoriteCourse: user.favoriteCourse ?? '',
    discCount: user.discCount ?? 0,
    lastLogin: user.lastLogin ?? null,
    };

  console.log('📦 Patched profile data:', patchedUser);
  return NextResponse.json({ user: patchedUser });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // ✅ Strip out lastLogin if it was accidentally sent
  const { lastLogin, ...safeBody } = body;

  await connectToDatabase();
  const updated = await User.findOneAndUpdate(
    { email: session.user.email },
    { $set: safeBody },
    { new: true }
  ).lean<DiscNestUser>();

  return NextResponse.json({ user: updated });
}