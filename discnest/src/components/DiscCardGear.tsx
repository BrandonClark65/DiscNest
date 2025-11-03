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
};

export default function DiscCardGear({
  disc,
  actionLabel,
  onAction,
  onEdit,
  onDelete,
  onHover,
  dragHandleProps,
}: DiscCardGearProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const baseColor = disc.color ?? '#ffffff';
  const textColor = getContrastColor(baseColor);

  const handleActionClick = () => {
    if (!isLoggedIn) {
      toast('Log in to manage your discs');
      return;
    }
    onAction?.();
  };

  return (
    <div
      onMouseEnter={() => onHover?.(disc)}
      onMouseLeave={() => onHover?.(null)}
      className="relative rounded-full border shadow-md flex flex-col items-center justify-center overflow-hidden cursor-pointer transition hover:ring-2 hover:ring-[var(--primary)]"
      style={{
        backgroundColor: baseColor,
        color: textColor,
        width: 'clamp(260px, 28vw, 320px)',
        height: 'clamp(260px, 28vw, 320px)',
        filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.25))',
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
