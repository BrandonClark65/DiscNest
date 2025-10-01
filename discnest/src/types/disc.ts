export type Disc = {
  _id: string;
  name: string;
  brand?: string;
  type?: string;
  stability?: string;
  image?: string;
  notes?: string;
  flight?: {
    speed?: number;
    glide?: number;
    turn?: number;
    fade?: number;
  };
  userId?: string;
  addedAt?: string;
};