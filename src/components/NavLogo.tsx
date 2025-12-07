'use client';

import Link from 'next/link';

export default function NavLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-2xl font-heading font-extrabold tracking-wide text-foreground hover:opacity-90 transition"
    >
      <img
        src="/Logo_NoBackground.png"
        alt="DiscNest Logo"
        width={40}
        height={40}
        className="object-contain h-10 w-10"
      />
      DiscNest
    </Link>
  );
}