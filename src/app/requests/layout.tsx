import { redirect } from 'next/navigation';
import { MARKETPLACE_ENABLED } from '@/lib/features';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  // Disc requests (in-search-of posts) are part of the marketplace.
  if (!MARKETPLACE_ENABLED) {
    redirect('/');
  }

  return <>{children}</>;
}
