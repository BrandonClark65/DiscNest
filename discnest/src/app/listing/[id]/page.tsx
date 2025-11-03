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
import ShareButton from '@/components/ui/ShareButton';

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
      <div className="p-8 text-center text-[var(--foreground)]/60 animate-pulse">
        Loading listing...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-[var(--accent)] font-semibold">
        {error}
      </div>
    );
  if (!listing)
    return (
      <div className="p-8 text-center text-[var(--foreground)]/60">
        Listing not found
      </div>
    );

  const handleImageClick = (index: number) => setActiveImage(index);

  return (
    <motion.div
      className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 text-[var(--foreground)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* ---------- BACK BUTTON ---------- */}
      <GradientButton
        label="Back to Marketplace"
        href="/marketplace"
        variant="muted"
        icon={<ArrowBigLeft className="w-5 h-5" />}
        className="mb-2"
      />

      {/* ---------- MAIN CONTAINER ---------- */}
      <div
        className="flex flex-col lg:flex-row gap-10 border border-[var(--muted)]/30 
                   rounded-2xl p-6 shadow-md hover:shadow-lg transition-all
                   bg-[color-mix(in srgb, var(--surface) 85%, var(--foreground) 5%)]
                   dark:bg-[var(--surface)]"
      >
        {/* ---------- LEFT: IMAGE GALLERY ---------- */}
        <div className="flex-1">
          {listing.imageUrls.length > 0 && (
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-md">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-[var(--muted)]/20 animate-pulse" />
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
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src = '/fallback.jpg')
                    }
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Thumbnails */}
          {listing.imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto mt-3 pb-2 scrollbar-thin scrollbar-thumb-[var(--muted)]/60">
              {listing.imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => handleImageClick(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-transform duration-200 hover:scale-105 ${
                    index === activeImage
                      ? 'border-[var(--primary)] shadow-md'
                      : 'border-transparent'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${listing.title} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src = '/fallback.jpg')
                    }
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------- RIGHT: DETAILS ---------- */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <h1
                className="text-3xl font-extrabold bg-gradient-to-r 
                           from-[var(--primary)] via-[var(--accent)] to-[var(--primary)]
                           bg-clip-text text-transparent"
              >
                {listing.title}
              </h1>
              <ShareButton
                title={listing.title}
                text={`Check out this disc on DiscNest: ${listing.title}`}
                url={`${typeof window !== 'undefined' ? window.location.href : ''}`}
                label="Share"
                className="!px-2 !py-1 text-sm"
              />
            </div>
            <p className="text-[var(--foreground)]/80 mb-5 leading-relaxed">
              {listing.description || 'No description provided.'}
            </p>

            <div className="space-y-2 text-[var(--foreground)]/90 text-sm sm:text-base">
              <p>
                <span className="font-semibold text-[var(--foreground)]/60">
                  Brand:
                </span>{' '}
                {listing.brand || '-'}
              </p>
              <p>
                <span className="font-semibold text-[var(--foreground)]/60">
                  Plastic:
                </span>{' '}
                {listing.plastic || '-'}
              </p>
              <p>
                <span className="font-semibold text-[var(--foreground)]/60">
                  Weight:
                </span>{' '}
                {listing.weight ? `${listing.weight}g` : '-'}
              </p>
              <p>
                <span className="font-semibold text-[var(--foreground)]/60">
                  Condition:
                </span>{' '}
                {listing.condition}
              </p>
              <p>
                <span className="font-semibold text-[var(--foreground)]/60">
                  Listing Type:
                </span>{' '}
                {listing.type}
              </p>
              <p>
                <span className="font-semibold text-[var(--foreground)]/60">
                  Price:
                </span>{' '}
                {listing.price !== undefined ? (
                  <span className="text-[var(--accent)] font-semibold">
                    ${listing.price.toFixed(2)}
                  </span>
                ) : (
                  'Not listed'
                )}
              </p>
              <p>
                <span className="font-semibold text-[var(--foreground)]/60">
                  Location:
                </span>{' '}
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
            <div className="sm:hidden fixed bottom-0 left-0 w-full bg-[var(--surface)]/90 backdrop-blur-md border-t border-[var(--muted)]/40 p-3 flex justify-center shadow-lg z-50">
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
        <div className="h-72 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-md border border-[var(--muted)]/30">
          <Map singleListing={listing} zoom={15} />
        </div>
      )}
    </motion.div>  
  );
}
