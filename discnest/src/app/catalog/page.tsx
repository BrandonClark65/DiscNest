'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Disc } from '@/types/disc';
import DiscCardCatalog from '@/components/DiscCardCatalog';
import toast from 'react-hot-toast';
import GradientButton from '@/components/ui/GradientButton';
import { Filter } from 'lucide-react';

export default function CatalogPage() {
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [hoveredDisc, setHoveredDisc] = useState<Disc | null>(null);
  const [addedDiscId, setAddedDiscId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: session } = useSession();
  const email = session?.user?.email;

  const discsPerPage = 24;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch discs & sort alphabetically
  useEffect(() => {
    fetch('/api/discs')
      .then((res) => res.json())
      .then((data: Disc[]) => {
        const sorted = [...data].sort((a, b) => {
          const brandCompare = (a.brand || '').localeCompare(b.brand || '', undefined, { sensitivity: 'base' });
          if (brandCompare !== 0) return brandCompare;
          return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        });
        setDiscs(sorted);
      });
  }, []);

  const handleAdd = async (discId: string, target: 'shelf' | 'bag') => {
    if (!email) return;
    const disc = discs.find((d) => d._id === discId);
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

  // --- Filters ---
  const [filter, setFilter] = useState({
    search: '',
    brands: [] as string[],
    types: [] as string[],
    stabilities: [] as string[],
    speeds: [] as string[],
  });

  const [openSections, setOpenSections] = useState({
    brand: true,
    type: true,
    stability: true,
    speed: true,
  });

  const uniqueBrands = Array.from(new Set(discs.map((d) => d.brand).filter(Boolean))).sort((a, b) =>
    a!.localeCompare(b!)
  ) as string[];

  const typeOrder = ['Putter', 'Approach Discs', 'Midrange', 'Hybrid Driver', 'Control Driver', 'Distance Driver', 'Disc Golf Sets'];

  const uniqueTypes = Array.from(new Set(discs.map((d) => d.type).filter(Boolean))).sort((a, b) => {
    const indexA = typeOrder.indexOf(a!);
    const indexB = typeOrder.indexOf(b!);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a!.localeCompare(b!);
  });

  const uniqueStabilities = Array.from(new Set(discs.map((d) => d.stability).filter(Boolean))) as string[];
  const uniqueSpeeds = Array.from(
    new Set(discs.map((d) => d.flight?.speed).filter((s): s is number => !!s))
  )
    .sort((a, b) => a - b)
    .map(String);

  const filtered = discs.filter((disc) => {
    const matchesSearch =
      (disc.name?.toLowerCase() || '').includes(filter.search.toLowerCase()) ||
      (disc.brand?.toLowerCase() || '').includes(filter.search.toLowerCase());

    const matchesBrand = filter.brands.length === 0 || filter.brands.includes(disc.brand || '');
    const matchesType = filter.types.length === 0 || filter.types.includes(disc.type || '');
    const matchesStability = filter.stabilities.length === 0 || filter.stabilities.includes(disc.stability || '');
    const matchesSpeed = filter.speeds.length === 0 || filter.speeds.includes(String(disc.flight?.speed || ''));

    return matchesSearch && matchesBrand && matchesType && matchesStability && matchesSpeed;
  });

  const totalPages = Math.ceil(filtered.length / discsPerPage);
  const startIndex = (currentPage - 1) * discsPerPage;
  const endIndex = startIndex + discsPerPage;
  const paginated = filtered.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentPage(page);
    }
  };

  const toggleAccordion = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCheckboxChange = (key: keyof typeof filter, value: string) => {
    setFilter((prev) => {
      const list = prev[key] as string[];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilter({ search: '', brands: [], types: [], stabilities: [], speeds: [] });
    setCurrentPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6 relative text-foreground">
      {/* Mobile Filter Overlay */}
      {isMobile && filtersOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setFiltersOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-11/12 max-w-xs bg-surface z-50 p-4 overflow-y-auto shadow-lg border-r border-muted/30">
            <button
              onClick={() => setFiltersOpen(false)}
              className="mb-4 text-sm underline text-accent"
            >
              Close Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="mb-4 text-sm text-muted underline hover:text-accent"
            >
              Clear Filters
            </button>

            {(['brand', 'type', 'stability', 'speed'] as const).map((section) => (
              <div key={section} className="border border-muted/30 rounded-md mb-2">
                <button
                  onClick={() => toggleAccordion(section)}
                  className="w-full text-left font-medium px-3 py-2 flex justify-between text-foreground"
                >
                  <span>{section.charAt(0).toUpperCase() + section.slice(1)}</span>
                  <span>{openSections[section] ? '−' : '+'}</span>
                </button>
                {openSections[section] && (
                  <div className="p-3 space-y-1 max-h-48 overflow-y-auto">
                    {section === 'brand' &&
                      uniqueBrands.map((value) => (
                        <label key={value} className="block text-sm">
                          <input
                            type="checkbox"
                            checked={filter.brands.includes(value)}
                            onChange={() => handleCheckboxChange('brands', value)}
                            className="mr-2 accent-[var(--primary)]"
                          />
                          {value}
                        </label>
                      ))}
                    {section === 'type' &&
                      uniqueTypes.map((value) => (
                        <label key={value} className="block text-sm">
                          <input
                            type="checkbox"
                            checked={filter.types.includes(value!)}
                            onChange={() => handleCheckboxChange('types', value!)}
                            className="mr-2 accent-[var(--primary)]"
                          />
                          {value}
                        </label>
                      ))}
                    {section === 'stability' &&
                      uniqueStabilities.map((value) => (
                        <label key={value} className="block text-sm">
                          <input
                            type="checkbox"
                            checked={filter.stabilities.includes(value)}
                            onChange={() => handleCheckboxChange('stabilities', value)}
                            className="mr-2 accent-[var(--primary)]"
                          />
                          {value}
                        </label>
                      ))}
                    {section === 'speed' &&
                      uniqueSpeeds.map((value) => (
                        <label key={value} className="block text-sm">
                          <input
                            type="checkbox"
                            checked={filter.speeds.includes(value)}
                            onChange={() => handleCheckboxChange('speeds', value)}
                            className="mr-2 accent-[var(--primary)]"
                          />
                          {value}
                        </label>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </aside>
        </>
      )}

      {/* Sidebar Filters (Desktop) */}
      {!isMobile && (
        <aside className="md:col-span-1 space-y-4 pt-2 md:pt-8">
          <button
            onClick={handleClearFilters}
            className="text-sm text-muted underline hover:text-accent"
          >
            Clear Filters
          </button>
          <input
            type="text"
            placeholder="Search by name or brand"
            value={filter.search}
            onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
            className="w-full border border-muted/30 bg-surface text-foreground px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="border border-muted/30 rounded-md">
            {(['brand', 'type', 'stability', 'speed'] as const).map((section) => (
              <div key={section}>
                <button
                  onClick={() => toggleAccordion(section)}
                  className="w-full text-left font-medium px-3 py-2 border-b border-muted/20 flex justify-between text-foreground"
                >
                  <span>{section.charAt(0).toUpperCase() + section.slice(1)}</span>
                  <span>{openSections[section] ? '−' : '+'}</span>
                </button>
                {openSections[section] && (
                  <div className="p-3 space-y-1 max-h-48 overflow-y-auto">
                    {section === 'brand' &&
                      uniqueBrands.map((value) => (
                        <label key={value} className="block text-sm">
                          <input
                            type="checkbox"
                            checked={filter.brands.includes(value)}
                            onChange={() => handleCheckboxChange('brands', value)}
                            className="mr-2 accent-[var(--primary)]"
                          />
                          {value}
                        </label>
                      ))}
                    {section === 'type' &&
                      uniqueTypes.map((value) => (
                        <label key={value} className="block text-sm">
                          <input
                            type="checkbox"
                            checked={filter.types.includes(value!)}
                            onChange={() => handleCheckboxChange('types', value!)}
                            className="mr-2 accent-[var(--primary)]"
                          />
                          {value}
                        </label>
                      ))}
                    {section === 'stability' &&
                      uniqueStabilities.map((value) => (
                        <label key={value} className="block text-sm">
                          <input
                            type="checkbox"
                            checked={filter.stabilities.includes(value)}
                            onChange={() => handleCheckboxChange('stabilities', value)}
                            className="mr-2 accent-[var(--primary)]"
                          />
                          {value}
                        </label>
                      ))}
                    {section === 'speed' &&
                      uniqueSpeeds.map((value) => (
                        <label key={value} className="block text-sm">
                          <input
                            type="checkbox"
                            checked={filter.speeds.includes(value)}
                            onChange={() => handleCheckboxChange('speeds', value)}
                            className="mr-2 accent-[var(--primary)]"
                          />
                          {value}
                        </label>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Main Catalog */}
      <div className="md:col-span-3 space-y-4">
        {isMobile && (
          <GradientButton
            label="Filters"
            icon={<Filter size={18} />}
            onClick={() => setFiltersOpen(true)}
            variant="primary"
            className="mb-4 px-4 py-2"
          />
        )}

        <h1 className="h1 text-center">
          <span className="text-gradient-brand">Disc Catalog</span>
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginated.map((disc) => (
            <DiscCardCatalog
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
          <p className="text-center text-muted mt-8">No discs match your filters.</p>
        )}

        {/* Pagination Controls */}
        {filtered.length > discsPerPage && (
          <div className="flex justify-center items-center gap-1 mt-8 flex-wrap">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-muted/30 rounded bg-surface hover:bg-muted/20 disabled:opacity-50"
            >
              Prev
            </button>

            {(() => {
              const windowSize = 2;
              const pages: (number | string)[] = [];

              pages.push(1);
              if (currentPage - windowSize > 2) pages.push('...');
              for (let i = Math.max(2, currentPage - windowSize); i <= Math.min(totalPages - 1, currentPage + windowSize); i++) {
                pages.push(i);
              }
              if (currentPage + windowSize < totalPages - 1) pages.push('...');
              if (totalPages > 1) pages.push(totalPages);

              return pages.map((page, idx) =>
                typeof page === 'number' ? (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 border border-muted/30 rounded transition-all ${
                      page === currentPage
                        ? 'bg-gradient-brand text-white'
                        : 'bg-surface hover:bg-muted/20 text-foreground'
                    }`}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={idx} className="px-2 text-muted">
                    {page}
                  </span>
                )
              );
            })()}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-muted/30 rounded bg-surface hover:bg-muted/20 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Hover Preview Modal */}
      {hoveredDisc && (
        <div
          className={`fixed z-50 bg-surface border border-muted/30 rounded-xl shadow-xl transition-all ${
            isMobile
              ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-h-[90vh] overflow-y-auto p-4'
              : 'top-20 right-8 w-96 p-6'
          }`}
        >
          {isMobile && (
            <button
              onClick={() => setHoveredDisc(null)}
              className="absolute top-2 right-2 text-muted hover:text-accent"
            >
              ✕
            </button>
          )}
          {hoveredDisc.image && (
            <>
              <img
                src={hoveredDisc.image}
                alt={hoveredDisc.name}
                className="w-full h-64 object-contain mb-4 rounded-lg bg-background"
              />
              <h3 className="text-xl font-bold text-center text-primary">{hoveredDisc.name}</h3>
              <p className="text-sm text-center text-muted">{hoveredDisc.brand}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
