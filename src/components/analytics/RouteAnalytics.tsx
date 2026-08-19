'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/**
 * Fires a GA4 page_view on client-side route changes.
 *
 * This is an App Router SPA, so navigating between pages (for example from
 * /handicap to /handicap/pros) does not reload the document and therefore does
 * not trigger gtag's initial page_view on its own. Mounted once in the layout,
 * this sends one on every pathname change so per-page traffic is captured
 * everywhere without wiring each page by hand.
 *
 * The very first load is skipped: gtag('config') in GoogleAnalyticsHead already
 * counts the landing page, so firing here too would double-count it.
 */
export default function RouteAnalytics() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    trackPageView(pathname, typeof document !== 'undefined' ? document.title : undefined);
  }, [pathname]);

  return null;
}
