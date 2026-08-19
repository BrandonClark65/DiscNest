import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MARKETPLACE_ENABLED } from '@/lib/features';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export const metadata: Metadata = {
  title: 'Messages | DiscNest',
  description: 'View and manage your messages on DiscNest.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${baseUrl}/messages`,
  },
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  // Messaging exists to connect buyers and sellers, so it turns off with the
  // rest of the marketplace.
  if (!MARKETPLACE_ENABLED) {
    redirect('/');
  }

  return children;
}
