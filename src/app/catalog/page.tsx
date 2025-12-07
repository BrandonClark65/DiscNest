'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Filter, Sparkles } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';
import toast from 'react-hot-toast';
import useCatalogData from './hooks/useCatalogData';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import CatalogGrid from '@/components/catalog/CatalogGrid';
import CatalogPagination from '@/components/catalog/CatalogPagination';
import HoverPreview from '@/components/catalog/HoverPreview';
import PopularBrands from '@/components/catalog/PopularBrands';
import StructuredData from '@/components/StructuredData';
import Breadcrumbs from '@/components/Breadcrumbs';
import type { Disc } from '@/types/disc';
import { useAnalytics } from '@/lib/useAnalytics';

export default function CatalogPage() {
  const { data: session } = useSession();
  const email = session?.user?.email;
  const { trackEvent } = useAnalytics();

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

  // Track search queries
  useEffect(() => {
    if (filter.search && filter.search.length > 0) {
      trackEvent('catalog_search', {
        search_query: filter.search,
        results_count: filtered.length,
      });
    }
  }, [filter.search, filtered.length, trackEvent]);

  // Track filter changes
  useEffect(() => {
    const activeFilters = [
      filter.brands.length > 0 && 'brand',
      filter.types.length > 0 && 'type',
      filter.stabilities.length > 0 && 'stability',
      filter.speeds.length > 0 && 'speed',
    ].filter(Boolean);

    if (activeFilters.length > 0) {
      trackEvent('catalog_filter', {
        filter_type: activeFilters.join(','),
        results_count: filtered.length,
      });
    }
  }, [filter.brands, filter.types, filter.stabilities, filter.speeds, filtered.length, trackEvent]);

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
      
      // Track disc add to bag/shelf
      trackEvent('disc_add_to_bag', {
        disc_id: discId,
        disc_name: disc?.name,
        disc_brand: disc?.brand,
        disc_type: disc?.type,
        target: target, // 'bag' or 'shelf'
      });
      
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
      <main className="max-w-7xl mx-auto p-6 space-y-6 relative text-foreground">
        {/* Header Section */}
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Disc Catalog', href: '/catalog' }]} className="mb-4" />

          <h1 className="h1 text-center">
            <span className="text-gradient-brand">Disc Catalog</span>
          </h1>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Filters - Left Sidebar */}
          <aside aria-label="Catalog filters" className="md:col-span-1">
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
          </aside>

          {/* Main Catalog - Center */}
          <section className="md:col-span-3 space-y-4" aria-label="Disc catalog">
            {isMobile && (
              <div className="flex gap-3 mb-4">
                <GradientButton
                  label="Filters"
                  icon={<Filter size={18} />}
                  onClick={() => setFiltersOpen(true)}
                  variant="primary"
                  className="flex-1 px-4 py-2"
                />
                <GradientButton
                  label="Popular Brands"
                  icon={<Sparkles size={18} />}
                  onClick={() => {
                    const event = new CustomEvent('openPopularBrands');
                    window.dispatchEvent(event);
                  }}
                  variant="accentGradient"
                  className="flex-1 px-4 py-2"
                />
              </div>
            )}

            {/* Popular Brands Section - Desktop: Above Catalog Grid */}
            {!isMobile && (
              <div className="mb-6 p-4 bg-gradient-to-r from-[var(--accent)]/10 via-[var(--primary)]/5 to-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                  <h2 className="text-lg font-semibold text-foreground">Popular Brands</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Discmania',
                    'Discraft',
                    'Dynamic Discs',
                    'Innova',
                    'Latitude 64',
                    'MVP',
                    'Prodigy',
                  ].map((brand) => (
                    <Link
                      key={brand}
                      href={`/catalog/brand/${encodeURIComponent(brand)}`}
                      className="px-4 py-2 bg-surface/80 hover:bg-surface border border-[var(--accent)]/30 hover:border-[var(--accent)]/60 rounded-lg transition-all duration-200 text-sm font-medium text-foreground hover:text-[var(--accent)] shadow-sm hover:shadow-md"
                    >
                      {brand}
                    </Link>
                  ))}
                </div>
              </div>
            )}

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
          </section>
        </div>

        {/* Popular Brands Mobile Component - Only renders mobile drawer */}
        <PopularBrands isMobile={isMobile} />

      <HoverPreview
        disc={hoveredDisc}
        onClose={() => setHoveredDisc(null)}
        isMobile={isMobile}
      />
    </main>
    </>
  );
}
