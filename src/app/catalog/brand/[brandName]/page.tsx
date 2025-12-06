'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/Breadcrumbs';
import CatalogGrid from '@/components/catalog/CatalogGrid';
import CatalogPagination from '@/components/catalog/CatalogPagination';
import HoverPreview from '@/components/catalog/HoverPreview';
import StructuredData from '@/components/StructuredData';
import type { Disc } from '@/types/disc';

// Brand descriptions for SEO and user information
const brandDescriptions: Record<string, { description: string; keywords: string[] }> = {
  'Discmania': {
    description: 'Explore Discmania disc golf discs, known for innovative designs and professional player endorsements. Browse drivers, midranges, and putters from this premium disc golf brand.',
    keywords: ['Discmania discs', 'Discmania disc golf', 'Discmania drivers', 'Discmania putters']
  },
  'Discraft': {
    description: 'Browse Discraft disc golf discs, one of the most popular brands in disc golf. Find drivers, midranges, and putters from this established manufacturer.',
    keywords: ['Discraft discs', 'Discraft disc golf', 'Discraft drivers', 'Discraft putters']
  },
  'Dynamic Discs': {
    description: 'Discover Dynamic Discs disc golf discs, featuring a wide range of molds for all skill levels. Shop drivers, midranges, and putters from this trusted brand.',
    keywords: ['Dynamic Discs', 'Dynamic Discs discs', 'Dynamic Discs disc golf', 'Dynamic Discs drivers']
  },
  'Innova': {
    description: 'Shop Innova disc golf discs, the original disc golf manufacturer. Browse the largest selection of drivers, midranges, and putters from the most established brand in disc golf.',
    keywords: ['Innova discs', 'Innova disc golf', 'Innova drivers', 'Innova putters', 'Innova Champion', 'Innova Star']
  },
  'Latitude 64': {
    description: 'Explore Latitude 64 disc golf discs, known for Scandinavian design and quality. Browse drivers, midranges, and putters from this innovative European brand.',
    keywords: ['Latitude 64 discs', 'Latitude 64 disc golf', 'Latitude 64 drivers', 'Latitude 64 putters']
  },
  'MVP': {
    description: 'Browse MVP disc golf discs, featuring overmold technology for enhanced stability. Discover drivers, midranges, and putters from this innovative manufacturer.',
    keywords: ['MVP discs', 'MVP disc golf', 'MVP drivers', 'MVP putters', 'MVP overmold']
  },
  'Prodigy': {
    description: 'Shop Prodigy disc golf discs, designed by professional players. Find drivers, midranges, and putters from this performance-focused brand.',
    keywords: ['Prodigy discs', 'Prodigy disc golf', 'Prodigy drivers', 'Prodigy putters']
  }
};

export default function BrandPage() {
  const params = useParams();
  const brandName = decodeURIComponent(params.brandName as string);
  const { data: session } = useSession();
  const email = session?.user?.email;

  const [discs, setDiscs] = useState<Disc[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredDisc, setHoveredDisc] = useState<Disc | null>(null);
  const [addedDiscId, setAddedDiscId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const discsPerPage = 24;

  // Load discs for this brand
  useEffect(() => {
    setLoading(true);
    fetch('/api/discs')
      .then((res) => res.json())
      .then((data: Disc[]) => {
        const brandDiscs = data
          .filter((disc) => disc.brand === brandName)
          .sort((a, b) => {
            // Sort by name within brand
            return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
          });
        setDiscs(brandDiscs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [brandName]);

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

  const brandInfo = brandDescriptions[brandName] || {
    description: `Browse ${brandName} disc golf discs. Find drivers, midranges, and putters from this trusted disc golf brand.`,
    keywords: [`${brandName} discs`, `${brandName} disc golf`]
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';
  const brandUrl = `${baseUrl}/catalog/brand/${encodeURIComponent(brandName)}`;

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${brandName} Disc Golf Discs`,
    description: brandInfo.description,
    url: brandUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: discs.slice(0, 10).map((disc, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: disc.name,
          brand: {
            '@type': 'Brand',
            name: disc.brand,
          },
        },
      })),
    },
  };

  return (
    <>
      <StructuredData data={collectionSchema} id="brand-schema" />
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
            {brandInfo.description}
          </p>
          {discs.length > 0 && (
            <p className="text-sm text-muted">
              Showing {discs.length} {discs.length === 1 ? 'disc' : 'discs'}
            </p>
          )}
        </div>

        {loading && (
          <p className="text-center text-muted mt-8">Loading {brandName} discs...</p>
        )}

        {!loading && discs.length === 0 && (
          <div className="text-center text-muted mt-8 space-y-4">
            <p>No discs found for {brandName}.</p>
            <Link href="/catalog" className="text-accent hover:underline">
              Browse all discs →
            </Link>
          </div>
        )}

        {!loading && discs.length > 0 && (
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
    </>
  );
}
