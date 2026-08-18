/**
 * Google Analytics 4 (GA4) Event Tracking Utilities
 * 
 * This module provides type-safe functions for tracking user events
 * and conversions in Google Analytics 4.
 * 
 * Usage:
 * - Import and call these functions from client components
 * - Events are only sent in production (when NEXT_PUBLIC_GA_MEASUREMENT_ID is set)
 * 
 * Example:
 * ```tsx
 * import { trackEvent } from '@/lib/analytics';
 * 
 * trackEvent('listing_view', {
 *   listing_id: '123',
 *   listing_title: 'Innova Destroyer',
 *   price: 25.00
 * });
 * ```
 */

// GA4 Event Names
export type GA4EventName =
  | 'listing_view'
  | 'listing_click'
  | 'listing_create'
  | 'listing_edit'
  | 'listing_delete'
  | 'message_sent'
  | 'message_received'
  | 'disc_add_to_bag'
  | 'disc_remove_from_bag'
  | 'catalog_search'
  | 'catalog_filter'
  | 'marketplace_search'
  | 'user_signup'
  | 'user_login'
  | 'page_view'
  | 'share_bag'
  | 'contact_form_submit'
  | 'admin_action'
  | 'pro_comparison_view'
  | 'pro_comparison_select'
  | 'share_pro_handicap';

// GA4 Event Parameters
export interface GA4EventParams {
  // Listing events
  listing_id?: string;
  listing_title?: string;
  listing_brand?: string;
  listing_type?: string;
  listing_price?: number;
  listing_condition?: string;
  listing_location?: string;
  
  // User events
  user_id?: string;
  user_email?: string; // Only hash in production
  
  // Search/Filter events
  search_query?: string;
  filter_type?: string;
  filter_value?: string;
  results_count?: number;
  
  // Navigation events
  page_path?: string;
  page_title?: string;
  
  // Conversion events
  conversion_value?: number;
  currency?: string;
  
  // Custom parameters
  [key: string]: string | number | boolean | undefined;
}

/**
 * Check if GA4 is enabled and available
 */
export function isGA4Enabled(): boolean {
  if (typeof window === 'undefined') return false;
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return !!measurementId && typeof window.gtag !== 'undefined';
}

/**
 * Initialize Google Analytics 4
 * This should be called once in the root layout
 */
export function initializeGA4(): void {
  if (typeof window === 'undefined') return;
  
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) {
    console.warn('GA4: NEXT_PUBLIC_GA_MEASUREMENT_ID not set. Analytics disabled.');
    return;
  }

  // Load gtag script if not already loaded
  if (document.querySelector(`script[src*="gtag"]`)) {
    return; // Already loaded
  }

  // Add gtag script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId, {
    page_path: window.location.pathname,
    send_page_view: true,
  });
}

/**
 * Track a custom event in GA4
 * 
 * @param eventName - The name of the event
 * @param params - Event parameters
 */
export function trackEvent(eventName: GA4EventName, params?: GA4EventParams): void {
  if (typeof window === 'undefined') return;
  if (!isGA4Enabled()) return;

  try {
    window.gtag('event', eventName, {
      ...params,
      // Add timestamp
      event_timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('GA4: Error tracking event', error);
  }
}

/**
 * Track a page view
 * 
 * @param path - The page path
 * @param title - The page title
 */
export function trackPageView(path: string, title?: string): void {
  if (typeof window === 'undefined') return;
  if (!isGA4Enabled()) return;

  try {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      page_path: path,
      page_title: title,
    });
  } catch (error) {
    console.error('GA4: Error tracking page view', error);
  }
}

/**
 * Track a conversion event
 * 
 * @param eventName - The conversion event name
 * @param value - The conversion value
 * @param currency - The currency code (default: USD)
 * @param params - Additional event parameters
 */
export function trackConversion(
  eventName: GA4EventName,
  value: number,
  currency: string = 'USD',
  params?: GA4EventParams
): void {
  trackEvent(eventName, {
    ...params,
    value,
    currency,
  });
}

/**
 * Set user properties
 * 
 * @param userId - The user ID
 * @param properties - Additional user properties
 */
export function setUserProperties(userId: string, properties?: Record<string, string | number>): void {
  if (typeof window === 'undefined') return;
  if (!isGA4Enabled()) return;

  try {
    window.gtag('set', 'user_properties', {
      user_id: userId,
      ...properties,
    });
  } catch (error) {
    console.error('GA4: Error setting user properties', error);
  }
}

// Type declarations for window.gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
