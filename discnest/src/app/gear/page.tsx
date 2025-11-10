'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Disc as DiscIcon, ShoppingBag, Package } from 'lucide-react';

import type { Disc } from '@/types/disc';
import GradientButton from '@/components/ui/GradientButton';
import ShareButton from '@/components/ui/ShareButton';
import DiscEditModal from '@/components/DiscEditModal';
import BagStats from '@/components/BagStats';
import BagAnalyzer from '@/components/BagAnalyzer';
import DiscBagDisplay from '@/components/DiscbagDisplay';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';

import GearSection from '@/components/gear/GearSection';
import useIsMobile from '@/components/gear/useIsMobile';

export default function GearPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const isMobile = useIsMobile();

  const [shelf, setShelf] = useState<Disc[]>([]);
  const [bag, setBag] = useState<Disc[]>([]);
  const [editingDisc, setEditingDisc] = useState<Disc | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [mobileReorderMode, setMobileReorderMode] = useState(false);

  const fieldMap = { shelf: 'discShelf', bag: 'bag' };

  /* --------------------- Fetch Share URL --------------------- */
  useEffect(() => {
    if (!isLoggedIn || shareUrl) return;
    (async () => {
      try {
        const res = await fetch('/api/user/discs/share', { method: 'POST' });
        const data = await res.json();
        setShareUrl(data.shareUrl);
      } catch {
        toast.error('Could not create share link.');
      }
    })();
  }, [isLoggedIn, shareUrl]);

  /* --------------------- Fetch Discs --------------------- */
  const fetchDiscs = async () => {
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
  };

  useEffect(() => {
    fetchDiscs();
  }, [isLoggedIn]);

  /* --------------------- CRUD Actions --------------------- */
  async function moveDisc(discId: string, from: 'shelf' | 'bag', to: 'shelf' | 'bag') {
    const res = await fetch('/api/user/discs/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discId, from: fieldMap[from], to: fieldMap[to] }),
    });
    if (res.ok) {
      toast.success(`Moved to ${to}!`);
      fetchDiscs();
    } else toast.error('Failed to move disc');
  }

  async function deleteDisc(discId: string, target: 'shelf' | 'bag') {
    const res = await fetch('/api/user/discs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discId, target: fieldMap[target] }),
    });
    if (res.ok) {
      toast.success('Disc removed!');
      fetchDiscs();
    } else toast.error('Failed to delete disc');
  }

  async function handleSaveDisc(updated: Partial<Disc> & { discId: string }) {
    try {
      const res = await fetch('/api/user/discs/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error();
      toast.success('Disc updated!');
      setEditingDisc(null);
      fetchDiscs();
    } catch {
      toast.error('Failed to save disc.');
    }
  }

  async function persistReorder(orderedIds: string[], zone: 'shelf' | 'bag') {
    try {
      await fetch('/api/user/discs/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds, zone }),
      });
    } catch {
      toast.error(`Could not save ${zone} order`);
    }
  }

  /* --------------------- Drag & Drop --------------------- */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const reorderList = async (arr: Disc[], setArr: any, zone: 'shelf' | 'bag') => {
      const oldIndex = arr.findIndex((d) => d._id === active.id);
      const newIndex = arr.findIndex((d) => d._id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(arr, oldIndex, newIndex);
        setArr(reordered);
        await persistReorder(reordered.map((d) => d._id), zone);
      }
    };

    await reorderList(shelf, setShelf, 'shelf');
    await reorderList(bag, setBag, 'bag');
  };

  /* --------------------- Render --------------------- */
  return (
    <div className="relative">
      {editingDisc && (
        <DiscEditModal
          disc={editingDisc}
          onClose={() => setEditingDisc(null)}
          onSave={handleSaveDisc}
        />
      )}

      <div className="max-w-6xl mx-auto p-6 space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="h1 text-gradient-brand">Your Gear</h1>
          <GradientButton
            label="Browse Disc Catalog"
            href="/catalog"
            icon={<DiscIcon className="w-5 h-5" />}
            variant="brand"
          />
        </motion.div>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <GearSection
            title="Disc Shelf"
            icon={<Package className="w-5 h-5 text-[var(--primary)]" />}
            discs={shelf}
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

          <motion.section className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-[var(--primary)]">
                  <ShoppingBag className="w-5 h-5" /> Disc Bag
                </h2>
                <BagStats bag={bag} />
              </div>
              {shareUrl && (
                <ShareButton
                  title="My Disc Bag"
                  text="Check out my disc bag on DiscNest!"
                  url={shareUrl}
                />
              )}
            </div>

            {bag.length > 0 && (
              <>
                <BagAnalyzer bag={bag} />
                <PersonalizedRecommendations />
              </>
            )}

            <GearSection
              title=""
              discs={bag}
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

            <motion.div className="flex justify-center mt-10">
              <DiscBagDisplay bag={bag} />
            </motion.div>
          </motion.section>
        </DndContext>
      </div>
    </div>
  );
}
