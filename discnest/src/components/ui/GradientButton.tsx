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
    | 'muted';
};


/**
 * Theme-aware gradient button.
 * Pulls from DiscNest CSS variables (globals.css).
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
    /** gradients derived from theme tokens */
    primary: 'from-[var(--primary)] to-[var(--accent)] text-white',
    accent: 'from-[var(--accent)] to-[var(--primary)] text-white',
    secondary: 'from-[var(--secondary)] to-[var(--primary)] text-white',
    danger: 'from-rose-600 to-red-500 text-white',
    surface: 'from-[var(--surface)] to-[var(--muted)] text-foreground',

    brand: 'from-[var(--primary)] to-[var(--primary-dark)]',
    muted: 'from-[var(--muted)]/40 to-[var(--muted)]/60',
  };

  const baseStyles =
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-heading font-semibold shadow-md hover:shadow-lg hover:scale-[1.05] active:scale-95 transition-all duration-300 bg-gradient-to-r';

  const combined = `${baseStyles} ${variantClasses[variant]} ${className}`;

  const content = (
    <motion.span
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
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
