'use client';

import { useState, useEffect } from 'react';
import type { Disc } from '@/types/disc';
import { DiscBrands, DiscPlastics } from '@/app/constants/discData';

type CreateDiscRequestProps = {
  user: { id: string; name?: string; email?: string };
  onClose?: () => void;
};

type Location = {
  type: 'Point';
  coordinates: [number, number];
};

export default function CreateDiscRequestForm({ user, onClose }: CreateDiscRequestProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    brand: '',
    plastic: '',
    weight: '',
    color: '',
    condition: 'Like New',
    city: '',
    state: '',
    location: null as Location | null,
  });

  const [discs, setDiscs] = useState<Disc[]>([]);
  const [selectedDisc, setSelectedDisc] = useState<string>('');
  const [useGeoLocation, setUseGeoLocation] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [touchedFields, setTouchedFields] = useState({
    title: false,
    brand: false,
    plastic: false,
    weight: false,
    color: false,
  });

  // Load user's discs (bag + shelf)
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

        const merged = [...bag, ...shelf].filter(
          (disc, i, arr) => arr.findIndex((d) => d._id === disc._id) === i
        );

        setDiscs(merged);
      } catch (err) {
        console.error('Failed to fetch discs:', err);
      }
    }
    fetchDiscs();
  }, [user?.email]);

  // Autofill fields when disc is selected
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
      color: touchedFields.color ? prev.color : disc.color || '',
    }));
  }, [selectedDisc, discs, touchedFields]);

  // Autofill location through geolocation
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
          location: {
            type: 'Point',
            coordinates: [pos.coords.longitude, pos.coords.latitude],
          },
        }));
      },
      () => setUseGeoLocation(false)
    );
  }, []);

  function handleFieldChange<K extends keyof typeof form>(field: K, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (['title', 'brand', 'plastic', 'weight', 'color'].includes(field)) {
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      let finalLocation = form.location;

      if (!finalLocation) {
        finalLocation = await new Promise<Location | null>((resolve) => {
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
      }

      if (!finalLocation) {
        alert('Location not provided. Please enable location or enter city/state.');
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          brand: form.brand,
          plastic: form.plastic,
          weight: form.weight ? Number(form.weight) : undefined,
          color: form.color,
          condition: form.condition,
          latitude: finalLocation.coordinates[1],
          longitude: finalLocation.coordinates[0],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error(err);
        throw new Error(err.error || 'Failed to create request');
      }

      alert('Disc request posted!');
      if (onClose) onClose();
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to create disc request');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm({
      title: '',
      description: '',
      brand: '',
      plastic: '',
      weight: '',
      color: '',
      condition: 'Like New',
      city: '',
      state: '',
      location: null,
    });
    setSelectedDisc('');
    setTouchedFields({
      title: false,
      brand: false,
      plastic: false,
      weight: false,
      color: false,
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
        {/* Disc Selector */}
        {discs.length > 0 && (
          <div>
            <label className="block font-medium mb-1">Select a disc from your bag or shelf (optional)</label>
            <select
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

        {/* Title */}
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            rows={3}
            className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
          />
        </div>

        {/* Brand */}
        <div>
          <label className="block font-medium mb-1">Brand</label>
          <select
            value={form.brand}
            onChange={(e) => handleFieldChange('brand', e.target.value)}
            className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
          >
            <option value="">Select brand</option>
            {DiscBrands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        {/* Plastic */}
        <div>
          <label className="block font-medium mb-1">Plastic</label>
          <select
            value={form.plastic}
            onChange={(e) => handleFieldChange('plastic', e.target.value)}
            className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
          >
            <option value="">Select plastic</option>
            {DiscPlastics.map((plastic) => (
              <option key={plastic} value={plastic}>{plastic}</option>
            ))}
          </select>
        </div>

        {/* Weight */}
        <div>
          <label className="block font-medium mb-1">Weight (g)</label>
          <input
            type="number"
            value={form.weight}
            onChange={(e) => handleFieldChange('weight', e.target.value)}
            placeholder="e.g. 175"
            className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block font-medium mb-1">Color (optional)</label>
          <input
            type="text"
            value={form.color}
            onChange={(e) => handleFieldChange('color', e.target.value)}
            className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
          />
        </div>

        {/* Condition */}
        <div>
          <label className="block font-medium mb-1">Condition</label>
          <select
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

        {/* City / State fallback (when no geolocation) */}
        {useGeoLocation === false && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block font-medium mb-1">City</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1">State</label>
              <input
                type="text"
                required
                value={form.state}
                onChange={(e) => handleFieldChange('state', e.target.value)}
                className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {submitting ? 'Posting...' : 'Post Request'}
        </button>
      </form>
    </div>
  );
}
