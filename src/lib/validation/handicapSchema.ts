// src/lib/validation/handicapSchema.ts
import { z } from "zod";
import { parseDateKey } from "@/lib/dateOnly";
import {
  ROUND_TYPES,
  MIN_HOLES,
  MAX_HOLES,
  MIN_SCORE,
  MAX_SCORE,
  UDISC_MIN,
  UDISC_MAX,
  RATING_FLOOR,
  RATING_CEILING,
} from "@/app/constants/handicapConfig";

/**
 * The date a round was played, normalized to midnight UTC.
 *
 * `z.coerce.date()` happened to produce midnight UTC for the `YYYY-MM-DD` the
 * form sends, but only by accident of how JS parses date-only strings, and it
 * kept the time of day on anything else. Normalizing explicitly makes the
 * calendar-day convention a guarantee readers can rely on, at the one point every
 * write path - POST and PUT alike - already goes through.
 */
const roundDate = z
  .union([z.string(), z.number(), z.date()])
  .transform(parseDateKey)
  .refine((date) => !Number.isNaN(date.getTime()), { message: "Invalid date" });

/** Fields every round carries, whatever its source. */
const baseRound = {
  courseName: z.string().trim().max(120).optional(),
  layoutName: z.string().trim().max(120).optional(),
  date: roundDate,
  holes: z.number().int().min(MIN_HOLES).max(MAX_HOLES).default(18),
  roundType: z.enum(ROUND_TYPES).default("casual"),
  completed: z.boolean().default(true),
  notes: z.string().max(300).optional(),
};

const score = z.number().min(MIN_SCORE).max(MAX_SCORE);

/**
 * Discriminated on `source` so each input type only requires its own fields.
 * This is what stops a "score + par" round from silently being accepted with
 * no par, which would then rate against undefined.
 */
export const handicapRoundSchema = z.discriminatedUnion("source", [
  z.object({
    ...baseRound,
    source: z.literal("pdga"),
    providedRating: z.number().min(RATING_FLOOR).max(RATING_CEILING),
  }),
  z.object({
    ...baseRound,
    source: z.literal("udisc"),
    providedRating: z.number().min(UDISC_MIN).max(UDISC_MAX),
  }),
  z.object({
    ...baseRound,
    source: z.literal("score_ssa"),
    score,
    ssa: z.number().min(MIN_SCORE).max(MAX_SCORE),
  }),
  z.object({
    ...baseRound,
    source: z.literal("score_par"),
    score,
    par: z.number().min(MIN_SCORE).max(MAX_SCORE),
  }),
]);

export type HandicapRoundInput = z.infer<typeof handicapRoundSchema>;

/** Editing a round replaces it wholesale, so the same shape applies. */
export const handicapRoundUpdateSchema = handicapRoundSchema;

export const handicapSnapshotSchema = z.object({
  note: z.string().max(200).optional(),
  targetRating: z.number().min(RATING_FLOOR).max(RATING_CEILING).optional(),
});

export type HandicapSnapshotInput = z.infer<typeof handicapSnapshotSchema>;
