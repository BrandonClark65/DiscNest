'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import React from 'react';

type GradientButtonProps = {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?:
    | 'primary'
    | 'accent'
    | 'secondary'
    | 'danger'
    | 'surface'
    | 'brand'
    | 'muted'
    | 'primaryAlt'
    | 'secondaryAlt'
    // 🆕 new theme-driven gradients
    | 'blueGradient'
    | 'accentGradient';
};

/**
 * Theme-aware gradient button
 * Includes subtle single-hue gradients for primary (blue) and accent tones.
 */
export default function GradientButton({
  label,
  icon,
  href,
  onClick,
  className = '',
  type = 'button',
  variant = 'primary',
}: GradientButtonProps) {
  const variantClasses: Record<string, string> = {
    primary: 'from-[var(--primary)] to-[var(--accent)] text-white',
    accent: 'from-[var(--accent)] to-[var(--primary)] text-white',
    secondary: 'from-[var(--secondary)] to-[var(--primary)] text-white',
    danger: 'from-rose-600 to-red-500 text-white',
    surface: 'from-[var(--surface)] to-[var(--muted)] text-[var(--foreground)]',
    brand: 'from-[var(--primary)] to-[var(--primary-dark)] text-white',
    muted: 'from-[var(--muted)]/40 to-[var(--muted)]/60 text-[var(--foreground)]',

    /** 🧱 safer, universally compatible variants */
    primaryAlt:
      'from-[var(--primary)]/80 to-[var(--accent)]/70 text-[var(--foreground)] hover:brightness-110',
    secondaryAlt:
      'from-[var(--accent)]/80 to-[var(--primary)]/70 text-white hover:brightness-110',

    /** 🆕 single-tone gradients */
    blueGradient: 'from-[var(--primary)]/90 to-[var(--primary)]/60 text-white',
    accentGradient: 'from-[var(--accent)]/90 to-[var(--accent)]/60 text-white',
  };


  const baseStyles =
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-heading font-semibold shadow-md hover:shadow-lg hover:scale-[1.04] active:scale-95 transition-all duration-300 bg-gradient-to-r focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40';

  const combined = `${baseStyles} ${variantClasses[variant]} ${className}`;

  const content = (
    <motion.span
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2"
    >
      {icon}
      {label}
    </motion.span>
  );

  if (href) {
    return (
      <Link href={href} className={combined}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={combined}>
      {content}
    </button>
  );
}
