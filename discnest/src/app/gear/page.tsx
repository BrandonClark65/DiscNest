'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import type { Disc } from '@/types/disc';
import DiscCard from '@/components/DiscCard';
import DiscEditModal from '@/components/DiscEditModal';
import DiscBagDisplay from '@/components/DiscbagDisplay';
import BagStats from '@/components/BagStats';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Disc as DiscIcon, ShoppingBag, Package } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';

/* ---------- Responsive breakpoint hook ---------- */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

/* ---------- Sortable Card Wrapper (Desktop DnD) ---------- */
function SortableDiscCard({
  disc,
  onAction,
  onDelete,
  onEdit,
  actionLabel,
}: {
  disc: Disc;
  onAction: () => void;
  onDelete: () => void;
  onEdit: (disc: Disc) => void;
  actionLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: disc._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <DiscCard
        disc={disc}
        actionLabel={actionLabel}
        onAction={onAction}
        onDelete={onDelete}
        onEdit={() => onEdit(disc)}
        circleView
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

/* ---------- Mobile Reorder (No Drag) ---------- */
function MobileReorderSection({
  discs,
  zone,
  actionLabel,
  onAction,
  onDelete,
  onEdit,
  onReorder,
  reorderMode,
}: {
  discs: Disc[];
  zone: 'shelf' | 'bag';
  actionLabel: string;
  onAction: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (disc: Disc) => void;
  onReorder: (ids: string[], zone: 'shelf' | 'bag') => Promise<void>;
  reorderMode: boolean;
}) {
  const [local, setLocal] = useState<Disc[]>(discs);
  useEffect(() => setLocal(discs), [discs]);

  const move = async (from: number, to: number) => {
    if (to < 0 || to >= local.length) return;
    const updated = [...local];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setLocal(updated);
    await onReorder(updated.map((d) => d._id), zone);
  };

  const moveToIndex = async (from: number, to: number) => {
    await move(from, to);
  };

  return (
    <div
      className="
        grid gap-6 justify-center
        grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
      "
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
    >
      {local.map((disc, idx) => (
        <div key={disc._id} className="relative">
          {reorderMode && (
            <div
              className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10
                       bg-white/80 backdrop-blur-md rounded-full px-2 py-1 shadow-sm"
            >
              <button
                className="px-2 py-1 text-xs rounded bg-white shadow hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation();
                  move(idx, idx - 1);
                }}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                className="px-2 py-1 text-xs rounded bg-white shadow hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation();
                  move(idx, idx + 1);
                }}
                aria-label="Move down"
              >
                ↓
              </button>
              <select
                className="px-1 py-1 text-xs rounded bg-white shadow"
                value={idx}
                onChange={(e) => {
                  e.stopPropagation();
                  moveToIndex(idx, Number(e.target.value));
                }}
                aria-label="Move to position"
              >
                {local.map((_, i) => (
                  <option key={i} value={i}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          <DiscCard
            disc={disc}
            actionLabel={actionLabel}
            onAction={() => onAction(disc._id)}
            onDelete={() => onDelete(disc._id)}
            onEdit={() => onEdit(disc)}
            circleView
          />
        </div>
      ))}
    </div>
  );
}

/* ---------- Main Page ---------- */
export default function GearPage() {
  const { data: session } = useSession();
  const [shelf, setShelf] = useState<Disc[]>([]);
  const [bag, setBag] = useState<Disc[]>([]);
  const [editingDisc, setEditingDisc] = useState<Disc | null>(null);
  const [mobileReorderMode, setMobileReorderMode] = useState(false);

  const isLoggedIn = !!session?.user;
  const isMobile = useIsMobile();
  const fieldMap = { shelf: 'discShelf', bag: 'bag' };

  const handleEdit = (disc: Disc) => setEditingDisc(disc);
  const closeModal = () => setEditingDisc(null);

  const fetchDiscs = async () => {
    if (!isLoggedIn) return;
    try {
      const [shelfRes, bagRes] = await Promise.all([
        fetch(`/api/user/discs/shelf`),
        fetch(`/api/user/discs/bag`),
      ]);
      if (!shelfRes.ok || !bagRes.ok) throw new Error('Failed to fetch discs');
      const shelfData = await shelfRes.json();
      const bagData = await bagRes.json();
      setShelf((shelfData.shelf || []).sort((a: Disc, b: Disc) => (a.order ?? 0) - (b.order ?? 0)));
      setBag((bagData.bag || []).sort((a: Disc, b: Disc) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (err) {
      console.error('❌ Error fetching discs:', err);
      toast.error('Failed to load discs. Please try again.');
    }
  };

  useEffect(() => {
    fetchDiscs();
  }, [isLoggedIn]);

  const persistReorder = async (orderedIds: string[], zone: 'shelf' | 'bag') => {
    try {
      const res = await fetch('/api/user/discs/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds, zone }),
      });
      if (!res.ok) throw new Error('Failed to save order');
    } catch {
      toast.error(`Could not save ${zone} order`);
    }
  };

  const moveDisc = async (discId: string, from: 'shelf' | 'bag', to: 'shelf' | 'bag') => {
    const res = await fetch('/api/user/discs/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discId, from: fieldMap[from], to: fieldMap[to] }),
    });
    if (res.ok) {
      toast.success(`Moved disc to ${to === 'bag' ? 'Bag' : 'Shelf'}!`);
      fetchDiscs();
    } else {
      toast.error('Failed to move disc');
    }
  };

  const deleteDisc = async (discId: string, target: 'shelf' | 'bag') => {
    const res = await fetch('/api/user/discs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discId, target: fieldMap[target] }),
    });
    if (res.ok) {
      toast.success('Disc removed!');
      fetchDiscs();
    } else {
      toast.error('Failed to delete disc');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;
    const oldShelfIndex = shelf.findIndex((d) => d._id === active.id);
    const newShelfIndex = shelf.findIndex((d) => d._id === over.id);
    if (oldShelfIndex !== -1 && newShelfIndex !== -1) {
      const newShelf = arrayMove(shelf, oldShelfIndex, newShelfIndex);
      setShelf(newShelf);
      await persistReorder(newShelf.map((d) => d._id), 'shelf');
      return;
    }
    const oldBagIndex = bag.findIndex((d) => d._id === active.id);
    const newBagIndex = bag.findIndex((d) => d._id === over.id);
    if (oldBagIndex !== -1 && newBagIndex !== -1) {
      const newBag = arrayMove(bag, oldBagIndex, newBagIndex);
      setBag(newBag);
      await persistReorder(newBag.map((d) => d._id), 'bag');
    }
  };

  return (
    <div className="relative">
      {editingDisc && <DiscEditModal disc={editingDisc} onClose={closeModal} onSave={fetchDiscs} />}

      <div className="max-w-6xl mx-auto p-6 space-y-12 relative">
        {/* ===== HEADER ===== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 drop-shadow-md tracking-tight">
            Your Gear
          </h1>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>

          <GradientButton
            label="Browse Disc Catalog"
            href="/catalog"
            icon={<DiscIcon className="w-5 h-5" />}
            variant="blue"
          />
        </motion.div>

        {/* ===== MAIN CONTENT ===== */}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {/* --- Shelf --- */}
          <GearSection
            title="Disc Shelf"
            icon={<Package className="w-5 h-5 text-green-600" />}
            discs={isLoggedIn ? shelf : []}
            emptyMessage="No discs here yet."
            zoneId="shelf"
            actionLabel="Move to Bag"
            onAction={(id) => moveDisc(id, 'shelf', 'bag')}
            onDelete={(id) => deleteDisc(id, 'shelf')}
            onEdit={handleEdit}
            sortable
            isMobile={isMobile}
            onReorder={persistReorder}
            reorderMode={mobileReorderMode}
            onToggleReorder={() => setMobileReorderMode((v) => !v)}
          />

          {/* --- Bag --- */}
          <GearSection
            title="Disc Bag"
            icon={<ShoppingBag className="w-5 h-5 text-green-600" />}
            discs={isLoggedIn ? bag : []}
            emptyMessage="No discs here yet."
            zoneId="bag"
            actionLabel="Move to Shelf"
            onAction={(id) => moveDisc(id, 'bag', 'shelf')}
            onDelete={(id) => deleteDisc(id, 'bag')}
            onEdit={handleEdit}
            sortable
            isMobile={isMobile}
            onReorder={persistReorder}
            reorderMode={mobileReorderMode}
            onToggleReorder={() => setMobileReorderMode((v) => !v)}
          />

          {isLoggedIn && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="flex justify-center mt-10"
            >
              <DiscBagDisplay bag={bag} />
            </motion.div>
          )}
        </DndContext>
      </div>
    </div>
  );
}

/* ---------- Gear Section ---------- */
function GearSection({
  title,
  icon,
  discs,
  zoneId,
  actionLabel,
  onAction,
  onDelete,
  onEdit,
  emptyMessage,
  sortable = false,
  isMobile = false,
  onReorder,
  reorderMode = false,
  onToggleReorder,
}: {
  title: string;
  icon?: React.ReactNode;
  discs: Disc[];
  zoneId: 'shelf' | 'bag' | string;
  actionLabel: string;
  onAction: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (disc: Disc) => void;
  emptyMessage: string;
  sortable?: boolean;
  isMobile?: boolean;
  onReorder?: (ids: string[], zone: 'shelf' | 'bag') => Promise<void>;
  reorderMode?: boolean;
  onToggleReorder?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId });

  const content =
    discs.length === 0 ? (
      <p className="text-gray-500 italic text-center py-8">{emptyMessage}</p>
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
          className="grid gap-6 justify-center grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
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
        className="grid gap-6 justify-center grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
      >
        {discs.map((disc) => (
          <DiscCard
            key={disc._id}
            disc={disc}
            actionLabel={actionLabel}
            onAction={() => onAction(disc._id)}
            onDelete={() => onDelete(disc._id)}
            onEdit={onEdit}
            circleView
          />
        ))}
      </div>
    );

  return (
    <section className="w-full mb-10">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-green-700">
            <span className="inline-block w-2 h-6 bg-green-500 rounded"></span>
            {icon}
            {title}
          </h2>
          {isMobile && sortable && (
            <GradientButton
              label={reorderMode ? 'Done Reordering' : 'Reorder'}
              onClick={onToggleReorder}
              variant={reorderMode ? 'green' : 'gray'}
              className="text-xs py-1 px-3"
            />
          )}
        </div>
      )}
      <div
        ref={setNodeRef}
        className={`transition p-2 rounded-lg ${isOver ? 'bg-green-50 ring-2 ring-green-400' : 'bg-white/50'}`}
      >
        {content}
      </div>
    </section>
  );
}
