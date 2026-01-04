'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
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

interface ClickableMapProps {
  location: { lat: number; lng: number } | null;
  onLocationClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationClick }: { onLocationClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationClick(lat, lng);
    },
  });
  return null;
}

export default function ClickableMap({ location, onLocationClick }: ClickableMapProps) {
  const [mounted, setMounted] = useState(false);
  const [center, setCenter] = useState<[number, number]>([37.7749, -122.4194]); // Default to SF

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
      if (location) {
        setCenter([location.lat, location.lng]);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
          () => {}
        );
      }
    }
  }, [location]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--surface)] text-[var(--foreground)]/70">
        Loading map...
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={location ? 15 : 10}
      scrollWheelZoom
      className="w-full h-full"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onLocationClick={onLocationClick} />
      {location && (
        <Marker
          position={[location.lat, location.lng]}
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
        />
      )}
    </MapContainer>
  );
}

