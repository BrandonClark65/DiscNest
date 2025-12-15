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
    city: '',
    state: '',
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
  const [useGeoLocation, setUseGeoLocation] = useState<boolean | null>(null);

  // Detect if geolocation is available
  useEffect(() => {
    if (!navigator.geolocation) {
      setUseGeoLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUseGeoLocation(true);
        setForm((prev) => ({
          ...prev,
          location: { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] },
        }));
      },
      () => setUseGeoLocation(false)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.flaggedImages.length > 0) {
      toast.error('Cannot submit listing: one or more images were flagged.');
      return;
    }

    setSubmitting(true);

    try {
      // Ensure location exists
      if (!form.location) {
        const location = await new Promise<Location | null>((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({ type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] }),
            () => resolve(null)
          );
        });
        setForm((prev) => ({ ...prev, location }));
      }

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          weight: form.weight ? Number(form.weight) : null, // convert to number
          userId: user.id,
          pendingReview: form.pendingReview,
        }),
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
        listing_location: form.city && form.state ? `${form.city}, ${form.state}` : undefined,
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
      city: '',
      state: '',
      location: null,
      imageUrls: [],
      publicIds: [],
      flaggedImages: [],
      pendingReview: false,
    });
    setTouchedFields({ title: false, brand: false, plastic: false, weight: false });
    setSelectedDisc('');
  }

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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Disc selector */}
        {discs.length > 0 && (
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

        {/* Title, Description, Brand, Plastic, Weight, Condition, Type, Price */}
        <div>
          <label htmlFor="title" className="block font-medium mb-1">
            Title
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

        <div>
          <label htmlFor="description" className="block font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
            rows={3}
          />
        </div>

        {/* Brand Picklist */}
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

        {form.type === 'Sell' && (
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
        )}

        {useGeoLocation === false && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="city" className="block font-medium mb-1">
                City
              </label>
              <input
                id="city"
                type="text"
                required
                value={form.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="state" className="block font-medium mb-1">
                State
              </label>
              <input
                id="state"
                type="text"
                required
                value={form.state}
                onChange={(e) => handleFieldChange('state', e.target.value)}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
              />
            </div>
          </div>
        )}

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
