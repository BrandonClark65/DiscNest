import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to normalize domain (redirect non-www to www)
 * This ensures consistent domain usage for OAuth flows, cookies, and sessions
 * 
 * Since NEXTAUTH_URL is set to https://www.discnest.com, we redirect
 * all non-www traffic (including API routes) to www to prevent OAuth callback mismatches
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Only apply in production (skip localhost and preview deployments)
  // Check if hostname is 'discnest.com' (non-www) - exact match to avoid subdomain issues
  if (
    process.env.NODE_ENV === 'production' &&
    hostname === 'discnest.com'
  ) {
    // Redirect non-www to www (including API routes for OAuth consistency)
    url.hostname = 'www.discnest.com';
    return NextResponse.redirect(url, 301); // Permanent redirect
  }

  return NextResponse.next();
}

// Run middleware on all paths to ensure domain consistency
// This includes API routes to prevent OAuth callback domain mismatches
export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and images
     * We include API routes to ensure OAuth callbacks use the canonical domain
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

