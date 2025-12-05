'use client';

import { motion } from 'framer-motion';

interface ValueCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function ValueCard({ title, description, icon }: ValueCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center space-y-4 p-6"
    >
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-[var(--primary)]/10 text-primary">
          {icon}
        </div>
      </div>
      <h3 className="font-heading text-xl font-semibold text-foreground">
        {title}
      </h3>
      <p className="text-muted">{description}</p>
    </motion.div>
  );
}
