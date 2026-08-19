import { ImageResponse } from "next/og";
import { getProsBySlugs } from "@/lib/pros/proService";
import type { SerializedPro } from "@/lib/pros/proService";

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

function delta(pro: SerializedPro): number | null {
  if (pro.previousRating == null) return null;
  const d = pro.rating - pro.previousRating;
  return d === 0 ? null : d;
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
        borderLeft: "13px solid transparent",
        borderRight: "13px solid transparent",
        ...(up
          ? { borderBottom: `20px solid ${UP_GREEN}` }
          : { borderTop: `20px solid ${DOWN_RED}` }),
      }}
    />
  );
}

/**
 * GET /api/og/pros-update?pros=<slug,slug,...>&title=<text>&format=og|square
 *
 * A shareable card listing chosen pros with their current rating and the
 * up/down move since the last update. Built for posting when the monthly PDGA
 * ratings land. The generator lives in the admin dashboard; this route only
 * renders public rating data.
 */
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const slugs = (searchParams.get("pros") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_PROS);
  const square = searchParams.get("format") === "square";
  const title = (searchParams.get("title") ?? "Pro Ratings Update").slice(0, 60);

  const width = square ? 1080 : 1200;
  const height = square ? 1080 : 630;

  const pros = await getProsBySlugs(slugs);

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
          backgroundImage: `radial-gradient(circle at 85% 12%, rgba(60,145,230,0.22), transparent 45%), radial-gradient(circle at 8% 92%, rgba(241,115,0,0.20), transparent 45%)`,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: OFF_WHITE }}>
              {title}
            </div>
            <div style={{ display: "flex", fontSize: 26, color: OFF_WHITE, opacity: 0.6, marginTop: 6 }}>
              PDGA ratings, as of {asOf(pros)}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
            <span style={{ color: TUFTS_BLUE }}>Disc</span>
            <span style={{ color: SAFETY_ORANGE }}>Nest</span>
          </div>
        </div>

        {/* Rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            gap: pros.length > 6 ? 10 : 18,
            marginTop: 28,
          }}
        >
          {pros.length === 0 ? (
            <div style={{ display: "flex", fontSize: 34, color: OFF_WHITE, opacity: 0.7 }}>
              No pros selected.
            </div>
          ) : (
            pros.map((pro) => {
              const d = delta(pro);
              return (
                <div
                  key={pro.slug}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(249,250,251,0.12)",
                    paddingBottom: pros.length > 6 ? 8 : 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ display: "flex", fontSize: 22, color: OFF_WHITE, opacity: 0.5, width: 64 }}>
                      {pro.division}
                    </div>
                    <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: OFF_WHITE }}>
                      {pro.name}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <div style={{ display: "flex", fontSize: 46, fontWeight: 800, color: OFF_WHITE }}>
                      {pro.rating}
                    </div>
                    {d != null && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: 96,
                          color: d > 0 ? UP_GREEN : DOWN_RED,
                          fontSize: 34,
                          fontWeight: 700,
                        }}
                      >
                        <Arrow up={d > 0} />
                        {Math.abs(d)}
                      </div>
                    )}
                    {d == null && <div style={{ display: "flex", width: 96 }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", fontSize: 26, color: OFF_WHITE, opacity: 0.7 }}>
          discnest.com/handicap
        </div>
      </div>
    ),
    { width, height, headers: CACHE_HEADERS }
  );
}
