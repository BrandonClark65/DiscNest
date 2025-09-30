'use client';

import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { useDraggable } from '@dnd-kit/core';
import type { Disc } from '@/types/disc';

type DiscCardProps = {
  disc: Disc;
  actionLabel?: string;
  onAction?: () => void;
  onDelete?: () => void;
  onHover?: (disc: Disc | null) => void;
  isRecentlyAdded?: boolean;
};

export default function DiscCard({
  disc,
  actionLabel,
  onAction,
  onDelete,
  onHover,
  isRecentlyAdded,
}: DiscCardProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: disc._id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onMouseEnter={() => onHover?.(disc)}
      onMouseLeave={() => onHover?.(null)}
      data-tooltip-id={`disc-${disc._id}`}
      data-tooltip-content={`Speed: ${disc.flight?.speed ?? '-'}, Glide: ${disc.flight?.glide ?? '-'}, Turn: ${disc.flight?.turn ?? '-'}, Fade: ${disc.flight?.fade ?? '-'}${disc.notes ? `\nNotes: ${disc.notes}` : ''}`}
      className={`border p-4 rounded shadow text-center bg-white cursor-grab transition ${
        isRecentlyAdded ? 'ring-2 ring-green-500' : 'hover:ring-2 hover:ring-green-500'
      }`}
    >
      {disc.image && (
        <img
          src={disc.image}
          alt={disc.name}
          className="w-20 h-20 mx-auto object-contain"
        />
      )}
      <h3 className="font-bold mt-2">{disc.name}</h3>
      <p className="text-sm text-gray-500">
        {disc.brand} • {disc.type} • {disc.stability}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-3 bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700"
        >
          {actionLabel}
        </button>
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          className="mt-2 text-red-600 hover:underline text-sm"
        >
          🗑️ Remove
        </button>
      )}

      <Tooltip id={`disc-${disc._id}`} place="top" />
    </div>
  );
}