'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { Listing } from '@/types/listing';
import imageCompression from 'browser-image-compression';
import { DiscBrands } from '@/app/constants/discData';
import type { DiscBrand } from '@/app/constants/discData';
import { useAnalytics } from '@/lib/useAnalytics';
import GroupedSelect from '@/components/ui/GroupedSelect';
import Image from 'next/image';
import { X } from 'lucide-react';

// Helper to validate if a string is a valid DiscBrand
function isValidDiscBrand(brand: string | undefined | null): brand is DiscBrand {
  if (!brand) return false;
  return DiscBrands.includes(brand as DiscBrand);
}

type Location = {
  type: 'Point';
  coordinates: [number, number];
};

type EditListingModalProps = {
  open: boolean;
  onClose: () => void;
  listing: Listing;
  onSuccess?: () => void;
};

export default function EditListingModal({
  open,
  onClose,
  listing,
  onSuccess,
}: EditListingModalProps) {
  const { trackEvent } = useAnalytics();
  const isGroupListing = listing.listingType === 'group';

  const [form, setForm] = useState({
    title: listing.title,
    description: listing.description || '',
    brand: listing.brand || '',
    plastic: listing.plastic || '',
    weight: listing.weight ? String(listing.weight) : '',
    color: listing.color || '',
    condition: listing.condition || 'Like New',
    type: listing.type,
    price: listing.price || 0,
    city: listing.city || '',
    state: listing.state || '',
    location: listing.location as Location | null,
    imageUrls: listing.imageUrls || [],
    publicIds: listing.publicIds || [],
  });

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
        if (!form.location) {
          setForm((prev) => ({
            ...prev,
            location: {
              type: 'Point',
              coordinates: [pos.coords.longitude, pos.coords.latitude],
            },
          }));
        }
      },
      () => setUseGeoLocation(false)
    );
  }, []);

  function handleFieldChange<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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

    setSubmitting(true);

    try {
      // Ensure location exists
      if (!form.location) {
        const location = await new Promise<Location | null>((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                type: 'Point',
                coordinates: [pos.coords.longitude, pos.coords.latitude],
              }),
            () => resolve(null)
          );
        });
        setForm((prev) => ({ ...prev, location }));
      }

      // Prepare payload
      const payload: Record<string, unknown> = {
        ...form,
        weight: form.weight ? Number(form.weight) : null,
        listingType: listing.listingType || 'single',
      };

      // For group listings, exclude single-disc specific fields
      if (isGroupListing) {
        delete payload.condition;
        delete payload.plastic;
        delete payload.weight;
        delete payload.color;
        delete payload.price;
      }

      const res = await fetch(`/api/listings/${listing._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error('Listing update failed:', errorBody);
        throw new Error('Failed to update listing');
      }

      const data = await res.json();

      // Track listing update event
      trackEvent('listing_update', {
        listing_id: listing._id,
        listing_title: form.title,
      });

      toast.success('Listing updated successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error updating listing');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const options = {
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        initialQuality: 0.8,
      };
      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('folder', 'disc-listings');
      formData.append('userId', listing.userId);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

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

  function handleRemoveImage(index: number) {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
      publicIds: prev.publicIds?.filter((_, i) => i !== index) || [],
    }));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Edit Listing
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
              Title {isGroupListing && <span className="text-red-500">*</span>}
            </label>
            <input
              id="title"
              type="text"
              required
              value={form.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full text-[var(--foreground)]"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
              Description {isGroupListing && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id="description"
              required={isGroupListing}
              value={form.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full text-[var(--foreground)]"
              rows={3}
            />
          </div>

          {/* Brand */}
          <div>
            <label htmlFor="brand" className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
              Brand
            </label>
            <select
              id="brand"
              value={form.brand}
              onChange={(e) => handleFieldChange('brand', e.target.value)}
              className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full text-[var(--foreground)]"
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
              {/* Plastic */}
              <div>
                <label htmlFor="plastic" className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Plastic
                </label>
                <GroupedSelect
                  id="plastic"
                  value={form.plastic}
                  onChange={(val) => handleFieldChange('plastic', val)}
                  filterByBrand={isValidDiscBrand(form.brand) ? form.brand : ''}
                  className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full text-[var(--foreground)]"
                  placeholder="Select plastic"
                />
              </div>

              {/* Weight */}
              <div>
                <label htmlFor="weight" className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Weight (g)
                </label>
                <input
                  id="weight"
                  type="number"
                  value={form.weight}
                  onChange={(e) => handleFieldChange('weight', e.target.value)}
                  className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full text-[var(--foreground)]"
                  placeholder="e.g. 175"
                />
              </div>

              {/* Color */}
              <div>
                <label htmlFor="color" className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Color (optional)
                </label>
                <input
                  id="color"
                  type="text"
                  value={form.color}
                  onChange={(e) => handleFieldChange('color', e.target.value)}
                  className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full text-[var(--foreground)]"
                  placeholder="e.g. Red, Blue, Yellow"
                />
              </div>

              {/* Condition */}
              <div>
                <label htmlFor="condition" className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Condition
                </label>
                <select
                  id="condition"
                  value={form.condition}
                  onChange={(e) =>
                    handleFieldChange('condition', e.target.value as typeof form.condition)
                  }
                  className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full text-[var(--foreground)]"
                >
                  <option>New</option>
                  <option>Like New</option>
                  <option>Used</option>
                  <option>Worn</option>
                </select>
              </div>
            </>
          )}

          {/* Listing Type (Sell/Trade) */}
          <div>
            <label htmlFor="type" className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
              Listing Type
            </label>
            <select
              id="type"
              value={form.type}
              onChange={(e) =>
                handleFieldChange('type', e.target.value as typeof form.type)
              }
              className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full text-[var(--foreground)]"
            >
              <option>Sell</option>
              <option>Trade</option>
            </select>
          </div>

          {/* Price - only for single listings with Sell type */}
          {!isGroupListing && form.type === 'Sell' && (
            <div>
              <label htmlFor="price" className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
                Price ($)
              </label>
              <input
                id="price"
                type="number"
                required={form.type === 'Sell'}
                value={form.price}
                onChange={(e) => handleFieldChange('price', parseFloat(e.target.value))}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full text-[var(--foreground)]"
              />
            </div>
          )}

          {/* Location */}
          {useGeoLocation === false && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="city" className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full text-[var(--foreground)]"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="state" className="block font-medium mb-1 text-gray-900 dark:text-gray-100">
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  required
                  value={form.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full text-[var(--foreground)]"
                />
              </div>
            </div>
          )}

          {/* Image Upload & Gallery */}
          <div>
            <label htmlFor="file" className="font-medium block mb-1 text-gray-900 dark:text-gray-100">
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

          {form.imageUrls.length > 0 && (
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
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-0 right-0 bg-red-600 text-white px-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2 border border-[var(--muted)]/40 rounded-lg hover:bg-[var(--muted)]/20 transition text-gray-900 dark:text-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || submitting}
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {submitting ? 'Updating...' : uploading ? 'Uploading...' : 'Update Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

