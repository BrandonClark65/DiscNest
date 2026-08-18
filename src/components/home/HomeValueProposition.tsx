'use client';

import { motion } from 'framer-motion';
import { Package, BookOpen, Target } from 'lucide-react';
import ValueCard from './ValueCard';

export default function HomeValueProposition() {
  return (
    <section className="px-4 py-16 bg-[var(--surface)]/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 mb-12"
        >
          <h2 className="h2">Why DiscNest?</h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Whether you carry ten discs or a hundred, DiscNest gives you a clear picture of what is in your bag and how your game is coming along.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ValueCard
            title="Bag Builder"
            description="Keep track of every disc you own. Sort between your shelf and your active bag, see the gaps in your lineup, and share your setup with friends."
            icon={<Package className="w-8 h-8" />}
          />
          <ValueCard
            title="Disc Catalog"
            description="Look up discs from every major brand with their speed, glide, turn, and fade. A quick way to compare molds before you throw or buy."
            icon={<BookOpen className="w-8 h-8" />}
          />
          <ValueCard
            title="Handicap Calculator"
            description="Turn your PDGA or UDisc round ratings, or plain scores, into a rating and a handicap. Sign in and DiscNest charts your progress over time."
            icon={<Target className="w-8 h-8" />}
          />
        </div>
      </div>
    </section>
  );
}
