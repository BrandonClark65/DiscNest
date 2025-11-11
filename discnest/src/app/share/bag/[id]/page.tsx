import { connectToDatabase } from '@/lib/mongodb';
import Disc from '@/models/Disc';
import User from '@/models/User';
import DiscBagDisplay from '@/components/DiscbagDisplay';
import DiscCard from '@/components/DiscCard';
import BagStats from '@/components/gear/BagStats';
import { ShoppingBag } from 'lucide-react';
import { notFound } from 'next/navigation';
import AnimatedHeader from '@/components/AnimatedHeader';
import AnimatedSection from '@/components/AnimatedSection';
import type { Disc as DiscType } from '@/types/disc';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

  return {
    title: `DiscNest | Shared Bag`,
    description: `Check out this disc golf bag on DiscNest!`,
    openGraph: {
      title: `Shared Disc Bag | DiscNest`,
      description: `Explore discs shared via DiscNest.`,
      images: [`${baseUrl}/og-bag-preview.png`],
      url: `${baseUrl}/share/bag/${resolvedParams.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Shared Disc Bag | DiscNest`,
      description: `View a disc golf bag shared via DiscNest.`,
      images: [`${baseUrl}/og-bag-preview.png`],
    },
  };
}

export default async function SharedBagPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  await connectToDatabase();
  await import('@/models/Disc');

  interface SharedDisc {
    _id: string;
    name: string;
    brand: string;
    plastic: string;
    weight?: number;
    condition?: string;
    imageUrls?: string[];
    color?: string;
  }

  interface SharedUser {
    name: string;
    bag: SharedDisc[];
  }

  const user = (await User.findOne({ shareableBagId: resolvedParams.id })
    .populate({
      path: 'bag',
      model: 'Disc',
      select:
        'name brand type stability plastic weight wearLevel condition imageUrls color',
    })
    .select('name bag')
    .lean()) as SharedUser | null;

  if (!user || !user.bag?.length) return notFound();

  const bag: DiscType[] = user.bag.map((disc) => ({
    ...disc,
    _id: disc._id.toString(),
    plastic: disc.plastic as DiscType['plastic'],
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-12 text-[var(--foreground)]">
      {/* ----- HEADER ----- */}
      <AnimatedHeader name={user.name} />

      {/* ----- DISC GRID ----- */}
      <AnimatedSection>
        <div className="flex items-center justify-between mb-6 border-b border-[var(--muted)]/30 pb-2">
          <h2
            className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2 
                       text-transparent bg-clip-text 
                       bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]"
          >
            <ShoppingBag className="w-6 h-6 text-[var(--accent)]" />
            Discs in Bag
          </h2>
          <BagStats bag={bag} />
        </div>

        {bag.length > 0 ? (
          <div
            className="grid gap-6 justify-center 
                       grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
          >
            {bag.map((disc) => (
              <DiscCard key={disc._id} disc={disc} circleView />
            ))}
          </div>
        ) : (
          <p className="text-[var(--foreground)]/60 italic text-center py-8">
            No discs found in this bag.
          </p>
        )}
      </AnimatedSection>

      {/* ----- BAG VISUAL DISPLAY ----- */}
      <AnimatedSection delay={0.2} className="flex justify-center mt-10">
        <div
          className="rounded-2xl shadow-md border border-[var(--muted)]/30 p-6
                     bg-[color-mix(in srgb, var(--surface) 85%, var(--foreground) 5%)]
                     dark:bg-[var(--surface)] w-full max-w-4xl"
        >
          <DiscBagDisplay bag={bag} />
        </div>
      </AnimatedSection>
    </div>
  );
}
