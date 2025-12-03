'use client';

import type { Disc } from '@/types/disc';
import { getContrastColor } from '@/lib/colors';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { GripVertical } from 'lucide-react';

type DiscCardGearProps = {
  disc: Disc;
  actionLabel?: string;
  onAction?: () => void;
  onEdit?: (disc: Disc) => void;
  onDelete?: () => void;
  onHover?: (disc: Disc | null) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  compact?: boolean;
};

export default function DiscCardGear({
  disc,
  actionLabel,
  onAction,
  onEdit,
  onDelete,
  onHover,
  dragHandleProps,
  compact = false,
}: DiscCardGearProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const baseColor = disc.color ?? '#ffffff';
  // If the disc has no color, give it a subtle brand-tinted gradient background
  const isDefaultWhite = !disc.color || disc.color === '#ffffff';
  const gradientBackground = isDefaultWhite
    ? 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.15) 100%)' // indigo → blue tint
    : baseColor;

  const textColor = getContrastColor(baseColor);

  // Create a radial gradient overlay that fades from center to edges (disc-like effect)
  const radialOverlay = isDefaultWhite
    ? 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.3) 100%)'
    : 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.4) 100%)';

  const handleActionClick = () => {
    if (!isLoggedIn) {
      toast('Log in to manage your discs');
      return;
    }
    onAction?.();
  };

  return (
    <div
      className="relative rounded-full border flex flex-col items-center justify-center overflow-hidden cursor-pointer transition hover:ring-2 hover:ring-[var(--primary)]"
      style={{
        background: `${radialOverlay}, ${gradientBackground}`,
        color: textColor,
        width: compact ? '100%' : 'clamp(260px, 28vw, 320px)',
        height: compact ? 'auto' : 'clamp(260px, 28vw, 320px)',
        aspectRatio: compact ? '1 / 1' : undefined,
        boxShadow: compact
          ? '0 8px 16px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.1)'
          : '0 12px 24px rgba(0,0,0,0.25), 0 6px 12px rgba(0,0,0,0.2), inset 0 1px 3px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.15)',
        transform: 'translateY(0)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        onHover?.(disc);
        if (!compact) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.25), inset 0 1px 3px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        onHover?.(null);
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = compact
          ? '0 8px 16px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.1)'
          : '0 12px 24px rgba(0,0,0,0.25), 0 6px 12px rgba(0,0,0,0.2), inset 0 1px 3px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.15)';
      }}

    >
      {/* Drag handle */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute -top-5 left-1/2 -translate-x-1/2 cursor-grab z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white/80 rounded-full shadow p-0.5 text-gray-700 hover:text-gray-900">
            <GripVertical className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col items-center justify-center text-center px-3 text-[0.85rem] sm:text-[0.9rem] leading-tight space-y-0.5">
        <h3
          className="font-extrabold text-lg sm:text-xl tracking-tight drop-shadow-sm"
          style={{ color: textColor }}
        >
          {disc.name}
        </h3>
        <p className="opacity-90">
          {disc.brand} • {disc.type} • {disc.stability}
        </p>

        {disc.flight && (
          <p className="font-medium opacity-80">
            {disc.flight.speed}/{disc.flight.glide}/{disc.flight.turn}/{disc.flight.fade}
          </p>
        )}

        {disc.plastic && <p className="italic opacity-90">Plastic: {disc.plastic}</p>}
        {(disc.weight || disc.wearLevel !== undefined) && (
          <p className="italic opacity-80">
            {disc.wearLevel !== undefined && `Wear: ${disc.wearLevel}`}
            {disc.wearLevel !== undefined && disc.weight ? ' • ' : ''}
            {disc.weight && `Weight: ${disc.weight}g`}
          </p>
        )}
      </div>

      {/* Edit/Delete */}
      {(onEdit || onDelete) && (
        <div className="flex justify-center gap-2 flex-wrap mt-2 text-xs sm:text-sm">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(disc);
              }}
              className="hover:underline"
              style={{ color: textColor }}
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="hover:underline"
              style={{ color: textColor }}
            >
              🗑️ Remove
            </button>
          )}
        </div>
      )}

      {/* Action Button */}
      {actionLabel && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleActionClick();
          }}
          className={`mt-2 rounded-full font-semibold text-xs sm:text-sm px-3 py-1 shadow-sm transition 
            ${
              textColor === 'black'
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
