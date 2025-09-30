'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Disc } from '@/types/disc';
import DiscCard from '@/components/DiscCard';
import toast from 'react-hot-toast';


export default function CatalogPage() {
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [filter, setFilter] = useState('');
  const [hoveredDisc, setHoveredDisc] = useState<Disc | null>(null);
  const [addedDiscId, setAddedDiscId] = useState<string | null>(null);
  const { data: session } = useSession();
  const email = session?.user?.email;

  useEffect(() => {
    fetch('/api/discs')
      .then(res => res.json())
      .then((data: Disc[]) => setDiscs(data));
  }, []);

  const handleAdd = async (discId: string, target: 'shelf' | 'bag') => {
    if (!email) return;

    const disc = discs.find(d => d._id === discId); // 🔍 Get disc info for name
    const res = await fetch('/api/user/discs/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, discId, target }),
    });

    if (res.ok) {
      setAddedDiscId(discId);
      toast.success(`${disc?.name || 'Disc'} added to ${target === 'shelf' ? 'Shelf' : 'Bag'}!`);
      setTimeout(() => setAddedDiscId(null), 2000);
    } else {
      const error = await res.json();
      toast.error(`Failed to add ${disc?.name || 'disc'}: ${error?.error || 'Unknown error'}`);
    }
  };



  const filtered = discs.filter(d =>
    d.name.toLowerCase().includes(filter.toLowerCase()) ||
    d.brand?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 relative">
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
            onHover={setHoveredDisc}
            isRecentlyAdded={addedDiscId === disc._id}
          />
        ))}
      </div>

      {/* Hover Preview Sidebar */}
      <div
        className={`hidden md:block fixed top-20 right-8 w-96 bg-white border rounded-xl shadow-xl p-6 z-50 transition-opacity duration-300 ${
          hoveredDisc ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {hoveredDisc?.image && (
          <>
            <img
              src={hoveredDisc.image}
              alt={hoveredDisc.name}
              className="w-full h-64 object-contain mb-4"
            />
            <h3 className="text-xl font-bold text-center text-green-700">{hoveredDisc.name}</h3>
            <p className="text-sm text-gray-600 text-center">{hoveredDisc.brand}</p>
          </>
        )}
      </div>
    </div>
  );
}