import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

// Brand descriptions for metadata
const brandDescriptions: Record<string, string> = {
  'Discmania': 'Explore Discmania disc golf discs, known for innovative designs and professional player endorsements. Browse drivers, midranges, and putters from this premium disc golf brand.',
  'Discraft': 'Browse Discraft disc golf discs, one of the most popular brands in disc golf. Find drivers, midranges, and putters from this established manufacturer.',
  'Dynamic Discs': 'Discover Dynamic Discs disc golf discs, featuring a wide range of molds for all skill levels. Shop drivers, midranges, and putters from this trusted brand.',
  'Innova': 'Shop Innova disc golf discs, the original disc golf manufacturer. Browse the largest selection of drivers, midranges, and putters from the most established brand in disc golf.',
  'Latitude 64': 'Explore Latitude 64 disc golf discs, known for Scandinavian design and quality. Browse drivers, midranges, and putters from this innovative European brand.',
  'MVP': 'Browse MVP disc golf discs, featuring overmold technology for enhanced stability. Discover drivers, midranges, and putters from this innovative manufacturer.',
  'Prodigy': 'Shop Prodigy disc golf discs, designed by professional players. Find drivers, midranges, and putters from this performance-focused brand.',
};

export async function generateMetadata({ params }: { params: Promise<{ brandName: string }> }): Promise<Metadata> {
  const { brandName: brandNameParam } = await params;
  const brandName = decodeURIComponent(brandNameParam);
  const description = brandDescriptions[brandName] || `Browse ${brandName} disc golf discs. Find drivers, midranges, and putters from this trusted disc golf brand.`;
  const brandUrl = `${baseUrl}/catalog/brand/${encodeURIComponent(brandName)}`;

  return {
    title: `${brandName} Disc Golf Discs - Browse Catalog | DiscNest`,
    description,
    openGraph: {
      title: `${brandName} Disc Golf Discs | DiscNest`,
      description,
      url: brandUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brandName} Disc Golf Discs | DiscNest`,
      description,
    },
    alternates: {
      canonical: brandUrl,
    },
  };
}

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
