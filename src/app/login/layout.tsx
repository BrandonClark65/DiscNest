import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export const metadata: Metadata = {
  title: 'Login | DiscNest',
  description: 'Login to your DiscNest account to buy, sell, and manage disc golf discs.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${baseUrl}/login`,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

