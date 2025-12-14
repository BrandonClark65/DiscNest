'use client';

import { useState, useEffect } from 'react';
import type { Disc } from '@/types/disc';
import { DiscPlastics } from '@/app/constants/discData';
import type { DiscPlastic } from '@/app/constants/discData';
import GradientButton from '@/components/ui/GradientButton';
import GroupedSelect from '@/components/ui/GroupedSelect';
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
    setVisible(true);
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
      className={`fixed inset-y-0 right-0 w-full max-w-md z-50 overflow-y-auto transform transition-transform duration-300 ${
        visible ? 'translate-x-0' : 'translate-x-full'
      } 
      bg-[var(--surface)]/95 backdrop-blur-xl border-l border-[var(--primary)]/10 shadow-2xl`}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6 text-[var(--foreground)]">
        {/* ---------- HEADER ---------- */}
        <div className="flex items-center justify-between border-b border-[var(--primary)]/20 pb-3 mb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gradient-brand drop-shadow-sm">
              Edit Disc
            </h2>
            <div className="h-1 w-20 bg-[var(--primary)]/60 rounded-full mt-1"></div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted)] hover:text-rose-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ---------- FORM FIELDS ---------- */}
        {/* Plastic */}
        <div>
          <label className="block text-sm font-medium mb-1">Plastic</label>
          <GroupedSelect
            value={plastic}
            onChange={(val) => setPlastic(val as DiscPlastic)}
            className="w-full rounded-md px-3 py-2 bg-[var(--background)]/60 border border-[var(--primary)]/20 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/40 outline-none transition"
            placeholder="Select Plastic"
          />
        </div>

        {/* Wear Level */}
        <div>
          <label className="block text-sm font-medium mb-1">Wear Level (0–100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={wearLevel}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!isNaN(val)) setWearLevel(val);
            }}
            className={`w-full rounded-md px-3 py-2 bg-[var(--background)]/60 border border-[var(--primary)]/20 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/40 outline-none transition ${
              wearLevel < 0 || wearLevel > 100 ? 'border-rose-500' : ''
            }`}
            placeholder="0–100"
          />
          {(wearLevel < 0 || wearLevel > 100) && (
            <p className="text-rose-500 text-sm mt-1">
              Wear level must be between 0 and 100
            </p>
          )}
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium mb-1">Weight (grams)</label>
          <input
            type="number"
            min={100}
            max={200}
            value={weight ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setWeight(val === '' ? undefined : Number(val));
            }}
            className={`w-full rounded-md px-3 py-2 bg-[var(--background)]/60 border border-[var(--primary)]/20 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/40 outline-none transition ${
              weight && (weight < 100 || weight > 200) ? 'border-amber-500' : ''
            }`}
            placeholder="e.g. 175"
          />
          {weight && (weight < 100 || weight > 200) && (
            <p className="text-amber-500 text-sm mt-1">
              Typical disc weights range between 150–180g
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[80px] rounded-md px-3 py-2 bg-[var(--background)]/60 border border-[var(--primary)]/20 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/40 outline-none transition resize-none"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium mb-1">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-8 p-0 border border-[var(--primary)]/20 rounded cursor-pointer"
          />
        </div>

        {/* ---------- ACTIONS ---------- */}
        <div className="flex justify-end gap-3 pt-6 border-t border-[var(--primary)]/10">
          <GradientButton
            label="Cancel"
            onClick={onClose}
            type="button"
            variant="surface"
            className="ring-1 ring-[var(--muted)]/40 hover:bg-[var(--surface)]/90"
          />
          <GradientButton
            label="Save Changes"
            type="submit"
            variant="brand"
          />
        </div>
      </form>
    </div>
  );
}
