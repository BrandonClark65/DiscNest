// types/user.ts (or wherever your types live)

import type { DiscBrand, DiscPlastic } from "@/app/constants/discData";

export interface DiscNestUser {
  _id: string;

  // Basic Info
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  password?: string;

  // Location
  location?: {
    type: "Point";
    coordinates: [number, number];
  };

  // Disc Golf Info
  pdgaNumber?: number;
  homeCourse?: string;
  favoriteCourses?: string[];
  maxDistanceFt?: number;
  goals?: string;

  // ---- Play Style ----
  dominantHand?: "Left" | "Right" | "Both";
  throwStyle?: "Backhand" | "Forehand" | "Both";
  favoriteBrands?: DiscBrand[];
  preferredDiscTypes?: ("Putter" | "Midrange" | "Fairway Driver" | "Distance Driver")[];
  stabilityPreference?: "Straight" | "Overstable" | "Understable";
  armSpeed?: "Slow" | "Medium" | "Fast";
  skillLevel?: "Beginner" | "Intermediate" | "Advanced" | "Pro";
  playFrequency?: "<1 per week" | "1-2 times per week" | "Every day";
  preferredPlastics?: DiscPlastic[];

  // ---- Disc Collections ----
  discShelf?: string[];
  bag?: string[];
  shareableBagId?: string | null;
  bagVisibility?: 'private' | 'public';
  discCount?: number;

  // ---- Meta ----
  createdAt?: Date | string;
  lastLogin?: Date | null;
  hasOnboarded?: boolean;
  role?: string;
  moderationFlags?: number;
  lastFlaggedAt?: Date | null;

  // ---- Store Fields ----
  storeName?: string; // Unique store name for URL slug
}
