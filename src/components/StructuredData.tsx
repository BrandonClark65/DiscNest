import Script from 'next/script';

interface StructuredDataProps {
  data: object;
  id: string;
}

export default function StructuredData({ data, id }: StructuredDataProps) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

