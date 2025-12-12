import Script from 'next/script';

export default function HomePageLayout({ children }: { children: React.ReactNode }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://discnest.com';

  interface OrganizationSchema {
    '@context': string;
    '@type': string;
    name: string;
    url: string;
    logo: string;
    description: string;
    contactPoint: {
      '@type': string;
      contactType: string;
      url: string;
    };
  }

  const organizationSchema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DiscNest',
    url: baseUrl,
    logo: `${baseUrl}/og-image.png`,
    description: 'The ultimate disc golf marketplace and bag builder. Buy and sell used disc golf discs, manage your bag, explore the catalog, and connect with players nationwide.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: `${baseUrl}/contact`,
    },
  };

  // Only add sameAs if social media URLs are available
  // Uncomment and add URLs when available:
  // organizationSchema.sameAs = ['https://twitter.com/discnest', 'https://facebook.com/discnest'];

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DiscNest',
    url: baseUrl,
    description: 'Disc golf marketplace and bag builder. Buy and sell used disc golf discs, build and manage your disc golf bag, and explore the catalog.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/marketplace?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {children}
    </>
  );
}

