'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface text-muted text-sm py-6 px-6 border-t border-muted/30 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Sitemap-style links */}
        <nav className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" aria-label="Footer navigation">
          <div>
            <h3 className="text-foreground font-semibold mb-2">Browse</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/catalog" className="hover:text-primary transition-colors">
                  Disc Catalog
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="hover:text-primary transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/handicap" className="hover:text-primary transition-colors">
                  Handicap Calculator
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-foreground font-semibold mb-2">Account</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/gear" className="hover:text-primary transition-colors">
                  Your Gear
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-primary transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-foreground font-semibold mb-2">Support</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-foreground font-semibold mb-2">About</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        
        {/* Copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-muted/20">
          <span>
            © {new Date().getFullYear()}{' '}
            <span className="text-foreground font-medium">DiscNest</span>
          </span>
          <Link
            href="/contact"
            className="text-primary hover:text-accent transition-colors mt-2 sm:mt-0"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}
