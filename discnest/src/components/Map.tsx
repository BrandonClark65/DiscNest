'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Popup, Circle, useMap } from 'react-leaflet';
import type { Listing } from '@/types/listing';
import 'leaflet/dist/leaflet.css';

// ---------- Helper ----------
function SetViewOnCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

type MapProps = {
  listings?: Listing[];
  singleListing?: Listing;
  zoom?: number;
};

export default function Map({ listings = [], singleListing, zoom = 13 }: MapProps) {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // ✅ Always call this
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
  }, []);

  // ✅ Always call this second useEffect, but guard inside
  useEffect(() => {
    if (!mounted || center) return;

    if (singleListing?.location?.coordinates) {
      const [lng, lat] = singleListing.location.coordinates;
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
            setCenter([37.7749, -122.4194]);
          }
          setLoading(false);
        }
      );
    } else {
      setCenter([37.7749, -122.4194]);
      setLoading(false);
    }
  }, [mounted, center, listings, singleListing]);

  // --- Create stable obfuscated marker positions ---
  const obfuscatedMarkers = useMemo(() => {
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
  }, [listings, singleListing]);

  // --- Loading guard ---
  if (loading || !mounted || !center) {
    return (
      <div className="flex items-center justify-center w-full h-full rounded bg-gray-100 text-gray-600">
        Loading map...
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded overflow-hidden relative z-0">
      <MapContainer
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

        {obfuscatedMarkers.map((listing, index) => (
          <Circle
            key={`${listing._id}-${index}`}
            center={[listing.obLat, listing.obLng]}
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
              Price: {listing.price ? `$${listing.price.toFixed(2)}` : 'Not listed'}
            </Popup>
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
}
