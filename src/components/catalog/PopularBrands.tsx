'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

type Props = {
  isMobile: boolean;
};

const popularBrands = [
  'Discmania',
  'Discraft',
  'Dynamic Discs',
  'Innova',
  'Latitude 64',
  'MVP',
  'Prodigy',
];

export default function PopularBrands({ isMobile }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Listen for mobile open event
  useEffect(() => {
    if (isMobile) {
      const handleOpen = () => setMobileOpen(true);
      window.addEventListener('openPopularBrands' as any, handleOpen);
      return () => window.removeEventListener('openPopularBrands' as any, handleOpen);
    }
  }, [isMobile]);

  // Only render mobile drawer - desktop version is in catalog page
  if (!isMobile) {
    return null;
  }

  if (!mobileOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
      <aside className="fixed inset-y-0 right-0 w-11/12 max-w-xs bg-surface z-50 p-4 overflow-y-auto shadow-lg border-l border-[var(--accent)]/30">
        <button
          onClick={() => setMobileOpen(false)}
          className="mb-4 text-sm underline text-accent"
        >
          Close Brands
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold text-foreground">Popular Brands</h2>
        </div>
        <div className="space-y-2">
          {popularBrands.map((brand) => (
            <Link
              key={brand}
              href={`/catalog/brand/${encodeURIComponent(brand)}`}
              onClick={() => setMobileOpen(false)}
              className="block w-full px-4 py-3 bg-surface/80 hover:bg-surface border border-[var(--accent)]/30 hover:border-[var(--accent)]/60 rounded-lg transition-all duration-200 text-sm font-medium text-foreground hover:text-[var(--accent)] text-center shadow-sm hover:shadow-md"
            >
              {brand}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
