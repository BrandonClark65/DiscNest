'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/Breadcrumbs';
import CatalogGrid from '@/components/catalog/CatalogGrid';
import CatalogPagination from '@/components/catalog/CatalogPagination';
import HoverPreview from '@/components/catalog/HoverPreview';
import type { Disc } from '@/types/disc';

interface BrandClientProps {
  initialDiscs: Disc[];
  brandName: string;
  brandDescription: string;
}

export default function BrandClient({ initialDiscs, brandName, brandDescription }: BrandClientProps) {
  const { data: session } = useSession();
  const email = session?.user?.email;

  const [discs] = useState<Disc[]>(initialDiscs);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredDisc, setHoveredDisc] = useState<Disc | null>(null);
  const [addedDiscId, setAddedDiscId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const discsPerPage = 24;

  // Handle mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const totalPages = Math.ceil(discs.length / discsPerPage);
  const startIndex = (currentPage - 1) * discsPerPage;
  const paginated = discs.slice(startIndex, startIndex + discsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentPage(page);
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6 text-foreground">
      <Breadcrumbs
        items={[
          { label: 'Catalog', href: '/catalog' },
          { label: `${brandName} Discs`, href: `/catalog/brand/${encodeURIComponent(brandName)}` },
        ]}
        className="mb-4"
      />

      <div className="text-center space-y-4">
        <h1 className="h1">
          <span className="text-gradient-brand">{brandName}</span> Disc Golf Discs
        </h1>
        <p className="text-muted max-w-2xl mx-auto">
          {brandDescription}
        </p>
        {discs.length > 0 && (
          <p className="text-sm text-muted">
            Showing {discs.length} {discs.length === 1 ? 'disc' : 'discs'}
          </p>
        )}
      </div>

      {discs.length === 0 && (
        <div className="text-center text-muted mt-8 space-y-4">
          <p>No discs found for {brandName}.</p>
          <Link href="/catalog" className="text-accent hover:underline">
            Browse all discs →
          </Link>
        </div>
      )}

      {discs.length > 0 && (
        <>
          <CatalogGrid
            discs={paginated}
            addedDiscId={addedDiscId}
            onAdd={handleAdd}
            onHover={setHoveredDisc}
          />

          {discs.length > discsPerPage && (
            <CatalogPagination
              totalPages={totalPages}
              currentPage={currentPage}
              onChange={handlePageChange}
            />
          )}
        </>
      )}

      <HoverPreview
        disc={hoveredDisc}
        onClose={() => setHoveredDisc(null)}
        isMobile={isMobile}
      />
    </main>
  );
}

