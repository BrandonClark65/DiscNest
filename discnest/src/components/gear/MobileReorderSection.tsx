'use client';

import { useState, useEffect } from 'react';
import type { Disc } from '@/types/disc';
import DiscCardGear from '@/components/gear/DiscCardGear';

type MobileReorderSectionProps = {
  discs: Disc[];
  zone: 'shelf' | 'bag';
  actionLabel: string;
  onAction: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (disc: Disc) => void;
  onReorder: (ids: string[], zone: 'shelf' | 'bag') => Promise<void>;
  reorderMode: boolean;
};

/** Compact reorderable layout for mobile view */
export default function MobileReorderSection({
  discs,
  zone,
  actionLabel,
  onAction,
  onDelete,
  onEdit,
  onReorder,
  reorderMode,
}: MobileReorderSectionProps) {
  const [local, setLocal] = useState<Disc[]>(discs);

  useEffect(() => setLocal(discs), [discs]);

  const move = async (from: number, to: number) => {
    if (to < 0 || to >= local.length) return;
    const updated = [...local];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setLocal(updated);
    await onReorder(updated.map((d) => d._id), zone);
  };

  return (
    <div
      className="grid gap-6 justify-center grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
    >
      {local.map((disc, idx) => (
        <div key={disc._id} className="relative">
          {reorderMode && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 bg-[var(--background)]/80 backdrop-blur-md rounded-full px-2 py-1 shadow-sm border border-[var(--muted)]/40">
              <button
                className="px-2 py-1 text-xs rounded bg-[var(--surface)] shadow hover:bg-[var(--muted)]/20"
                onClick={(e) => {
                  e.stopPropagation();
                  move(idx, idx - 1);
                }}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                className="px-2 py-1 text-xs rounded bg-[var(--surface)] shadow hover:bg-[var(--muted)]/20"
                onClick={(e) => {
                  e.stopPropagation();
                  move(idx, idx + 1);
                }}
                aria-label="Move down"
              >
                ↓
              </button>
            </div>
          )}

          <DiscCardGear
            disc={disc}
            actionLabel={actionLabel}
            onAction={() => onAction(disc._id)}
            onEdit={() => onEdit(disc)}
            onDelete={() => onDelete(disc._id)}
          />
        </div>
      ))}
    </div>
  );
}
