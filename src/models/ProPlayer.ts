import { Schema, model, models } from "mongoose";

/**
 * A touring pro whose rating is shown on the handicap page so visitors can see
 * how many throws they would get from them.
 *
 * Ratings are entered and maintained manually today. The `pdgaNumber`,
 * `syncSource`, `manualOverride`, and `lastSyncedAt` fields are the seam for a
 * future PDGA API sync (see docs/Feature Enhancements/PRO_HANDICAP_COMPARISON.md):
 * once a PDGA membership and API access are in place, a sync job can fill
 * `rating` from the official number, while `manualOverride` always wins so a
 * wrong value can be corrected without waiting for the next sync.
 */
const ProPlayerHistorySchema = new Schema(
  {
    rating: { type: Number, required: true },
    effectiveDate: { type: Date, required: true },
  },
  { _id: false }
);

const ProPlayerSchema = new Schema(
  {
    // Optional on purpose: a pro can be shown from manual data alone. It must
    // be present AND verified against pdga.com before the future API sync may
    // trust it, since a wrong number would pull a different player's rating.
    pdgaNumber: { type: Number, sparse: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 120 },

    // Stable, URL-safe identity used in share links (?vs=<slug>). Unique.
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },

    division: {
      type: String,
      enum: ["MPO", "FPO"],
      required: true,
    },

    // Current rating shown to users. When manualOverride is set it takes
    // precedence at read time (see the pre-save hook below).
    rating: { type: Number, required: true },
    previousRating: { type: Number },

    // When the rating value last CHANGED, for the "updated <date>" line and the
    // month-over-month delta. Distinct from lastSyncedAt.
    ratingUpdatedAt: { type: Date, default: Date.now },

    // When a sync last successfully checked this pro, whatever the outcome.
    // Drives the staleness warning in the UI.
    lastSyncedAt: { type: Date },

    syncSource: {
      type: String,
      enum: ["manual", "pdga_api"],
      default: "manual",
    },

    // Admin-entered value that overrides a synced rating. Null/undefined means
    // "trust the synced rating".
    manualOverride: { type: Number },

    // Shown in the default set on /handicap.
    featured: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },

    // Soft delete. A removed pro must still resolve so old share links render.
    active: { type: Boolean, default: true, index: true },

    // Short flavour line, e.g. "2024 World Champion".
    blurb: { type: String, trim: true, maxlength: 140 },

    // Last 24 rating points, for the sparkline. Embedded rather than a separate
    // collection: tiny, always read with the parent, and there are ~15 pros.
    history: { type: [ProPlayerHistorySchema], default: [] },
  },
  { timestamps: true }
);

// The list query is "active, featured pros in display order".
ProPlayerSchema.index({ active: 1, featured: 1, displayOrder: 1 });

/**
 * A manual override is the source of truth for the displayed rating when set,
 * so `rating` reflects it and stays consistent everywhere it is read.
 */
ProPlayerSchema.pre("save", function proPlayerPreSave(next) {
  if (this.manualOverride != null && this.rating !== this.manualOverride) {
    this.rating = this.manualOverride;
  }
  next();
});

export default models.ProPlayer || model("ProPlayer", ProPlayerSchema);
