import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import DiscBagDisplay from '@/components/DiscbagDisplay';
import DiscCard from '@/components/DiscCard';
import BagStats from '@/components/BagStats';
import { ShoppingBag } from 'lucide-react';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';

/* ---------- Metadata for social previews ---------- */
export async function generateMetadata({ params }: { params: { userId: string } }) {
  await connectToDatabase();
  const user = await User.findById(params.userId).select('name');
  const name = user?.name || 'DiscGolfer';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

  return {
    title: `${name}'s Bag | DiscNest`,
    description: `Check out ${name}'s disc golf bag on DiscNest!`,
    openGraph: {
      title: `${name}'s Bag | DiscNest`,
      description: `Shared via DiscNest — explore discs and gear.`,
      images: [`${baseUrl}/og-bag-preview.png`],
      url: `${baseUrl}/share/bag/${params.userId}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name}'s Bag | DiscNest`,
      description: `View ${name}'s disc golf bag shared via DiscNest!`,
      images: [`${baseUrl}/og-bag-preview.png`],
    },
  };
}

/* ---------- Shared Bag Page ---------- */
export default async function SharedBagPage({ params }: { params: { userId: string } }) {
  await connectToDatabase();
  const user = await User.findById(params.userId)
    .populate('bag')
    .select('name bag');

  if (!user || !user.bag) return notFound();

  const bag = user.bag;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
      {/* ----- HEADER ----- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 drop-shadow-md tracking-tight">
          {user.name}&apos;s Disc Bag
        </h1>
        <div className="h-1 w-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
      </motion.div>

      {/* ----- DISC GRID ----- */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-green-700">
            <ShoppingBag className="w-5 h-5 text-green-600" />
            Discs in Bag
          </h2>
          <BagStats bag={bag} />
        </div>

        {bag.length > 0 ? (
          <div
            className="grid gap-6 justify-center grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
          >
            {bag.map((disc: any) => (
              <DiscCard
                key={disc._id}
                disc={disc}
                circleView
                // 🧊 Read-only: no action or edit props
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-center py-8">
            No discs found in this bag.
          </p>
        )}
      </section>

      {/* ----- DISC BAG DISPLAY (visual layout) ----- */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex justify-center mt-10"
      >
        <DiscBagDisplay bag={bag} />
      </motion.section>
    </div>
  );
}
