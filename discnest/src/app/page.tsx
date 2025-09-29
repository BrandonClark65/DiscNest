'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-10 text-center">
      <h1 className="text-4xl font-bold text-green-700">Welcome to DiscNest 🥏</h1>
      <p className="text-lg text-gray-600">
        Track your disc golf gear, build your bag, and explore new discs.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
        <NavCard href="/gear" title="Your Gear" description="View your shelf and bag, move discs, and manage your collection." />
        <NavCard href="/catalog" title="Disc Catalog" description="Browse all available discs and add them to your shelf." />
        <NavCard href="/profile" title="Your Profile" description="Customize your account and view saved preferences." />
      </div>
    </main>
  );
}

function NavCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href}>
      <div className="border rounded-lg p-6 hover:shadow-lg hover:border-green-500 transition cursor-pointer bg-white">
        <h2 className="text-xl font-semibold text-green-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-2">{description}</p>
      </div>
    </Link>
  );
}
