'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  href: string;
  title: string;
  description: string;
  Icon: React.ElementType;
}

export default function FeatureCard({ href, title, description, Icon }: FeatureCardProps) {
  return (
    <Link href={href} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        className="border border-muted/40 rounded-2xl p-6 bg-surface shadow-soft hover:shadow-md transition-all flex flex-col items-center text-center space-y-3 h-full"
      >
        <Icon className="w-10 h-10 text-primary group-hover:text-accent transition-colors" />
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted">{description}</p>
      </motion.div>
    </Link>
  );
}
