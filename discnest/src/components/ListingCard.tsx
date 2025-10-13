import type { Listing } from "@/types/listing";
import Image from "next/image";
import Link from "next/link";

type ListingCardProps = {
  listing: Listing;
  isOwner?: boolean;
  onDelete?: () => void;
  onMarkSold?: () => void;
};

function ListingCard({ listing, isOwner, onDelete, onMarkSold }: ListingCardProps) {
  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow duration-200 flex flex-col">
      {listing.imageUrls && listing.imageUrls.length > 0 && (
        <div className="w-full aspect-square mb-4 relative">
          <Image
            src={listing.imageUrls[0]}
            alt={listing.title}
            fill
            className="object-cover rounded"
            sizes="(max-width: 768px) 100vw, 300px"
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/fallback.jpg";
            }}
          />
        </div>
      )}

      <h3 className="text-lg font-bold mb-1 truncate">{listing.title}</h3>
      <p className="text-sm text-gray-600 mb-2 truncate">
        {listing.brand} – {listing.condition}
      </p>
      <p className="text-md font-semibold mb-4">
        {listing.price ? `$${listing.price.toFixed(2)}` : 'Price not listed'}
      </p>

      <Link href={`/listing/${listing._id}`}>
        <button
          className="bg-blue-600 text-white py-2 px-4 rounded w-full mb-2
                    hover:bg-blue-700 active:bg-blue-800
                    hover:scale-105 active:scale-95
                    transition duration-150 transform"
        >
          View Listing
        </button>
      </Link>

      {/* Owner actions */}
      {isOwner && !listing.sold && (
        <div className="flex gap-2">
          <button
            onClick={onMarkSold}
            className="bg-green-500 text-white px-2 py-1 rounded flex-1
                      hover:bg-green-600 active:bg-green-700
                      hover:scale-105 active:scale-95
                      transition duration-150 transform"
          >
            Mark as Sold
          </button>

          <button
            onClick={onDelete}
            className="bg-red-500 text-white px-2 py-1 rounded flex-1
                      hover:bg-red-600 active:bg-red-700
                      hover:scale-105 active:scale-95
                      transition duration-150 transform"
          >
            Delete
          </button>
        </div>
      )}

      {/* Sold badge */}
      {listing.sold && (
        <span className="text-gray-500 italic mt-2">Sold</span>
      )}
    </div>
  );
}


export default ListingCard;
