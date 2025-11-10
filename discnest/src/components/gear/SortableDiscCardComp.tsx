'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Disc } from '@/types/disc';
import DiscCardGear from '@/components/DiscCardGear';

type SortableDiscCardProps = {
  disc: Disc;
  onAction: () => void;
  onDelete: () => void;
  onEdit: (disc: Disc) => void;
  actionLabel: string;
};

/** Wrapper for DiscCardGear that makes it draggable within DnD contexts */
export default function SortableDiscCard({
  disc,
  onAction,
  onDelete,
  onEdit,
  actionLabel,
}: SortableDiscCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: disc._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <DiscCardGear
        disc={disc}
        actionLabel={actionLabel}
        onAction={onAction}
        onEdit={() => onEdit(disc)}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
