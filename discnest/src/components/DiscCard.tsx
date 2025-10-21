'use client';

import type { Disc } from '@/types/disc';
import { getContrastColor } from '@/lib/colors';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

type DiscCardProps = {
  disc: Disc;
  actionLabel?: string;
  onAction?: () => void;
  onDelete?: () => void;
  onEdit?: (disc: Disc) => void;
  onHover?: (disc: Disc | null) => void; // re-added
  isRecentlyAdded?: boolean;
  className?: string;
};

export default function DiscCard({
  disc,
  actionLabel,
  onAction,
  onDelete,
  onEdit,
  onHover,
  isRecentlyAdded = false,
  className = '',
}: DiscCardProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const textColor = getContrastColor(disc.color ?? '#ffffff');

  const handleActionClick = () => {
    if (!isLoggedIn) {
      toast('Log in to Add Discs to Shelf');
      return;
    }
    onAction?.();
  };

  return (
    <div
      onMouseEnter={() => !isMobile && onHover?.(disc)}
      onMouseLeave={() => !isMobile && onHover?.(null)}
      onClick={() => isMobile && onHover?.(disc)}
      className={`border p-4 rounded shadow flex flex-col justify-between transition cursor-pointer ${className} ${
        isRecentlyAdded ? 'ring-2 ring-green-500' : 'hover:ring-2 hover:ring-green-500'
      }`}
      style={{
        backgroundColor: disc.color ?? '#ffffff',
        color: textColor,
        filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.4))',
      }}
    >
      {/* Disc Image */}
      {disc.image && (
        <img
          src={disc.image}
          alt={disc.name}
          onError={(e) => ((e.target as HTMLImageElement).src = '/fallback.jpg')}
          className={isMobile ? 'w-32 h-32 mx-auto object-contain mb-4' : 'w-20 h-20 mx-auto object-contain mb-2'}
        />
      )}

      {/* Info */}
      <div className={isMobile ? 'text-center mb-4 space-y-1' : 'mb-2 text-center'}>
        <h3 className="font-bold" style={{ color: textColor }}>
          {disc.name}
        </h3>
        <p style={{ color: textColor }}>
          {disc.brand} • {disc.type} • {disc.stability}
        </p>
        {disc.plastic && (
          <p className="italic" style={{ color: textColor }}>
            Plastic: {disc.plastic}
          </p>
        )}
        {(disc.wearLevel !== undefined || disc.weight) && (
          <p className="italic" style={{ color: textColor }}>
            {disc.wearLevel !== undefined && `Wear: ${disc.wearLevel}`}
            {disc.wearLevel !== undefined && disc.weight ? ' • ' : ''}
            {disc.weight && `Weight: ${disc.weight}g`}
          </p>
        )}
      </div>

      {/* Edit / Delete Buttons */}
      {(onEdit || onDelete) && (
        <div className="flex justify-center gap-2 mb-2 flex-wrap">
          {onEdit && (
            <button
              onClick={() => onEdit(disc)}
              className="flex-1 text-sm hover:underline"
              style={{ color: textColor }}
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex-1 text-sm hover:underline"
              style={{ color: textColor }}
            >
              🗑️ Remove
            </button>
          )}
        </div>
      )}

      {/* Add Button */}
      {actionLabel && (
        <button
          onClick={handleActionClick}
          className={isMobile ? 'mt-auto bg-green-600 text-white py-2 px-4 rounded text-lg' : 'mt-auto bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700'}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
