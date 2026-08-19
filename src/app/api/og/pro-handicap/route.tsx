import { ImageResponse } from "next/og";
import { getProBySlug } from "@/lib/pros/proService";
import { throwsFromPro } from "@/lib/handicap/proComparison";
import { RATING_FLOOR, RATING_CEILING } from "@/app/constants/handicapConfig";

// Mongoose is used to look up the pro, so this runs on the Node runtime.
export const runtime = "nodejs";

// Brand palette (Satori cannot read CSS variables, so the values are inline).
const RICH_BLACK = "#011627";
const TUFTS_BLUE = "#3c91e6";
const SAFETY_ORANGE = "#f17300";
const OFF_WHITE = "#f9fafb";

const CACHE_HEADERS = {
  // A given (pro, rating) pair renders the same, but a pro's rating can change
  // monthly, so this is fresh-for-a-day rather than immutable.
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

function clampRating(raw: string | null): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < RATING_FLOOR || n > RATING_CEILING) return null;
  return Math.round(n);
}

/**
 * GET /api/og/pro-handicap?vs=<slug>&r=<rating>&format=og|square
 *
 * The dynamic share card: renders the visitor's own "N throws from <pro>"
 * number so a shared link previews with their result, not a generic image.
 * Pro name and rating come from the database by slug; the player rating rides
 * in the query so the card needs no per-visitor state.
 */
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("vs");
  const playerRating = clampRating(searchParams.get("r"));
  const square = searchParams.get("format") === "square";

  const width = square ? 1080 : 1200;
  const height = square ? 1080 : 630;

  const pro = slug ? await getProBySlug(slug) : null;

  // Generic fallback when we have no pro or no usable rating.
  const comparison =
    pro && playerRating != null ? throwsFromPro(playerRating, pro.rating) : null;

  const wordmark = (
    <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
      <span style={{ color: TUFTS_BLUE }}>Disc</span>
      <span style={{ color: SAFETY_ORANGE }}>Nest</span>
    </div>
  );

  const content =
    pro && comparison ? (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{ display: "flex", fontSize: 34, color: OFF_WHITE, opacity: 0.85 }}>
          {comparison.throws >= 0 ? "You would get" : "You would spot"}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 20,
            marginTop: 8,
          }}
        >
          <div style={{ display: "flex", fontSize: 200, fontWeight: 800, color: SAFETY_ORANGE, lineHeight: 1 }}>
            {Math.abs(comparison.throws)}
          </div>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 700, color: OFF_WHITE }}>
            {Math.abs(comparison.throws) === 1 ? "throw" : "throws"}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 44, color: OFF_WHITE, marginTop: 12 }}>
          {comparison.throws >= 0 ? "from " : "to "}
          <span style={{ color: TUFTS_BLUE, fontWeight: 700, marginLeft: 12 }}>{pro.name}</span>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: OFF_WHITE, opacity: 0.6, marginTop: 24 }}>
          My rating {playerRating} vs {pro.name} {pro.rating}
        </div>
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: OFF_WHITE, lineHeight: 1.1 }}>
          How many throws would
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: SAFETY_ORANGE, lineHeight: 1.1 }}>
          you get from a pro?
        </div>
        <div style={{ display: "flex", fontSize: 30, color: OFF_WHITE, opacity: 0.7, marginTop: 24 }}>
          Find out on DiscNest.
        </div>
      </div>
    );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: RICH_BLACK,
          backgroundImage: `radial-gradient(circle at 85% 15%, rgba(60,145,230,0.25), transparent 45%), radial-gradient(circle at 10% 90%, rgba(241,115,0,0.22), transparent 45%)`,
        }}
      >
        {wordmark}
        {content}
        <div style={{ display: "flex", fontSize: 28, color: OFF_WHITE, opacity: 0.75 }}>
          discnest.com/handicap
        </div>
      </div>
    ),
    { width, height, headers: CACHE_HEADERS }
  );
}
