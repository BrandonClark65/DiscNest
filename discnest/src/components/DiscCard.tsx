'use client';

import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import type { Disc } from '@/types/disc';
import { getContrastColor } from '@/lib/colors';

type DiscCardProps = {
  disc: Disc;
  actionLabel?: string;
  onAction?: () => void;
  onDelete?: () => void;
  onHover?: (disc: Disc | null) => void;
  onEdit?: (disc: Disc) => void;
  isRecentlyAdded?: boolean;
  className?: string;
};

export default function DiscCard({
  disc,
  actionLabel,
  onAction,
  onDelete,
  onHover,
  onEdit,
  isRecentlyAdded = false,
  className = '',
}: DiscCardProps) {
  const textColor = getContrastColor(disc.color ?? '#ffffff');

  const tooltipContent = [
    `Speed: ${disc.flight?.speed ?? '-'}`,
    `Glide: ${disc.flight?.glide ?? '-'}`,
    `Turn: ${disc.flight?.turn ?? '-'}`,
    `Fade: ${disc.flight?.fade ?? '-'}`,
    disc.plastic ? `Plastic: ${disc.plastic}` : null,
    disc.wearLevel !== undefined ? `Wear: ${disc.wearLevel}` : null,
    disc.notes ? `Notes: ${disc.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div
      onMouseEnter={() => onHover?.(disc)}
      onMouseLeave={() => onHover?.(null)}
      data-tooltip-id={`disc-${disc._id}`}
      data-tooltip-content={tooltipContent}
      className={`border p-4 rounded shadow flex flex-col justify-between transition ${className} ${
        isRecentlyAdded ? 'ring-2 ring-green-500' : 'hover:ring-2 hover:ring-green-500'
      }`}
      style={{ backgroundColor: disc.color ?? '#ffffff', color: textColor }}
    >
      {/* Disc Image */}
      {disc.image && (
        <img
          src={disc.image}
          alt={disc.name}
          className="w-20 h-20 mx-auto object-contain mb-2"
        />
      )}

      {/* Disc Info */}
      <div className="mb-2 text-center">
        <h3 className="font-bold" style={{ color: textColor }}>
          {disc.name}
        </h3>
        <p style={{ color: textColor }}>
          {disc.brand} • {disc.type} • {disc.stability}
        </p>
        {disc.plastic && <p className="italic" style={{ color: textColor }}>Plastic: {disc.plastic}</p>}
        {disc.wearLevel !== undefined && <p className="italic" style={{ color: textColor }}>Wear: {disc.wearLevel}</p>}
      </div>

      {/* Edit & Remove Buttons */}
      {(onEdit || onDelete) && (
        <div className="flex justify-center gap-2 mb-2">
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

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-auto bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700"
        >
          {actionLabel}
        </button>
      )}

      <Tooltip id={`disc-${disc._id}`} place="top" />
    </div>
  );
}

