'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import MessageSellerButton from '@/components/MessageSellerButton';
import type { Listing } from '@/types/listing';
import GradientButton from '@/components/ui/GradientButton';
import { ArrowBigLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function ListingPage() {
  const params = useParams();
  const listingId = params.id;
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
        setError(err.message || 'Failed to fetch listing');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse">
        Loading listing...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-red-500 font-semibold">{error}</div>
    );
  if (!listing)
    return <div className="p-8 text-center text-gray-500">Listing not found</div>;

  const handleImageClick = (index: number) => setActiveImage(index);

  return (
    <motion.div
      className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* ---------- BACK BUTTON ---------- */}
      <GradientButton
        label="Back to Marketplace"
        href="/marketplace"
        variant="gray"
        icon={<ArrowBigLeft className="w-5 h-5" />}
        className="mb-2"
      />

      {/* ---------- MAIN CONTAINER ---------- */}
      <div className="flex flex-col lg:flex-row gap-10 bg-gradient-to-br from-gray-50/50 to-white/90 dark:from-gray-900/50 dark:to-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-lg rounded-2xl p-6">
        {/* ---------- LEFT: IMAGE GALLERY ---------- */}
        <div className="flex-1">
          {listing.imageUrls.length > 0 && (
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0.3, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={listing.imageUrls[activeImage]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    onLoad={() => setImageLoaded(true)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/fallback.jpg';
                    }}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Thumbnails */}
          {listing.imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto mt-3 pb-2 scrollbar-thin scrollbar-thumb-gray-400/50">
              {listing.imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => handleImageClick(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-transform duration-200 hover:scale-105 ${
                    index === activeImage
                      ? 'border-blue-500 shadow-md'
                      : 'border-transparent'
                  }`}
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent mb-3">
              {listing.title}
            </h1>

            <p className="text-gray-700 dark:text-gray-300 mb-5 leading-relaxed">
              {listing.description || 'No description provided.'}
            </p>

            <div className="space-y-2 text-gray-800 dark:text-gray-200 text-sm sm:text-base">
              <p>
                <span className="font-semibold text-gray-600 dark:text-gray-400">Brand:</span>{' '}
                {listing.brand || '-'}
              </p>
              <p>
                <span className="font-semibold text-gray-600 dark:text-gray-400">Plastic:</span>{' '}
                {listing.plastic || '-'}
              </p>
              <p>
                <span className="font-semibold text-gray-600 dark:text-gray-400">Weight:</span>{' '}
                {listing.weight ? `${listing.weight}g` : '-'}
              </p>
              <p>
                <span className="font-semibold text-gray-600 dark:text-gray-400">Condition:</span>{' '}
                {listing.condition}
              </p>
              <p>
                <span className="font-semibold text-gray-600 dark:text-gray-400">Listing Type:</span>{' '}
                {listing.type}
              </p>
              <p>
                <span className="font-semibold text-gray-600 dark:text-gray-400">Price:</span>{' '}
                {listing.price !== undefined ? (
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    ${listing.price.toFixed(2)}
                  </span>
                ) : (
                  'Not listed'
                )}
              </p>
              <p>
                <span className="font-semibold text-gray-600 dark:text-gray-400">Location:</span>{' '}
                {listing.city || '-'}, {listing.state || '-'}
              </p>
            </div>
          </div>

          {/* ---------- MESSAGE SELLER ---------- */}
          <div className="mt-6">
            <div className="hidden sm:block">
              <MessageSellerButton
                sellerId={listing.userId}
                listingId={listing._id}
              />
            </div>

            {/* Mobile sticky footer */}
            <div className="sm:hidden fixed bottom-0 left-0 w-full bg-white/90 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-300 dark:border-gray-700 p-3 flex justify-center shadow-lg z-50">
              <div className="w-full max-w-md">
                <MessageSellerButton
                  sellerId={listing.userId}
                  listingId={listing._id}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- MAP ---------- */}
      {listing.location?.coordinates && (
        <div className="h-72 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
          <Map singleListing={listing} zoom={15} />
        </div>
      )}
    </motion.div>
  );
}
