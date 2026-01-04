'use client';

import type { Listing, ListingAdmin } from '@/types/listing';
import Image from 'next/image';
import { useState } from 'react';
import GradientButton from '@/components/ui/GradientButton';
import SellerRatingBadge from '@/components/ratings/SellerRatingBadge';

type ListingCardProps = {
  listing: Listing | ListingAdmin;
  isOwner?: boolean;
  onDelete?: () => void;
  onMarkSold?: () => void;
};

export default function ListingCard({
  listing,
  isOwner,
  onDelete,
  onMarkSold,
}: ListingCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const cityState =
    listing.city && listing.state
      ? `${listing.city}, ${listing.state}`
      : listing.city || listing.state || '';

  const imageSrc =
    !imageError && listing.imageUrls?.length
      ? listing.imageUrls[0]
      : '/fallback.jpg';

  return (
    <div
      className={`
        group border border-[var(--muted)]/30 rounded-xl overflow-hidden 
        shadow-sm hover:shadow-lg hover:border-[var(--accent)]/40
        transition-all duration-300 flex flex-col text-[var(--foreground)]
        bg-[var(--surface)]
        dark:bg-[var(--surface)]
        bg-[color-mix(in srgb, var(--surface) 85%, var(--foreground) 5%)]  /* ✨ Light mode: a bit darker */
      `}
    >
      {/* ---------- IMAGE ---------- */}
      <div className="relative w-full aspect-[4/3] bg-[var(--muted)]/10 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[var(--muted)]/20 animate-pulse rounded-none" />
        )}

        <Image
          src={imageSrc}
          alt={`${listing.title} - ${listing.brand || ''} ${listing.type || 'disc golf disc'}${listing.listingType !== 'group' && listing.condition ? ` in ${listing.condition} condition` : ''}${listing.listingType !== 'group' && listing.price !== undefined ? ` for $${listing.price.toFixed(2)}` : ''}`}
          fill
          priority={false}
          className={`object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          sizes="(max-width: 768px) 100vw, 25vw"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />

        {/* Sold overlay */}
        {listing.sold && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white text-lg font-semibold uppercase tracking-wide drop-shadow">
              Sold
            </span>
          </div>
        )}
      </div>

      {/* ---------- DETAILS ---------- */}
      <div className="flex flex-col flex-1 p-4 space-y-1.5">
        <h3
          className="text-base sm:text-lg font-bold line-clamp-1 
                     text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors"
        >
          {listing.title}
        </h3>

        {listing.listingType !== 'group' ? (
          <>
            <p className="text-sm text-[var(--foreground)]/70 line-clamp-1">
              {listing.brand ? `${listing.brand}${listing.condition ? ` • ${listing.condition}` : ''}` : listing.condition || ''}
            </p>

            {cityState && (
              <p className="text-sm text-[var(--foreground)]/60 line-clamp-1">
                {cityState}
              </p>
            )}

            {listing.type === 'Sell' && (
              <p className="text-base font-semibold mt-1 text-[var(--foreground)]">
                {listing.price !== undefined
                  ? `$${listing.price.toFixed(2)}`
                  : 'Price not listed'}
              </p>
            )}

            {/* Seller Rating */}
            {(() => {
              // Type guard to check if this is ListingAdmin with populated userId
              if ('userId' in listing && typeof listing.userId === 'object' && listing.userId && '_id' in listing.userId) {
                const seller = listing.userId as {
                  _id: string;
                  averageRating?: number | null;
                  ratingCount?: number;
                  username?: string;
                };
                return (
                  <div className="mt-2 mb-3">
                    <SellerRatingBadge
                      averageRating={seller.averageRating ?? null}
                      ratingCount={seller.ratingCount ?? 0}
                      userId={seller._id}
                      username={seller.username}
                      showCount={false}
                    />
                  </div>
                );
              }
              return null;
            })()}
          </>
        ) : (
          <>
            {listing.brand && (
              <p className="text-sm text-[var(--foreground)]/70 line-clamp-1">
                {listing.brand}
              </p>
            )}
            <p className="text-sm text-[var(--foreground)]/60 line-clamp-2 mt-1 mb-3">
              {listing.description || ''}
            </p>
          </>
        )}

        {/* ---------- ACTIONS ---------- */}
        <div className="mt-auto space-y-2 flex flex-col items-center">
          <GradientButton
            label="View Listing"
            href={`/listing/${listing._id}`}
            variant="blueGradient"
            className="w-full"
          />

          {isOwner && !listing.sold && (
            <div className="flex gap-2 justify-center w-full">
              <GradientButton
                label="Sold"
                onClick={onMarkSold}
                variant="accentGradient"
                className="flex-1"
              />
              <GradientButton
                label="Delete"
                onClick={onDelete}
                variant="danger"
                className="flex-1"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
