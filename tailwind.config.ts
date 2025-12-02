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
        primary: {
          DEFAULT: '#3c91e6', // tufts-blue
          light: '#60abf0',
          dark: '#1f5faa',
        },
        secondary: {
          DEFAULT: '#4d685a', // feldgrau
          light: '#6d897b',
          dark: '#344b41',
        },
        accent: {
          DEFAULT: '#f17300', // safety-orange
          light: '#ffa347',
          dark: '#b35300',
        },
        muted: {
          DEFAULT: '#b1b6a6', // ash-gray
          dark: '#4d685a',
        },
        background: {
          DEFAULT: '#ffffff',
          dark: '#011627', // rich-black
        },
        surface: {
          DEFAULT: '#f9fafb',
          dark: '#1a1a1a',
        },
        foreground: {
          DEFAULT: '#011627',
          dark: '#f9fafb',
        },
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
