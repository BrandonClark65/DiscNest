'use client';

import { useState, useEffect } from 'react';
import type { Disc } from '@/types/disc';
import imageCompression from 'browser-image-compression';

type CreateListingFormProps = {
  user: { id: string; name?: string; email?: string };
  onClose?: () => void;
};

type Location = {
  type: 'Point';
  coordinates: [number, number];
};

export default function CreateListingForm({ user, onClose }: CreateListingFormProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    brand: '',
    plastic: '',
    weight: '', // always controlled as string
    condition: 'Used - Like New',
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

  // Fetch user's discs
  useEffect(() => {
    async function fetchDiscs() {
      if (!user?.email) return;
      try {
        const res = await fetch(`/api/user/discs/bag?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        setDiscs(data.bag || []);
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
      brand: touchedFields.brand ? prev.brand : disc.brand || '',
      plastic: touchedFields.plastic ? prev.plastic : disc.plastic || '',
      weight: touchedFields.weight
        ? prev.weight
        : disc.weight !== undefined
        ? String(disc.weight)
        : '',
    }));
  }, [selectedDisc, discs, touchedFields]);

  function handleFieldChange<K extends keyof typeof form>(field: K, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (['title', 'brand', 'plastic', 'weight'].includes(field)) {
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.flaggedImages.length > 0) {
      alert('Cannot submit listing: one or more images were flagged.');
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

      if (form.pendingReview) {
        alert(
          'Your listing has been submitted successfully but is pending review. It will not appear publicly until approved by an admin.'
        );
      } else {
        alert('Listing created!');
      }

      resetForm();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert('Error creating listing');
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
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error uploading image');
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
      condition: 'Used - Like New',
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
              className="border px-3 py-2 rounded w-full"
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
            className="border px-3 py-2 rounded w-full"
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
            className="border px-3 py-2 rounded w-full"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="brand" className="block font-medium mb-1">
            Brand
          </label>
          <input
            id="brand"
            type="text"
            value={form.brand}
            onChange={(e) => handleFieldChange('brand', e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        <div>
          <label htmlFor="plastic" className="block font-medium mb-1">
            Plastic
          </label>
          <input
            id="plastic"
            type="text"
            value={form.plastic}
            onChange={(e) => handleFieldChange('plastic', e.target.value)}
            className="border px-3 py-2 rounded w-full"
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
            className="border px-3 py-2 rounded w-full"
            placeholder="e.g. 175"
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
            className="border px-3 py-2 rounded w-full"
          >
            <option>New</option>
            <option>Used - Like New</option>
            <option>Used - Fair</option>
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
            className="border px-3 py-2 rounded w-full"
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
              value={form.price}
              onChange={(e) => handleFieldChange('price', parseFloat(e.target.value))}
              className="border px-3 py-2 rounded w-full"
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
                className="border px-3 py-2 rounded w-full"
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
                className="border px-3 py-2 rounded w-full"
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
            className="border px-3 py-2 rounded w-full"
            disabled={uploading}
          />
        </div>

        {(form.imageUrls.length > 0 || form.flaggedImages.length > 0) && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {form.imageUrls.map((url, i) => (
              <div key={i} className="relative border-2 border-green-500 rounded">
                <img src={url} className="w-24 h-24 object-cover rounded" />
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
                  <img src={urlOrName} className="w-24 h-24 object-cover rounded" />
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
