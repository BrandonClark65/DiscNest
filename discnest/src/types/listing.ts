export type Listing = {
  _id: string;
  sellerId: { _id: string; name: string };
  title: string;
  brand: string;
  condition: string;
  price: number;
  location: { coordinates: [number, number] };
  imageUrls: string[];
  userId: string;
  pendingReview?: boolean;
};