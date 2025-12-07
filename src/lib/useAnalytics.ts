/**
 * React Hook for Google Analytics 4 Event Tracking
 * 
 * Provides easy-to-use hooks for tracking events in React components.
 * 
 * Example:
 * ```tsx
 * const { trackEvent } = useAnalytics();
 * 
 * const handleClick = () => {
 *   trackEvent('listing_click', { listing_id: '123' });
 * };
 * ```
 */

import { useCallback } from 'react';
import { trackEvent, trackPageView, trackConversion, setUserProperties, type GA4EventName, type GA4EventParams } from './analytics';
import { useSession } from 'next-auth/react';

/**
 * Hook for tracking analytics events
 */
export function useAnalytics() {
  const { data: session } = useSession();

  const track = useCallback((eventName: GA4EventName, params?: GA4EventParams) => {
    // Automatically include user ID if available
    const enrichedParams: GA4EventParams = {
      ...params,
      ...(session?.user?.id && { user_id: session.user.id }),
    };
    trackEvent(eventName, enrichedParams);
  }, [session]);

  const trackPage = useCallback((path: string, title?: string) => {
    trackPageView(path, title);
  }, []);

  const trackConv = useCallback((
    eventName: GA4EventName,
    value: number,
    currency: string = 'USD',
    params?: GA4EventParams
  ) => {
    const enrichedParams: GA4EventParams = {
      ...params,
      ...(session?.user?.id && { user_id: session.user.id }),
    };
    trackConversion(eventName, value, currency, enrichedParams);
  }, [session]);

  const setUser = useCallback((userId: string, properties?: Record<string, string | number>) => {
    setUserProperties(userId, properties);
  }, []);

  return {
    trackEvent: track,
    trackPageView: trackPage,
    trackConversion: trackConv,
    setUserProperties: setUser,
  };
}

/**
 * Hook for tracking page views
 * Automatically tracks page views when the component mounts
 */
export function usePageView(pageName?: string) {
  const { trackPageView } = useAnalytics();

  const track = useCallback(() => {
    if (typeof window !== 'undefined') {
      trackPageView(window.location.pathname, pageName);
    }
  }, [trackPageView, pageName]);

  return { trackPageView: track };
}
