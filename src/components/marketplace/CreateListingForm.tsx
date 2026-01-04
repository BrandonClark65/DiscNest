'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { Disc } from '@/types/disc';
import imageCompression from 'browser-image-compression';
import { DiscBrands, DiscPlastics } from '@/app/constants/discData';
import type { DiscBrand } from '@/app/constants/discData';

// Helper to validate if a string is a valid DiscBrand
function isValidDiscBrand(brand: string | undefined | null): brand is DiscBrand {
  if (!brand) return false;
  return DiscBrands.includes(brand as DiscBrand);
}
import { useAnalytics } from '@/lib/useAnalytics';
import GroupedSelect from '@/components/ui/GroupedSelect';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import EbayPriceResearch from '@/components/marketplace/EbayPriceResearch';

// Dynamically import the clickable map component to avoid SSR issues
const ClickableMap = dynamic(
  () => import('@/components/profile/ClickableMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-[var(--surface)] text-[var(--foreground)]/70">
        Loading map...
      </div>
    ),
  }
);


type CreateListingFormProps = {
  user: { id: string; name?: string; email?: string };
  onClose?: () => void;
};

type Location = {
  type: 'Point';
  coordinates: [number, number];
};

export default function CreateListingForm({ user, onClose }: CreateListingFormProps) {
  const { trackEvent, trackConversion } = useAnalytics();
  const [listingType, setListingType] = useState<'single' | 'group' | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    brand: '',
    plastic: '',
    weight: '', // always controlled as string
    color: '',
    condition: 'Like New',
    type: 'Sell',
    price: 0,
    location: null as Location | null,
    imageUrls: [] as string[],
    publicIds: [] as string[],
    flaggedImages: [] as string[],
    pendingReview: false,
  });

  const [touchedFields, setTouchedFields] = useState({
    title: false,
    brand: false,
    plastic: false,
    weight: false,
  });

  const [discs, setDiscs] = useState<Disc[]>([]);
  const [selectedDisc, setSelectedDisc] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Initialize location from form if available
  useEffect(() => {
    if (form.location?.coordinates && Array.isArray(form.location.coordinates) && form.location.coordinates.length === 2) {
      const [lng, lat] = form.location.coordinates;
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        setLocation({ lat, lng });
      }
    }
  }, []);

  // Try to get current location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
        setForm((prev) => ({
          ...prev,
          location: { type: 'Point', coordinates: [lng, lat] },
        }));
      },
      () => {
        // Geolocation denied or failed - user will need to set manually
      }
    );
  }, []);

    // Fetch user's discs (bag + shelf)
  useEffect(() => {
    async function fetchDiscs() {
      if (!user?.email) return;
      try {
        const [bagRes, shelfRes] = await Promise.all([
          fetch(`/api/user/discs/bag?email=${encodeURIComponent(user.email)}`),
          fetch(`/api/user/discs/shelf?email=${encodeURIComponent(user.email)}`),
        ]);

        const bagData = await bagRes.json();
        const shelfData = await shelfRes.json();

        const bag = Array.isArray(bagData.bag) ? bagData.bag : [];
        const shelf = Array.isArray(shelfData.shelf) ? shelfData.shelf : [];

        // Merge + deduplicate (in case of overlap)
        const merged = [...bag, ...shelf].filter(
          (disc, index, arr) => arr.findIndex((d) => d._id === disc._id) === index
        );

        setDiscs(merged);
      } catch (err) {
        console.error('Failed to fetch discs:', err);
      }
    }

    fetchDiscs();
  }, [user?.email]);


  // Autofill form when a disc is selected
  useEffect(() => {
    if (!selectedDisc) return;
    const disc = discs.find((d) => d._id === selectedDisc);
    if (!disc) return;

    setForm((prev) => ({
      ...prev,
      title: touchedFields.title ? prev.title : disc.name || '',
      brand: touchedFields.brand ? prev.brand : (isValidDiscBrand(disc.brand) ? disc.brand : ''),
      plastic: touchedFields.plastic ? prev.plastic : disc.plastic || '',
      weight: touchedFields.weight
        ? prev.weight
        : disc.weight !== undefined
        ? String(disc.weight)
        : '',
    }));
  }, [selectedDisc, discs, touchedFields]);

  function handleFieldChange<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (['title', 'brand', 'plastic', 'weight'].includes(field)) {
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
    }
  }

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
        setLocationError('Failed to get your location. Please set it manually on the map.');
        console.error('Geolocation error:', error);
      }
    );
  };

  // Handle location being set (from map click or geolocation)
  const handleLocationSet = (lat: number, lng: number) => {
    setLocation({ lat, lng });
    setLocationError(null);
    setForm((prev) => ({
      ...prev,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    }));
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.flaggedImages.length > 0) {
      toast.error('Cannot submit listing: one or more images were flagged.');
      return;
    }

    // Validate required fields for group listings
    if (isGroupListing) {
      if (!form.title.trim()) {
        toast.error('Title is required for group listings.');
        return;
      }
      if (!form.description.trim()) {
        toast.error('Description is required for group listings.');
        return;
      }
    }

    // Validate location is set
    if (!form.location || !form.location.coordinates || form.location.coordinates.length !== 2) {
      toast.error('Please set a location for your listing. Click on the map or use the "Get Location" button.');
      return;
    }

    setSubmitting(true);

    try {

      // Prepare payload - exclude fields not applicable to group listings
      const payload: Record<string, unknown> = {
        ...form,
        weight: form.weight ? Number(form.weight) : null, // convert to number
        userId: user.id,
        pendingReview: form.pendingReview,
        listingType: listingType || 'single', // default to single for backward compatibility
        // Remove city and state - they will be reverse geocoded from location coordinates
        city: undefined,
        state: undefined,
      };

      // For group listings, exclude single-disc specific fields
      // Note: location is kept for group listings
      if (isGroupListing) {
        delete payload.condition;
        delete payload.plastic;
        delete payload.weight;
        delete payload.color;
        delete payload.price;
      }

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error('Listing creation failed:', errorBody);
        throw new Error('Failed to create listing');
      }

      const data = await res.json();

      // Track listing creation event
      trackEvent('listing_create', {
        listing_id: data.listing?._id || data.listingId,
        listing_title: form.title,
        listing_brand: form.brand,
        listing_type: form.type,
        listing_price: form.price,
        listing_condition: form.condition,
        listing_location: form.location?.coordinates ? `Lat: ${form.location.coordinates[1]}, Lng: ${form.location.coordinates[0]}` : undefined,
      });

      // Track as conversion if it's a sell listing with price
      if (form.type === 'Sell' && form.price > 0) {
        trackConversion('listing_create', form.price, 'USD', {
          listing_id: data.listing?._id || data.listingId,
          listing_title: form.title,
        });
      }

      if (form.pendingReview) {
        toast.success(
          'Your listing has been submitted successfully but is pending review. It will not appear publicly until approved by an admin.'
        );
      } else {
        toast.success('Listing created!');
      }

      resetForm();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error creating listing');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    try {
      const options = { maxSizeMB: 0.6, maxWidthOrHeight: 1280, useWebWorker: true, initialQuality: 0.8 };
      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append("folder", "disc-listings");
      formData.append('userId', user.id);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      if (data.status === 'flagged') {
        setForm((prev) => ({
          ...prev,
          flaggedImages: [...prev.flaggedImages, data.imageUrl || file.name],
          publicIds: [...(prev.publicIds || []), data.publicId],
        }));
        return;
      }

      if (data.status === 'pendingReview') {
        setForm((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, data.imageUrl],
          publicIds: [...(prev.publicIds || []), data.publicId],
          pendingReview: true,
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, data.imageUrl],
        publicIds: [...(prev.publicIds || []), data.publicId],
      }));
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Error uploading image';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function handleRemoveImage(urlOrName: string, flagged = false) {
    if (flagged) {
      setForm((prev) => ({ ...prev, flaggedImages: prev.flaggedImages.filter((f) => f !== urlOrName) }));
    } else {
      setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((u) => u !== urlOrName) }));
    }
  }

  function resetForm() {
    setListingType(null);
    setForm({
      title: '',
      description: '',
      brand: '',
      plastic: '',
      weight: '', // reset to empty string
      color: '',
      condition: 'Like New',
      type: 'Sell',
      price: 0,
      location: null,
      imageUrls: [],
      publicIds: [],
      flaggedImages: [],
      pendingReview: false,
    });
    setTouchedFields({ title: false, brand: false, plastic: false, weight: false });
    setSelectedDisc('');
    setLocation(null);
    setLocationError(null);
  }

  // Show listing type selection screen if not selected
  if (listingType === null) {
    return (
      <div className="space-y-4">
        {onClose && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              ✕ Close
            </button>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">What would you like to list?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setListingType('single')}
              className="p-6 border-2 border-[var(--muted)]/40 rounded-lg hover:border-[var(--primary)] hover:bg-[var(--muted)]/10 transition-all text-left"
            >
              <h3 className="text-lg font-semibold mb-2">Single Disc</h3>
              <p className="text-sm text-[var(--foreground)]/70">
                List a single disc with detailed information including plastic, weight, condition, and more.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setListingType('group')}
              className="p-6 border-2 border-[var(--muted)]/40 rounded-lg hover:border-[var(--primary)] hover:bg-[var(--muted)]/10 transition-all text-left"
            >
              <h3 className="text-lg font-semibold mb-2">Group of Discs</h3>
              <p className="text-sm text-[var(--foreground)]/70">
                List multiple discs together with a title, description, brand, and images.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // For group listings, show simplified form
  const isGroupListing = listingType === 'group';

  return (
    <div className="space-y-4">
      {onClose && (
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setListingType(null)}
            className="text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            ✕ Close
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Disc selector - only for single listings */}
        {!isGroupListing && discs.length > 0 && (
          <div>
            <label htmlFor="discSelect" className="block font-medium mb-1">
              Select a disc from your bag or shelf(optional)
            </label>
            <select
              id="discSelect"
              value={selectedDisc}
              onChange={(e) => setSelectedDisc(e.target.value)}
              className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
            >
              <option value="">-- None --</option>
              {discs.map((disc) => (
                <option key={disc._id} value={disc._id}>
                  {disc.name} {disc.brand ? `(${disc.brand})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Title - required for both */}
        <div>
          <label htmlFor="title" className="block font-medium mb-1">
            Title {isGroupListing && <span className="text-red-500">*</span>}
          </label>
          <input
            id="title"
            type="text"
            required
            value={form.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
          />
        </div>

        {/* Description - required for group, optional for single */}
        <div>
          <label htmlFor="description" className="block font-medium mb-1">
            Description {isGroupListing && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id="description"
            required={isGroupListing}
            value={form.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
            rows={3}
          />
        </div>

        {/* Brand Picklist - shown for both, optional */}
        <div>
          <label htmlFor="brand" className="block font-medium mb-1">
            Brand
          </label>
          <select
            id="brand"
            value={form.brand}
            onChange={(e) => handleFieldChange('brand', e.target.value)}
            className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
          >
            <option value="">Select brand</option>
            {DiscBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        {/* Single listing only fields */}
        {!isGroupListing && (
          <>
            {/* Plastic Picklist */}
            <div>
              <label htmlFor="plastic" className="block font-medium mb-1">
                Plastic
              </label>
              <GroupedSelect
                id="plastic"
                value={form.plastic}
                onChange={(val) => handleFieldChange('plastic', val)}
                filterByBrand={isValidDiscBrand(form.brand) ? form.brand : ''}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
                placeholder="Select plastic"
              />
            </div>
            <div>
              <label htmlFor="weight" className="block font-medium mb-1">
                Weight (g)
              </label>
              <input
                id="weight"
                type="number"
                value={form.weight}
                onChange={(e) => handleFieldChange('weight', e.target.value)}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
                placeholder="e.g. 175"
              />
            </div>

            <div>
              <label htmlFor="color" className="block font-medium mb-1">
                Color (optional)
              </label>
              <input
                id="color"
                type="text"
                value={form.color}
                onChange={(e) => handleFieldChange('color', e.target.value)}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
                placeholder="e.g. Red, Blue, Yellow"
              />
            </div>

            <div>
              <label htmlFor="condition" className="block font-medium mb-1">
                Condition
              </label>
              <select
                id="condition"
                value={form.condition}
                onChange={(e) => handleFieldChange('condition', e.target.value)}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
              >
                <option>New</option>
                <option>Like New</option>
                <option>Used</option>
                <option>Worn</option>
              </select>
            </div>
          </>
        )}

        {/* Listing Type (Sell/Trade) - shown for both */}
        <div>
          <label htmlFor="type" className="block font-medium mb-1">
            Listing Type
          </label>
          <select
            id="type"
            value={form.type}
            onChange={(e) => handleFieldChange('type', e.target.value)}
            className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
          >
            <option>Sell</option>
            <option>Trade</option>
          </select>
        </div>

        {/* Price - only for single listings with Sell type */}
        {!isGroupListing && form.type === 'Sell' && (
          <>
            <div>
              <label htmlFor="price" className="block font-medium mb-1">
                Price ($)
              </label>
              <input
                id="price"
                type="number"
                required={form.type === 'Sell'}
                value={form.price}
                onChange={(e) => handleFieldChange('price', parseFloat(e.target.value))}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
              />
            </div>
            
            {/* eBay Price Research Tool */}
            <EbayPriceResearch
              title={form.title}
              brand={form.brand}
              plastic={form.plastic}
              condition={form.condition}
              onPriceSelect={(price) => handleFieldChange('price', price)}
            />
          </>
        )}

        {/* Location - required for both single and group listings */}
        <div>
          <label className="block font-medium mb-2">
            Listing Location <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-[var(--foreground)]/60 mb-3">
            Your listing location is required and will be used to display on the marketplace map. City and state will be automatically determined from your location.
          </p>
          
          <button
            type="button"
            onClick={handleGetLocation}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--background)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors mb-4"
          >
            <MapPin className="w-4 h-4" />
            {location ? 'Update Location' : 'Get My Location'}
          </button>

          {locationError && (
            <p className="text-sm text-red-500 mb-2">{locationError}</p>
          )}

          {location && location.lat !== undefined && location.lng !== undefined ? (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm text-[var(--foreground)]/80 mb-2">
                  Click on the map to set your listing location, or edit coordinates manually:
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
          ) : (
            <div className="mt-4">
              <p className="text-sm text-[var(--foreground)]/70 mb-3">
                Please click &quot;Get My Location&quot; above or set your location on the map below:
              </p>
              <div className="h-64 rounded-lg overflow-hidden border border-[var(--muted)]/30">
                <ClickableMap
                  location={null}
                  onLocationClick={handleLocationSet}
                />
              </div>
            </div>
          )}
        </div>

        {/* Image Upload & Gallery */}
        <div>
          <label htmlFor="file" className="font-medium block mb-1">
            Upload Image
          </label>
          <input
            id="file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
            disabled={uploading}
          />
        </div>

        {(form.imageUrls.length > 0 || form.flaggedImages.length > 0) && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {form.imageUrls.map((url, i) => (
              <div key={i} className="relative border-2 border-green-500 rounded">
                <div className="relative w-24 h-24">
                  <Image
                    src={url}
                    alt={`Listing image ${i + 1}`}
                    width={96}
                    height={96}
                    className="object-cover rounded"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(url)}
                  className="absolute top-0 right-0 bg-red-600 text-white px-1 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
            {form.flaggedImages.map((urlOrName, i) => (
              <div key={i} className="relative border-2 border-red-500 rounded bg-red-100">
                {urlOrName.startsWith('http') ? (
                  <div className="relative w-24 h-24">
                    <Image
                      src={urlOrName}
                      alt={`Flagged image ${i + 1}`}
                      width={96}
                      height={96}
                      className="object-cover rounded"
                    />
                  </div>
                ) : (
                  <span className="px-2 py-1 text-red-800">{urlOrName}</span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(urlOrName, true)}
                  className="absolute top-0 right-0 bg-red-600 text-white px-1 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {form.flaggedImages.length > 0 && (
          <p className="text-red-600 font-semibold">
            ⚠️ You have {form.flaggedImages.length} flagged image(s). Remove them to submit.
          </p>
        )}

        <button
          type="submit"
          disabled={uploading || submitting || form.flaggedImages.length > 0}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {submitting ? 'Posting...' : uploading ? 'Uploading...' : 'Post Listing'}
        </button>
      </form>
    </div>
  );
}
