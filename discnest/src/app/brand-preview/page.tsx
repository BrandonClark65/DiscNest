'use client';

import React, { useEffect, useState } from 'react';
import GradientButton from '@/components/ui/GradientButton';
import { Sun, Moon } from 'lucide-react';

export default function BrandPreviewPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Keep body/html in sync with selected theme
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const colors = [
    { name: 'Primary', var: '--primary' },
    { name: 'Secondary', var: '--secondary' },
    { name: 'Accent', var: '--accent' },
    { name: 'Foreground', var: '--foreground' },
    { name: 'Background', var: '--background' },
    { name: 'Surface', var: '--surface' },
    { name: 'Muted', var: '--muted' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-10 relative">
      {/* 🌙 Floating Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-surface shadow-soft border border-muted hover:shadow-lg transition"
        title="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon className="h-5 w-5 text-foreground" />
        ) : (
          <Sun className="h-5 w-5 text-foreground" />
        )}
      </button>

      <div className="max-w-5xl mx-auto space-y-10">
        {/* 🏷️ Header */}
        <header className="text-center space-y-3">
          <h1 className="h1 text-gradient-brand">DiscNest Brand Style Guide</h1>
          <p className="p text-muted max-w-2xl mx-auto">
            A quick visual reference for our color palette, typography, and component styles.
          </p>
        </header>

        {/* 🎨 Color Palette */}
        <section>
          <h2 className="h2 mb-4">🎨 Brand Colors</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {colors.map(({ name, var: variable }) => (
              <div
                key={name}
                className="rounded-2xl shadow-soft border border-surface overflow-hidden text-center"
              >
                <div
                  className="h-20 w-full"
                  style={{ backgroundColor: `var(${variable})` }}
                ></div>
                <div className="p-2 text-sm font-medium">{name}</div>
                <div className="text-xs text-muted mb-2">{variable}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ✍️ Typography */}
        <section>
          <h2 className="h2 mb-4">✍️ Typography</h2>
          <div className="space-y-6">
            <div>
              <p className="uppercase text-xs text-muted mb-1">Font: Poppins (Heading)</p>
              <h1 className="h1">Heading Level 1</h1>
              <h2 className="h2 mt-2">Heading Level 2</h2>
            </div>
            <div>
              <p className="uppercase text-xs text-muted mb-1">Font: Inter (Body)</p>
              <p className="p max-w-xl">
                This is an example paragraph using Inter. The quick brown fox jumps over the lazy
                dog. DiscNest helps players manage their bag, browse the marketplace, and share
                their disc setups with friends.
              </p>
            </div>
          </div>
        </section>

        {/* 🌈 Gradients & Buttons */}
        <section>
          <h2 className="h2 mb-4">🌈 Gradients & Buttons</h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-gradient-brand text-white px-6 py-3 rounded-2xl shadow-brand font-heading text-lg">
              Gradient Sample
            </div>
            <GradientButton label="Primary Action" variant="blue" />
            <GradientButton label="Confirm" variant="green" />
            <GradientButton label="Delete" variant="red" />
          </div>
        </section>

        {/* 🧱 Surface / Card Example */}
        <section>
          <h2 className="h2 mb-4">🧱 Surface Example</h2>
          <div className="bg-surface rounded-2xl shadow-soft p-6 max-w-md">
            <h3 className="font-heading text-xl text-primary mb-2">Disc Card Example</h3>
            <p className="p text-sm">
              Surfaces use the <code>--surface</code> token for background. Combine with{' '}
              <span className="font-bold text-secondary">secondary</span> and{' '}
              <span className="font-bold text-accent">accent</span> colors for detail emphasis.
            </p>
            <div className="mt-4">
              <GradientButton label="View Disc" href="#" variant="blue" />
            </div>
          </div>
        </section>

        {/* 🌙 Footer Info */}
        <footer className="pt-10 border-t border-surface text-center text-sm text-muted">
          Toggle dark mode with the button in the bottom-right corner.
        </footer>
      </div>
    </div>
  );
}
