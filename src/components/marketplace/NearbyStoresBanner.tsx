'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Store, ChevronRight } from 'lucide-react';

interface Store {
  _id: string;
  name?: string;
  storeName?: string;
  location?: { coordinates: [number, number] };
  avatarUrl?: string;
  bio?: string;
  city?: string;
  state?: string;
  distance?: number;
}

interface NearbyStoresBannerProps {
  userLocation?: { lat: number; lng: number } | null;
}

export default function NearbyStoresBanner({ userLocation }: NearbyStoresBannerProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLocation) {
      setLoading(false);
      return;
    }

    const fetchStores = async () => {
      try {
        const res = await fetch(
          `/api/stores?lat=${userLocation.lat}&lng=${userLocation.lng}&limit=6`
        );
        if (res.ok) {
          const data = await res.json();
          setStores(data.stores || []);
        }
      } catch (error) {
        console.error('Failed to fetch nearby stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [userLocation]);

  // Don't display if loading, no location, or no stores
  if (loading || !userLocation || stores.length === 0) {
    return null;
  }

  return (
    <section className="mb-10" aria-label="Nearby stores">
      <div className="bg-[var(--surface)] border border-[var(--muted)]/30 rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-xl font-bold text-[var(--foreground)]">Nearby Stores</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => {
            const storeDisplayName = store.name || store.storeName || 'Store';
            const distanceText = store.distance
              ? store.distance < 0.1
                ? `${Math.round(store.distance * 5280)} ft away`
                : `${store.distance.toFixed(1)} mi away`
              : '';

            return (
              <Link
                key={store._id}
                href={`/marketplace/store/${store.storeName}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-[var(--muted)]/30 hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/10 transition-all group"
              >
                {/* Store Avatar */}
                {store.avatarUrl ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[var(--muted)]/40 flex-shrink-0">
                    <Image
                      src={store.avatarUrl}
                      alt={`${storeDisplayName} logo`}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
                    <Store className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                )}

                {/* Store Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                    {storeDisplayName}
                  </h3>
                  {distanceText && (
                    <div className="flex items-center gap-1 text-xs text-[var(--foreground)]/60">
                      <MapPin className="w-3 h-3" />
                      <span>{distanceText}</span>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-[var(--foreground)]/40 group-hover:text-[var(--primary)] transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

