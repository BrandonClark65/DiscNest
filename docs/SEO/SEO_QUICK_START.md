# 🚀 SEO Quick Start Guide

**Quick reference for implementing the most critical SEO improvements immediately.**

---

## ⚡ Immediate Actions (Do Today)

### 1. Create robots.txt
**File:** `public/robots.txt`
```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /messages/
Disallow: /profile/
Disallow: /gear/
Disallow: /login
Disallow: /signup

Sitemap: https://discnest.com/sitemap.xml
```

### 2. Create Sitemap
**File:** `src/app/sitemap.ts`
```typescript
import { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import Listing from '@/models/Listing';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';
  
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${baseUrl}/catalog`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/marketplace`, lastModified: new Date(), changeFrequency: 'hourly' as const, priority: 0.9 },
  ];

  let listingPages = [];
  try {
    await connectToDatabase();
    const listings = await Listing.find({ sold: false }).select('_id updatedAt').lean().limit(10000);
    listingPages = listings.map((listing) => ({
      url: `${baseUrl}/listing/${listing._id}`,
      lastModified: listing.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return [...staticPages, ...listingPages];
}
```

### 3. Fix Root Layout Metadata
**File:** `src/app/layout.tsx`

**Current Issue:** Layout is a client component. Need to separate metadata.

**Solution:** Create a metadata export in a server component or use Next.js 15 metadata API.

**Option A - Create separate metadata file:**
```typescript
// src/app/metadata.ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'DiscNest - Buy, Sell & Manage Disc Golf Discs',
    template: '%s | DiscNest'
  },
  description: 'The ultimate platform for disc golf enthusiasts. Buy and sell discs, manage your bag, explore the catalog, and connect with players.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com',
    siteName: 'DiscNest',
    title: 'DiscNest - Buy, Sell & Manage Disc Golf Discs',
    description: 'The ultimate platform for disc golf enthusiasts.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'DiscNest' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DiscNest - Buy, Sell & Manage Disc Golf Discs',
    description: 'The ultimate platform for disc golf enthusiasts.',
    images: ['/og-image.png'],
  },
};
```

**Option B - Refactor layout:**
Split into server component for metadata and client component for interactivity.

---

## 📋 This Week's Tasks

### Day 1-2: Foundation
- [ ] Create robots.txt
- [ ] Create sitemap.ts
- [ ] Fix root layout metadata
- [ ] Set up Google Search Console account

### Day 3-4: Page Metadata
- [ ] Add metadata to homepage
- [ ] Add metadata to catalog page
- [ ] Add metadata to marketplace page
- [ ] Verify existing listing metadata works

### Day 5-7: Structured Data
- [ ] Add Organization schema to homepage
- [ ] Add Product schema to listing pages
- [ ] Test with Rich Results Test
- [ ] Add BreadcrumbList schema

---

## 🎯 Priority Order

1. **robots.txt** - 5 minutes
2. **sitemap.ts** - 30 minutes
3. **Root metadata** - 1-2 hours
4. **Page metadata** - 2-3 hours
5. **Structured data** - 3-4 hours

---

## 🔍 Testing Checklist

After implementing, test:
- [ ] robots.txt accessible at `/robots.txt`
- [ ] sitemap accessible at `/sitemap.xml`
- [ ] Metadata shows in page source
- [ ] Open Graph tags work (test with Facebook Debugger)
- [ ] Structured data validates (Rich Results Test)
- [ ] Google Search Console shows pages

---

## 📞 Quick Reference

**Google Search Console:** https://search.google.com/search-console  
**Rich Results Test:** https://search.google.com/test/rich-results  
**Facebook Debugger:** https://developers.facebook.com/tools/debug/  
**Schema Validator:** https://validator.schema.org/

---

**See [SEO_PLAN.md](./SEO_PLAN.md) for the complete strategy.**

