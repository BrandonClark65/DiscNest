'use client';

import type { Listing } from '@/types/listing';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type ListingCardProps = {
  listing: Listing;
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
      className="group border rounded-xl overflow-hidden shadow-sm hover:shadow-md 
                 transition-all duration-200 bg-white flex flex-col"
    >
      {/* ---------- IMAGE ---------- */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}

        <Image
          src={imageSrc}
          alt={listing.title}
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
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-lg font-semibold uppercase tracking-wide">
              Sold
            </span>
          </div>
        )}
      </div>

      {/* ---------- DETAILS ---------- */}
      <div className="flex flex-col flex-1 p-4">
        <h3
          className="text-base sm:text-lg font-bold mb-1 text-gray-800 line-clamp-1
                     group-hover:text-blue-600 transition-colors"
        >
          {listing.title}
        </h3>

        <p className="text-sm text-gray-600 mb-1 line-clamp-1">
          {listing.brand} – {listing.condition}
        </p>

        {cityState && (
          <p className="text-sm text-gray-500 mb-2 line-clamp-1">{cityState}</p>
        )}

        <p className="text-base font-semibold mb-3 text-gray-800">
          {listing.price !== undefined
            ? `$${listing.price.toFixed(2)}`
            : 'Price not listed'}
        </p>

        <div className="mt-auto space-y-2">
          <Link href={`/listing/${listing._id}`} className="block">
            <button
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg
                         hover:bg-blue-700 active:bg-blue-800
                         hover:scale-[1.02] active:scale-[0.98]
                         transition duration-150"
            >
              View Listing
            </button>
          </Link>

          {/* ---------- Owner Actions ---------- */}
          {isOwner && !listing.sold && (
            <div className="flex gap-2">
              <button
                onClick={onMarkSold}
                className="flex-1 bg-green-500 text-white py-1 rounded-lg
                           hover:bg-green-600 active:bg-green-700
                           hover:scale-[1.02] active:scale-[0.98]
                           transition duration-150"
              >
                Mark Sold
              </button>

              <button
                onClick={onDelete}
                className="flex-1 bg-red-500 text-white py-1 rounded-lg
                           hover:bg-red-600 active:bg-red-700
                           hover:scale-[1.02] active:scale-[0.98]
                           transition duration-150"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
