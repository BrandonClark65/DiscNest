'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateListingForm from '@/components/CreateListingForm';
import ListingCard from '@/components/ListingCard';
import type { Listing } from '@/types/listing';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function MarketplacePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [marketListings, setMarketListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'market' | 'myListings'>('market');
  const [myListingsTab, setMyListingsTab] = useState<'active' | 'sold'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Pagination state for marketplace
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const router = useRouter();

  // --- Fetch user location ---
  useEffect(() => {
    if (!userId) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.error('Location error:', err);
        setUserLocation(null);
      }
    );
  }, [userId]);

  // --- Generic fetch function ---
  const fetchListings = async (
    mode: 'marketplace' | 'myListings',
    pageToFetch = 1
  ): Promise<Listing[]> => {
    if (!userId) return [];

    setLoading(true);
    try {
      let url = `/api/listings?mode=${mode}&excludeUserId=${userId}&page=${pageToFetch}&limit=${
        mode === 'marketplace' ? 20 : 100
      }`;
      if (mode === 'marketplace' && userLocation)
        url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (brandFilter) url += `&brand=${encodeURIComponent(brandFilter)}`;
      if (conditionFilter) url += `&condition=${encodeURIComponent(conditionFilter)}`;

      const res = await fetch(url);
      const data: Listing[] = await res.json();

      // Only keep listings with proper coordinates
      return (data || []).filter(
        (l) =>
          l &&
          typeof l._id === 'string' &&
          l.title &&
          l.location &&
          Array.isArray(l.location.coordinates) &&
          l.location.coordinates.length === 2
      );
    } catch (err) {
      console.error('Error fetching listings:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch marketplace listings ---
  useEffect(() => {
    if (activeTab !== 'market') return;

    const fetchMarket = async () => {
      const data = await fetchListings('marketplace', page);
      if (page === 1) setMarketListings(data);
      else setMarketListings((prev) => [...prev, ...data]);
      setHasMore(data.length === 20);
    };

    fetchMarket();
  }, [activeTab, userId, userLocation, searchQuery, brandFilter, conditionFilter, page]);

  // --- Fetch current user's listings ---
  useEffect(() => {
    if (activeTab !== 'myListings') return;

    const fetchMine = async () => {
      const data = await fetchListings('myListings', 1);
      setMyListings(data);
    };

    fetchMine();
  }, [activeTab, userId, searchQuery, brandFilter, conditionFilter]);

  // --- Reset marketplace page when filters/search changes ---
  useEffect(() => {
    setPage(1);
  }, [searchQuery, brandFilter, conditionFilter]);

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
        body: JSON.stringify({ action: 'markSold' }),
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

  function isOwner(listingUserId: string | { _id?: string } | undefined, sessionUserId: string) {
    if (!listingUserId) return false;
    if (typeof listingUserId === 'string') return listingUserId === sessionUserId;
    return listingUserId._id === sessionUserId;
  }

  // --- Determine listings to show ---
  let listingsToShow: Listing[] = [];
  if (activeTab === 'market') listingsToShow = marketListings;
  else
    listingsToShow =
      myListingsTab === 'active'
        ? myListings.filter((l) => !l.sold)
        : myListings.filter((l) => l.sold);

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
          className={`px-3 py-1 rounded ${
            activeTab === 'market' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          } transition-colors duration-150`}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab('myListings')}
          className={`px-3 py-1 rounded ${
            activeTab === 'myListings'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          } transition-colors duration-150`}
        >
          My Listings
        </button>
      </div>

      {/* Subtabs for My Listings */}
      {activeTab === 'myListings' && (
        <div className="flex gap-2 mb-4 ml-2">
          <button
            onClick={() => setMyListingsTab('active')}
            className={`px-3 py-1 rounded text-sm ${
              myListingsTab === 'active'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            } transition-colors duration-150`}
          >
            Active
          </button>
          <button
            onClick={() => setMyListingsTab('sold')}
            className={`px-3 py-1 rounded text-sm ${
              myListingsTab === 'sold'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            } transition-colors duration-150`}
          >
            Sold
          </button>
        </div>
      )}

      {/* Filters */}
      {activeTab === 'market' && (
        <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="font-medium">Search:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              placeholder="Search discs, brand..."
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-medium">Brand:</label>
            <input
              type="text"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="input"
              placeholder="Brand"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-medium">Condition:</label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="input"
            >
              <option value="">Any</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Used">Used</option>
              <option value="Worn">Worn</option>
            </select>
          </div>
        </div>
      )}

      {/* Create Listing Form */}
      {isCreating && session?.user && (
        <div className="border rounded p-4 mb-6 bg-gray-50">
          <CreateListingForm user={session.user} onClose={() => setIsCreating(false)} />
        </div>
      )}

      {/* Map */}
      {activeTab === 'market' && (
        <div className="mb-6 h-96 flex items-center justify-center">
          {!userLocation ? (
            <p className="text-gray-500 italic">Loading map based on your location...</p>
          ) : (
            <Map listings={marketListings} />
          )}
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <p>Loading listings...</p>
      ) : listingsToShow.length === 0 ? (
        <p className="text-gray-500 italic">
          {activeTab === 'market'
            ? 'No listings found.'
            : myListingsTab === 'sold'
            ? 'No sold listings yet.'
            : 'No active listings yet.'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listingsToShow.map((listing, index) => (
              <ListingCard
                key={`${listing._id}-${index}`}
                listing={listing}
                isOwner={isOwner(listing.userId, userId!)}
                onDelete={() => handleDelete(listing._id)}
                onMarkSold={() => handleMarkSold(listing._id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {hasMore && activeTab === 'market' && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
