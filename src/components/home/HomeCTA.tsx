'use client';

import { motion } from 'framer-motion';
import { Package, Target } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';

export default function HomeCTA() {
  return (
    <section className="px-4 py-16 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent)]/10">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="h2">Ready to get started?</h2>
          <p className="text-lg text-muted mb-8">
            Build your bag or check your handicap. Both are free, and you can start right now.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <GradientButton
              label="Build Your Bag"
              href="/gear"
              icon={<Package className="w-5 h-5" />}
              variant="primary"
            />
            <GradientButton
              label="Check Your Handicap"
              href="/handicap"
              icon={<Target className="w-5 h-5" />}
              variant="accent"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
