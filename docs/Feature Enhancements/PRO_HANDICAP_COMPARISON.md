# Pro Player Handicap Comparison ("How many throws do you get from the pros?")

**Status:** Plan — not yet implemented
**Owner:** Brandon
**Related:** `src/components/handicap/`, `src/lib/handicap/`, `src/app/api/handicap/`

---

## Overview

Show the current ratings of a curated set of touring pros on the handicap page, and
tell the visitor how many throws they would receive from each one. The number is
personal, instantly understandable, slightly humbling, and screenshot-shaped — which
is exactly what makes it shareable.

Three goals, in priority order:

1. **Engagement** — give visitors a reason to open `/handicap` even when they have no
   new round to enter, and a reason to come back monthly when pro ratings move.
2. **Shareability** — one tap produces a link and an image good enough to post to
   Reddit, a Facebook league group, or Instagram Stories, with a DiscNest branded card.
3. **Acquisition** — every shared card is a landing page for "what's my disc golf
   handicap", pointing back at the calculator.

### The math already exists

This is mostly a **data + UI** feature, not a math feature. `courseHandicap()` in
`src/lib/handicap/handicapUtils.ts` already takes a target rating:

```ts
courseHandicap(rating, { ppt }, targetRating, allowance)
// unrounded = (targetRating - rating) / ppt
```

"Throws you get from Calvin" is just `targetRating = Calvin's rating`. The existing
`targetRating` input in `HandicapSummary` is the same lever, exposed as a number box.
This feature replaces that abstract box with named faces — same engine underneath, so
the numbers can never disagree with the rest of the page.

---

## Key requirements

| # | Requirement | Notes |
|---|---|---|
| 1 | Works logged out | The calculator already does. A visitor with no account must get a number and a share link. |
| 2 | Works with zero rounds entered | Let them type a rating directly ("I'm about 900"). Requiring 3 rounds first kills the funnel. |
| 3 | Pro ratings update automatically | See the honesty note below — official ratings move **monthly**, not per tournament. |
| 4 | Ratings never silently go stale | If the sync fails, the UI says when the number was last refreshed. |
| 5 | One-tap share, image included | Link + auto-written text + a generated card image. |
| 6 | No new runtime dependencies | `next/og` ships with Next 15; `chart.js` is already installed. |
| 7 | Admin control without a deploy | Add/remove/reorder pros and override a rating from the admin dashboard. |

---

## Honesty note on "updates when they play a new tournament"

**Official PDGA player ratings update once a month, on the second Tuesday**, covering
every event submitted since the last update ([PDGA ratings
FAQ](https://www.pdga.com/faq/ratings-0), and the monthly
[ratings update announcements](https://www.pdga.com/announcements/pdga-player-ratings-update-published-july-14-2026)).
There is no official per-tournament rating.

So "auto-updates when the pros play" realistically means **auto-updates monthly**. That
is not a downside if we lean into it:

- The sync runs on the second Tuesday, so DiscNest is current the day ratings drop.
- **Ratings day becomes a recurring social moment.** "Ratings update: Gannon +7, Paul
  −4 — how many throws do you get now?" is a free monthly post, every month, forever.
- Show the delta since last month (▲ +7) and the sparkline, so returning visitors see
  something new even when their own rating hasn't moved.

If we later want event-level freshness, the optional add-on is an "unofficial live
rating" derived from a pro's most recent round ratings, clearly labelled as DiscNest's
own estimate. That is out of scope for v1 and should not be confused with the official
number.

---

## 1. Data source

### 1.1 Options

| Option | Verdict |
|---|---|
| **PDGA REST API** (`https://api.pdga.com`) — player search returns rating for current members | ⭐ **Preferred.** Official, structured, stable. |
| Scraping `pdga.com/player/<number>` | ❌ **No.** Same conclusion as `EBAY_SOLD_LISTINGS_ALTERNATIVES.md` — brittle, and against site terms. |
| Manual admin entry | ✅ **Required fallback**, and the day-one shipping path. 12 numbers, once a month, is a two-minute job. |
| Third-party stats sites (Statmando, UDisc Live) | Later, and only for flavour data (last event, finish), not for the rating itself. |

### 1.2 PDGA API access — do this first, it has a lead time

The API is documented at [pdga.com/dev](https://www.pdga.com/dev) with
[auth](https://www.pdga.com/dev/api/rest/v1/auth) and
[services](https://www.pdga.com/dev/api/rest/v1/services) pages.

- Auth is a session login: `POST /services/json/user/login` with PDGA member
  credentials, returning a session id + token used on subsequent calls.
- Player search returns rating **only for currently-current members** — fine, touring
  pros are always current.
- Access requires **reading and signing the PDGA API license agreement** and emailing
  **dev@pdga.com** before launch so they can review the implementation.

⚠️ **Blocker to resolve before relying on it:** the API is offered at no cost for
**non-commercial** use. DiscNest is a marketplace, so we should not assume we qualify.
Email dev@pdga.com early, describe the feature honestly (a free public calculator that
displays current pro ratings with attribution), and ask what the commercial terms are.

**Because the answer may take weeks, the build must not depend on it.** Hence:

### 1.3 Provider abstraction

```
src/lib/pros/
├── proSync.ts                  # orchestration: fetch → diff → upsert → history
└── providers/
    ├── types.ts                # ProRatingProvider interface
    ├── manualProvider.ts       # reads admin-entered values; the default
    └── pdgaApiProvider.ts      # added when access is granted
```

```ts
export interface ProRatingProvider {
  name: 'manual' | 'pdga_api';
  /** Current rating for each PDGA number, or null when unavailable. */
  fetchRatings(pdgaNumbers: number[]): Promise<Map<number, ProRatingFetch | null>>;
}
```

Selected by `PRO_RATING_PROVIDER` env var (default `manual`). Flipping to `pdga_api`
is a one-line env change, no code churn, and the manual override always wins so a
single wrong number can be corrected instantly from the admin panel.

---

## 2. Data model

### 2.1 `src/models/ProPlayer.ts`

```ts
{
  pdgaNumber:      Number,  // unique, indexed — the stable identity
  name:            String,  // "Calvin Heimburg"
  slug:            String,  // unique, indexed — "calvin-heimburg", used in share URLs
  division:        String,  // enum: 'MPO' | 'FPO'
  rating:          Number,  // current official rating
  previousRating:  Number,  // for the ▲/▼ delta
  ratingUpdatedAt: Date,    // when the rating value last CHANGED
  lastSyncedAt:    Date,    // when we last successfully checked
  syncSource:      String,  // enum: 'manual' | 'pdga_api'
  manualOverride:  Number,  // set by admin; wins over synced value when present
  featured:        Boolean, // shows in the default set on /handicap
  displayOrder:    Number,
  active:          Boolean, // soft delete — keeps old share links resolvable
  blurb:           String,  // maxlength 140, e.g. "2024 World Champion"
  history: [{ rating: Number, effectiveDate: Date }],  // capped to last 24 entries
}
```

Indexes: `{ slug: 1 }` unique, `{ pdgaNumber: 1 }` unique,
`{ active: 1, featured: 1, displayOrder: 1 }` for the list query.

`history` is embedded rather than a separate collection: it is at most 24 small
entries per pro, it is always read with the parent, and there will be ~15 documents
total. It feeds the existing `RatingChart` component directly.

**`active` instead of delete.** A shared link naming a pro we later remove must still
render, or every card posted to Reddit rots.

### 2.2 Seed script — `scripts/seed/seedProPlayers.ts`

Follows `scripts/seed/seedDiscs.ts`. Seeds ~12 pros (6 MPO, 6 FPO) with PDGA numbers,
names, blurbs and a starting rating, so the feature is fully functional on day one with
zero external access. Keeping FPO at parity with MPO in the default set is deliberate —
it widens the audience and it is the right thing to do.

---

## 3. Sync job

### 3.1 `src/lib/pros/proSync.ts`

```ts
syncProRatings(options?: { force?: boolean }): Promise<ProSyncReport>
```

For each active pro:
1. Ask the configured provider for the current rating.
2. If unchanged → update `lastSyncedAt` only.
3. If changed → push `{ rating: previous, effectiveDate: ratingUpdatedAt }` onto
   `history`, set `previousRating`, `rating`, `ratingUpdatedAt`, trim history to 24.
4. If the fetch fails → leave the stored rating untouched, record the failure in the
   report. **A failed sync must never blank a rating.**

Returns a report (`{ checked, changed, failed, errors[] }`) so the admin tab and the
cron response can show what happened.

### 3.2 `src/app/api/cron/pros/sync/route.ts`

- `POST`, wrapped in `withErrorHandling` like every other route.
- Authorised by `Authorization: Bearer ${CRON_SECRET}`; returns 401 otherwise. Also
  accept an admin session, so the admin "Sync now" button reuses the same path.
- Returns the `ProSyncReport` as JSON.

### 3.3 Scheduling — new `vercel.json`

The repo has no `vercel.json` yet; this feature introduces one.

```json
{
  "crons": [
    { "path": "/api/cron/pros/sync", "schedule": "0 15 8-14 * 2" }
  ]
}
```

`0 15 8-14 * 2` = 15:00 UTC on the Tuesday falling between the 8th and 14th — i.e.
**exactly the second Tuesday of each month**, a few hours after PDGA publishes. Once
per day at most, so it stays inside Hobby-plan cron limits.

Optionally add a weekly safety net (`0 15 * * 3`) once we're on the PDGA API, to catch
an update that lands late.

---

## 4. API surface

### 4.1 `GET /api/pros` — public

Returns the active pros with `{ slug, name, division, rating, previousRating,
ratingUpdatedAt, blurb, featured, displayOrder }`. Never returns `manualOverride` or
sync internals.

Cached aggressively — the data changes monthly:
`Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`. Note this is the
opposite of the `no-store` used on `/api/handicap/rounds`, and correctly so: this
response is identical for every visitor and contains nothing personal.

### 4.2 `GET/POST/PATCH/DELETE /api/admin/pros` — admin only

Wrapped in `withAdminAuth` (`src/lib/auth/withAdminAuth.ts`). Add a pro by PDGA number,
edit blurb/order/featured, set or clear `manualOverride`, deactivate. Zod schema in
`src/lib/validation/proPlayerSchema.ts`, matching `handicapSchema.ts`.

### 4.3 No new endpoint for the comparison itself

The throws calculation runs in the browser from the `/api/pros` payload and the rating
the calculator already holds — same as the existing local recompute in
`HandicapCalculator`. Zero server round-trips when the visitor flips between pros.

---

## 5. The calculation

New helper in `src/lib/handicap/proComparison.ts` (kept out of `handicapUtils.ts`,
which stays the pure engine):

```ts
export function throwsFromPro(
  playerRating: number,
  proRating: number,
  options?: { ppt?: number; allowance?: number }
): { throws: number; unrounded: number; perHoles: number | null }
```

Implemented on top of `courseHandicap(playerRating, { ppt }, proRating, allowance)` —
no duplicated formula.

Two decisions worth stating:

**Allowance = 1.0, not 0.95.** `DEFAULT_ALLOWANCE` (WHS Appendix C) exists to keep a
competitive field equitable. A headline "you'd get 12 throws from Paul McBeth" is a
comparison, not a competition, and shaving 5% off it only makes it wrong-looking. Add
`PRO_COMPARISON_ALLOWANCE = 1.0` to `handicapConfig.ts` with that reasoning in a
comment, so the choice is visible rather than accidental.

**Round to a whole throw in the headline.** `courseHandicap` returns half-throws, which
is right for league play and wrong for a share card. Show the whole number big, and
"11.5 over 18 holes" in the fine print.

**`perHoles`** — `Math.min(18, Math.round(unrounded))`, phrased as "that's a throw on
12 of 18 holes". It makes an abstract number physical, and it is the line people quote.

**Direction matters.** Follow the existing convention in `HandicapSummary` and never
render a signed number: a strong player facing a lower-rated pro sees "Throws you'd
give back", not "−3".

---

## 6. UI

### 6.1 On `/handicap` — `src/components/handicap/ProComparison.tsx`

A card placed **directly under `HandicapSummary`**, above "Add a round" — high enough
that a first-time visitor sees it, below their own number so it reads as a consequence
of it.

- Horizontal scroller of pro chips (name, division, rating, ▲ delta). Tap to select.
- Headline: **"You'd get 11 throws from Calvin Heimburg"** with the per-hole line under
  it.
- If the visitor has no rating yet: a single "My rating is ___" input, defaulted to 900,
  with a note that entering rounds gives a real number. This is the funnel — the
  comparison works before they have committed anything.
- If they *do* have a rating, that is used automatically.
- Footer: "Ratings from the PDGA, updated <relative date>." Staleness is visible; if
  `lastSyncedAt` is more than 45 days old, say "may be out of date".

### 6.2 Dedicated page — `/handicap/pros`

Server-rendered, indexable, `export const revalidate = 3600`. This is the SEO play:
"disc golf handicap vs pro", "what rating is Calvin Heimburg", "how many throws behind
a pro am I". It carries:

- The full pro grid, all divisions, with sparklines from `history` via `RatingChart`.
- The interactive comparison (same component as 6.1).
- "Which pro are you closest to?" — the nearest rating in either direction. This is the
  friendliest possible framing of the feature and the most likely thing to be shared by
  someone who is *not* a beginner.
- Deep links: `/handicap/pros?vs=calvin-heimburg&r=942` — pro and rating in the query,
  so **the shared URL is stateless and needs no account on either end**. That is the
  single most important decision for virality in this whole plan.
- `Breadcrumbs`, metadata + `StructuredData` mirroring `src/app/handicap/layout.tsx`,
  and an entry added to `src/app/sitemap.ts` (priority 0.8, `changeFrequency: 'monthly'`).

### 6.3 Admin — `src/components/admin/ProsTab.tsx`

New tab in `TabsNav` (`'pros'` added to `TabType`), following `DiscsTab.tsx`:
table of pros, inline edit, featured toggle, drag order, manual rating override, plus a
**Sync now** button and last-sync status with the failure list from the report.

---

## 7. Sharing

This is the half of the feature that decides whether it does anything for growth, so
it deserves more than a link copy.

### 7.1 Share URL

`https://www.discnest.com/handicap/pros?vs=<slug>&r=<rating>`

Stateless, no account, no database row, works for logged-out visitors, and the
recipient lands on a page that immediately invites them to compute their own.

For signed-in players who want their real record attached, keep the existing
`shareableHandicapId` route and add the pro as a query param:
`/share/handicap/<id>?vs=calvin-heimburg` — no new share-id plumbing needed.

### 7.2 Dynamic share image — `src/app/api/og/pro-handicap/route.tsx`

Use `ImageResponse` from `next/og` (built into Next 15 — no new dependency; `canvas`
and Cloudinary are not needed here). Params `?vs=<slug>&r=<rating>&format=og|square`.

- `og` → 1200×630 for link previews on X / Facebook / Discord / Reddit.
- `square` → 1080×1080 for Instagram and stories.

Card content: DiscNest logo, the big number, "throws from Calvin Heimburg", the
player's rating and the pro's rating, `discnest.com/handicap`. Brand gradient
background matching `text-gradient-brand`.

Wire it into `generateMetadata` on `/handicap/pros` so the OG/Twitter image is derived
from the query params — **every shared link previews with that person's own number**,
which is what makes it stop a thumb in a feed.

Cache the route (`s-maxage=31536000, immutable` keyed by the params) since a given
rating/pro pair renders identically forever.

### 7.3 `ShareMenu` — extending `src/components/ui/ShareButton.tsx`

The current `ShareButton` is `navigator.share` + clipboard fallback. Add a sibling
`ShareMenu` (leaving `ShareButton` untouched for its existing callers) offering:

- **Copy link** — existing behaviour.
- **Share sheet** including the image: `navigator.share({ files: [pngFile], ... })` when
  `navigator.canShare({ files })` is true. This is what enables a one-tap post to
  Instagram Stories from a phone, and it is the highest-value item on this list.
- **X / Facebook / Reddit intent links.** Reddit and Facebook groups are where disc golf
  actually congregates — r/discgolf and local league groups will out-perform X here.
- **Download image** — the fallback that always works, for people who post manually.

Auto-written text, e.g.:
> I'd get 11 throws from Calvin Heimburg 😅 What about you? → discnest.com/handicap/pros

### 7.4 Analytics

Add to `GA4EventName` in `src/lib/analytics.ts`: `pro_comparison_view`,
`pro_comparison_select`, `share_pro_handicap`, and params `pro_slug`, `share_channel`.
Without this there is no way to tell whether the feature moved anything.

---

## 8. Risks & open questions

| Risk | Mitigation |
|---|---|
| **PDGA API is non-commercial-only** and DiscNest may not qualify | Email dev@pdga.com before building the provider. Manual provider ships regardless; the feature does not block on the answer. |
| **Player likeness / photos** | **Do not use pro headshots in v1.** Names, PDGA numbers and ratings are facts and fine to display with attribution; photographs are licensed works. Use initials/disc-silhouette avatars — which also keeps the OG image self-contained and fast. |
| Implying pro endorsement | Footer on `/handicap/pros`: ratings sourced from the PDGA; DiscNest is not affiliated with the PDGA or with any player. |
| A wrong rating goes public | `manualOverride` + admin edit, correctable in seconds without a deploy. |
| Sync failure blanks the page | Sync never writes null; UI shows the last-known value plus a staleness note. |
| DiscNest rating ≠ PDGA rating | The comparison mixes a self-reported DiscNest rating with an official PDGA rating. Carry the existing `HandicapSummary` disclaimer into this card verbatim — it is already written and already honest. |
| Cron never fires / silently dies | Admin tab surfaces `lastSyncedAt`; a >45-day-old sync shows a warning badge in the public UI too. |

---

## 9. Environment variables

| Name | Required | Purpose |
|---|---|---|
| `CRON_SECRET` | yes | Bearer token authorising `/api/cron/pros/sync`. |
| `PRO_RATING_PROVIDER` | no (default `manual`) | `manual` or `pdga_api`. |
| `PDGA_API_USERNAME` | only for `pdga_api` | PDGA member login for the session auth. |
| `PDGA_API_PASSWORD` | only for `pdga_api` | As above. |

Add all four to `src/lib/env.ts` (optional-with-validation, matching the existing
pattern) and to `docs/Deployment/ENV_VALIDATION.md`.

---

## 10. Testing

| Layer | File | Covers |
|---|---|---|
| Unit | `tests/unit/proComparison.test.ts` | `throwsFromPro` direction and rounding; equal ratings → 0; player above pro → "give back"; `perHoles` cap at 18; allowance is 1.0, not 0.95. |
| Unit | `tests/unit/proSync.test.ts` | Rating change pushes history; unchanged rating only touches `lastSyncedAt`; **provider failure leaves the stored rating intact**; history trims at 24. |
| Component | `tests/component/handicap/ProComparison.test.tsx` | Renders with no player rating (manual input path); switching pros updates the number; staleness warning past 45 days. |
| Integration | `tests/integration/pros.test.ts` | `/api/pros` shape and cache header; admin routes reject non-admins; cron route rejects a bad `CRON_SECRET`. |
| E2E | `tests/e2e/proHandicap.spec.ts` | Logged-out visitor sets a rating, picks a pro, copies a share link, and the link renders the same number on load. |

---

## 11. Phasing

Each phase is independently shippable and independently useful.

**Phase 1 — Data + comparison (no external dependency)**
`ProPlayer` model, seed script, `GET /api/pros`, `proComparison.ts` + unit tests,
`ProComparison` card on `/handicap`. Ratings are seeded and updated by hand.
→ *The feature is live and usable at the end of this phase.*

**Phase 2 — Sharing**
`/handicap/pros` page with query-param deep links, `next/og` share image, `ShareMenu`,
analytics events, sitemap + metadata.
→ *This is the phase that produces the growth; do not defer it.*

**Phase 3 — Automation**
`proSync.ts` + manual provider, cron route + `vercel.json`, admin `ProsTab`,
`pdgaApiProvider` once PDGA responds.
→ *Removes the monthly manual task.*

**Phase 4 — Extras (pick by what analytics shows)**
"Closest pro to you", ratings-day delta callouts and a monthly social post, pro
sparklines, per-hole visual, FPO/MPO filtering, "gap to close" framing
("38 rating points from Kristin Tattar").

**Start dev@pdga.com in parallel with Phase 1** — it is the longest-lead item and
nothing else waits on it.

---

## 12. Files touched (summary)

**New**
```
src/models/ProPlayer.ts
src/lib/pros/proSync.ts
src/lib/pros/providers/{types,manualProvider,pdgaApiProvider}.ts
src/lib/handicap/proComparison.ts
src/lib/validation/proPlayerSchema.ts
src/app/api/pros/route.ts
src/app/api/admin/pros/route.ts
src/app/api/cron/pros/sync/route.ts
src/app/api/og/pro-handicap/route.tsx
src/app/handicap/pros/{page,layout}.tsx
src/components/handicap/ProComparison.tsx
src/components/admin/ProsTab.tsx
src/components/ui/ShareMenu.tsx
scripts/seed/seedProPlayers.ts
vercel.json
```

**Modified**
```
src/app/constants/handicapConfig.ts   # PRO_COMPARISON_ALLOWANCE
src/components/handicap/HandicapCalculator.tsx  # mount ProComparison
src/components/admin/{TabsNav,AdminDashboard}.tsx  # 'pros' tab
src/lib/analytics.ts                  # new event names/params
src/lib/env.ts                        # new env vars
src/app/sitemap.ts                    # /handicap/pros
docs/Deployment/ENV_VALIDATION.md
```

---

## References

- [PDGA Developer Program](https://www.pdga.com/dev)
- [PDGA REST API — Authentication](https://www.pdga.com/dev/api/rest/v1/auth)
- [PDGA REST API — Services](https://www.pdga.com/dev/api/rest/v1/services)
- [PDGA Ratings FAQ](https://www.pdga.com/faq/ratings-0) — second-Tuesday monthly update cadence
- [PDGA Ratings System Guide](https://www.pdga.com/ratings/guide)
- Internal precedent for "use the official API, never scrape": `docs/Feature Enhancements/EBAY_SOLD_LISTINGS_ALTERNATIVES.md`
