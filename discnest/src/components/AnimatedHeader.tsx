'use client';

import { motion } from 'framer-motion';

export default function AnimatedHeader({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center space-y-4"
    >
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 drop-shadow-md tracking-tight">
        {name ? `${name}'s Disc Bag` : 'Disc Bag'}
      </h1>
      <div className="h-1 w-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
    </motion.div>
  );
}
