'use client';

import { motion } from 'framer-motion';
import { Package, BookOpen, Target, BarChart3 } from 'lucide-react';
import FeatureCard from './FeatureCard';

export default function HomeFeatures() {
  return (
    <section className="px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 mb-12"
        >
          <h2 className="h2">What you can do</h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Tools built around the parts of disc golf you actually keep track of
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            href="/gear"
            title="Bag Builder"
            description="Organize your discs between shelf and bag, track your inventory, and keep your collection in one place."
            Icon={Package}
          />
          <FeatureCard
            href="/gear"
            title="Bag Stats"
            description="See how your bag breaks down by speed and stability, and where it has gaps to fill."
            Icon={BarChart3}
          />
          <FeatureCard
            href="/catalog"
            title="Disc Catalog"
            description="Browse discs from every major brand. Filter by speed, stability, and type to compare molds."
            Icon={BookOpen}
          />
          <FeatureCard
            href="/handicap"
            title="Handicap Calculator"
            description="Get your rating and handicap from PDGA or UDisc ratings, or from raw scores, and track it over time."
            Icon={Target}
          />
        </div>
      </div>
    </section>
  );
}
