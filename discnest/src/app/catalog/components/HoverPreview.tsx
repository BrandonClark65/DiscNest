'use client';

import type { Disc } from '@/types/disc';

type Props = {
  disc: Disc | null;
  onClose: () => void;
  isMobile: boolean;
};

export default function HoverPreview({ disc, onClose, isMobile }: Props) {
  if (!disc) return null;

  return (
    <div
      className={`fixed z-50 bg-surface border border-muted/30 rounded-xl shadow-xl transition-all ${
        isMobile
          ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-h-[90vh] overflow-y-auto p-4'
          : 'top-20 right-8 w-96 p-6'
      }`}
    >
      {isMobile && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-muted hover:text-accent"
        >
          ✕
        </button>
      )}
      {disc.image && (
        <>
          <img
            src={disc.image}
            alt={disc.name}
            className="w-full h-64 object-contain mb-4 rounded-lg bg-background"
          />
          <h3 className="text-xl font-bold text-center text-primary">{disc.name}</h3>
          <p className="text-sm text-center text-muted">{disc.brand}</p>
        </>
      )}
    </div>
  );
}
