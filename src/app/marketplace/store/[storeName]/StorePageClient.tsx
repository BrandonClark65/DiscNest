'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Breadcrumbs from '@/components/Breadcrumbs';
import MarketplaceGrid from '@/components/marketplace/MarketplaceGrid';
import type { ListingAdmin } from '@/types/listing';
import { useAnalytics } from '@/lib/useAnalytics';
import { MapPin, Store } from 'lucide-react';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface StorePageClientProps {
  store: {
    _id: string;
    name?: string;
    storeName?: string;
    location?: { coordinates: [number, number] };
    avatarUrl?: string;
    bio?: string;
    city?: string;
    state?: string;
  };
  initialListings: ListingAdmin[];
  initialListingCount: number;
}

export default function StorePageClient({
  store,
  initialListings,
  initialListingCount,
}: StorePageClientProps) {
  const { trackPageView } = useAnalytics();
  const [listings] = useState(initialListings);
  const storeDisplayName = store.name || store.storeName || 'Store';

  // Track page view
  useEffect(() => {
    if (typeof window !== 'undefined') {
      trackPageView(window.location.pathname, 'Store Page');
    }
  }, [trackPageView]);

  return (
    <main className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 text-foreground">
      {/* BREADCRUMBS */}
      <Breadcrumbs
        items={[
          { label: 'Marketplace', href: '/marketplace' },
          { label: storeDisplayName, href: `/marketplace/store/${store.storeName}` },
        ]}
        className="mb-4"
      />

      {/* STORE HEADER */}
      <header className="mb-8">
        <div className="bg-[var(--surface)] border border-[var(--muted)]/30 rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* Store Avatar */}
            {store.avatarUrl ? (
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-[var(--primary)] flex-shrink-0">
                <Image
                  src={store.avatarUrl}
                  alt={`${storeDisplayName} store logo`}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
                <Store className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--primary)]" />
              </div>
            )}

            {/* Store Info */}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] bg-clip-text text-transparent">
                {storeDisplayName}
              </h1>
              {store.bio && (
                <p className="text-[var(--foreground)]/80 mb-4 leading-relaxed">
                  {store.bio}
                </p>
              )}
              {(store.city || store.state) && (
                <div className="flex items-center gap-2 text-[var(--foreground)]/70">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {store.city || ''}
                    {store.city && store.state ? ', ' : ''}
                    {store.state || ''}
                  </span>
                </div>
              )}
              <p className="mt-4 text-sm text-[var(--foreground)]/60">
                {initialListingCount} active listing{initialListingCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* MAP */}
      {store.location?.coordinates && (
        <section className="mb-10" aria-label="Store location map">
          <div className="h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden shadow-lg border border-[var(--muted)]/20">
            <Map
              listings={listings.filter((l) => l.location?.coordinates)}
              zoom={13}
              showExactLocations={true}
            />
          </div>
        </section>
      )}

      {/* LISTINGS GRID */}
      <section aria-label="Store listings">
        {listings.length === 0 ? (
          <div className="text-center py-12 text-[var(--foreground)]/60">
            <p className="text-lg">No active listings at this time.</p>
            <p className="text-sm mt-2">Check back soon for new disc golf discs!</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6">Available Discs</h2>
            <MarketplaceGrid
              listings={listings}
              loading={false}
              activeTab="market"
              myListingsTab="active"
              isOwner={() => false}
              onDelete={() => {}}
              onMarkSold={() => {}}
            />
          </>
        )}
      </section>
    </main>
  );
}

