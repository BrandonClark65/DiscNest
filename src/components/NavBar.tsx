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
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import NavLogo from '@/components/NavLogo';
import useUnreadMessages from '@/hooks/useUnreadMessages';

export default function NavBar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const hasUnreadMessages = useUnreadMessages();

  const toggleMenu = () => setMenuOpen((p) => !p);
  const toggleDropdown = () => setDropdownOpen((p) => !p);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/marketplace', label: 'Marketplace', icon: Store },
    { href: '/gear', label: 'Bag Builder', icon: ShoppingBag },
    { href: '/catalog', label: 'Catalog', icon: Disc },
  ];

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-primary to-accent text-foreground/90 shadow-md"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3 md:py-4">
        {/* Logo */}
        <NavLogo />

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`relative group transition-colors duration-200 ${
                pathname === href
                  ? 'text-[var(--foreground)] font-semibold drop-shadow-sm'
                  : 'text-foreground/90 hover:text-[var(--foreground)]'

              }`}
            >
              {label}
              <span
                className={`absolute left-0 -bottom-1 h-0.5 rounded-full bg-[var(--foreground)]/80 transition-all duration-300 ${
                  pathname === href
                    ? 'w-full opacity-100'
                    : 'w-0 group-hover:w-full opacity-70'
                }`}
              />
            </Link>
          ))}

          {status === 'authenticated' && session?.user && (session.user as { role?: string }).role === 'admin' && (
            <Link
              href="/admin"
              className={`relative group transition-colors duration-200 ${
                pathname === '/admin'
                  ? 'text-[var(--foreground)] font-semibold drop-shadow-sm'
                  : 'text-foreground/90 hover:text-[var(--foreground)]'
              }`}
            >
              Admin
              <span
                className={`absolute left-0 -bottom-1 h-0.5 rounded-full bg-[var(--foreground)]/80 transition-all duration-300 ${
                  pathname === '/admin'
                    ? 'w-full opacity-100'
                    : 'w-0 group-hover:w-full opacity-70'
                }`}
              />
            </Link>
          )}

          {/* 💬 Messages */}
          {status === 'authenticated' && (
            <Link
              href="/messages"
              className="ml-2 relative flex items-center justify-center bg-gradient-brand text-white rounded-full p-2 hover:scale-105 transition-transform shadow-md"
              title="Messages"
            >
              <MessageCircle size={20} />
              {hasUnreadMessages && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </Link>
          )}

          {/* 🌙 Theme toggle */}
          <ThemeToggle />

          {/* User dropdown / login */}
          {status === 'authenticated' ? (
            <div className="relative ml-3">
              <button
                onClick={toggleDropdown}
                className="flex items-center gap-1 bg-surface text-foreground px-3 py-1 rounded-md hover:bg-muted/20 transition"
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
                    className="absolute right-0 mt-2 w-40 bg-surface rounded-lg shadow-md overflow-hidden z-50 border border-muted/30"
                  >
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted/20 transition"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted/10 transition"
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
              className="bg-surface text-foreground px-3 py-1 rounded-md hover:bg-muted/20 transition"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-md hover:bg-surface/30 transition"
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
            className="md:hidden bg-surface border-t border-muted/40 shadow-inner"
          >
            <div className="flex flex-col items-start px-6 py-4 space-y-3">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 w-full transition ${
                    pathname === href
                      ? 'text-accent'
                      : 'text-foreground hover:text-accent'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}

              {status === 'authenticated' && session?.user && (session.user as { role?: string }).role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 w-full transition ${
                    pathname === '/admin'
                      ? 'text-accent'
                      : 'text-foreground hover:text-accent'
                  }`}
                >
                  <User size={18} /> Admin
                </Link>
              )}

              {status === 'authenticated' && (
                <Link
                  href="/messages"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full text-foreground hover:text-accent relative"
                >
                  <div className="relative">
                    <MessageCircle size={18} />
                    {hasUnreadMessages && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface" />
                    )}
                  </div>
                  Messages
                  {hasUnreadMessages && (
                    <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                </Link>
              )}

              {/* 🌙 Theme toggle for mobile */}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="text-sm text-foreground">Toggle Theme</span>
              </div>

              {status === 'authenticated' ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 w-full text-foreground hover:text-accent"
                  >
                    <User size={18} /> Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-2 w-full bg-accent/10 text-accent px-3 py-2 rounded-md hover:bg-accent/20 transition"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full bg-accent/10 text-accent px-3 py-2 rounded-md hover:bg-accent/20 transition"
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
