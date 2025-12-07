'use client';

import { useEffect } from 'react';
import { initializeGA4 } from '@/lib/analytics';

/**
 * Google Analytics 4 Component
 * 
 * This component initializes GA4 tracking on the client side.
 * It should be included in the root layout.
 * 
 * Analytics will only be active when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 */
export default function GoogleAnalytics() {
  useEffect(() => {
    // Only initialize in production or when measurement ID is set
    if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      initializeGA4();
    }
  }, []);

  // This component doesn't render anything
  return null;
}
