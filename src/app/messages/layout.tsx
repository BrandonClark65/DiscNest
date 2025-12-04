import type { Metadata } from 'next';

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
  return children;
}

