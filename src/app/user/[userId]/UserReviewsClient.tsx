'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import UserRating from '@/components/ratings/UserRating';
import RatingsList from '@/components/ratings/RatingsList';
import RatingForm from '@/components/ratings/RatingForm';
import RatingPrompt from '@/components/ratings/RatingPrompt';
import GradientButton from '@/components/ui/GradientButton';
import MessageSellerButton from '@/components/MessageSellerButton';
import Breadcrumbs from '@/components/Breadcrumbs';

interface User {
  _id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  averageRating: number | null;
  ratingCount: number;
}

interface Rating {
  _id: string;
  rating: number;
  review?: string;
  createdAt: string;
  rater: {
    _id: string;
    name?: string;
    username?: string;
    avatarUrl?: string;
  } | null;
}

interface UserReviewsClientProps {
  userId: string;
  initialUser: User;
}

export default function UserReviewsClient({ userId, initialUser }: UserReviewsClientProps) {
  const { data: session } = useSession();
  const [user, setUser] = useState<User>(initialUser);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [canRate, setCanRate] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  const currentUserId = session?.user ? (session.user as { id?: string }).id : undefined;
  const isOwnProfile = currentUserId === userId;

  // Fetch ratings and eligibility
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch ratings
        const ratingsRes = await fetch(`/api/users/${userId}/public?page=${page}&limit=10`);
        if (ratingsRes.ok) {
          const data = await ratingsRes.json();
          setRatings(data.ratings || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setUser((prev) => ({
            ...prev,
            averageRating: data.user.averageRating,
            ratingCount: data.user.ratingCount,
          }));
          setCanRate(data.canRate || false);
        }
      } catch (error) {
        console.error('Failed to fetch ratings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, page]);

  const handleRatingSuccess = () => {
    setShowRatingForm(false);
    // Refresh data
    window.location.reload();
  };

  const displayName = user.name || user.username || 'User';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-[var(--foreground)]">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: displayName, href: `/user/${userId}` },
        ]}
        className="mb-6"
      />

      {/* User Header */}
      <div className="border border-[var(--muted)]/30 rounded-2xl p-6 mb-8 bg-[var(--surface)]/80 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={displayName}
              width={80}
              height={80}
              className="rounded-full"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[var(--muted)]/30 flex items-center justify-center">
              <span className="text-3xl font-medium text-[var(--foreground)]/60">
                {displayName[0].toUpperCase()}
              </span>
            </div>
          )}

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2">
              {displayName}
            </h1>
            {user.bio && (
              <p className="text-[var(--foreground)]/80 mb-3">{user.bio}</p>
            )}
            <UserRating
              averageRating={user.averageRating}
              ratingCount={user.ratingCount}
              size="lg"
            />
          </div>

          {/* Actions */}
          {!isOwnProfile && currentUserId && (
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <MessageSellerButton sellerId={userId} />
              {canRate && !showRatingForm && (
                <GradientButton
                  label="Rate This User"
                  onClick={() => setShowRatingForm(true)}
                  variant="primary"
                  className="w-full sm:w-auto"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rating Prompt */}
      {canRate && !showRatingForm && !isOwnProfile && (
        <div className="mb-6">
          <RatingPrompt
            ratedUserId={userId}
            ratedUserName={displayName}
            role="buyer"
            onRated={handleRatingSuccess}
          />
        </div>
      )}

      {/* Rating Form */}
      {showRatingForm && !isOwnProfile && (
        <div className="border border-[var(--primary)]/30 rounded-lg p-6 mb-8 bg-[var(--surface)]/80">
          <RatingForm
            ratedUserId={userId}
            role="buyer"
            onSuccess={handleRatingSuccess}
            onCancel={() => setShowRatingForm(false)}
          />
        </div>
      )}

      {/* Ratings List */}
      <div className="border border-[var(--muted)]/30 rounded-2xl p-6 bg-[var(--surface)]/80 shadow-md">
        {loading ? (
          <div className="text-center py-8 text-[var(--foreground)]/60">Loading...</div>
        ) : (
          <RatingsList
            ratings={ratings}
            averageRating={user.averageRating}
            ratingCount={user.ratingCount}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}

