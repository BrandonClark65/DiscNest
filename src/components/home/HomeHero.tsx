'use client';

import { motion } from 'framer-motion';
import { Disc as DiscIcon, ShoppingCart } from 'lucide-react';
import DiscbagDisplay from '@/components/DiscbagDisplay';
import GradientButton from '@/components/ui/GradientButton';
import SiteAnnouncement from '@/components/SiteAnnouncement';

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
          The Ultimate Platform for <span className="text-gradient-brand">Disc Golf</span> Enthusiasts
        </h1>
        <p className="p text-lg max-w-2xl mx-auto text-muted">
          Buy and sell disc golf discs, manage your bag, explore our comprehensive catalog, and connect with players nationwide. Everything you need for your disc golf journey in one place.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <GradientButton
            label="Browse Marketplace"
            href="/marketplace"
            icon={<ShoppingCart className="w-5 h-5" />}
            variant="primary"
          />
          <GradientButton
            label="Explore Catalog"
            href="/catalog"
            icon={<DiscIcon className="w-5 h-5" />}
            variant="accent"
          />
          <SiteAnnouncement />
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
