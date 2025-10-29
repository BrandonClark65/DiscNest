'use client';

import { useState, useEffect } from 'react';
import type { Disc } from '@/types/disc';
import { DiscPlastics } from '@/app/constants/discData';
import type { DiscPlastic } from '@/app/constants/discData';
import GradientButton from '@/components/ui/GradientButton';
import { X } from 'lucide-react';

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
      className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* ---------- HEADER ---------- */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 drop-shadow-md">
              Edit Disc
            </h2>
            <div className="h-1 w-20 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full mt-1"></div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ---------- FORM FIELDS ---------- */}
        {/* Plastic */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Plastic</label>
          <select
            value={plastic}
            onChange={(e) => setPlastic(e.target.value as DiscPlastic)}
            className="w-full border rounded px-2 py-1 focus:ring-2 focus:ring-green-400"
          >
            <option value="">Select Plastic</option>
            {DiscPlastics.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Wear Level */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Wear Level (0–100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={wearLevel}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (isNaN(val)) return;
              setWearLevel(val);
            }}
            className={`w-full border rounded px-2 py-1 focus:ring-2 focus:ring-green-400 ${
              wearLevel < 0 || wearLevel > 100 ? 'border-red-500' : ''
            }`}
            placeholder="0–100"
          />
          {(wearLevel < 0 || wearLevel > 100) && (
            <p className="text-red-500 text-sm mt-1">
              Wear level must be between 0 and 100
            </p>
          )}
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Weight (grams)</label>
          <input
            type="number"
            min={100}
            max={200}
            value={weight ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setWeight(val === '' ? undefined : Number(val));
            }}
            className={`w-full border rounded px-2 py-1 focus:ring-2 focus:ring-green-400 ${
              weight && (weight < 100 || weight > 200) ? 'border-yellow-500' : ''
            }`}
            placeholder="e.g. 175"
          />
          {weight && (weight < 100 || weight > 200) && (
            <p className="text-yellow-600 text-sm mt-1">
              Typical disc weights range between 150–180g
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded px-2 py-1 focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-8 p-0 border rounded cursor-pointer"
          />
        </div>

        {/* ---------- ACTIONS ---------- */}
        <div className="flex justify-end gap-3 pt-6">
          <GradientButton
            label="Cancel"
            onClick={onClose}
            variant="gray"
            type="button"
          />
          <GradientButton
            label="Save Changes"
            type="submit"
            variant="green"
          />
        </div>
      </form>
    </div>
  );
}
