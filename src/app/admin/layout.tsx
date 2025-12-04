import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export const metadata: Metadata = {
  title: 'Admin Dashboard | DiscNest',
  description: 'DiscNest admin dashboard',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${baseUrl}/admin`,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}

