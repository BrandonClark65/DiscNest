import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 🌿 Brand Palette (Replace later)
        primary: {
          DEFAULT: '#15803d', // Deep green (main)
          light: '#4ade80',
          dark: '#14532d',
        },
        secondary: {
          DEFAULT: '#3b82f6', // Blue accent
          light: '#60a5fa',
          dark: '#1e3a8a',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          700: '#404040',
          900: '#171717',
        },
        background: '#f9fafb',
        surface: '#ffffff',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-poppins)', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 8px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
