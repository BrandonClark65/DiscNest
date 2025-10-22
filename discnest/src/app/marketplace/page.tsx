'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import CreateListingForm from '@/components/CreateListingForm';
import type { Listing } from '@/types/listing';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });
const ListingCard = dynamic(() => import('@/components/ListingCard'), { ssr: false });

export default function MarketplacePage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();

  // Listings
  const [marketListings, setMarketListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);

  // UI
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'market' | 'myListings'>('market');
  const [myListingsTab, setMyListingsTab] = useState<'active' | 'sold'>('active');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');

  // Location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Pagination
  const [marketPage, setMarketPage] = useState(1);
  const [marketTotalPages, setMarketTotalPages] = useState(1);
  const [myPage, setMyPage] = useState(1);
  const [myTotalPages, setMyTotalPages] = useState(1);

  // --- Fetch user location ---
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.error('Location error:', err);
        setUserLocation(null);
      }
    );
  }, []);

  // --- Fetch listings ---
  const fetchListings = async (
    mode: 'marketplace' | 'myListings',
    pageToFetch = 1
  ): Promise<{ listings: Listing[]; totalPages: number }> => {
    setLoading(true);
    try {
      let url = `/api/listings?mode=${mode}&page=${pageToFetch}&limit=${
        mode === 'marketplace' ? 20 : 100
      }`;

      if (mode === 'marketplace') {
        if (userLocation) url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        if (brandFilter) url += `&brand=${encodeURIComponent(brandFilter)}`;
        if (conditionFilter) url += `&condition=${encodeURIComponent(conditionFilter)}`;
        if (userId) url += `&excludeUserId=${userId}`; // ✅ only here
      } else if (mode === 'myListings' && userId) {
        url += `&userId=${userId}`; // ✅ correct param for owned listings
      }

      const res = await fetch(url);
      const data: { listings: Listing[]; totalCount: number } = await res.json();

      const validListings = (data.listings || []).filter(
        (l) =>
          l &&
          typeof l._id === 'string' &&
          l.title &&
          l.location &&
          Array.isArray(l.location.coordinates) &&
          l.location.coordinates.length === 2
      );

      const totalPages = Math.ceil(
        (data.totalCount || validListings.length) / (mode === 'marketplace' ? 20 : 100)
      );

      return { listings: validListings, totalPages };
    } catch (err) {
      console.error('Error fetching listings:', err);
      return { listings: [], totalPages: 1 };
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch marketplace listings ---
  useEffect(() => {
    if (activeTab !== 'market') return;
    if (status === 'loading') return;

    const fetchMarket = async () => {
      const { listings, totalPages } = await fetchListings('marketplace', marketPage);

      // ✅ Client-side safety filter: ensure we never show owned listings
      const filtered = userId
        ? listings.filter((l) => {
            const ownerId =
              typeof l.userId === 'string'
                ? l.userId
                : String((l.userId as any)?._id || '');
            return ownerId !== userId;
          })
        : listings;



      setMarketListings(filtered);
      setMarketTotalPages(totalPages);
    };

    fetchMarket();
  }, [
    activeTab,
    userLocation,
    searchQuery,
    brandFilter,
    conditionFilter,
    marketPage,
    userId,
    status,
  ]);

  // --- Fetch user's listings ---
  useEffect(() => {
    if (activeTab !== 'myListings' || !userId) return;

    const fetchMine = async () => {
      const { listings, totalPages } = await fetchListings('myListings', myPage);
      setMyListings(listings);
      setMyTotalPages(totalPages);
    };
    fetchMine();
  }, [activeTab, userId, myListingsTab, myPage]);

  // --- Reset marketplace page when filters/search changes ---
  useEffect(() => {
    setMarketPage(1);
  }, [searchQuery, brandFilter, conditionFilter]);

  // --- Smooth scroll on pagination change ---
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [marketPage, myPage]);

  const handleLoginRequired = (action: string) => {
    alert(`Log in to ${action}`);
  };

  const handleDelete = async (listingId: string) => {
    if (!userId) return handleLoginRequired('delete listings');
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete listing');
      setMyListings((prev) => prev.filter((l) => l._id !== listingId));
    } catch (err) {
      console.error(err);
      alert('Error deleting listing.');
    }
  };

  const handleMarkSold = async (listingId: string) => {
    if (!userId) return handleLoginRequired('mark listings as sold');

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markSold' }),
      });
      if (!res.ok) throw new Error('Failed to mark as sold');

      setMyListings((prev) =>
        prev.map((l) => (l._id === listingId ? { ...l, sold: true } : l))
      );
    } catch (err) {
      console.error(err);
      alert('Error marking listing as sold.');
    }
  };

  const isOwner = (listingUserId: string | { _id?: string } | undefined) => {
    if (!listingUserId || !userId) return false;
    if (typeof listingUserId === 'string') return listingUserId === userId;
    return listingUserId._id === userId;
  };

  const listingsToShow =
    activeTab === 'market'
      ? marketListings
      : !userId
      ? []
      : myListingsTab === 'active'
      ? myListings.filter((l) => !l.sold)
      : myListings.filter((l) => l.sold);

  const currentPage = activeTab === 'market' ? marketPage : myPage;
  const currentTotalPages = activeTab === 'market' ? marketTotalPages : myTotalPages;
  const setCurrentPage = activeTab === 'market' ? setMarketPage : setMyPage;

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ---------- HEADER ---------- */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Disc Marketplace</h1>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() =>
              session?.user ? router.push('/messages') : handleLoginRequired('view messages')
            }
            className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm sm:text-base transition"
          >
            Messages
          </button>
          <button
            onClick={() =>
              session?.user ? setIsCreating(true) : handleLoginRequired('create a listing')
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base transition"
          >
            + Create Listing
          </button>
        </div>
      </header>

      {/* ---------- TABS ---------- */}
      <div className="flex justify-center sm:justify-start border-b border-gray-200 mb-6">
        {['market', 'myListings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'market' | 'myListings')}
            className={`px-4 py-2 text-sm sm:text-base font-medium border-b-2 transition-colors duration-200 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'market' ? 'Marketplace' : 'My Listings'}
          </button>
        ))}
      </div>

      {/* ---------- My Listings subtabs ---------- */}
      {activeTab === 'myListings' && userId && (
        <div className="flex gap-2 mb-4 ml-2">
          {['active', 'sold'].map((tab) => (
            <button
              key={tab}
              onClick={() => setMyListingsTab(tab as 'active' | 'sold')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                myListingsTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              } transition`}
            >
              {tab === 'active' ? 'Active' : 'Sold'}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'myListings' && !userId && (
        <p className="text-gray-500 italic mb-4">Log in to view your listings.</p>
      )}

      {/* ---------- FILTERS (desktop) ---------- */}
      {activeTab === 'market' && (
        <div className="hidden md:flex gap-4 items-center mb-6">
          <input
            type="text"
            placeholder="Search discs, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-1/3"
          />
          <input
            type="text"
            placeholder="Brand"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-1/4"
          />
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-1/4"
          >
            <option value="">Condition</option>
            <option>New</option>
            <option>Like New</option>
            <option>Used</option>
            <option>Worn</option>
          </select>
        </div>
      )}

      {/* ---------- FILTERS (mobile collapsible) ---------- */}
      {activeTab === 'market' && (
        <details className="md:hidden mb-6">
          <summary className="cursor-pointer bg-gray-100 px-3 py-2 rounded-lg font-medium">
            Filters
          </summary>
          <div className="flex flex-col gap-3 mt-3">
            <input
              type="text"
              placeholder="Search discs, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="text"
              placeholder="Brand"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Condition</option>
              <option>New</option>
              <option>Like New</option>
              <option>Used</option>
              <option>Worn</option>
            </select>
          </div>
        </details>
      )}

      {/* ---------- CREATE LISTING FORM ---------- */}
      {isCreating && session?.user && (
        <div className="border rounded-lg p-4 mb-6 bg-gray-50 shadow-sm">
          <CreateListingForm user={session.user} onClose={() => setIsCreating(false)} />
        </div>
      )}

      {/* ---------- MAP SECTION ---------- */}
      {activeTab === 'market' && (
        <div className="mb-8">
          <div className="h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden shadow">
            {!userLocation ? (
              <p className="text-gray-500 italic flex items-center justify-center h-full">
                Loading map based on your location...
              </p>
            ) : (
              <Map listings={marketListings} />
            )}
          </div>
        </div>
      )}

      {/* ---------- LISTINGS GRID ---------- */}
      {loading ? (
        <p className="text-gray-500 text-center italic py-10">Loading listings...</p>
      ) : listingsToShow.length === 0 ? (
        <p className="text-gray-500 italic text-center py-10">
          {activeTab === 'market'
            ? 'No listings found.'
            : !userId
            ? ''
            : myListingsTab === 'sold'
            ? 'No sold listings yet.'
            : 'No active listings yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {listingsToShow.map((listing, index) => (
            <ListingCard
              key={`${listing._id}-${index}`}
              listing={listing}
              isOwner={isOwner(listing.userId)}
              onDelete={() => handleDelete(listing._id)}
              onMarkSold={() => handleMarkSold(listing._id)}
            />
          ))}
        </div>
      )}

      {/* ---------- PAGINATION ---------- */}
      {currentTotalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2 flex-wrap">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: currentTotalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`px-3 py-1 rounded ${
                currentPage === p ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(currentTotalPages, p + 1))}
            disabled={currentPage === currentTotalPages}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* ---------- FLOATING CREATE BUTTON (mobile only) ---------- */}
      {!isCreating && (
        <button
          onClick={() =>
            session?.user ? setIsCreating(true) : handleLoginRequired('create a listing')
          }
          className="fixed bottom-20 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 sm:hidden z-50"
        >
          +
        </button>
      )}
    </div>
  );
}
