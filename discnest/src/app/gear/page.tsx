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
import { motion } from 'framer-motion';
import { Disc as DiscIcon, ShoppingBag, Package } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton'; // ✅ NEW

export default function GearPage() {
  const { data: session } = useSession();
  const [shelf, setShelf] = useState<Disc[]>([]);
  const [bag, setBag] = useState<Disc[]>([]);
  const [editingDisc, setEditingDisc] = useState<Disc | null>(null);

  const isLoggedIn = !!session?.user;
  const fieldMap = { shelf: 'discShelf', bag: 'bag' };

  const handleEdit = (disc: Disc) => setEditingDisc(disc);
  const closeModal = () => setEditingDisc(null);

  // ✅ Unified fetch
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
      setShelf(shelfData.shelf || []);
      setBag(bagData.bag || []);
    } catch (err) {
      console.error('❌ Error fetching discs:', err);
      toast.error('Failed to load discs. Please try again.');
    }
  };

  useEffect(() => {
    fetchDiscs();
  }, [isLoggedIn]);

  const refreshDiscs = () => fetchDiscs();

  const moveDisc = async (discId: string, from: 'shelf' | 'bag', to: 'shelf' | 'bag') => {
    const res = await fetch('/api/user/discs/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discId, from: fieldMap[from], to: fieldMap[to] }),
    });
    if (res.ok) {
      toast.success(`Moved disc to ${to === 'bag' ? 'Bag' : 'Shelf'}!`);
      refreshDiscs();
    } else {
      const error = await res.json();
      toast.error(`Failed to move disc: ${error?.error || 'Unknown error'}`);
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
      refreshDiscs();
    } else {
      const error = await res.json();
      toast.error(`Failed to delete disc: ${error?.error || 'Unknown error'}`);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const discId = event.active.id as string;
    const targetZone = event.over?.id;
    if (!discId || !targetZone) return;

    const from = shelf.find((d) => d._id === discId) ? 'shelf' : 'bag';
    const to = targetZone === 'shelf' ? 'shelf' : 'bag';
    if (from !== to) moveDisc(discId, from, to);
  };

  // ✅ Responsive Layout
  return (
    <div className="relative">
      {editingDisc && (
        <DiscEditModal disc={editingDisc} onClose={closeModal} onSave={fetchDiscs} />
      )}

      <div
        className={`max-w-6xl mx-auto p-6 space-y-12 transition-all duration-300 relative`}
        style={{
          paddingRight: editingDisc ? '24rem' : undefined, // Prevents layout shift
        }}
      >
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

          {/* ✅ Updated to use GradientButton */}
          <GradientButton
            label="Browse Disc Catalog"
            href="/catalog"
            icon={<DiscIcon className="w-5 h-5" />}
            variant="blue"
          />
        </motion.div>

        {/* ===== MAIN CONTENT ===== */}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {/* === DISC SHELF === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <GearSection
              title="Disc Shelf"
              icon={<Package className="w-5 h-5 text-green-600" />}
              discs={isLoggedIn ? shelf : []}
              emptyMessage={isLoggedIn ? 'No discs here yet.' : 'Log in to fill your shelf'}
              zoneId="shelf"
              actionLabel="Move to Bag"
              onAction={(id) => moveDisc(id, 'shelf', 'bag')}
              onDelete={(id) => deleteDisc(id, 'shelf')}
              onEdit={handleEdit}
            />
          </motion.div>

          {/* === DISC BAG === */}
          <motion.section
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-green-700">
                <ShoppingBag className="w-5 h-5 text-green-600" />
                Disc Bag
              </h2>
              {isLoggedIn && <BagStats bag={bag} />}
            </div>

            <GearSection
              title=""
              discs={isLoggedIn ? bag : []}
              emptyMessage={isLoggedIn ? 'No discs here yet.' : 'Log in to fill your bag'}
              zoneId="bag"
              actionLabel="Move to Shelf"
              onAction={(id) => moveDisc(id, 'bag', 'shelf')}
              onDelete={(id) => deleteDisc(id, 'bag')}
              onEdit={handleEdit}
            />

            {/* Bag visual */}
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

/* ---------- Gear Section Component ---------- */
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
}: {
  title: string;
  icon?: React.ReactNode;
  discs: Disc[];
  zoneId: string;
  actionLabel: string;
  onAction: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (disc: Disc) => void;
  emptyMessage: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId });

  return (
    <section className="w-full mb-10">
      {title && (
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-green-700">
          <span className="inline-block w-2 h-6 bg-green-500 rounded"></span>
          {icon}
          {title}
        </h2>
      )}
      <div
        ref={setNodeRef}
        className={`transition p-2 rounded-lg ${
          isOver ? 'bg-green-50 ring-2 ring-green-400' : 'bg-white/50'
        }`}
      >
        {discs.length === 0 ? (
          <p className="text-gray-500 italic text-center py-8">{emptyMessage}</p>
        ) : (
          <div
            className="
              grid
              gap-6
              justify-center
              grid-cols-2
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
              xl:grid-cols-5
            "
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            {discs.map((disc) => (
              <DiscCard
                key={disc._id}
                disc={disc}
                actionLabel={actionLabel}
                onAction={() => onAction(disc._id)}
                onDelete={() => onDelete(disc._id)}
                onEdit={() => onEdit(disc)}
                isRecentlyAdded={false}
                circleView
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
