# 📊 Analytics & Monitoring Setup Guide

**Purpose:** This guide explains how to set up analytics and monitoring for DiscNest, including what can be done before and after production deployment.

---

## ⏰ Timeline: Before vs After Production

### ✅ Can Be Done Before Production

1. **Google Analytics 4 Implementation**
   - ✅ GA4 tracking code implemented in `src/lib/analytics.ts`
   - ✅ Analytics component added to layout (`src/components/analytics/GoogleAnalytics.tsx`)
   - ✅ Event tracking utilities created
   - ✅ React hooks for easy tracking (`src/lib/useAnalytics.ts`)
   - ✅ Event tracking added to key pages (listing views, etc.)
   - ⏳ **Action Required:** Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to environment variables

2. **Conversion Tracking Setup**
   - ✅ Conversion tracking functions implemented
   - ✅ Event tracking for key actions (listing views, messages, etc.)
   - ⏳ **Action Required:** Configure conversion events in GA4 dashboard after deployment

3. **Code Infrastructure**
   - ✅ All analytics code is ready
   - ✅ Type-safe event tracking
   - ✅ Automatic user ID tracking (when authenticated)

### ⏳ Must Wait Until After Production

1. **Google Analytics 4 Configuration**
   - Create GA4 property in Google Analytics
   - Get measurement ID (G-XXXXXXXXXX)
   - Configure conversion events in GA4 dashboard
   - Set up custom dimensions (if needed)

2. **Google Search Console**
   - Domain verification (see `GOOGLE_SEARCH_CONSOLE_SETUP.md`)
   - Submit sitemap
   - Monitor indexing and performance

3. **Bing Webmaster Tools**
   - Domain verification
   - Submit sitemap
   - Monitor Bing performance

4. **Data Collection**
   - Analytics only collects data after deployment
   - Search Console only shows data after verification

---

## 📋 Google Analytics 4 Setup

### Step 1: Create GA4 Property

1. Visit: https://analytics.google.com/
2. Sign in with your Google account
3. Click **"Admin"** (gear icon)
4. Click **"Create Property"**
5. Fill in property details:
   - Property name: "DiscNest"
   - Reporting time zone: Your timezone
   - Currency: USD
6. Click **"Next"** and complete setup

### Step 2: Get Measurement ID

1. In your GA4 property, go to **"Admin"** → **"Data Streams"**
2. Click on your web stream (or create one)
3. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 3: Add Measurement ID to Environment

Add to your `.env.local` (development) and production environment:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Step 4: Deploy and Verify

1. Deploy your application
2. Visit your site and perform some actions
3. In GA4, go to **"Realtime"** report
4. You should see events appearing within seconds

---

## 🎯 Event Tracking

### Available Events

The following events are tracked automatically or can be tracked manually:

#### Automatic Events
- **`page_view`** - Tracked automatically on page navigation
- **`listing_view`** - Tracked when viewing a listing detail page

#### Manual Events (Ready to Use)

You can track these events from any component:

```tsx
import { useAnalytics } from '@/lib/useAnalytics';

function MyComponent() {
  const { trackEvent } = useAnalytics();
  
  const handleAction = () => {
    trackEvent('listing_click', {
      listing_id: '123',
      listing_title: 'Innova Destroyer',
      listing_price: 25.00
    });
  };
}
```

**Available Event Types:**
- `listing_view` - Viewing a listing
- `listing_click` - Clicking on a listing
- `listing_create` - Creating a new listing
- `listing_edit` - Editing a listing
- `listing_delete` - Deleting a listing
- `message_sent` - Sending a message
- `message_received` - Receiving a message
- `disc_add_to_bag` - Adding a disc to bag
- `disc_remove_from_bag` - Removing a disc from bag
- `catalog_search` - Searching the catalog
- `catalog_filter` - Filtering the catalog
- `marketplace_search` - Searching the marketplace
- `user_signup` - User registration
- `user_login` - User login
- `share_bag` - Sharing a bag
- `contact_form_submit` - Submitting contact form
- `admin_action` - Admin actions

### Conversion Tracking

Track conversions (purchases, signups, etc.):

```tsx
import { useAnalytics } from '@/lib/useAnalytics';

function CheckoutComponent() {
  const { trackConversion } = useAnalytics();
  
  const handlePurchase = () => {
    trackConversion('listing_create', 25.00, 'USD', {
      listing_id: '123',
      listing_title: 'Innova Destroyer'
    });
  };
}
```

---

## 📊 Google Search Console Setup

See `GOOGLE_SEARCH_CONSOLE_SETUP.md` for detailed instructions.

**Quick Summary:**
1. Visit https://search.google.com/search-console
2. Add property (domain or URL prefix)
3. Verify ownership (meta tag method is ready in code)
4. Submit sitemap: `https://discnest.com/sitemap.xml`
5. Monitor indexing and performance

---

## 🔍 Bing Webmaster Tools Setup

### Step 1: Create Account

1. Visit: https://www.bing.com/webmasters
2. Sign in with Microsoft account
3. Click **"Add a site"**

### Step 2: Verify Ownership

1. Enter your site URL: `https://discnest.com`
2. Choose verification method:
   - **Meta tag** (easiest - similar to GSC)
   - **XML file upload**
   - **DNS record**
3. Add verification code to your site
4. Click **"Verify"**

### Step 3: Submit Sitemap

1. Go to **"Sitemaps"** in left sidebar
2. Enter: `https://discnest.com/sitemap.xml`
3. Click **"Submit"**

---

## 📈 Monitoring Dashboard (Future Enhancement)

A monitoring dashboard can be created to track:
- Organic traffic trends
- Keyword rankings
- Click-through rates
- Bounce rates
- Pages indexed
- Core Web Vitals
- Search Console errors

**Status:** Infrastructure ready, dashboard can be built as internal admin tool if needed.

---

## 🔧 Code Implementation Summary

### Files Created/Modified

**New Files:**
- `src/lib/analytics.ts` - Core GA4 tracking utilities
- `src/lib/useAnalytics.ts` - React hooks for tracking
- `src/components/analytics/GoogleAnalytics.tsx` - GA4 initialization component

**Modified Files:**
- `src/components/ClientLayout.tsx` - Added GoogleAnalytics component
- `src/app/listing/[id]/page.tsx` - Added listing view tracking
- `README.md` - Added analytics environment variable documentation

### How It Works

1. **Initialization:** `GoogleAnalytics` component loads GA4 script on client-side
2. **Event Tracking:** Use `useAnalytics()` hook in any component
3. **Automatic Tracking:** Some events tracked automatically (page views, listing views)
4. **Manual Tracking:** Call `trackEvent()` for custom events

---

## ✅ Pre-Production Checklist

- [x] GA4 tracking code implemented
- [x] Analytics utilities created
- [x] Event tracking hooks created
- [x] Key pages have tracking (listing views)
- [x] Environment variable documented
- [ ] GA4 property created (after deployment)
- [ ] Measurement ID added to environment
- [ ] Google Search Console verified (after deployment)
- [ ] Bing Webmaster Tools verified (after deployment)

---

## ✅ Post-Deployment Checklist

- [ ] Create GA4 property
- [ ] Get measurement ID
- [ ] Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to production environment
- [ ] Deploy updated code
- [ ] Verify GA4 is tracking (check Realtime report)
- [ ] Set up conversion events in GA4 dashboard
- [ ] Verify Google Search Console (see `GOOGLE_SEARCH_CONSOLE_SETUP.md`)
- [ ] Submit sitemap to GSC
- [ ] Set up Bing Webmaster Tools
- [ ] Submit sitemap to Bing
- [ ] Set up email alerts for critical issues
- [ ] Monitor analytics data daily for first week

---

## 📊 What to Monitor

### Daily (First Week)
- GA4 Realtime events
- Search Console crawl errors
- Sitemap status

### Weekly (First Month)
- Organic traffic trends
- Top pages by traffic
- Search queries
- Conversion events
- Indexing coverage

### Monthly (Ongoing)
- Keyword rankings
- Click-through rates
- Bounce rates
- Core Web Vitals
- Search Console performance
- Conversion rates

---

## 🚨 Common Issues & Solutions

### Issue: "No events showing in GA4"
**Solutions:**
- Verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set correctly
- Check browser console for errors
- Ensure site is deployed (not localhost)
- Wait a few minutes for data to appear
- Check GA4 Realtime report (not standard reports)

### Issue: "Events not tracking"
**Solutions:**
- Verify GA4 script is loading (check Network tab)
- Check browser console for errors
- Ensure `useAnalytics()` hook is being used correctly
- Verify measurement ID format (G-XXXXXXXXXX)

### Issue: "Search Console not showing data"
**Solutions:**
- Normal for first few days/weeks
- Ensure sitemap is submitted
- Check that pages are indexable
- Verify robots.txt isn't blocking pages

---

## 🔗 Useful Links

- **Google Analytics:** https://analytics.google.com/
- **Google Search Console:** https://search.google.com/search-console
- **Bing Webmaster Tools:** https://www.bing.com/webmasters
- **GA4 Event Builder:** Use in GA4 dashboard
- **Rich Results Test:** https://search.google.com/test/rich-results

---

## 💡 Pro Tips

1. **Test in Development:** Analytics won't send events without measurement ID, so safe to test locally
2. **Use Realtime Reports:** GA4 Realtime shows events within seconds
3. **Set Up Alerts:** Configure email alerts in Search Console for critical issues
4. **Monitor Regularly:** Check analytics weekly to catch issues early
5. **Track Conversions:** Set up conversion events for key actions (signups, messages, etc.)
6. **Use Custom Dimensions:** Add custom dimensions in GA4 for deeper insights

---

**Last Updated:** January 2025  
**Status:** ✅ Code implementation complete, ready for GA4 setup after deployment
