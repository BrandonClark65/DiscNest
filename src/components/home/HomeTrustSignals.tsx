'use client';

import { motion } from 'framer-motion';
import { Shield, CheckCircle2, User } from 'lucide-react';
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
          <h2 className="h2">Trusted by Disc Golf Players</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TrustCard
              icon={<Shield className="w-10 h-10" />}
              title="Secure Platform"
              description="Your data and transactions are protected with industry-standard security measures."
            />
            <TrustCard
              icon={<CheckCircle2 className="w-10 h-10" />}
              title="Easy to Use"
              description="Intuitive interface designed for players of all skill levels. Get started in minutes."
            />
            <TrustCard
              icon={<User className="w-10 h-10" />}
              title="Community Driven"
              description="Built by disc golfers, for disc golfers. Connect with players who share your passion."
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
