import { z } from "zod";
import { RATING_FLOOR, RATING_CEILING } from "@/app/constants/handicapConfig";

/** A URL-safe slug: lowercase letters, numbers, and single hyphens. */
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase words joined by hyphens");

const rating = z
  .number()
  .int()
  .min(RATING_FLOOR)
  .max(RATING_CEILING);

/**
 * Shape for creating or seeding a pro player. Shared by the seed script and,
 * later, the admin API, so validation lives in exactly one place.
 */
export const proPlayerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug,
  division: z.enum(["MPO", "FPO"]),
  rating,
  // Optional until verified against pdga.com - see the model comment.
  pdgaNumber: z.number().int().positive().optional(),
  blurb: z.string().trim().max(140).optional(),
  featured: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  active: z.boolean().optional(),
  // Admin display pin; null clears it.
  manualOverride: rating.nullable().optional(),
});

export type ProPlayerInput = z.infer<typeof proPlayerSchema>;

/**
 * Partial shape for editing an existing pro. Every field optional except the
 * id that names the pro to update. `slug` is intentionally not editable here -
 * changing it would break any share link already in the wild.
 */
export const proPlayerUpdateSchema = proPlayerSchema
  .partial()
  .omit({ slug: true })
  .extend({ id: z.string().min(1) });

export type ProPlayerUpdate = z.infer<typeof proPlayerUpdateSchema>;
