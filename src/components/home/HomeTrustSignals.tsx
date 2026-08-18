'use client';

import { motion } from 'framer-motion';
import { Zap, CheckCircle2, User } from 'lucide-react';
import TrustCard from './TrustCard';

export default function HomeTrustSignals() {
  return (
    <section className="px-4 py-16 bg-[var(--surface)]/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
          <h2 className="h2">Built for disc golfers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TrustCard
              icon={<Zap className="w-10 h-10" />}
              title="Free to use"
              description="Browse the catalog, build your bag, and run the handicap calculator without paying anything."
            />
            <TrustCard
              icon={<CheckCircle2 className="w-10 h-10" />}
              title="Simple to pick up"
              description="A clean interface that works for players of any skill level. There is nothing to learn before you start."
            />
            <TrustCard
              icon={<User className="w-10 h-10" />}
              title="Made by a player"
              description="A personal project built by someone who plays the game, and shaped by how disc golfers actually use their gear."
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
