'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { DiscRequest } from '@/types/DiscRequest';
import { DiscBrands } from '@/app/constants/discData';
import type { DiscBrand } from '@/app/constants/discData';
import GroupedSelect from '@/components/ui/GroupedSelect';
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

type EditRequestModalProps = {
  open: boolean;
  onClose: () => void;
  request: DiscRequest;
  onSuccess?: () => void;
};

export default function EditRequestModal({
  open,
  onClose,
  request,
  onSuccess,
}: EditRequestModalProps) {
  const [form, setForm] = useState({
    title: request.title,
    description: request.description || '',
    brand: request.brand || '',
    plastic: request.plastic || '',
    weight: request.weight ? String(request.weight) : '',
    color: request.color || '',
    condition: request.condition || 'Like New',
    location: request.location as Location,
  });

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

    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }

    setSubmitting(true);

    try {
      // Ensure location exists
      if (!form.location) {
        const location = await new Promise<Location>((resolve) => {
          if (!navigator.geolocation) {
            // Use existing location if available
            return resolve(request.location as Location);
          }
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                type: 'Point',
                coordinates: [pos.coords.longitude, pos.coords.latitude],
              }),
            () => resolve(request.location as Location)
          );
        });
        setForm((prev) => ({ ...prev, location }));
      }

      // Prepare payload
      const payload = {
        ...form,
        weight: form.weight ? Number(form.weight) : undefined,
      };

      const res = await fetch(`/api/requests/${request._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error('Request update failed:', errorBody);
        throw new Error('Failed to update request');
      }

      toast.success('Request updated successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error updating request');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Edit Request
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
              Title <span className="text-red-500">*</span>
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
              Description
            </label>
            <textarea
              id="description"
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
                handleFieldChange(
                  'condition',
                  e.target.value as typeof form.condition
                )
              }
              className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded w-full text-[var(--foreground)]"
            >
              <option>New</option>
              <option>Like New</option>
              <option>Used</option>
              <option>Worn</option>
            </select>
          </div>

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
              disabled={submitting}
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

