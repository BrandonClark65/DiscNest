// src/lib/validation/userSchema.ts
import { z } from "zod";
import { DiscBrands, DiscPlastics } from "@/app/constants/discData";

export const userSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  username: z.string().min(3).max(20).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(300).optional(),
  password: z.string().min(6).optional(),

  // Location
  location: z
    .object({
      type: z.literal("Point"),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),

  // Disc Golf Info
  pdgaNumber: z.number().optional(),
  homeCourse: z.string().optional(),
  favoriteCourses: z.array(z.string()).optional(),
  maxDistanceFt: z.number().min(0).max(800).optional(),
  goals: z.string().optional(),

  // Play Style
  dominantHand: z.enum(["Left", "Right", "Both"]).optional(),
  throwStyle: z.enum(["Backhand", "Forehand", "Both"]).optional(),
  favoriteBrands: z.array(z.enum(DiscBrands)).optional(),
  preferredDiscTypes: z
    .array(z.enum(["Putter", "Midrange", "Fairway Driver", "Distance Driver"]))
    .optional(),
  stabilityPreference: z.enum(["Straight", "Overstable", "Understable"]).optional(),
  armSpeed: z.enum(["Slow", "Medium", "Fast"]).optional(),
  skillLevel: z.enum(["Beginner", "Intermediate", "Advanced", "Pro"]).optional(),
  playFrequency: z.enum(["<1 per week", "1-2 times per week", "Every day"]).optional(),
  preferredPlastics: z.array(z.enum(DiscPlastics)).optional(),

  // Meta / Collections
  discShelf: z.array(z.string()).optional(),
  bag: z.array(z.string()).optional(),
  discCount: z.number().default(0).optional(),

  // Meta fields
  createdAt: z.union([z.string(), z.date()]).optional(),
  lastLogin: z.date().nullable().optional(),
  hasOnboarded: z.boolean().optional(),
  role: z.string().optional(),
  moderationFlags: z.number().optional(),
  lastFlaggedAt: z.date().nullable().optional(),
});

export const editableProfileSchema = userSchema.pick({
  name: true,
  username: true,
  avatarUrl: true,
  bio: true,
  location: true,
  pdgaNumber: true,
  homeCourse: true,
  favoriteCourses: true,
  maxDistanceFt: true,
  goals: true,
  dominantHand: true,
  throwStyle: true,
  favoriteBrands: true,
  preferredDiscTypes: true,
  stabilityPreference: true,
  armSpeed: true,
  skillLevel: true,
  playFrequency: true,
  preferredPlastics: true,
});

export type UserSchema = z.infer<typeof userSchema>;
