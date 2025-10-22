'use client';

import { motion } from 'framer-motion';

type GradientButtonProps = {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'gray';
};

export default function GradientButton({
  label,
  icon,
  href,
  onClick,
  className = '',
  type = 'button',
  variant = 'blue',
}: GradientButtonProps) {
  const variantClasses: Record<string, string> = {
    blue: 'from-blue-600 to-indigo-600',
    green: 'from-green-600 to-emerald-500',
    purple: 'from-violet-600 to-fuchsia-600',
    red: 'from-rose-600 to-red-500',
    orange: 'from-orange-500 to-amber-500',
    gray: 'from-slate-500 to-gray-600',
  };

  const baseStyles =
    'inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-full shadow-md hover:shadow-xl hover:scale-[1.05] active:scale-95 transition-all duration-300 font-semibold bg-gradient-to-r';

  const combinedClass = `${baseStyles} ${variantClasses[variant]} ${className}`;

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
      <a href={href} className={combinedClass}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={combinedClass}>
      {content}
    </button>
  );
}
