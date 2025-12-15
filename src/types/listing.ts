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
  publicIds?: string[];
  location?: { coordinates: [number, number] };
  city?: string;
  state?: string;
  radiusVisibility?: number;
  createdAt?: string;
  pendingReview?: boolean;
  plastic?: string;
  sold?: boolean;
  weight?: number; // in grams
  color?: string; // optional color description
};

export type ListingAdmin = Listing & {
  userId: {
    _id: string;
    name?: string;
    email?: string;
  };
};

