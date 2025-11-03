'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import CreateListingForm from '@/components/CreateListingForm';
import type { Listing } from '@/types/listing';
import { DiscBrands } from '@/app/constants/discData';
import GradientButton from '@/components/ui/GradientButton';
import { MessageCircle, PlusCircle } from 'lucide-react';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });
const ListingCard = dynamic(() => import('@/components/ListingCard'), { ssr: false });

export default function MarketplacePage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();

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
  const [marketPage, setMarketPage] = useState(1);
  const [marketTotalPages, setMarketTotalPages] = useState(1);
  const [myPage, setMyPage] = useState(1);
  const [myTotalPages, setMyTotalPages] = useState(1);

  // ---- LOCATION ----
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(null)
    );
  }, []);

  // ---- FETCH HELPERS ----
  const fetchListings = async (mode: 'marketplace' | 'myListings', pageToFetch = 1) => {
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
        if (userId) url += `&excludeUserId=${userId}`;
      } else if (mode === 'myListings' && userId) {
        url += `&userId=${userId}`;
      }

      const res = await fetch(url);
      const data: { listings: Listing[]; totalCount: number } = await res.json();

      const valid = (data.listings || []).filter(
        (l) => l && l._id && l.title && l.location?.coordinates?.length === 2
      );

      const totalPages = Math.ceil(
        (data.totalCount || valid.length) / (mode === 'marketplace' ? 20 : 100)
      );

      return { listings: valid, totalPages };
    } catch {
      return { listings: [], totalPages: 1 };
    } finally {
      setLoading(false);
    }
  };

  // ---- LOAD MARKET ----
  useEffect(() => {
    if (activeTab !== 'market' || status === 'loading') return;
    const load = async () => {
      const { listings, totalPages } = await fetchListings('marketplace', marketPage);
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
    load();
  }, [activeTab, userLocation, searchQuery, brandFilter, conditionFilter, marketPage, userId, status]);

  // ---- LOAD MY LISTINGS ----
  useEffect(() => {
    if (activeTab !== 'myListings' || !userId) return;
    const load = async () => {
      const { listings, totalPages } = await fetchListings('myListings', myPage);
      setMyListings(listings);
      setMyTotalPages(totalPages);
    };
    load();
  }, [activeTab, userId, myListingsTab, myPage]);

  useEffect(() => setMarketPage(1), [searchQuery, brandFilter, conditionFilter]);
  useEffect(() => window.scrollTo({ top: 0, behavior: 'smooth' }), [marketPage, myPage]);

  // ---- ACTIONS ----
  const handleLoginRequired = (msg: string) => alert(`Log in to ${msg}`);

  const handleDelete = async (id: string) => {
    if (!userId) return handleLoginRequired('delete listings');
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
    if (res.ok) setMyListings((prev) => prev.filter((l) => l._id !== id));
  };

  const handleMarkSold = async (id: string) => {
    if (!userId) return handleLoginRequired('mark listings as sold');
    const res = await fetch(`/api/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markSold' }),
    });
    if (res.ok)
      setMyListings((prev) => prev.map((l) => (l._id === id ? { ...l, sold: true } : l)));
  };

  const isOwner = (id: any) => (typeof id === 'string' ? id : id?._id) === userId;

  // ---- LISTINGS ----
  const listingsToShow =
    activeTab === 'market'
      ? marketListings
      : myListingsTab === 'active'
      ? myListings.filter((l) => !l.sold)
      : myListings.filter((l) => l.sold);

  const currentPage = activeTab === 'market' ? marketPage : myPage;
  const totalPages = activeTab === 'market' ? marketTotalPages : myTotalPages;
  const setPage = activeTab === 'market' ? setMarketPage : setMyPage;

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 text-foreground">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] drop-shadow-md">
          Disc Marketplace
        </h1>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <GradientButton
            label="Messages"
            href="/messages"
            icon={<MessageCircle className="w-5 h-5" />}
            variant="blueGradient"
          />
          <GradientButton
            label="Create Listing"
            onClick={() => setIsCreating(true)}
            icon={<PlusCircle className="w-5 h-5" />}
            variant="accentGradient"
          />
        </div>
      </header>

      {/* TABS */}
      <div className="flex justify-center sm:justify-start border-b border-[var(--muted)]/30 mb-6">
        {['market', 'myListings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm sm:text-base font-semibold transition-colors duration-200 ${
              activeTab === tab
                ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                : 'text-foreground/60 hover:text-[var(--primary)]'
            }`}
          >
            {tab === 'market' ? 'Marketplace' : 'My Listings'}
          </button>
        ))}
      </div>

      {/* My Listings subtabs */}
      {activeTab === 'myListings' && userId && (
        <div className="flex gap-3 mb-6 ml-2">
          <GradientButton
            label="Active"
            onClick={() => setMyListingsTab('active')}
            variant={myListingsTab === 'active' ? 'blueGradient' : 'muted'}
            className="px-4 py-2 text-sm"
          />
          <GradientButton
            label="Sold"
            onClick={() => setMyListingsTab('sold')}
            variant={myListingsTab === 'sold' ? 'accent' : 'muted'}
            className="px-4 py-2 text-sm"
          />
        </div>
      )}

      {/* Filters */}
      {activeTab === 'market' && (
        <div className="hidden md:flex gap-4 items-center mb-8">
          <input
            type="text"
            placeholder="Search discs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-[var(--muted)]/40 bg-[var(--surface)] rounded-lg px-3 py-2 w-1/3 text-foreground focus:ring-2 focus:ring-[var(--primary)]/40"
          />
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="border border-[var(--muted)]/40 bg-[var(--surface)] rounded-lg px-3 py-2 w-1/4 text-foreground focus:ring-2 focus:ring-[var(--primary)]/40"
          >
            <option value="">All Brands</option>
            {DiscBrands.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="border border-[var(--muted)]/40 bg-[var(--surface)] rounded-lg px-3 py-2 w-1/4 text-foreground focus:ring-2 focus:ring-[var(--primary)]/40"
          >
            <option value="">Condition</option>
            <option>New</option>
            <option>Like New</option>
            <option>Used</option>
            <option>Worn</option>
          </select>
        </div>
      )}

      {/* Create Listing Form */}
      {isCreating && session?.user && (
        <div className="border border-[var(--muted)]/30 rounded-lg p-5 mb-8 bg-[var(--surface)]/80 shadow-md">
          <CreateListingForm user={session.user} onClose={() => setIsCreating(false)} />
        </div>
      )}

      {/* Map */}
      {activeTab === 'market' && (
        <div className="mb-10">
          <div className="h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden shadow-lg border border-[var(--muted)]/20">
            {!userLocation ? (
              <p className="flex items-center justify-center h-full text-foreground/60 italic">
                Loading map...
              </p>
            ) : (
              <Map listings={marketListings} />
            )}
          </div>
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <p className="text-foreground/60 text-center italic py-10">Loading listings...</p>
      ) : listingsToShow.length === 0 ? (
        <p className="text-foreground/60 italic text-center py-10">
          {activeTab === 'market'
            ? 'No listings found.'
            : myListingsTab === 'sold'
            ? 'No sold listings yet.'
            : 'No active listings yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {listingsToShow.map((listing) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              isOwner={isOwner(listing.userId)}
              onDelete={() => handleDelete(listing._id)}
              onMarkSold={() => handleMarkSold(listing._id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-10 gap-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                currentPage === p
                  ? 'bg-[var(--primary)] text-[var(--background)] shadow-sm'
                  : 'bg-[var(--surface)] text-foreground/70 hover:bg-[var(--muted)]/20'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Floating Create Button */}
      {!isCreating && (
        <button
          onClick={() =>
            session?.user ? setIsCreating(true) : handleLoginRequired('create a listing')
          }
          className="fixed bottom-20 right-6 bg-[var(--primary)] text-[var(--background)] p-4 rounded-full shadow-lg hover:bg-[var(--primary)]/90 sm:hidden z-50"
        >
          +
        </button>
      )}
    </div>
  );
}
