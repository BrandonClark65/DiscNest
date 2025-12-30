import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import UserReviewsClient from './UserReviewsClient';

async function getUserData(identifier: string) {
  await connectToDatabase();

  // Try to find by username first (if identifier doesn't look like ObjectId)
  // ObjectIds are 24 hex characters
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
  
  let user;
  if (isObjectId) {
    // Try ObjectId first
    user = await User.findById(identifier)
      .select('name username avatarUrl bio averageRating ratingCount')
      .lean();
  }
  
  // If not found by ObjectId, or identifier is not an ObjectId, try username
  if (!user) {
    user = await User.findOne({ username: identifier })
      .select('name username avatarUrl bio averageRating ratingCount')
      .lean();
  }

  if (!user) {
    return null;
  }

  const userDoc = user as {
    _id: { toString: () => string } | string;
    name?: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    averageRating?: number | null;
    ratingCount?: number;
  };
  
  return {
    _id: typeof userDoc._id === 'string' ? userDoc._id : userDoc._id.toString(),
    name: userDoc.name,
    username: userDoc.username,
    avatarUrl: userDoc.avatarUrl,
    bio: userDoc.bio,
    averageRating: userDoc.averageRating ?? null,
    ratingCount: userDoc.ratingCount ?? 0,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const user = await getUserData(userId);

  if (!user) {
    return {
      title: 'User Not Found | DiscNest',
    };
  }

  const displayName = user.name || user.username || 'User';
  const ratingText = user.averageRating
    ? `⭐ ${user.averageRating.toFixed(1)} (${user.ratingCount} ${user.ratingCount === 1 ? 'review' : 'reviews'})`
    : 'No ratings yet';

  return {
    title: `${displayName} - Reviews | DiscNest`,
    description: user.bio || `${displayName}'s seller ratings and reviews. ${ratingText}`,
    openGraph: {
      title: `${displayName} - Reviews`,
      description: user.bio || `${displayName}'s seller ratings and reviews. ${ratingText}`,
      type: 'profile',
      ...(user.avatarUrl && { images: [{ url: user.avatarUrl }] }),
    },
  };
}

export default async function UserReviewsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getUserData(userId);

  if (!user) {
    notFound();
  }

  // Use the actual user ID from the database (not the identifier from URL)
  return <UserReviewsClient userId={user._id} initialUser={user} />;
}

