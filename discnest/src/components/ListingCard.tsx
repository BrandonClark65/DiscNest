import type { Listing } from "@/types/listing";
import Image from "next/image";
import Link from "next/link";

function ListingCard({ listing }: { listing: Listing }) {
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
        <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
          View Listing
        </button>
      </Link>
    </div>
  );
}

export default ListingCard;
