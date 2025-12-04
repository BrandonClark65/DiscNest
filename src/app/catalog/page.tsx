'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Filter } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';
import toast from 'react-hot-toast';
import useCatalogData from './hooks/useCatalogData';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import CatalogGrid from '@/components/catalog/CatalogGrid';
import CatalogPagination from '@/components/catalog/CatalogPagination';
import HoverPreview from '@/components/catalog/HoverPreview';
import StructuredData from '@/components/StructuredData';
import type { Disc } from '@/types/disc';

export default function CatalogPage() {
  const { data: session } = useSession();
  const email = session?.user?.email;

  const {
    discs,
    paginated,
    filtered,
    loading,        // ← NEW
    isMobile,
    filtersOpen,
    setFiltersOpen,
    filter,
    setFilter,
    uniqueBrands,
    uniqueTypes,
    uniqueStabilities,
    uniqueSpeeds,
    openSections,
    toggleAccordion,
    handleCheckboxChange,
    handleClearFilters,
    currentPage,
    handlePageChange,
    totalPages,
  } = useCatalogData();

  const [hoveredDisc, setHoveredDisc] = useState<Disc | null>(null);
  const [addedDiscId, setAddedDiscId] = useState<string | null>(null);

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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';
  
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Disc Golf Catalog',
    description: 'Browse our comprehensive catalog of disc golf discs from top brands',
    url: `${baseUrl}/catalog`,
  };

  return (
    <>
      <StructuredData data={collectionSchema} id="catalog-schema" />
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6 relative text-foreground">
      {/* Filters */}
      <CatalogFilters
        isMobile={isMobile}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        filter={filter}
        setFilter={setFilter}
        openSections={openSections}
        toggleAccordion={toggleAccordion}
        handleCheckboxChange={handleCheckboxChange}
        handleClearFilters={handleClearFilters}
        uniqueBrands={uniqueBrands}
        uniqueTypes={uniqueTypes}
        uniqueStabilities={uniqueStabilities}
        uniqueSpeeds={uniqueSpeeds}
      />

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

        {/* Catalog Grid */}
        <CatalogGrid
          discs={paginated}
          addedDiscId={addedDiscId}
          onAdd={handleAdd}
          onHover={setHoveredDisc}
        />

        {/* Status Messages */}
        {loading && (
          <p className="text-center text-muted mt-8">
            Loading discs...
          </p>
        )}

        {!loading && discs.length > 0 && filtered.length === 0 && (
          <p className="text-center text-muted mt-8">
            No discs match your filters.
          </p>
        )}

        {!loading && discs.length === 0 && (
          <p className="text-center text-muted mt-8">
            No discs available.
          </p>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 24 && (
          <CatalogPagination
            totalPages={totalPages}
            currentPage={currentPage}
            onChange={handlePageChange}
          />
        )}
      </div>

      <HoverPreview
        disc={hoveredDisc}
        onClose={() => setHoveredDisc(null)}
        isMobile={isMobile}
      />
    </div>
    </>
  );
}
