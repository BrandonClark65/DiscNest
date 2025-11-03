'use client';

import { motion } from 'framer-motion';

export default function AnimatedHeader({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center space-y-4 pb-5"
    >
      <h1
        className="text-4xl sm:text-5xl font-extrabold text-[var(--foreground)] 
                   drop-shadow-sm tracking-tight leading-tight"
      >
        {name ? `${name}'s Disc Bag` : 'Disc Bag'}
      </h1>

      <div
        className="h-1 w-24 mx-auto rounded-full 
                   bg-[var(--foreground)]/80"
      />
    </motion.div>
  );
}
