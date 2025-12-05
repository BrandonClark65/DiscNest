'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ListingAdmin } from '@/types/listing';

export default function PendingListingsTab() {
  const [pendingListings, setPendingListings] = useState<ListingAdmin[]>([]);

  const fetchPendingListings = async () => {
    try {
      const res = await fetch('/api/admin/listings');
      const data = await res.json();
      setPendingListings(data.listings);
    } catch (err) {
      console.error(err);
    }
  };

  const handleModeration = async (listingId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, action }),
      });
      if (!res.ok) throw new Error('Moderation failed');
      setPendingListings((prev) => prev.filter((l) => l._id !== listingId));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPendingListings();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold mb-4 text-center sm:text-left">
        Pending Listings Moderation
      </h2>

      {pendingListings.length === 0 ? (
        <p className="text-gray-600 text-center">No pending listings</p>
      ) : (
        pendingListings.map((listing) => (
          <div key={listing._id} className="border rounded-lg p-4 space-y-4 shadow-sm bg-white">
            <div className="flex flex-col sm:flex-row gap-4">
              {listing.imageUrls?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto sm:w-1/3">
                  {listing.imageUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative w-32 h-32 flex-shrink-0 rounded overflow-hidden shadow-md"
                    >
                      <Image
                        src={url}
                        alt={`${listing.title} - ${listing.brand || ''} ${listing.type || 'disc golf disc'}${listing.condition ? ` in ${listing.condition} condition` : ''}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 160px"
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/fallback.jpg';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex-1 space-y-1 text-sm sm:text-base">
                <p><strong>Title:</strong> {listing.title}</p>
                <p><strong>User:</strong> {listing.userId?.name} ({listing.userId?.email})</p>
                <p><strong>Brand:</strong> {listing.brand || '-'}</p>
                <p><strong>Plastic:</strong> {listing.plastic || '-'}</p>
                <p><strong>Condition:</strong> {listing.condition}</p>
                <p><strong>Price:</strong> {listing.price ? `$${listing.price.toFixed(2)}` : 'Not listed'}</p>
                <p><strong>Submitted:</strong> {listing.createdAt ? new Date(listing.createdAt).toLocaleString() : '-'}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full sm:w-auto"
                onClick={() => handleModeration(listing._id, 'approve')}
              >
                Approve
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded w-full sm:w-auto"
                onClick={() => handleModeration(listing._id, 'reject')}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
