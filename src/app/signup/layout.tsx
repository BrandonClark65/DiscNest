import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export const metadata: Metadata = {
  title: 'Sign Up | DiscNest',
  description: 'Create your DiscNest account to build your disc golf bag and track your handicap.',
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

