import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export const metadata: Metadata = {
  title: 'Manage Your Disc Golf Bag',
  description: 'Track and manage your disc golf collection. Organize your shelf and bag, view stats, and get personalized recommendations.',
  openGraph: {
    title: 'Manage Your Disc Golf Bag | DiscNest',
    description: 'Track and manage your disc golf collection. Organize your shelf and bag, view stats, and get personalized recommendations.',
    url: `${baseUrl}/gear`,
    type: 'website',
  },
  alternates: {
    canonical: `${baseUrl}/gear`,
  },
  robots: {
    index: false, // Private user page
    follow: false,
  },
};

export default function GearLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

