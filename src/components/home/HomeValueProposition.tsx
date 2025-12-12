'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Package, MapPin } from 'lucide-react';
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
          <h2 className="h2">Why Choose DiscNest?</h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Whether you&apos;re buying your first disc or managing a professional collection, DiscNest provides all the tools you need for an exceptional disc golf experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ValueCard
            title="Disc Golf Marketplace"
            description="Buy and sell used disc golf discs safely. Connect with trusted sellers and buyers nationwide. Our messaging system keeps communication secure and organized."
            icon={<ShoppingCart className="w-8 h-8" />}
          />
          <ValueCard
            title="Disc Golf Bag Builder"
            description="Build and manage your disc golf bag with our intuitive bag builder. Track every disc in your collection, organize between shelf and bag, and optimize your setup."
            icon={<Package className="w-8 h-8" />}
          />
          <ValueCard
            title="Find Local Deals"
            description="Discover discs near you with our interactive map. Meet local players and save on shipping costs."
            icon={<MapPin className="w-8 h-8" />}
          />
        </div>
      </div>
    </section>
  );
}
