import { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import Listing from '@/models/Listing';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use the canonical production domain by default to avoid redirect warnings
  // in Google Search Console when sitemap URLs redirect from non-www → www.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.discnest.com';
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/handicap`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic listing pages
  let listingPages: MetadataRoute.Sitemap = [];
  try {
    // Add timeout to prevent hanging on connection issues
    const connectionPromise = connectToDatabase();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
    
    const listings = await Listing.find({ sold: false })
      .select('_id updatedAt')
      .lean()
      .limit(10000); // Adjust based on your needs
    
    listingPages = listings.map((listing) => ({
      url: `${baseUrl}/listing/${listing._id}`,
      lastModified: listing.updatedAt ? new Date(listing.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    // Silently fail during build - sitemap will still be generated with static pages
    // This is expected if MongoDB is unavailable (e.g., IP not whitelisted during build)
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Could not connect to MongoDB for sitemap generation. Using static pages only.');
      console.warn('   This is normal if your IP is not whitelisted in MongoDB Atlas.');
    }
    // Return static pages only if database connection fails
    // This ensures sitemap is always generated even if DB is unavailable
  }

  // Brand landing pages
  const majorBrands = [
    'Discmania',
    'Discraft',
    'Dynamic Discs',
    'Innova',
    'Latitude 64',
    'MVP',
    'Prodigy',
  ];

  const brandPages: MetadataRoute.Sitemap = majorBrands.map((brand) => ({
    url: `${baseUrl}/catalog/brand/${encodeURIComponent(brand)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Note: Shareable bag pages (/share/bag/[id]) are not included in sitemap
  // as they are user-generated and may be numerous. They are discoverable
  // via direct links and are allowed in robots.txt

  return [...staticPages, ...brandPages, ...listingPages];
}

