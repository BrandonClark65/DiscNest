'use client';

import { motion } from 'framer-motion';
import { Disc as DiscIcon, Package } from 'lucide-react';
import DiscbagDisplay from '@/components/DiscbagDisplay';
import GradientButton from '@/components/ui/GradientButton';

export default function HomeHero() {
  return (
    <section className="flex flex-col items-center justify-center px-4 py-16 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4 max-w-3xl"
      >
        <h1 className="h1">
          Manage your <span className="text-gradient-brand">disc golf bag</span>, look up any disc, track your rating
        </h1>
        <p className="p text-lg max-w-2xl mx-auto text-muted">
          DiscNest is a set of tools for disc golfers. Build and organize your bag, browse a full catalog of discs with their flight numbers, and work out your handicap from the rounds you play.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <GradientButton
            label="Build Your Bag"
            href="/gear"
            icon={<Package className="w-5 h-5" />}
            variant="primary"
          />
          <GradientButton
            label="Explore Catalog"
            href="/catalog"
            icon={<DiscIcon className="w-5 h-5" />}
            variant="accent"
          />
        </div>
      </motion.div>

      {/* Bag Preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="w-full max-w-3xl px-2 sm:px-4"
      >
        <DiscbagDisplay />
      </motion.div>
    </section>
  );
}
