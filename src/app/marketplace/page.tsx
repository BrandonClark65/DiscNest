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
import StructuredData from '@/components/StructuredData';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function MarketplacePage() {
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

  const isOwner = (id: any) =>
    (typeof id === 'string' ? id : id?._id) === userId;

  const totalPages = activeTab === 'market' ? marketTotalPages : myTotalPages;
  const currentPage = activeTab === 'market' ? marketPage : myPage;
  const setPage = activeTab === 'market' ? setMarketPage : setMyPage;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';
  
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Disc Golf Marketplace',
    description: 'Buy and sell disc golf discs in our marketplace',
    url: `${baseUrl}/marketplace`,
    numberOfItems: listingsToShow?.length || 0,
  };

  return (
    <>
      <StructuredData data={itemListSchema} id="marketplace-schema" />
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 text-foreground">
      {/* HEADER */}
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

      {/* TABS */}
      <MarketplaceTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        myListingsTab={myListingsTab}
        setMyListingsTab={setMyListingsTab}
        userId={userId}
        includeRequestsTab
      />

      {/* FILTERS */}
      {activeTab === 'market' && (
        <MarketplaceFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          brandFilter={brandFilter}
          setBrandFilter={setBrandFilter}
          conditionFilter={conditionFilter}
          setConditionFilter={setConditionFilter}
        />
      )}

      {/* CREATE LISTING FORM */}
      {isCreatingListing && session?.user && (
        <div className="border border-[var(--muted)]/30 rounded-lg p-5 mb-8 bg-[var(--surface)]/80 shadow-md">
          <CreateListingForm
            user={session.user}
            onClose={() => setIsCreatingListing(false)}
          />
        </div>
      )}

      {/* CREATE REQUEST FORM */}
      {isCreatingRequest && session?.user && (
        <div className="border border-[var(--muted)]/30 rounded-lg p-5 mb-8 bg-[var(--surface)]/80 shadow-md">
          <CreateDiscRequestForm
            user={session.user}
            onClose={() => setIsCreatingRequest(false)}
          />
        </div>
      )}

      {/* MAP */}
      {activeTab === 'market' && (
        <div className="mb-10">
          <div className="h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden shadow-lg border border-[var(--muted)]/20">
            {!userLocation ? (
              <p className="flex items-center justify-center h-full text-foreground/60 italic">
                Loading map...
              </p>
            ) : (
              <Map listings={listingsToShow} />
            )}
          </div>
        </div>
      )}

      {/* REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div className="mt-6">
          <RequestsTab currentUserId={userId} />
        </div>
      )}

      {/* LISTINGS GRID */}
      {activeTab !== 'requests' && (
        <MarketplaceGrid
          listings={listingsToShow}
          loading={loading}
          activeTab={activeTab}
          myListingsTab={myListingsTab}
          isOwner={isOwner}
          onDelete={handleDelete}
          onMarkSold={handleMarkSold}
        />
      )}

      {/* PAGINATION */}
      {activeTab !== 'requests' && (
        <MarketplacePagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={(p) => setPage(p)}
        />
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
        >
          +
        </button>
      )}
    </div>
    </>
  );
}
