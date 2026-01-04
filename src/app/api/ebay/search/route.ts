import { NextResponse } from "next/server";

/**
 * eBay Search API Route
 * 
 * Generates eBay search URLs for sold listings matching the provided disc information.
 * 
 * Note: eBay's Finding API (which supported sold listings) has been deprecated and removed.
 * The Browse API does not support sold/completed listings. Therefore, this route generates
 * search URLs that users can open in their browser to view sold listings manually.
 * 
 * Query parameters:
 * - title: Disc title/name
 * - brand: Disc brand
 * - plastic: Disc plastic type (optional)
 * - condition: Disc condition (New, Like New, Used, Worn)
 * 
 * Returns:
 * - Search URL that user can open in browser to view sold listings
 */

/**
 * Map DiscNest condition to eBay condition IDs
 * eBay condition IDs: 1000=New, 1500=New Other, 1750=New with defects, 
 * 2000=Manufacturer refurbished, 2500=Seller refurbished, 3000=Used, 4000=Very Good, 
 * 5000=Good, 6000=Acceptable, 7000=For parts/not working
 */
function mapConditionToEbay(condition?: string): string {
  const conditionMap: Record<string, string> = {
    'New': '1000', // New
    'Like New': '3000', // Used (eBay doesn't have "Like New", use Used as closest)
    'Used': '3000', // Used
    'Worn': '5000', // Good (eBay doesn't have "Worn", use Good as closest)
  };
  return conditionMap[condition || ''] || '';
}

/**
 * Build eBay search keywords from disc information
 */
function buildSearchKeywords(title?: string, brand?: string, plastic?: string): string {
  const parts: string[] = [];
  
  // Add brand if available
  if (brand) {
    parts.push(brand);
  }
  
  // Add title (disc name)
  if (title) {
    parts.push(title);
  }
  
  // Add plastic type if available
  if (plastic) {
    parts.push(plastic);
  }
  
  // Always include "disc golf" to narrow results
  parts.push('disc golf');
  
  return parts.join(' ');
}

/**
 * Generate eBay search URL for sold listings
 * This URL opens eBay with filters for completed/sold listings
 */
function generateEbaySearchUrl(keywords: string, condition?: string): string {
  const baseUrl = 'https://www.ebay.com/sch/i.html';
  const params = new URLSearchParams({
    '_nkw': keywords,
    '_sop': '13', // Sort by: newly listed
    'LH_Complete': '1', // Completed listings
    'LH_Sold': '1', // Sold listings only
  });
  
  // Add condition filter if available
  const ebayCondition = mapConditionToEbay(condition);
  if (ebayCondition) {
    params.append('LH_ItemCondition', ebayCondition);
  }
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * GET handler for eBay search
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const title = searchParams.get('title') || undefined;
    const brand = searchParams.get('brand') || undefined;
    const plastic = searchParams.get('plastic') || undefined;
    const condition = searchParams.get('condition') || undefined;
    
    // Build search keywords
    const keywords = buildSearchKeywords(title, brand, plastic);
    
    if (!keywords || keywords.trim() === 'disc golf') {
      return NextResponse.json(
        { error: 'Please provide at least a title or brand to search' },
        { status: 400 }
      );
    }
    
    // Generate search URL
    const searchUrl = generateEbaySearchUrl(keywords, condition);
    
    return NextResponse.json({
      success: true,
      source: 'url',
      searchUrl,
      message: 'Click the link to view sold listings on eBay.',
    });
    
  } catch (error) {
    console.error('eBay search error:', error);
    return NextResponse.json(
      { error: 'Failed to generate eBay search URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
