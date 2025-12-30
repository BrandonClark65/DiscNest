'use client';

import Image from 'next/image';
import Link from 'next/link';
import MessageSellerButton from '@/components/MessageSellerButton';
import SellerRatingBadge from '@/components/ratings/SellerRatingBadge';

interface SellerInfoProps {
  seller: {
    _id: string;
    name?: string;
    username?: string;
    avatarUrl?: string;
    averageRating?: number | null;
    ratingCount?: number;
  };
  listingId: string;
  className?: string;
}

export default function SellerInfo({ seller, listingId, className = '' }: SellerInfoProps) {
  const sellerName = seller.name || seller.username || 'Seller';
  const userPath = seller.username ? `/user/${seller.username}` : `/user/${seller._id}`;

  return (
    <div className={`border border-[var(--muted)]/30 rounded-lg p-4 bg-[var(--surface)]/50 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        {/* Seller Avatar */}
        {seller.avatarUrl ? (
          <Link href={userPath}>
            <Image
              src={seller.avatarUrl}
              alt={sellerName}
              width={48}
              height={48}
              className="rounded-full hover:opacity-80 transition-opacity"
            />
          </Link>
        ) : (
          <Link href={userPath}>
            <div className="w-12 h-12 rounded-full bg-[var(--muted)]/30 flex items-center justify-center hover:opacity-80 transition-opacity">
              <span className="text-lg font-medium text-[var(--foreground)]/60">
                {sellerName[0].toUpperCase()}
              </span>
            </div>
          </Link>
        )}

        {/* Seller Name and Rating */}
        <div className="flex-1 min-w-0">
          <Link
            href={userPath}
            className="block font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
          >
            {sellerName}
          </Link>
          <SellerRatingBadge
            averageRating={seller.averageRating ?? null}
            ratingCount={seller.ratingCount ?? 0}
            userId={seller._id}
            username={seller.username}
            className="mt-1"
          />
        </div>
      </div>

      {/* Message Seller Button */}
      <MessageSellerButton sellerId={seller._id} listingId={listingId} />
    </div>
  );
}

