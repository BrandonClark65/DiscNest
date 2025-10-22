'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Menu, X, LogOut, User, Disc, Store, ShoppingBag, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NavBar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/marketplace', label: 'Marketplace', icon: Store },
    { href: '/gear', label: 'Gear', icon: ShoppingBag },
    { href: '/catalog', label: 'Catalog', icon: Disc },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bg-gradient-to-r from-green-700 via-green-800 to-green-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3 md:py-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-wide hover:opacity-90 transition"
        >
          DiscNest
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hover:text-green-200 transition-colors duration-200"
            >
              {label}
            </Link>
          ))}

          {status === 'authenticated' && session?.user?.role === 'admin' && (
            <Link href="/admin" className="hover:text-green-200">
              Admin
            </Link>
          )}

          {status === 'authenticated' ? (
            <>
              <span className="italic text-green-100">
                Hi, {session.user?.name?.split(' ')[0]}
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1 bg-white text-green-800 px-3 py-1 rounded-md hover:bg-green-100 transition"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-white text-green-800 px-3 py-1 rounded-md hover:bg-green-100 transition"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-md hover:bg-green-800 transition"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-green-800/95 backdrop-blur-sm border-t border-green-700 shadow-inner"
          >
            <div className="flex flex-col items-start px-6 py-3 space-y-3">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full text-white hover:text-green-200 transition"
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}

              {status === 'authenticated' && session?.user?.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full text-white hover:text-green-200"
                >
                  <User size={18} /> Admin
                </Link>
              )}

              {status === 'authenticated' ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-2 w-full bg-white text-green-800 px-3 py-2 rounded-md hover:bg-green-100 transition"
                >
                  <LogOut size={18} /> Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full bg-white text-green-800 px-3 py-2 rounded-md hover:bg-green-100 transition"
                >
                  <User size={18} /> Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
