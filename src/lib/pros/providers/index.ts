import type { ProRatingProvider } from './types';
import { manualProvider } from './manualProvider';
import { pdgaApiProvider } from './pdgaApiProvider';

/**
 * The active rating provider, chosen by PRO_RATING_PROVIDER (default 'manual').
 * Flipping to 'pdga_api' is the one change needed to switch on the API once it
 * is implemented and access is granted.
 */
export function getProvider(): ProRatingProvider {
  return process.env.PRO_RATING_PROVIDER === 'pdga_api' ? pdgaApiProvider : manualProvider;
}

export type { ProRatingProvider, ProRatingFetch } from './types';
