export type Listing = {
  _id: string;
  userId: string; // reference to the seller
  title: string;
  description?: string;
  brand?: string;
  condition: "New" | "Used - Like New" | "Used - Fair";
  type: "Sell" | "Trade";
  price?: number;
  imageUrls: string[];
  location?: { coordinates: [number, number] };
  city?: string;
  radiusVisibility?: number;
  createdAt?: string;
  pendingReview?: boolean;
  plastic?: string;
};

export type ListingAdmin = Listing & {
  userId: {
    _id: string;
    name?: string;
    email?: string;
  };
};

