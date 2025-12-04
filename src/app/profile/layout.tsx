import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export const metadata: Metadata = {
  title: 'User Profile',
  description: 'View and edit your disc golf profile. Manage your account settings and preferences.',
  openGraph: {
    title: 'User Profile | DiscNest',
    description: 'View and edit your disc golf profile.',
    url: `${baseUrl}/profile`,
    type: 'website',
  },
  alternates: {
    canonical: `${baseUrl}/profile`,
  },
  robots: {
    index: false, // Private user page
    follow: false,
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

