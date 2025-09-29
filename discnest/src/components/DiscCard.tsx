'use client';

import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { useDraggable } from '@dnd-kit/core';
import type { Disc } from '@/types/disc';

export default function DiscCard({ disc, actionLabel, onAction }: { disc: Disc; actionLabel?: string; onAction?: () => void }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: disc._id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-tooltip-id={`disc-${disc._id}`}
      data-tooltip-content={
        `Speed: ${disc.flight?.speed ?? '-'}, Glide: ${disc.flight?.glide ?? '-'}, Turn: ${disc.flight?.turn ?? '-'}, Fade: ${disc.flight?.fade ?? '-'}${disc.notes ? `\nNotes: ${disc.notes}` : ''}`
      }
      className="border p-4 rounded shadow text-center bg-white cursor-grab hover:ring-2 hover:ring-green-500 transition"
    >
      {disc.image && (
        <img src={disc.image} alt={disc.name} className="w-20 h-20 mx-auto object-contain" />
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
      <Tooltip id={`disc-${disc._id}`} place="top" />
    </div>
  );
}