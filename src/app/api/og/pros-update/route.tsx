import { ImageResponse } from "next/og";
import { getProsBySlugs } from "@/lib/pros/proService";
import type { SerializedPro } from "@/lib/pros/proService";
import { throwsFromPro } from "@/lib/handicap/proComparison";
import { RATING_FLOOR, RATING_CEILING } from "@/app/constants/handicapConfig";

// Mongoose is used to look up the pros, so this runs on the Node runtime.
export const runtime = "nodejs";

// Brand palette (Satori cannot read CSS variables, so the values are inline).
const RICH_BLACK = "#011627";
const TUFTS_BLUE = "#3c91e6";
const SAFETY_ORANGE = "#f17300";
const OFF_WHITE = "#f9fafb";
const UP_GREEN = "#3fbf6f";
const DOWN_RED = "#e0574f";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

const MAX_PROS = 10;
const DEFAULT_REFERENCE = 900;

/** Rating movement since the last update, or null when it has not moved. */
function ratingDelta(pro: SerializedPro): number | null {
  if (pro.previousRating == null) return null;
  const d = pro.rating - pro.previousRating;
  return d === 0 ? null : d;
}

function clampReference(raw: string | null): number {
  if (raw == null) return DEFAULT_REFERENCE;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < RATING_FLOOR || n > RATING_CEILING) return DEFAULT_REFERENCE;
  return Math.round(n);
}

/** Latest "as of" date across the shown pros, for the subtitle. */
function asOf(pros: SerializedPro[]): string {
  const times = pros
    .map((p) => (p.ratingUpdatedAt ? new Date(p.ratingUpdatedAt).getTime() : 0))
    .filter(Boolean);
  const d = times.length ? new Date(Math.max(...times)) : new Date();
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** A small CSS triangle, drawn with borders so it needs no glyph font support. */
function Arrow({ up }: { up: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        width: 0,
        height: 0,
        borderLeft: "9px solid transparent",
        borderRight: "9px solid transparent",
        ...(up
          ? { borderBottom: `14px solid ${UP_GREEN}` }
          : { borderTop: `14px solid ${DOWN_RED}` }),
      }}
    />
  );
}

/**
 * GET /api/og/pros-update?pros=<slug,slug,...>&r=<rating>&title=<text>&format=og|square
 *
 * A shareable card built around the hook that actually travels: how many throws
 * a typical player (rating `r`, default 900) would get from each chosen pro.
 * The rating and its up/down move stay as small context. Deliberately light on
 * branding so it reads as an interesting stat, not an advert. The generator
 * lives in the admin dashboard; this route only renders public data.
 */
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const slugs = (searchParams.get("pros") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_PROS);
  const reference = clampReference(searchParams.get("r"));
  const square = searchParams.get("format") === "square";
  const title = (searchParams.get("title") ?? "How many throws would you get?").slice(0, 70);

  const width = square ? 1080 : 1200;
  const height = square ? 1080 : 630;

  const pros = await getProsBySlugs(slugs);
  const many = pros.length > 6;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 64,
          backgroundColor: RICH_BLACK,
          backgroundImage: `radial-gradient(circle at 85% 12%, rgba(60,145,230,0.20), transparent 45%), radial-gradient(circle at 8% 92%, rgba(241,115,0,0.18), transparent 45%)`,
        }}
      >
        {/* Header: the hook leads, not the brand. */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 800, color: OFF_WHITE }}>
            {title}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: OFF_WHITE, opacity: 0.6, marginTop: 8 }}>
            Throws a {reference}-rated player gets from each pro · {asOf(pros)} ratings
          </div>
        </div>

        {/* Rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            gap: many ? 10 : 16,
            marginTop: 24,
          }}
        >
          {pros.length === 0 ? (
            <div style={{ display: "flex", fontSize: 34, color: OFF_WHITE, opacity: 0.7 }}>
              No pros selected.
            </div>
          ) : (
            pros.map((pro) => {
              const d = ratingDelta(pro);
              const throws = throwsFromPro(reference, pro.rating).throws;
              const sign = throws >= 0 ? "+" : "-";
              return (
                <div
                  key={pro.slug}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(249,250,251,0.12)",
                    paddingBottom: many ? 8 : 14,
                  }}
                >
                  {/* Identity + small rating/movement */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ display: "flex", fontSize: 20, color: OFF_WHITE, opacity: 0.45, width: 58 }}>
                        {pro.division}
                      </div>
                      <div style={{ display: "flex", fontSize: many ? 34 : 40, fontWeight: 700, color: OFF_WHITE }}>
                        {pro.name}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 72, marginTop: 2 }}>
                      <div style={{ display: "flex", fontSize: 20, color: OFF_WHITE, opacity: 0.5 }}>
                        {pro.rating} rated
                      </div>
                      {d != null && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            color: d > 0 ? UP_GREEN : DOWN_RED,
                            fontSize: 20,
                            fontWeight: 700,
                          }}
                        >
                          <Arrow up={d > 0} />
                          {Math.abs(d)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* The headline: throws you would get. */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div style={{ display: "flex", fontSize: many ? 56 : 68, fontWeight: 800, color: SAFETY_ORANGE, lineHeight: 1 }}>
                      {sign}
                      {Math.abs(throws)}
                    </div>
                    <div style={{ display: "flex", fontSize: 18, color: OFF_WHITE, opacity: 0.55, marginTop: 2 }}>
                      throws
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: quiet attribution, no call to action. */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, opacity: 0.6 }}>
          <div style={{ display: "flex", fontWeight: 700 }}>
            <span style={{ color: TUFTS_BLUE }}>Disc</span>
            <span style={{ color: SAFETY_ORANGE }}>Nest</span>
          </div>
          <div style={{ display: "flex", color: OFF_WHITE }}>discnest.com/handicap</div>
        </div>
      </div>
    ),
    { width, height, headers: CACHE_HEADERS }
  );
}
