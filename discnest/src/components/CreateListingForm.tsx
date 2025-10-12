'use client';

import { useState } from 'react';

type CreateListingFormProps = {
  user: { id: string; name?: string; email?: string };
  onClose?: () => void;
};

export default function CreateListingForm({ user, onClose }: CreateListingFormProps) {
  const [form, setForm] = useState({
    discId: '',
    title: '',
    description: '',
    brand: '',
    condition: 'Used - Like New',
    type: 'Sell',
    price: 0,
    city: '',
    radiusVisibility: 5,
    imageUrls: [] as string[],
    flaggedImages: [] as string[],
    pendingReview: false,
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.flaggedImages.length > 0) {
      alert('Cannot submit listing: one or more images were flagged.');
      return;
    }

    setSubmitting(true);
    const location = await getApproxLocation();

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          userId: user.id,
          location,
          pendingReview: form.pendingReview,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error('Listing creation failed:', errorBody);
        throw new Error('Failed to create listing');
      }

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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      if (data.status === 'flagged') {
        // Mark flagged images for internal tracking
        setForm((prev) => ({
          ...prev,
          flaggedImages: [...prev.flaggedImages, data.imageUrl || file.name],
        }));
        return;
      }

      if (data.status === 'pendingReview') {
        // Mark listing as pending review
        setForm((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, data.imageUrl],
          pendingReview: true,
        }));
        return;
      }

      // Approved image
      setForm((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, data.imageUrl],
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
      setForm((prev) => ({
        ...prev,
        flaggedImages: prev.flaggedImages.filter((f) => f !== urlOrName),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        imageUrls: prev.imageUrls.filter((u) => u !== urlOrName),
      }));
    }
  }

  function resetForm() {
    setForm({
      discId: '',
      title: '',
      description: '',
      brand: '',
      condition: 'Used - Like New',
      type: 'Sell',
      price: 0,
      city: '',
      radiusVisibility: 5,
      imageUrls: [],
      flaggedImages: [],
      pendingReview: false,
    });
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
        {/* Disc ID (optional, from bag) */}
        <div>
          <label htmlFor="discId" className="block font-medium mb-1">Disc (optional)</label>
          <input
            id="discId"
            type="text"
            placeholder="Disc ID (if from bag)"
            value={form.discId}
            onChange={(e) => setForm({ ...form, discId: e.target.value })}
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block font-medium mb-1">Title</label>
          <input
            id="title"
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block font-medium mb-1">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border px-3 py-2 rounded w-full"
            rows={3}
          />
        </div>

        {/* Brand */}
        <div>
          <label htmlFor="brand" className="block font-medium mb-1">Brand</label>
          <input
            id="brand"
            type="text"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        {/* Condition */}
        <div>
          <label htmlFor="condition" className="block font-medium mb-1">Condition</label>
          <select
            id="condition"
            value={form.condition}
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
            className="border px-3 py-2 rounded w-full"
          >
            <option>New</option>
            <option>Used - Like New</option>
            <option>Used - Fair</option>
          </select>
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block font-medium mb-1">Listing Type</label>
          <select
            id="type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="border px-3 py-2 rounded w-full"
          >
            <option>Sell</option>
            <option>Trade</option>
          </select>
        </div>

        {/* Price (only if Sell) */}
        {form.type === 'Sell' && (
          <div>
            <label htmlFor="price" className="block font-medium mb-1">Price ($)</label>
            <input
              id="price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
              className="border px-3 py-2 rounded w-full"
            />
          </div>
        )}

        {/* City */}
        <div>
          <label htmlFor="city" className="block font-medium mb-1">City</label>
          <input
            id="city"
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        {/* Radius Visibility */}
        <div>
          <label htmlFor="radius" className="block font-medium mb-1">Visibility Radius (miles)</label>
          <input
            id="radius"
            type="number"
            min={1}
            max={100}
            value={form.radiusVisibility}
            onChange={(e) => setForm({ ...form, radiusVisibility: parseInt(e.target.value) })}
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        {/* Upload */}
        <div>
          <label htmlFor="file" className="font-medium block mb-1">Upload Image</label>
          <input
            id="file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border px-3 py-2 rounded w-full"
            disabled={uploading}
          />
        </div>

        {/* Image gallery */}
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
              <div
                key={i}
                className="relative border-2 border-red-500 rounded bg-red-100"
              >
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

// Approx location helper
async function getApproxLocation() {
  return new Promise<{ type: string; coordinates: [number, number] }>((resolve) => {
    navigator.geolocation.getCurrentPosition((pos) => {
      resolve({
        type: 'Point',
        coordinates: [pos.coords.longitude, pos.coords.latitude],
      });
    });
  });
}
