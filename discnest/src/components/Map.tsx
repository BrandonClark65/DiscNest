'use client';

import { MapContainer, TileLayer, Popup, Circle, useMap } from 'react-leaflet';
import { useEffect, useState, useMemo } from 'react';
import type { Listing } from '@/types/listing';
import 'leaflet/dist/leaflet.css';

// Helper to set map view safely
function SetViewOnCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center]); // ✅ only rerun when center actually changes
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

  // Determine map center (user or single listing)
  useEffect(() => {
    // Prevent infinite loops if we already have a center
    if (center) return;

    if (!singleListing && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
        (pos) => {
            setCenter([pos.coords.latitude, pos.coords.longitude]);
            setLoading(false);
        },
        () => {
            console.warn('Geolocation blocked or failed, using fallback');
            if (listings.length > 0 && listings[0].location?.coordinates) {
            const [lng, lat] = listings[0].location.coordinates;
            setCenter([lat, lng]);
            } else {
            setCenter([37.7749, -122.4194]); // fallback: SF
            }
            setLoading(false);
        }
        );
    } else if (singleListing?.location?.coordinates) {
        const [lng, lat] = singleListing.location.coordinates;
        setCenter([lat, lng]);
        setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [singleListing?._id, listings.length]);

  // ✅ Stable obfuscation: only computed once per listing
  // ✅ Stable obfuscation: only computed once per listing
    const obfuscatedMarkers = useMemo(() => {
    const offset = 0.01;
    return (singleListing ? [singleListing] : listings)
        .map((listing, index) => {
        if (!listing.location?.coordinates) return null;
        const [lng, lat] = listing.location.coordinates;

        // ✅ Use listing._id if available, else fallback to index
        const idString = typeof listing._id === 'string' ? listing._id : String(index);
        const randomSeed = idString
            .split('')
            .reduce((sum, c) => sum + c.charCodeAt(0), 0);

        const latOffset = ((randomSeed % 100) / 100 - 0.5) * offset;
        const lngOffset = (((randomSeed * 13) % 100) / 100 - 0.5) * offset;

        return {
            ...listing,
            obLat: lat + latOffset,
            obLng: lng + lngOffset,
        };
        })
        .filter(Boolean) as (Listing & { obLat: number; obLng: number })[];
    }, [listings, singleListing]);


  if (loading || !center) {
    return (
      <div className="flex items-center justify-center w-full h-full rounded bg-gray-100 text-gray-600">
        Loading map...
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded overflow-hidden">
      <MapContainer
        key={center.join(',')}
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
            radius={250} // smaller radius
            pathOptions={{
              color: 'rgba(30, 144, 255, 0.7)',
              fillColor: 'rgba(30, 144, 255, 0.4)',
              fillOpacity: 0.5,
            }}
          >
            <Popup>
              <strong>{listing.title}</strong>
              <br />
              {listing.brand ? `Brand: ${listing.brand}` : ''}
              <br />
              Price: ${listing.price?.toFixed(2) || 'N/A'}
            </Popup>
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
}
