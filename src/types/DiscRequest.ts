// src/types/discRequest.ts
export type DiscRequest = {
  _id: string;
  userId: string;

  title: string;
  description?: string;

  brand?: string;
  plastic?: string;
  weight?: number;
  color?: string;
  condition?: "New" | "Like New" | "Used" | "Worn";

  // GeoJSON
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };

  createdAt: string;
};
