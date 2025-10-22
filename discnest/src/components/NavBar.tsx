'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import {
  Menu,
  X,
  LogOut,
  User,
  Disc,
  Store,
  ShoppingBag,
  Home,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/marketplace', label: 'Marketplace', icon: Store },
    { href: '/gear', label: 'Gear', icon: ShoppingBag },
    { href: '/catalog', label: 'Catalog', icon: Disc },
  ];

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-green-700 via-green-800 to-green-900 text-white shadow-md"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3 md:py-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-wide text-white hover:opacity-90 transition"
        >
          DiscNest
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`relative group transition-colors duration-200 ${
                pathname === href ? 'text-green-200' : 'text-white hover:text-green-200'
              }`}
            >
              {label}
              <span
                className={`absolute left-0 -bottom-1 h-0.5 rounded-full bg-green-200 transition-all duration-300 ${
                  pathname === href
                    ? 'w-full opacity-100'
                    : 'w-0 group-hover:w-full opacity-70'
                }`}
              />
            </Link>
          ))}

          {status === 'authenticated' && session?.user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`relative group transition-colors duration-200 ${
                pathname === '/admin'
                  ? 'text-green-200'
                  : 'text-white hover:text-green-200'
              }`}
            >
              Admin
              <span
                className={`absolute left-0 -bottom-1 h-0.5 rounded-full bg-green-200 transition-all duration-300 ${
                  pathname === '/admin'
                    ? 'w-full opacity-100'
                    : 'w-0 group-hover:w-full opacity-70'
                }`}
              />
            </Link>
          )}

          {/* User Dropdown */}
          {status === 'authenticated' ? (
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center gap-1 bg-white text-green-800 px-3 py-1 rounded-md hover:bg-green-100 transition"
              >
                <User size={16} />
                {session.user?.name?.split(' ')[0]}
                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    dropdownOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-md overflow-hidden z-50"
                  >
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-green-900 hover:bg-green-100 transition"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
          className="md:hidden p-2 rounded-md hover:bg-green-900/40 transition"
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
            className="md:hidden bg-green-900 border-t border-green-700 shadow-inner"
          >
            <div className="flex flex-col items-start px-6 py-4 space-y-3">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 w-full transition ${
                    pathname === href
                      ? 'text-green-200'
                      : 'text-white hover:text-green-200'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}

              {status === 'authenticated' && session?.user?.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 w-full transition ${
                    pathname === '/admin'
                      ? 'text-green-200'
                      : 'text-white hover:text-green-200'
                  }`}
                >
                  <User size={18} /> Admin
                </Link>
              )}

              {status === 'authenticated' ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 w-full text-white hover:text-green-200"
                  >
                    <User size={18} /> Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-2 w-full bg-white text-green-800 px-3 py-2 rounded-md hover:bg-green-100 transition"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </>
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
    </motion.nav>
  );
}
