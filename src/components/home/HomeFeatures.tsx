'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Package, BookOpen, MessageSquare } from 'lucide-react';
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
          <h2 className="h2">Everything You Need</h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Powerful features designed specifically for disc golf players
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            href="/marketplace"
            title="Marketplace"
            description="Buy and sell discs from players nationwide. Filter by brand, condition, and location."
            Icon={ShoppingCart}
          />
          <FeatureCard
            href="/gear"
            title="Bag Tracker"
            description="Manage your disc collection. Organize between shelf and bag, track your inventory."
            Icon={Package}
          />
          <FeatureCard
            href="/catalog"
            title="Disc Catalog"
            description="Browse thousands of discs from all major brands. Filter by speed, stability, and type."
            Icon={BookOpen}
          />
          <FeatureCard
            href="/messages"
            title="Messaging"
            description="Connect directly with buyers and sellers. Secure, real-time communication built in."
            Icon={MessageSquare}
          />
        </div>
      </div>
    </section>
  );
}
