'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import MessageSellerButton from '@/components/MessageSellerButton';
import type { Listing } from '@/types/listing';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function ListingPage() {
  const params = useParams();
  const listingId = params.id;
  const router = useRouter();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

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

  if (loading) return <p className="p-6 text-center text-gray-500">Loading...</p>;
  if (error) return <p className="p-6 text-center text-red-500">{error}</p>;
  if (!listing) return <p className="p-6 text-center text-gray-500">Listing not found</p>;

  const handleImageClick = (index: number) => setActiveImage(index);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ---------- BACK BUTTON ---------- */}
      <button
        onClick={() => router.push('/marketplace')}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm sm:text-base transition"
      >
        &larr; Back to Marketplace
      </button>

      {/* ---------- MAIN LAYOUT ---------- */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ---------- LEFT: IMAGE + THUMBNAILS ---------- */}
        <div className="flex-1">
          {/* Large active image */}
          {listing.imageUrls.length > 0 && (
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
              <Image
                src={listing.imageUrls[activeImage]}
                alt={listing.title}
                fill
                priority
                className={`object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                sizes="(max-width: 768px) 100vw, 50vw"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/fallback.jpg';
                }}
              />
            </div>
          )}

          {/* Thumbnails (scrollable on mobile, grid on desktop) */}
          {listing.imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-5">
              {listing.imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => handleImageClick(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition
                              ${index === activeImage ? 'border-blue-600' : 'border-transparent hover:border-gray-300'}`}
                >
                  <Image
                    src={url}
                    alt={`${listing.title} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/fallback.jpg';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------- RIGHT: DETAILS ---------- */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {listing.title}
            </h1>
            <p className="text-gray-600 mb-4">{listing.description || 'No description provided.'}</p>

            <div className="space-y-1 text-sm sm:text-base text-gray-700">
              <p><span className="font-semibold">Brand:</span> {listing.brand || '-'}</p>
              <p><span className="font-semibold">Plastic:</span> {listing.plastic || '-'}</p>
              <p><span className="font-semibold">Weight:</span> {listing.weight ? `${listing.weight}g` : '-'}</p>
              <p><span className="font-semibold">Condition:</span> {listing.condition}</p>
              <p><span className="font-semibold">Listing Type:</span> {listing.type}</p>
              <p>
                <span className="font-semibold">Price:</span>{' '}
                {listing.price !== undefined ? (
                  <span className="text-blue-600 font-semibold">${listing.price.toFixed(2)}</span>
                ) : (
                  'Not listed'
                )}
              </p>
              <p><span className="font-semibold">Location:</span> {listing.city || '-'}, {listing.state || '-'}</p>
            </div>
          </div>

          {/* Message Seller button fixed spacing */}
          {/* ---------- MESSAGE SELLER BUTTON ---------- */}
          <div className="mt-6">
            {/* Desktop / Tablet - inline */}
            <div className="hidden sm:block">
              <MessageSellerButton sellerId={listing.userId} listingId={listing._id} />
            </div>

            {/* Mobile - sticky bottom bar */}
            <div
              className="sm:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 
                        p-3 flex justify-center shadow-xl z-[9999]"
            >
              <div className="w-full max-w-md">
                <MessageSellerButton sellerId={listing.userId} listingId={listing._id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- MAP ---------- */}
      {listing.location?.coordinates && (
        <div className="h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden shadow">
          <Map singleListing={listing} zoom={15} />
        </div>
      )}
    </div>
  );
}
