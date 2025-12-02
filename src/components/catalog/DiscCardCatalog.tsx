'use client';

import type { Disc } from '@/types/disc';
import { getContrastColor } from '@/lib/colors';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type DiscCardCatalogProps = {
  disc: Disc;
  actionLabel: string;
  onAction: () => void;
  onHover?: (disc: Disc | null) => void;
  isRecentlyAdded?: boolean;
};

export default function DiscCardCatalog({
  disc,
  actionLabel,
  onAction,
  onHover,
  isRecentlyAdded = false,
}: DiscCardCatalogProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [isMobile, setIsMobile] = useState(false);

  // Calculate text contrast color, fallback to theme foreground if too close to background
  const contrastColor = getContrastColor(disc.color ?? '#ffffff');
  const textColor =
    contrastColor === 'white'
      ? 'var(--foreground)'
      : contrastColor === 'black'
      ? 'var(--foreground)'
      : 'var(--foreground)';

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleActionClick = () => {
    if (!isLoggedIn) {
      toast('Log in to add discs');
      return;
    }
    onAction?.();
  };

  return (
    <div
      onMouseEnter={() => !isMobile && onHover?.(disc)}
      onMouseLeave={() => !isMobile && onHover?.(null)}
      onClick={() => isMobile && onHover?.(disc)}
      className={`border p-4 rounded-xl shadow-md flex flex-col justify-between transition hover:ring-2 hover:ring-[var(--primary)] ${
        isRecentlyAdded ? 'ring-2 ring-[var(--accent)]' : ''
      }`}
      style={{
        backgroundColor: disc.color ?? 'var(--surface)',
        color: textColor,
      }}
    >
      {/* Disc Image */}
      {disc.image && (
        <img
          src={disc.image}
          alt={disc.name}
          className="object-contain w-32 h-32 mx-auto mb-4 rounded-md shadow-sm"
          onError={(e) => ((e.target as HTMLImageElement).src = '/fallback.jpg')}
        />
      )}

      {/* Disc Info */}
      <div className="text-center space-y-1">
        <h3 className="font-bold text-[var(--foreground)] text-lg tracking-tight">
          {disc.name}
        </h3>
        <p className="text-sm opacity-80">
          {disc.brand} • {disc.type} • {disc.stability}
        </p>
        {disc.plastic && (
          <p className="text-xs italic opacity-75">Plastic: {disc.plastic}</p>
        )}
      </div>

      {/* Add Button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleActionClick();
          }}
          className="rounded-full px-4 py-2 bg-[var(--primary)] text-[var(--background)] font-medium text-sm shadow hover:bg-[var(--primary)]/90 active:scale-95 transition"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
