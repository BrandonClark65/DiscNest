import MessageSellerButton from "@/components/MessageSellerButton";
import type { Listing } from "@/types/listing";
import Image from "next/image";

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow duration-200 flex flex-col">
      {/* Image */}
      {listing.imageUrls && listing.imageUrls.length > 0 && (
        <div className="w-full aspect-w-1 aspect-h-1 mb-4 relative">
          <Image
            src={listing.imageUrls[0]}
            alt={listing.title}
            fill
            className="object-cover rounded"
            sizes="(max-width: 768px) 100vw, 300px"
            unoptimized
            onError={(e) => {
              // Replace image with local fallback
              const target = e.target as HTMLImageElement;
              target.src = "/fallback.jpg";
            }}
          />
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-bold mb-1 truncate">{listing.title}</h3>

      {/* Brand / Condition */}
      <p className="text-sm text-gray-600 mb-2 truncate">
        {listing.brand} – {listing.condition}
      </p>

      {/* Price */}
      <p className="text-md font-semibold mb-4">${listing.price.toFixed(2)}</p>

      {/* Message Seller Button */}
      <MessageSellerButton
        sellerId={listing.userId}
        listingId={listing._id}
      />
    </div>
  );
}

export default ListingCard;

