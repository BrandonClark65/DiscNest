/**
 * Feature flags.
 *
 * The buy/sell marketplace (listings, storefronts, disc requests,
 * buyer-to-seller messaging, and seller reviews) is switched off while it sees
 * no real usage. The code stays in the tree rather than being deleted, so the
 * whole surface can be turned back on later by setting an environment variable,
 * with no code changes.
 *
 * To re-enable, set NEXT_PUBLIC_MARKETPLACE_ENABLED=true in the environment.
 *
 * The NEXT_PUBLIC_ prefix is required so the flag can be read in client
 * components (the navigation and home page) as well as on the server.
 */
export const MARKETPLACE_ENABLED =
  process.env.NEXT_PUBLIC_MARKETPLACE_ENABLED === 'true';
