'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface text-muted text-sm py-3 px-6 flex justify-between items-center border-t border-muted/30 font-sans">
      <span>
        © {new Date().getFullYear()}{' '}
        <span className="text-foreground font-medium">DiscNest</span>
      </span>
      <Link
        href="/contact"
        className="text-primary hover:text-accent transition-colors"
      >
        Contact Us
      </Link>
    </footer>
  );
}
