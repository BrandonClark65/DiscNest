'use client';

import { Megaphone, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SiteAnnouncement() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto mt-8 mb-6 rounded-2xl bg-gradient-to-r from-indigo-600/90 to-purple-600/90 p-[1px] shadow-lg"
    >
      <div className="rounded-2xl bg-white dark:bg-neutral-900 p-6 text-center">
        <div className="flex justify-center mb-3">
          <Megaphone className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>

        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          DiscNest is still in development!
        </h2>

        <p className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed">
          We're actively building and improving the platform, and we'd love your feedback.
          If you have ideas, feature suggestions, or thoughts about the site,
          please reach out through our{' '}
          <Link
            href="/contact"
            className="text-indigo-600 font-medium hover:underline"
          >
            contact page
          </Link>
          .
        </p>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
          Your input helps shape the future of DiscNest — thank you for being part of it!
        </p>
      </div>
    </motion.div>
  );
}
