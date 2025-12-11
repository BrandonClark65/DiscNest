'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import MarketplaceTabs from '@/components/marketplace/MarketplaceTabs';
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters';
import MarketplaceGrid from '@/components/marketplace/MarketplaceGrid';
import MarketplacePagination from '@/components/marketplace/MarketplacePagination';
import CreateListingForm from '@/components/marketplace/CreateListingForm';
import CreateDiscRequestForm from '@/components/marketplace/CreateDiscRequestForm';
import RequestsTab from '@/components/marketplace/RequestsTab';
import Breadcrumbs from '@/components/Breadcrumbs';
import type { ListingAdmin } from '@/types/listing';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface MarketplaceClientProps {
  initialListings: ListingAdmin[];
  initialTotalCount: number;
}

export default function MarketplaceClient({ 
  initialListings, 
  initialTotalCount 
}: MarketplaceClientProps) {
  const {
    session,
    loading,
    listingsToShow,
    activeTab,
    setActiveTab,
    myListingsTab,
    setMyListingsTab,
    searchQuery,
    setSearchQuery,
    brandFilter,
    setBrandFilter,
    conditionFilter,
    setConditionFilter,
    userLocation,
    marketPage,
    setMarketPage,
    marketTotalPages,
    myPage,
    setMyPage,
    myTotalPages,
    userId,
    setMyListings,
  } = useMarketplaceData();

  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);

  // Use server-fetched listings when on market tab and no filters/search/pagination are active
  // Once user interacts (filters, search, pagination), use client-fetched data
  const hasFilters = searchQuery || brandFilter || conditionFilter || marketPage > 1;
  const displayListings = 
    activeTab === 'market' && 
    !hasFilters &&
    !loading
      ? initialListings
      : listingsToShow;

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

  const isOwner = (id: string | { _id: string } | undefined) =>
    (typeof id === 'string' ? id : id?._id) === userId;

  const totalPages = activeTab === 'market' ? marketTotalPages : myTotalPages;
  const currentPage = activeTab === 'market' ? marketPage : myPage;
  const setPage = activeTab === 'market' ? setMarketPage : setMyPage;

  return (
    <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 text-foreground">
      {/* BREADCRUMBS */}
      <Breadcrumbs items={[{ label: 'Marketplace', href: '/marketplace' }]} className="mb-4" />
      
      {/* HEADER */}
      <header>
        <MarketplaceHeader
          onCreate={() =>
            session?.user
              ? setIsCreatingListing(true)
              : handleLoginRequired('create a listing')
          }
          onCreateRequest={() =>
            session?.user
              ? setIsCreatingRequest(true)
              : handleLoginRequired('create a request')
          }
        />
      </header>

      {/* TABS */}
      <nav aria-label="Marketplace tabs">
        <MarketplaceTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          myListingsTab={myListingsTab}
          setMyListingsTab={setMyListingsTab}
          userId={userId}
          includeRequestsTab
        />
      </nav>

      {/* FILTERS */}
      {activeTab === 'market' && (
        <aside aria-label="Marketplace filters">
          <MarketplaceFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            brandFilter={brandFilter}
            setBrandFilter={setBrandFilter}
            conditionFilter={conditionFilter}
            setConditionFilter={setConditionFilter}
          />
        </aside>
      )}

      {/* CREATE LISTING FORM */}
      {isCreatingListing && session?.user && (
        <div className="border border-[var(--muted)]/30 rounded-lg p-5 mb-8 bg-[var(--surface)]/80 shadow-md">
          <CreateListingForm
            user={{ id: (session.user as { id?: string }).id || '', name: session.user.name || undefined, email: session.user.email || undefined }}
            onClose={() => setIsCreatingListing(false)}
          />
        </div>
      )}

      {/* CREATE REQUEST FORM */}
      {isCreatingRequest && session?.user && (
        <div className="border border-[var(--muted)]/30 rounded-lg p-5 mb-8 bg-[var(--surface)]/80 shadow-md">
          <CreateDiscRequestForm
            user={{ id: (session.user as { id?: string }).id || '', name: session.user.name || undefined, email: session.user.email || undefined }}
            onClose={() => setIsCreatingRequest(false)}
          />
        </div>
      )}

      {/* MAP */}
      {activeTab === 'market' && (
        <section className="mb-10" aria-label="Listings map">
          <div className="h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden shadow-lg border border-[var(--muted)]/20">
            {!userLocation ? (
              <p className="flex items-center justify-center h-full text-foreground/60 italic">
                Loading map...
              </p>
            ) : (
              <Map listings={displayListings} />
            )}
          </div>
        </section>
      )}

      {/* REQUESTS TAB */}
      {activeTab === 'requests' && (
        <section className="mt-6" aria-label="Disc requests">
          <RequestsTab currentUserId={userId} />
        </section>
      )}

      {/* LISTINGS GRID */}
      {activeTab !== 'requests' && (
        <section aria-label="Disc listings">
          {/* Show initial listing count for SEO when no filters */}
          {activeTab === 'market' && !hasFilters && initialListings.length > 0 && (
            <p className="text-center text-muted text-sm mb-4">
              Showing {initialListings.length} of {initialTotalCount} active listings
            </p>
          )}
          <MarketplaceGrid
            listings={displayListings}
            loading={Boolean(loading && (activeTab !== 'market' || hasFilters))}
            activeTab={activeTab}
            myListingsTab={myListingsTab}
            isOwner={isOwner}
            onDelete={handleDelete}
            onMarkSold={handleMarkSold}
          />
        </section>
      )}

      {/* PAGINATION */}
      {activeTab !== 'requests' && (
        <nav aria-label="Listings pagination">
          <MarketplacePagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={(p) => setPage(p)}
          />
        </nav>
      )}

      {/* FLOATING CREATE LISTING BUTTON (mobile only) */}
      {!isCreatingListing && activeTab === 'market' && (
        <button
          onClick={() =>
            session?.user
              ? setIsCreatingListing(true)
              : handleLoginRequired('create a listing')
          }
          className="fixed bottom-20 right-6 bg-[var(--primary)] text-[var(--background)] p-4 rounded-full shadow-lg hover:bg-[var(--primary)]/90 sm:hidden z-50"
          aria-label="Create new listing"
        >
          +
        </button>
      )}
    </main>
  );
}

