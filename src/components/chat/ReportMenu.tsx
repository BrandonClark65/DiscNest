'use client';

import { useEffect, useRef, useState } from 'react';

type ReportMenuProps = {
  onReport: () => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
  label?: string;
};

export default function ReportMenu({
  onReport,
  children,
  align = 'right',
  label = 'Report',
}: ReportMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-full hover:bg-[var(--muted)]/20 transition"
        aria-label="More Options"
      >
        {children}
      </button>

      {open && (
        <div
          className={`
            absolute mt-2 w-40 bg-[var(--surface)] border border-[var(--muted)]/40 shadow-lg
            rounded-xl p-1 z-20
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
        >
          <button
            onClick={() => {
              setOpen(false);
              onReport();
            }}
            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-600"
          >
            {label}
          </button>
        </div>
      )}
    </div>
  );
}
