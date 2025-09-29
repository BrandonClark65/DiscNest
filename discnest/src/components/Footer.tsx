'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-600 text-sm py-3 px-6 flex justify-between items-center">
      <span>© {new Date().getFullYear()} DiscNest</span>
      <Link
        href="/contact"
        className="text-green-700 hover:text-green-900 transition"
      >
        Contact Us
      </Link>
    </footer>
  );
}