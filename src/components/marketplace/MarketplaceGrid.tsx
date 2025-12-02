'use client';

import dynamic from 'next/dynamic';
import type { Listing } from '@/types/listing';

const ListingCard = dynamic(() => import('@/components/ListingCard'), { ssr: false });

type Props = {
  listings: Listing[];
  loading: boolean;
  activeTab: 'market' | 'myListings';
  myListingsTab: 'active' | 'sold';
  isOwner: (id: any) => boolean;
  onDelete: (id: string) => void;
  onMarkSold: (id: string) => void;
};

export default function MarketplaceGrid({
  listings,
  loading,
  activeTab,
  myListingsTab,
  isOwner,
  onDelete,
  onMarkSold,
}: Props) {
  if (loading) {
    return (
      <p className="text-foreground/60 text-center italic py-10">
        Loading listings...
      </p>
    );
  }

  if (listings.length === 0) {
    const message =
      activeTab === 'market'
        ? 'No listings found.'
        : myListingsTab === 'sold'
        ? 'No sold listings yet.'
        : 'No active listings yet.';
    return (
      <p className="text-foreground/60 italic text-center py-10">{message}</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
      {listings.map((listing) => (
        <ListingCard
          key={listing._id}
          listing={listing}
          isOwner={isOwner(listing.userId)}
          onDelete={() => onDelete(listing._id)}
          onMarkSold={() => onMarkSold(listing._id)}
        />
      ))}
    </div>
  );
}
