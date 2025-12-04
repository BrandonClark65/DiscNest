import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Have questions, feedback, or ideas? Contact the DiscNest team. We\'d love to hear from you.',
  openGraph: {
    title: 'Contact Us | DiscNest',
    description: 'Have questions, feedback, or ideas? Contact the DiscNest team.',
    url: `${baseUrl}/contact`,
    type: 'website',
  },
  alternates: {
    canonical: `${baseUrl}/contact`,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

