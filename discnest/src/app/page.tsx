'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, BookOpen, User } from 'lucide-react';
import DiscbagDisplay from '@/components/DiscbagDisplay';
import GradientButton from '@/components/ui/GradientButton';
import { DiscIcon } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-4 py-12 space-y-10">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl sm:text-5xl font-extrabold text-green-700">
          Welcome to <span className="text-green-600">DiscNest</span> 
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto">
          Track your disc golf gear, build your bag, and explore new discs with ease.
        </p>
        <div className="mt-6">
          <GradientButton
            label="Browse Disc Catalog"
            href="/catalog"
            icon={<DiscIcon className="w-5 h-5" />}
            variant="green"
          />
        </div>
      </motion.div>

      {/* Bag Preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="w-full max-w-3xl px-2 sm:px-4"
      >
        <DiscbagDisplay />
      </motion.div>

      {/* Navigation Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl mt-10"
      >
        <NavCard
          href="/gear"
          title="Your Gear"
          description="View your shelf and bag, move discs, and manage your collection."
          Icon={Package}
        />
        <NavCard
          href="/catalog"
          title="Disc Catalog"
          description="Browse all available discs and add them to your shelf."
          Icon={BookOpen}
        />
        <NavCard
          href="/profile"
          title="Your Profile"
          description="Customize your account and view saved preferences."
          Icon={User}
        />
      </motion.div>
    </main>
  );
}

function NavCard({
  href,
  title,
  description,
  Icon,
}: {
  href: string;
  title: string;
  description: string;
  Icon: React.ElementType;
}) {
  return (
    <Link href={href} className="block group">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center space-y-3"
      >
        <Icon className="w-10 h-10 text-green-600 group-hover:text-green-700" />
        <h2 className="text-lg sm:text-xl font-semibold text-green-800">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </motion.div>
    </Link>
  );
}
