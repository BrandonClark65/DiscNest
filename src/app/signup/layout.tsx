import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export const metadata: Metadata = {
  title: 'Sign Up | DiscNest',
  description: 'Create your DiscNest account to start buying, selling, and managing disc golf discs.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${baseUrl}/signup`,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}

