'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateListingForm from '@/components/CreateListingForm';
import ListingCard from '@/components/ListingCard';
import type { Listing } from '@/types/listing';
import { useSession } from 'next-auth/react';

export default function MarketplacePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [marketListings, setMarketListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [radius, setRadius] = useState(25);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'market' | 'myListings'>('market');
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchListings(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        console.error('Location error:', err);
        fetchListings(0, 0);
      }
    );
  }, [activeTab, radius, userId]);

  async function fetchListings(lat: number, lng: number) {
    try {
      let url = `/api/listings?`;
      if (activeTab === 'market') {
        url += `lat=${lat}&lng=${lng}&radius=${radius}&excludeUserId=${userId}`;
      } else {
        url += `userId=${userId}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (activeTab === 'market') setMarketListings(data);
      else setMyListings(data);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  }

  // --- Delete a listing ---
  async function handleDelete(listingId: string) {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
      if (res.status === 401) return alert('You must be logged in to delete this listing.');
      if (res.status === 403) return alert('You are not allowed to delete this listing.');
      if (!res.ok) throw new Error('Failed to delete listing');

      setMyListings((prev) => prev.filter((l) => l._id !== listingId));
    } catch (err) {
      console.error(err);
      alert('Error deleting listing.');
    }
  }

  // --- Mark as sold ---
  async function handleMarkSold(listingId: string) {
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'markSold' })
        });
      if (res.status === 401) return alert('You must be logged in to mark this listing as sold.');
      if (res.status === 403) return alert('You are not allowed to mark this listing as sold.');
      if (!res.ok) throw new Error('Failed to mark as sold');

      setMyListings((prev) =>
        prev.map((l) => (l._id === listingId ? { ...l, sold: true } : l))
      );
    } catch (err) {
      console.error(err);
      alert('Error marking listing as sold.');
    }
  }


  function isOwner(listingUserId: string | { _id: string }, sessionUserId: string) {
    if (typeof listingUserId === 'string') return listingUserId === sessionUserId;
    return listingUserId._id === sessionUserId;
  }


  const listingsToShow = activeTab === 'market' ? marketListings : myListings;

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

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab('market')}
          className={`px-3 py-1 rounded 
                    ${activeTab === 'market' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}
                    transition-colors duration-150`}
        >
          Marketplace
        </button>

        <button
          onClick={() => setActiveTab('myListings')}
          className={`px-3 py-1 rounded 
                    ${activeTab === 'myListings' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}
                    transition-colors duration-150`}
        >
          My Listings
        </button>
      </div>

      {/* Radius Filter */}
      {activeTab === 'market' && (
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
      )}

      {/* Create Listing Form */}
      {isCreating && session?.user && (
        <div className="border rounded p-4 mb-6 bg-gray-50">
          <CreateListingForm user={session.user} onClose={() => setIsCreating(false)} />
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <p>Loading listings...</p>
      ) : listingsToShow.length === 0 ? (
        <p className="text-gray-500 italic">
          {activeTab === 'market' ? 'No listings found in this area.' : 'You have no listings yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listingsToShow.map((listing) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              isOwner={isOwner(listing.userId, userId!)}
              onDelete={() => handleDelete(listing._id)}
              onMarkSold={() => handleMarkSold(listing._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
