import { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import Listing from '@/models/Listing';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';
  
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
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic listing pages
  let listingPages: MetadataRoute.Sitemap = [];
  try {
    await connectToDatabase();
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
    console.error('Error generating listing sitemap:', error);
  }

  return [...staticPages, ...listingPages];
}

