'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Disc } from '@/types/disc';
import DiscCard from '@/components/DiscCard';

export default function CatalogPage() {
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [filter, setFilter] = useState('');
  const { data: session } = useSession();
  const email = session?.user?.email;

  useEffect(() => {
    fetch('/api/discs')
      .then(res => res.json())
      .then((data: Disc[]) => setDiscs(data));
  }, []);

  const handleAdd = async (discId: string, target: 'shelf' | 'bag') => {
    if (!email) return;

    await fetch('/api/user/discs/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, discId, target }),
    });
  };

  const filtered = discs.filter(d =>
    d.name.toLowerCase().includes(filter.toLowerCase()) ||
    d.brand?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center text-green-700">Disc Catalog</h1>

      <input
        type="text"
        placeholder="Search by name or brand"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="w-full border px-4 py-2 rounded"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(disc => (
          <DiscCard
            key={disc._id}
            disc={disc}
            actionLabel="Add to Shelf"
            onAction={() => handleAdd(disc._id, 'shelf')}
          />
        ))}
      </div>
    </div>
  );
}