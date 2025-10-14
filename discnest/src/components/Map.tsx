'use client';

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import type { Listing } from '@/types/listing';
import 'leaflet/dist/leaflet.css';

type MapProps = {
  listings?: Listing[];
  singleListing?: Listing;
  zoom?: number;
  center?: { lat: number; lng: number };
};

// Move map center dynamically when user location changes
function SetViewOnCenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], map.getZoom(), { duration: 1 });
    }
  }, [center, map]);
  return null;
}

export default function Map({ listings = [], singleListing, zoom = 13, center }: MapProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for DOM to be available (important for SSR + Leaflet)
    setIsReady(typeof window !== 'undefined');
  }, []);

  if (!isReady || !center) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 italic">
        Loading map...
      </div>
    );
  }

  const markers = singleListing ? [singleListing] : listings;

  // Add gentle randomization to mask exact positions
  const obfuscate = (lat: number, lng: number) => {
    const offset = 0.01; // ~1km radius
    return [lat + (Math.random() - 0.5) * offset, lng + (Math.random() - 0.5) * offset] as [number, number];
  };

  return (
    <MapContainer
      key={`${center.lat}-${center.lng}`} // reinit when center changes
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SetViewOnCenter center={center} />

      {markers.map((listing) => {
        if (!listing.location?.coordinates) return null;
        const [lng, lat] = listing.location.coordinates;
        if (lat === undefined || lng === undefined) return null;
        const [obLat, obLng] = obfuscate(lat, lng);

        return (
          <CircleMarker
            key={listing._id}
            center={[obLat, obLng]}
            radius={8}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.35,
              weight: 1,
            }}
          >
            <Popup>
              <strong>{listing.title}</strong>
              <br />
              {listing.brand ? `Brand: ${listing.brand}` : ''}
              <br />
              Price: ${listing.price?.toFixed(2) || 'N/A'}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
