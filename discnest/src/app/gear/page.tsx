'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import type { Disc } from '@/types/disc';
import DiscCardGear from '@/components/DiscCardGear';
import DiscEditModal from '@/components/DiscEditModal';
import DiscBagDisplay from '@/components/DiscbagDisplay';
import ShareButton from '@/components/ui/ShareButton';
import BagStats from '@/components/BagStats';
import BagAnalyzer from '@/components/BagAnalyzer';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
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

/* ---------- Sortable Disc Card ---------- */
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

/* ---------- Mobile Reorder Section ---------- */
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

  return (
    <div
      className="grid gap-6 justify-center grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
    >
      {local.map((disc, idx) => (
        <div key={disc._id} className="relative">
          {reorderMode && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 bg-[var(--background)]/80 backdrop-blur-md rounded-full px-2 py-1 shadow-sm border border-[var(--muted)]/40">
              <button
                className="px-2 py-1 text-xs rounded bg-[var(--surface)] shadow hover:bg-[var(--muted)]/20"
                onClick={(e) => {
                  e.stopPropagation();
                  move(idx, idx - 1);
                }}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                className="px-2 py-1 text-xs rounded bg-[var(--surface)] shadow hover:bg-[var(--muted)]/20"
                onClick={(e) => {
                  e.stopPropagation();
                  move(idx, idx + 1);
                }}
                aria-label="Move down"
              >
                ↓
              </button>
            </div>
          )}
          <DiscCardGear
            disc={disc}
            actionLabel={actionLabel}
            onAction={() => onAction(disc._id)}
            onEdit={() => onEdit(disc)}
            onDelete={() => onDelete(disc._id)}
          />
        </div>
      ))}
    </div>
  );
}

/* ---------- Main Gear Page ---------- */
export default function GearPage() {
  const { data: session } = useSession();
  const [shelf, setShelf] = useState<Disc[]>([]);
  const [bag, setBag] = useState<Disc[]>([]);
  const [editingDisc, setEditingDisc] = useState<Disc | null>(null);
  const [mobileReorderMode, setMobileReorderMode] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');

  const isLoggedIn = !!session?.user;
  const isMobile = useIsMobile();
  const fieldMap = { shelf: 'discShelf', bag: 'bag' };

  async function fetchShareUrl() {
    try {
      const res = await fetch('/api/user/discs/share', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate share link');
      const data = await res.json();
      setShareUrl(data.shareUrl);
    } catch {
      toast.error('Could not create share link.');
    }
  }

  useEffect(() => {
    if (!isLoggedIn || shareUrl) return;
    fetchShareUrl();
  }, [isLoggedIn, shareUrl]);

  async function fetchDiscs() {
    if (!isLoggedIn) return;
    try {
      const [shelfRes, bagRes] = await Promise.all([
        fetch(`/api/user/discs/shelf`),
        fetch(`/api/user/discs/bag`),
      ]);
      const shelfData = await shelfRes.json();
      const bagData = await bagRes.json();
      setShelf((shelfData.shelf || []).sort((a: Disc, b: Disc) => (a.order ?? 0) - (b.order ?? 0)));
      setBag((bagData.bag || []).sort((a: Disc, b: Disc) => (a.order ?? 0) - (b.order ?? 0)));
    } catch {
      toast.error('Failed to load discs.');
    }
  }

  useEffect(() => {
    fetchDiscs();
  }, [isLoggedIn]);

  const handleSaveDisc = async (updated: Partial<Disc> & { discId: string }) => {
    try {
      const res = await fetch('/api/user/discs/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Failed to update disc');
      toast.success('Disc updated successfully!');
      await fetchDiscs();
      setEditingDisc(null);
    } catch {
      toast.error('Failed to save changes');
    }
  };

  const persistReorder = async (orderedIds: string[], zone: 'shelf' | 'bag') => {
    try {
      await fetch('/api/user/discs/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds, zone }),
      });
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
    } else toast.error('Failed to move disc');
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
    } else toast.error('Failed to delete disc');
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
      {editingDisc && (
        <DiscEditModal disc={editingDisc} onClose={() => setEditingDisc(null)} onSave={handleSaveDisc} />
      )}

      <div className="max-w-6xl mx-auto p-6 space-y-12 relative text-foreground">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <h1 className="h1">
            <span className="text-gradient-brand">Your Gear</span>
          </h1>
          <GradientButton
            label="Browse Disc Catalog"
            href="/catalog"
            icon={<DiscIcon className="w-5 h-5" />}
            variant="brand"
            className="px-5 py-2.5"
          />
        </motion.div>

        {/* SHELF + BAG */}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <GearSection
            title="Disc Shelf"
            icon={<Package className="w-5 h-5 text-[var(--primary)]" />}
            discs={isLoggedIn ? shelf : []}
            emptyMessage="No discs here yet."
            zoneId="shelf"
            actionLabel="Move to Bag"
            onAction={(id) => moveDisc(id, 'shelf', 'bag')}
            onDelete={(id) => deleteDisc(id, 'shelf')}
            onEdit={setEditingDisc}
            sortable
            isMobile={isMobile}
            onReorder={persistReorder}
            reorderMode={mobileReorderMode}
            onToggleReorder={() => setMobileReorderMode((v) => !v)}
          />

          <motion.section
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-[var(--primary)]">
                  <ShoppingBag className="w-5 h-5 text-[var(--primary)]" />
                  Disc Bag
                </h2>
                {isLoggedIn && <BagStats bag={bag} />}
              </div>
              {isLoggedIn && shareUrl && (
                <ShareButton
                  title="My Disc Bag"
                  text="Check out my disc bag on DiscNest!"
                  url={shareUrl}
                />
              )}
            </div>
            {/* Bag Analyzer and recommendations */}
            {isLoggedIn && bag.length > 0 && (
              <>
                <BagAnalyzer bag={bag} />
                <PersonalizedRecommendations />
              </>
            )}
            <GearSection
              title=""
              discs={isLoggedIn ? bag : []}
              emptyMessage="No discs here yet."
              zoneId="bag"
              actionLabel="Move to Shelf"
              onAction={(id) => moveDisc(id, 'bag', 'shelf')}
              onDelete={(id) => deleteDisc(id, 'bag')}
              onEdit={setEditingDisc}
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
          </motion.section>
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
  emptyMessage = 'No discs here yet.',
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
      <SortableContext items={discs.map((d: Disc) => d._id)} strategy={verticalListSortingStrategy}>
        <div
          className="grid gap-6 justify-center grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
        >
          {discs.map((disc: Disc) => (
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
        {discs.map((disc: Disc) => (
          <DiscCardGear
            key={disc._id}
            disc={disc}
            actionLabel={actionLabel}
            onAction={() => onAction(disc._id)}
            onEdit={onEdit}
            onDelete={() => onDelete(disc._id)}
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
