'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Disc } from '@/types/disc';
import SortableDiscCard from './SortableDiscCardComp';
import MobileReorderSection from './MobileReorderSection';
import GradientButton from '@/components/ui/GradientButton';

type GearSectionProps = {
  title: string;
  icon?: React.ReactNode;
  discs: Disc[];
  zoneId: 'shelf' | 'bag' | string;
  actionLabel: string;
  onAction: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (disc: Disc) => void;
  emptyMessage?: string;
  sortable?: boolean;
  isMobile?: boolean;
  onReorder?: (ids: string[], zone: 'shelf' | 'bag') => Promise<void>;
  reorderMode?: boolean;
  onToggleReorder?: () => void;
  loading?: boolean;
};

/** Generic grid section (shelf or bag) supporting sorting & mobile reorder */
export default function GearSection({
  title,
  icon,
  discs,
  zoneId,
  actionLabel,
  onAction,
  onDelete,
  onEdit,
  emptyMessage = 'No discs here yet.',
  sortable = false,
  isMobile = false,
  onReorder,
  reorderMode = false,
  onToggleReorder,
  loading = false,
}: GearSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId });

  const content =
      loading ? (
        <p className="text-muted italic text-center py-8">Loading discs...</p>
      ) : discs.length === 0 ? (
        <p className="text-muted italic text-center py-8">{emptyMessage}</p>
      ) : sortable && isMobile && (zoneId === 'shelf' || zoneId === 'bag') && onReorder ? (
        <MobileReorderSection
          discs={discs}
          zone={zoneId as 'shelf' | 'bag'}
          actionLabel={actionLabel}
          onAction={onAction}
          onDelete={onDelete}
          onEdit={onEdit}
          onReorder={onReorder}
          reorderMode={reorderMode}
        />
      ) : sortable ? (
      <SortableContext items={discs.map((d) => d._id)} strategy={verticalListSortingStrategy}>
        <div
          className="grid gap-6 justify-center grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
        >
          {discs.map((disc) => (
            <SortableDiscCard
              key={disc._id}
              disc={disc}
              actionLabel={actionLabel}
              onAction={() => onAction(disc._id)}
              onDelete={() => onDelete(disc._id)}
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
    ) : (
      <div
        className="grid gap-6 justify-center grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
      >
        {discs.map((disc) => (
          <SortableDiscCard
            key={disc._id}
            disc={disc}
            actionLabel={actionLabel}
            onAction={() => onAction(disc._id)}
            onDelete={() => onDelete(disc._id)}
            onEdit={onEdit}
          />
        ))}
      </div>
    );

  return (
    <section className="w-full mb-10">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-[var(--primary)]">
            {icon}
            {title}
          </h2>
          {isMobile && sortable && (
            <GradientButton
              label={reorderMode ? 'Done Reordering' : 'Reorder'}
              onClick={onToggleReorder}
              variant={reorderMode ? 'brand' : 'muted'}
              className="text-xs px-3 py-1.5"
            />
          )}
        </div>
      )}

      <div
        ref={setNodeRef}
        className={`transition p-2 rounded-lg ${
          isOver ? 'bg-[var(--surface)] ring-2 ring-[var(--primary)]/50' : 'bg-[var(--background)]/70'
        }`}
      >
        {content}
      </div>
    </section>
  );
}
