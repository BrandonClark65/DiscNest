'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Disc } from '@/types/disc';
import DiscCard from '@/components/DiscCard';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';

export default function GearPage() {
  const { data: session } = useSession();
  const [shelf, setShelf] = useState<Disc[]>([]);
  const [bag, setBag] = useState<Disc[]>([]);
  const email = session?.user?.email;

  useEffect(() => {
    if (!email) return;

    const fetchDiscs = async () => {
      const [shelfRes, bagRes] = await Promise.all([
        fetch(`/api/user/discs/shelf?email=${email}`),
        fetch(`/api/user/discs/bag?email=${email}`),
      ]);
      const shelfData = await shelfRes.json();
      const bagData = await bagRes.json();
      setShelf(shelfData.shelf || []);
      setBag(bagData.bag || []);
    };

    fetchDiscs();
  }, [email]);

  const moveDisc = async (discId: string, from: 'shelf' | 'bag', to: 'shelf' | 'bag') => {
    if (!email) return;

    await fetch('/api/user/discs/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, discId, from, to }),
    });

    const [shelfRes, bagRes] = await Promise.all([
      fetch(`/api/user/discs/shelf?email=${email}`),
      fetch(`/api/user/discs/bag?email=${email}`),
    ]);
    const shelfData = await shelfRes.json();
    const bagData = await bagRes.json();
    setShelf(shelfData.shelf || []);
    setBag(bagData.bag || []);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const discId = event.active.id as string;
    const targetZone = event.over?.id;

    if (!discId || !targetZone || !email) return;

    const from = shelf.find(d => d._id === discId) ? 'shelf' : 'bag';
    const to = targetZone === 'shelf' ? 'shelf' : 'bag';

    if (from !== to) moveDisc(discId, from, to);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <h1 className="text-3xl font-bold text-center text-green-700">Your Gear</h1>

      <div className="text-center">
        <a
          href="/catalog"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          ➕ Browse Disc Catalog
        </a>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <GearSection
          title="Disc Shelf"
          discs={shelf}
          zoneId="shelf"
          actionLabel="Move to Bag"
          onAction={(id) => moveDisc(id, 'shelf', 'bag')}
        />
        <GearSection
          title="Disc Bag"
          discs={bag}
          zoneId="bag"
          actionLabel="Move to Shelf"
          onAction={(id) => moveDisc(id, 'bag', 'shelf')}
        />
      </DndContext>
    </div>
  );
}

// import { useDroppable } from '@dnd-kit/core';

function GearSection({ title, discs, zoneId, actionLabel, onAction }: { title: string; discs: Disc[]; zoneId: string; actionLabel: string; onAction: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div
        ref={setNodeRef}
        className={`transition p-2 rounded ${isOver ? 'bg-green-50 ring-2 ring-green-400' : ''}`}
      >
        {discs.length === 0 ? (
          <p className="text-gray-500 italic">No discs here yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {discs.map((disc) => (
              <DiscCard
                key={disc._id}
                disc={disc}
                actionLabel={actionLabel}
                onAction={() => onAction(disc._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}