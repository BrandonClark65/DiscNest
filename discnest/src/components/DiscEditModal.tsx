'use client';

import { useState, useEffect } from 'react';
import type { Disc } from '@/types/disc';
import { DiscPlastics } from '@/app/constants/discData'; // import the constants
import type { DiscPlastic } from '@/app/constants/discData';

export default function DiscEditModal({
  disc,
  onClose,
  onSave,
}: {
  disc: Disc;
  onClose: () => void;
  onSave: (updated: Partial<Disc> & { discId: string }) => void;
}) {
  const [plastic, setPlastic] = useState<DiscPlastic | ''>(disc.plastic ?? '');
  const [wearLevel, setWearLevel] = useState(disc.wearLevel ?? 0);
  const [weight, setWeight] = useState<number | undefined>(disc.weight);
  const [notes, setNotes] = useState(disc.notes ?? '');
  const [color, setColor] = useState(disc.color ?? '#ffffff');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // Trigger slide-in
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      discId: disc._id,
      plastic: plastic === '' ? undefined : plastic,
      wearLevel,
      weight,
      notes,
      color,
    });
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-lg z-50 overflow-y-auto transform transition-transform duration-300 ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-green-700">Edit Disc Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 text-lg"
          >
            ✖
          </button>
        </div>

        {/* Plastic */}
        <label className="block text-sm font-medium">Plastic</label>
        <select
          value={plastic}
          onChange={e => setPlastic(e.target.value as DiscPlastic)}
          className="w-full border rounded px-2 py-1"
        >
          <option value="">Select Plastic</option>
          {DiscPlastics.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {/* Wear Level */}
        <label className="block text-sm font-medium">Wear Level</label>
        <input
          type="number"
          min={0}
          max={100}
          value={wearLevel}
          onChange={e => {
            const val = Number(e.target.value);
            if (isNaN(val)) return;
            setWearLevel(val);
          }}
          className={`w-full border rounded px-2 py-1 ${
            wearLevel < 0 || wearLevel > 100 ? 'border-red-500' : ''
          }`}
          placeholder="0–100"
        />
        {(wearLevel < 0 || wearLevel > 100) && (
          <p className="text-red-500 text-sm mt-1">
            Wear level must be between 0 and 100
          </p>
        )}

        {/* Weight */}
        <label className="block text-sm font-medium">Weight (grams)</label>
        <input
          type="number"
          min={100}
          max={200}
          value={weight ?? ''}
          onChange={e => {
            const val = e.target.value;
            setWeight(val === '' ? undefined : Number(val));
          }}
          className={`w-full border rounded px-2 py-1 ${
            weight && (weight < 100 || weight > 200) ? 'border-yellow-500' : ''
          }`}
          placeholder="e.g. 175"
        />
        {weight && (weight < 100 || weight > 200) && (
          <p className="text-yellow-600 text-sm mt-1">
            Typical disc weights range between 150–180g
          </p>
        )}

        {/* Notes */}
        <label className="block text-sm font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full border rounded px-2 py-1"
        />

        {/* Color */}
        <label className="block text-sm font-medium">Color</label>
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="w-12 h-8 p-0 border rounded"
        />

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
