'use client';

import { useEffect } from 'react';

/**
 * Google Analytics 4 Component
 * 
 * This component verifies GA4 is loaded and sets up client-side tracking.
 * The gtag script itself is loaded directly in the root layout via Next.js Script component.
 * 
 * Analytics will only be active when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 */
export default function GoogleAnalytics() {
  useEffect(() => {
    // The gtag script is loaded via Next.js Script component in layout.tsx
    // This component is kept for compatibility but no longer needs to load the script
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-TLTD6B9X9G';
    
    // Verify gtag is loaded
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      // Ensure dataLayer is initialized
      window.dataLayer = window.dataLayer || [];
      console.log('GA4: Google Analytics loaded successfully');
    } else {
      console.warn('GA4: gtag not found. Make sure Script component is loading correctly.');
    }
  }, []);

  // This component doesn't render anything
  return null;
}
