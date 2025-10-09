'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Disc } from '@/types/disc';
import DiscCard from '@/components/DiscCard';
import toast from 'react-hot-toast';

export default function CatalogPage() {
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [hoveredDisc, setHoveredDisc] = useState<Disc | null>(null);
  const [addedDiscId, setAddedDiscId] = useState<string | null>(null);
  const { data: session } = useSession();
  const email = session?.user?.email;

  // Filters state
  const [filter, setFilter] = useState({
    search: '',
    brands: [] as string[],
    types: [] as string[],
    stabilities: [] as string[],
    speeds: [] as string[],
  });

  // Accordion state
  const [openSections, setOpenSections] = useState({
    brand: true,
    type: true,
    stability: true,
    speed: true,
  });

  useEffect(() => {
    fetch('/api/discs')
      .then(res => res.json())
      .then((data: Disc[]) => setDiscs(data));
  }, []);

  const handleAdd = async (discId: string, target: 'shelf' | 'bag') => {
    if (!email) return;
    const disc = discs.find(d => d._id === discId);
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

  // --- Distinct filter values ---
  const uniqueBrands = Array.from(new Set(discs.map(d => d.brand).filter(Boolean))).sort((a, b) => a!.localeCompare(b!)) as string[];

  // Custom order for disc types
const typeOrder = [
  'Putter',
  'Approach Discs',
  'Midrange',
  'Hybrid Driver',
  'Control Driver',
  'Distance Driver',
  'Disc Golf Sets',
];

  const uniqueTypes = Array.from(
    new Set(discs.map(d => d.type).filter(Boolean))
  ).sort((a, b) => {
    const indexA = typeOrder.indexOf(a!);
    const indexB = typeOrder.indexOf(b!);

    // If both types are recognized, sort by their order in the array
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // If only one is recognized, that one comes first
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // Otherwise, fall back to alphabetical
    return a!.localeCompare(b!);
  });
  const uniqueStabilities = Array.from(new Set(discs.map(d => d.stability).filter(Boolean))) as string[];
  const uniqueSpeeds = Array.from(new Set(discs.map(d => d.flight?.speed).filter((s): s is number => !!s))).sort((a, b) => a - b).map(String);

  // --- Filter logic ---
  const filtered = discs.filter(disc => {
    const matchesSearch =
      (disc.name?.toLowerCase() || '').includes(filter.search.toLowerCase()) ||
      (disc.brand?.toLowerCase() || '').includes(filter.search.toLowerCase());

    const matchesBrand =
      filter.brands.length === 0 || filter.brands.includes(disc.brand || '');

    const matchesType =
      filter.types.length === 0 || filter.types.includes(disc.type || '');

    const matchesStability =
      filter.stabilities.length === 0 || filter.stabilities.includes(disc.stability || '');

    const matchesSpeed =
      filter.speeds.length === 0 || filter.speeds.includes(String(disc.flight?.speed || ''));

    return matchesSearch && matchesBrand && matchesType && matchesStability && matchesSpeed;
  });

  // --- Handlers ---
  const toggleAccordion = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCheckboxChange = (key: keyof typeof filter, value: string) => {
    setFilter(prev => {
      const list = prev[key] as string[];
      return {
        ...prev,
        [key]: list.includes(value)
          ? list.filter(v => v !== value)
          : [...list, value],
      };
    });
  };

  const handleClearFilters = () => {
    setFilter({
      search: '',
      brands: [],
      types: [],
      stabilities: [],
      speeds: [],
    });
  };

  // --- UI ---
  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6 relative">
      {/* Sidebar Filters */}
      <aside className="md:col-span-1 space-y-4 pt-2 md:pt-8">
        <button
          onClick={handleClearFilters}
          className="text-sm text-gray-600 underline hover:text-green-700"
        >
          Clear Filters
        </button>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or brand"
          value={filter.search}
          onChange={e => setFilter(prev => ({ ...prev, search: e.target.value }))}
          className="w-full border px-3 py-2 rounded"
        />

        {/* Accordion Filter Groups */}
        <div className="border rounded-md">
          {/* Brand */}
          <div>
            <button
              onClick={() => toggleAccordion('brand')}
              className="w-full text-left font-medium px-3 py-2 border-b flex justify-between"
            >
              <span>Brand</span>
              <span>{openSections.brand ? '−' : '+'}</span>
            </button>
            {openSections.brand && (
              <div className="p-3 space-y-1">
                {uniqueBrands.map(brand => (
                  <label key={brand} className="block text-sm">
                    <input
                      type="checkbox"
                      checked={filter.brands.includes(brand)}
                      onChange={() => handleCheckboxChange('brands', brand)}
                      className="mr-2"
                    />
                    {brand}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <button
              onClick={() => toggleAccordion('type')}
              className="w-full text-left font-medium px-3 py-2 border-b flex justify-between"
            >
              <span>Type</span>
              <span>{openSections.type ? '−' : '+'}</span>
            </button>
            {openSections.type && (
              <div className="p-3 space-y-1">
                {uniqueTypes.filter(Boolean).map(type => (
                  <label key={type} className="block text-sm">
                    <input
                      type="checkbox"
                      checked={filter.types.includes(type!)} // type! asserts it is not undefined
                      onChange={() => handleCheckboxChange('types', type!)}
                      className="mr-2"
                    />
                    {type}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Stability */}
          <div>
            <button
              onClick={() => toggleAccordion('stability')}
              className="w-full text-left font-medium px-3 py-2 border-b flex justify-between"
            >
              <span>Stability</span>
              <span>{openSections.stability ? '−' : '+'}</span>
            </button>
            {openSections.stability && (
              <div className="p-3 space-y-1">
                {uniqueStabilities.map(stab => (
                  <label key={stab} className="block text-sm">
                    <input
                      type="checkbox"
                      checked={filter.stabilities.includes(stab)}
                      onChange={() => handleCheckboxChange('stabilities', stab)}
                      className="mr-2"
                    />
                    {stab}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Speed */}
          <div>
            <button
              onClick={() => toggleAccordion('speed')}
              className="w-full text-left font-medium px-3 py-2 flex justify-between"
            >
              <span>Speed</span>
              <span>{openSections.speed ? '−' : '+'}</span>
            </button>
            {openSections.speed && (
              <div className="p-3 space-y-1">
                {uniqueSpeeds.map(speed => (
                  <label key={speed} className="block text-sm">
                    <input
                      type="checkbox"
                      checked={filter.speeds.includes(speed)}
                      onChange={() => handleCheckboxChange('speeds', speed)}
                      className="mr-2"
                    />
                    {speed}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Catalog */}
      <div className="md:col-span-3 space-y-4">
        <h1 className="text-2xl font-bold text-center text-green-700">Disc Catalog</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

        {filtered.length === 0 && (
          <p className="text-center text-gray-500 mt-8">No discs match your filters.</p>
        )}
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



