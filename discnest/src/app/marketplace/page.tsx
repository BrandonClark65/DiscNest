'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateListingForm from '@/components/CreateListingForm';
import ListingCard from '@/components/ListingCard';
import type { Listing } from '@/types/listing';

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [radius, setRadius] = useState(25);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch listings near user's current location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchListings(pos.coords.latitude, pos.coords.longitude, radius);
      },
      (err) => {
        console.error('Location error:', err);
        // fallback: fetch all listings if no geolocation permission
        fetchListings(0, 0, radius);
      }
    );
  }, [radius]);

  async function fetchListings(lat: number, lng: number, r: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings?lat=${lat}&lng=${lng}&radius=${r}`);
      const data = await res.json();
      setListings(data);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
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

      {/* Radius Filter */}
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

      {/* Create Listing Form */}
      {isCreating && (
        <div className="border rounded p-4 mb-6 bg-gray-50">
          <CreateListingForm onClose={() => setIsCreating(false)} />
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <p>Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500 italic">No listings found in this area.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

