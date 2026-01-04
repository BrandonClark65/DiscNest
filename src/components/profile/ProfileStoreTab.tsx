'use client';

import { useState, useEffect } from 'react';
import type { z } from 'zod';
import { editableProfileSchema } from '@/lib/validation/userSchema';
import { MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the clickable map component to avoid SSR issues
const ClickableMap = dynamic(
  () => import('./ClickableMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-[var(--surface)] text-[var(--foreground)]/70">
        Loading map...
      </div>
    ),
  }
);

type EditableUserFields = z.infer<typeof editableProfileSchema>;

type Props = {
  profile: Partial<EditableUserFields> & { role?: string };
  setProfile: React.Dispatch<React.SetStateAction<Partial<EditableUserFields> & { role?: string }>>;
  userRole?: string;
};

export default function ProfileStoreTab({ profile, setProfile, userRole }: Props) {
  const [isStore, setIsStore] = useState(userRole === 'store');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Initialize location from profile if available
  useEffect(() => {
    if (profile.location?.coordinates && Array.isArray(profile.location.coordinates) && profile.location.coordinates.length === 2) {
      const [lng, lat] = profile.location.coordinates;
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        setLocation({ lat, lng });
      }
    }
  }, [profile.location]);

  // Get current location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleLocationSet(latitude, longitude);
      },
      (error) => {
        setLocationError('Failed to get your location. Please try again.');
        console.error('Geolocation error:', error);
      }
    );
  };

  // Handle location being set (from map click or geolocation)
  const handleLocationSet = (lat: number, lng: number) => {
    setLocation({ lat, lng });
    setLocationError(null);
    setProfile({
      ...profile,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    });
  };

  // Handle manual coordinate input
  const handleManualLocation = (field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    if (field === 'lat') {
      const newLocation = { lat: numValue, lng: location?.lng || 0 };
      if (location?.lng !== undefined) {
        handleLocationSet(newLocation.lat, newLocation.lng);
      } else {
        setLocation(newLocation);
      }
    } else {
      const newLocation = { lat: location?.lat || 0, lng: numValue };
      if (location?.lat !== undefined) {
        handleLocationSet(newLocation.lat, newLocation.lng);
      } else {
        setLocation(newLocation);
      }
    }
  };

  // Handle role change
  const handleRoleChange = (newRole: 'user' | 'store') => {
    setIsStore(newRole === 'store');
    setProfile({
      ...profile,
      role: newRole,
    });
    if (newRole === 'store' && !profile.storeName) {
      // Suggest a store name based on username or name
      const suggestedName = profile.username || profile.name || 'my-store';
      setProfile({
        ...profile,
        role: newRole,
        storeName: suggestedName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <div>
        <label className="block font-medium mb-2">Account Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="role"
              value="user"
              checked={!isStore}
              onChange={() => handleRoleChange('user')}
              className="w-4 h-4"
            />
            <span>Regular User</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="role"
              value="store"
              checked={isStore}
              onChange={() => handleRoleChange('store')}
              className="w-4 h-4"
            />
            <span>Store</span>
          </label>
        </div>
        <p className="text-sm text-[var(--foreground)]/60 mt-1">
          {isStore
            ? 'Store accounts can create store pages and appear on the marketplace map.'
            : 'Regular users can buy and sell discs.'}
        </p>
      </div>

      {/* Store-specific fields */}
      {isStore && (
        <>
          {/* Store Name */}
          <div>
            <label htmlFor="storeName" className="block font-medium mb-1">
              Store Name (URL Slug)
            </label>
            <input
              id="storeName"
              type="text"
              value={profile.storeName ?? ''}
              onChange={(e) => {
                // Normalize to lowercase, alphanumeric with hyphens
                const normalized = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, '-')
                  .replace(/-+/g, '-')
                  .replace(/^-|-$/g, '');
                setProfile({ ...profile, storeName: normalized });
              }}
              placeholder="my-store-name"
              className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-[var(--accent)]/40"
            />
            <p className="text-xs text-[var(--foreground)]/60 mt-1">
              This will be used in your store URL: /marketplace/store/{profile.storeName || 'your-store-name'}
            </p>
            {profile.storeName && (
              <p className="text-xs text-[var(--foreground)]/60 mt-1">
                Your store page: <span className="text-[var(--primary)]">/marketplace/store/{profile.storeName}</span>
              </p>
            )}
          </div>

          {/* Store Location */}
          <div>
            <label className="block font-medium mb-2">Store Location</label>
            <p className="text-sm text-[var(--foreground)]/60 mb-3">
              Your store location will appear on the marketplace map. This is required for stores.
            </p>
            
            <button
              type="button"
              onClick={handleGetLocation}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--background)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors mb-4"
            >
              <MapPin className="w-4 h-4" />
              {location ? 'Update Location' : 'Set Store Location'}
            </button>

            {locationError && (
              <p className="text-sm text-red-500 mb-2">{locationError}</p>
            )}

            {location && location.lat !== undefined && location.lng !== undefined && (
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm text-[var(--foreground)]/80 mb-2">
                    Click on the map to set your store location, or edit coordinates manually:
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-[var(--foreground)]/60 mb-1 block">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={location.lat}
                        onChange={(e) => handleManualLocation('lat', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-[var(--background)] border border-[var(--muted)]/40 rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-[var(--foreground)]/60 mb-1 block">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={location.lng}
                        onChange={(e) => handleManualLocation('lng', e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-[var(--background)] border border-[var(--muted)]/40 rounded"
                      />
                    </div>
                  </div>
                </div>
                <div className="h-64 rounded-lg overflow-hidden border border-[var(--muted)]/30">
                  <ClickableMap
                    location={location}
                    onLocationClick={handleLocationSet}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

