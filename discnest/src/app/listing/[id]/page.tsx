'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import MessageSellerButton from '@/components/MessageSellerButton';
import Map from '@/components/Map';
import type { Listing } from '@/types/listing';

export default function ListingPage() {
  const params = useParams();
  const listingId = params.id;
  const router = useRouter();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) return;

    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${listingId}`);
        if (!res.ok) throw new Error('Listing not found');
        const data = await res.json();
        setListing(data.listing as Listing);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch listing');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!listing) return <p>Listing not found</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/marketplace')}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold"
      >
        &larr; Back to Marketplace
      </button>

      {/* Image Gallery */}
      {listing.imageUrls.length > 0 && (
        <div className="flex overflow-x-auto gap-4 py-2">
          {listing.imageUrls.map((url, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-64 h-64 relative rounded overflow-hidden shadow-md"
            >
              <Image
                src={url}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
                unoptimized
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/fallback.jpg';
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Listing Details */}
      <div className="space-y-2 text-gray-700">
        <p><span className="font-semibold">Title:</span> {listing.title}</p>
        <p><span className="font-semibold">Description:</span> {listing.description || '-'}</p>
        <p><span className="font-semibold">Brand:</span> {listing.brand || '-'}</p>
        <p><span className="font-semibold">Plastic:</span> {listing.plastic || '-'}</p>
        <p><span className="font-semibold">Weight:</span> {listing.weight ? `${listing.weight}g` : '-'}</p>
        <p><span className="font-semibold">Condition:</span> {listing.condition}</p>
        <p><span className="font-semibold">Listing Type:</span> {listing.type}</p>
        <p>
          <span className="font-semibold">Price:</span>{' '}
          {listing.price !== undefined ? `$${listing.price.toFixed(2)}` : 'Not listed'}
        </p>
        <p><span className="font-semibold">City:</span> {listing.city || '-'}</p>
        <p><span className="font-semibold">State:</span> {listing.state || '-'}</p>
      </div>

      {/* Map showing listing */}
      {listing.location?.coordinates && (
        <div className="h-96 rounded overflow-hidden">
          <Map singleListing={listing} zoom={15} />
        </div>
      )}

      {/* Message Seller Button */}
      <MessageSellerButton sellerId={listing.userId} listingId={listing._id} />
    </div>
  );
}
