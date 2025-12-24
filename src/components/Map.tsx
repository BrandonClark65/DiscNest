'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Popup, Circle, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Listing } from '@/types/listing';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

function SetViewOnCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

type Store = {
  _id: string;
  name?: string;
  storeName?: string;
  location?: { coordinates: [number, number] };
  avatarUrl?: string;
  bio?: string;
  city?: string;
  state?: string;
};

type MapProps = {
  listings?: Listing[];
  singleListing?: Listing;
  stores?: Store[];
  zoom?: number;
  showExactLocations?: boolean; // If true, show listings as exact markers instead of obfuscated circles
};

export default function Map({ listings = [], singleListing, stores = [], zoom = 13, showExactLocations = false }: MapProps) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  // ✅ Ensure client-side mount before using leaflet
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
    // Delay one tick to prevent appendChild race in Turbopack
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted || center) return;

    if (singleListing?.location?.coordinates) {
      const [lng, lat] = singleListing.location.coordinates;
      setCenter([lat, lng]);
      setLoading(false);
      return;
    }

    // Prefer store location if available
    if (stores.length > 0 && stores[0]?.location?.coordinates) {
      const [lng, lat] = stores[0].location.coordinates;
      setCenter([lat, lng]);
      setLoading(false);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
          setLoading(false);
        },
        () => {
          if (listings[0]?.location?.coordinates) {
            const [lng, lat] = listings[0].location.coordinates;
            setCenter([lat, lng]);
          } else {
            setCenter([37.7749, -122.4194]); // fallback to SF
          }
          setLoading(false);
        }
      );
    } else {
      setCenter([37.7749, -122.4194]);
      setLoading(false);
    }
  }, [mounted, center, listings, singleListing, stores]);

  const obfuscatedMarkers = useMemo(() => {
    if (showExactLocations) {
      // For store listings, show exact locations as markers
      const source = singleListing ? [singleListing] : listings;
      return source
        .filter((listing) => listing.location?.coordinates)
        .map((listing) => {
          const [lng, lat] = listing.location!.coordinates!;
          return { ...listing, exactLat: lat, exactLng: lng };
        }) as (Listing & { exactLat: number; exactLng: number })[];
    }

    // Regular listings: obfuscated circles
    const offset = 0.01;
    const source = singleListing ? [singleListing] : listings;

    return source
      .map((listing, i) => {
        if (!listing.location?.coordinates) return null;
        const [lng, lat] = listing.location.coordinates;
        const idString = typeof listing._id === 'string' ? listing._id : `idx-${i}`;
        const randomSeed = [...idString].reduce((sum, c) => sum + c.charCodeAt(0), 0);
        const latOffset = ((randomSeed % 100) / 100 - 0.5) * offset;
        const lngOffset = (((randomSeed * 13) % 100) / 100 - 0.5) * offset;
        return { ...listing, obLat: lat + latOffset, obLng: lng + lngOffset };
      })
      .filter(Boolean) as (Listing & { obLat: number; obLng: number })[];
  }, [listings, singleListing, showExactLocations]);

  if (loading || !mounted || !center || !ready) {
    return (
      <div className="flex items-center justify-center w-full h-full rounded bg-[var(--surface)] text-[var(--foreground)]/70">
        Loading map...
      </div>
    );
  }

  try {
    return (
      <div className="w-full h-full rounded overflow-hidden relative z-0">
        <MapContainer
          key={center.join(',')} // 🧱 Forces remount cleanly after hot reload
          center={center}
          zoom={zoom}
          scrollWheelZoom
          className="w-full h-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <SetViewOnCenter center={center} />

          {/* Store markers - exact location, different color */}
          {stores.map((store) => {
            if (!store.location?.coordinates) return null;
            const [lng, lat] = store.location.coordinates;
            const storeDisplayName = store.name || store.storeName || 'Store';
            return (
              <Marker
                key={`store-${store._id}`}
                position={[lat, lng]}
                icon={L.divIcon({
                  className: 'store-marker',
                  html: `<div style="
                    background-color: #10b981;
                    width: 24px;
                    height: 24px;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  "></div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
              >
                <Popup>
                  <strong>{storeDisplayName}</strong>
                  <br />
                  {store.city && store.state && (
                    <span>{store.city}, {store.state}<br /></span>
                  )}
                  <a
                    href={`/marketplace/store/${store.storeName}`}
                    style={{ color: '#3b82f6', textDecoration: 'underline' }}
                  >
                    View Store
                  </a>
                </Popup>
              </Marker>
            );
          })}

          {/* Listing markers */}
          {showExactLocations
            ? // Store listings: exact location markers
              obfuscatedMarkers.map((listing, index) => {
                const markerListing = listing as Listing & { exactLat: number; exactLng: number };
                return (
                  <Marker
                    key={`${listing._id}-${index}`}
                    position={[markerListing.exactLat, markerListing.exactLng]}
                    icon={L.divIcon({
                      className: 'listing-marker',
                      html: `<div style="
                        background-color: #3b82f6;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      "></div>`,
                      iconSize: [20, 20],
                      iconAnchor: [10, 10],
                    })}
                  >
                    <Popup>
                      <strong>{listing.title || 'Untitled'}</strong>
                      <br />
                      {listing.brand && <span>Brand: {listing.brand}<br /></span>}
                      Price:{' '}
                      {listing.price ? `$${listing.price.toFixed(2)}` : 'Not listed'}
                      <br />
                      <a
                        href={`/listing/${listing._id}`}
                        style={{ color: '#3b82f6', textDecoration: 'underline' }}
                      >
                        View Listing
                      </a>
                    </Popup>
                  </Marker>
                );
              })
            : // Regular listings: obfuscated, blue circles
              obfuscatedMarkers.map((listing, index) => {
                const circleListing = listing as Listing & { obLat: number; obLng: number };
                return (
                  <Circle
                    key={`${listing._id}-${index}`}
                    center={[circleListing.obLat, circleListing.obLng]}
                    radius={400}
                    pathOptions={{
                      color: '#1d4ed8',
                      fillColor: '#3b82f6',
                      fillOpacity: 0.45,
                      weight: 1,
                    }}
                  >
                    <Popup>
                      <strong>{listing.title || 'Untitled'}</strong>
                      <br />
                      {listing.brand && <span>Brand: {listing.brand}<br /></span>}
                      Price:{' '}
                      {listing.price ? `$${listing.price.toFixed(2)}` : 'Not listed'}
                    </Popup>
                  </Circle>
                );
              })}
        </MapContainer>
      </div>
    );
  } catch (e) {
    console.warn('Map render error:', e);
    return (
      <div className="flex items-center justify-center h-full text-[var(--foreground)]/60 italic">
        Map failed to load.
      </div>
    );
  }
}
