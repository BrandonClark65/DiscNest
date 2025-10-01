export interface DiscNestUser {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  password?: string;
  hasOnboarded?: boolean;
  role?: string;
  favoriteBrands?: string[];
  preferredTypes?: string[];
  stability?: string;
  throwingStyle?: string;
  maxDistance?: number;
  favoriteCourse?: string;
  discCount?: number;
  lastLogin?: Date | null;
  discShelf?: string[];
  bag?: string[];
  createdAt?: Date | string;
}