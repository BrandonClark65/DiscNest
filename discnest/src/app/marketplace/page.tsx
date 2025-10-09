'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateListingForm from '@/components/CreateListingForm';
import type { Listing } from '@/types/listing';

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [radius, setRadius] = useState(25); // miles
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // Example: get approximate user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      fetchListings(pos.coords.latitude, pos.coords.longitude, radius);
    });
  }, [radius]);

  async function fetchListings(lat: number, lng: number, r: number) {
    const res = await fetch(`/api/listings?lat=${lat}&lng=${lng}&radius=${r}`);
    const data = await res.json();
    setListings(data);
  }

  async function handleMessageSeller(listingId: string, sellerId: string) {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, recipientId: sellerId }),
    });
    const thread = await res.json();
    router.push(`/messages/${thread._id}`);
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Disc Marketplace</h1>

        <div className="flex gap-2">
          <button
            onClick={() => router.push('/messages')}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            Messages
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            + Create Listing
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label className="font-medium">Search radius:</label>
        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
        <span>{radius} miles</span>
      </div>

      {isCreating && (
        <div className="border rounded p-4 mb-6 bg-gray-50">
          <CreateListingForm onClose={() => setIsCreating(false)} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <div
            key={listing._id}
            className="border rounded-lg p-3 shadow hover:shadow-md transition"
          >
            <img
              src={listing.imageUrls?.[0] || '/placeholder.png'}
              alt={listing.title}
              className="w-full h-48 object-cover rounded"
            />
            <h2 className="text-lg font-medium mt-2">{listing.title}</h2>
            <p className="text-sm text-gray-600">{listing.brand}</p>
            <p className="text-sm text-gray-500">{listing.condition}</p>
            <p className="font-semibold mt-1">${listing.price}</p>

            <button
              onClick={() => handleMessageSeller(listing._id, listing.userId)}
              className="w-full mt-2 bg-green-600 text-white py-1.5 rounded hover:bg-green-700"
            >
              Message Seller
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
