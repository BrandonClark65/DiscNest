'use client';

import { useEffect } from 'react';

/**
 * Google Analytics 4 Head Script Component
 * 
 * This component injects the Google Analytics gtag.js script directly into the <head>
 * immediately after the opening <head> tag, as recommended by Google.
 * 
 * This ensures Google's verification tools can detect the tag.
 */
export default function GoogleAnalyticsHead() {
  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-TLTD6B9X9G';
    
    // Check if scripts are already added
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) {
      return; // Already added
    }

    // Create and add the inline config script
    const inlineScript = document.createElement('script');
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    `;
    
    // Create and add the gtag.js script
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;

    // Insert scripts at the beginning of head (immediately after <head>)
    // Follow Google's order: gtag.js first, then inline config script
    const head = document.head || document.getElementsByTagName('head')[0];
    
    // Insert inline script first (it will become second after next insertion)
    head.insertBefore(inlineScript, head.firstChild);
    // Insert gtag.js second (it becomes first, final order: gtag.js, then inline script)
    head.insertBefore(gtagScript, head.firstChild);
  }, []);

  return null;
}

