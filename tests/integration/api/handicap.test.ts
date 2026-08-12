import { describe, test, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import HandicapRound from "@/models/HandicapRound";
import HandicapSnapshot from "@/models/HandicapSnapshot";
import User from "@/models/User";
import {
  setupStandardMocks,
  mockRequireUser,
  resetAllMocks,
} from "../../utils/testMocks";
import mongoose from "mongoose";

setupStandardMocks();

const USER_A = new mongoose.Types.ObjectId().toString();
const USER_B = new mongoose.Types.ObjectId().toString();

const authAs = (userId: string) =>
  mockRequireUser.mockResolvedValueOnce({
    user: { id: userId, email: `${userId}@test.com` },
  } as never);

/** Seed a round straight into the DB, bypassing the API. */
const seedRound = (userId: string, rating: number, daysAgo: number) =>
  HandicapRound.create({
    userId,
    source: "pdga",
    date: new Date(Date.now() - daysAgo * 86_400_000),
    holes: 18,
    providedRating: rating,
    computedRating: rating,
    estimated: false,
    completed: true,
  });

// One connection lifecycle for the whole file. mongoose is a global singleton,
// so calling connectTestDb/closeTestDb per describe block tears the shared
// connection down underneath other test files in the same worker.
beforeAll(connectTestDb);
afterEach(async () => {
  // resetTestDb is async - not awaiting it leaks documents into the next test.
  await resetTestDb();
  resetAllMocks();
});
afterAll(closeTestDb);

describe("/api/handicap/rounds", () => {
  test("requires authentication", async () => {
    const { UnauthorizedError } = await import("@/lib/errors/UnauthorizedError");
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app).get("/api/handicap/rounds");
    expect(res.status).toBe(401);
  });

  test("creates a round and derives the rating server-side", async () => {
    authAs(USER_A);

    const res = await request(app)
      .post("/api/handicap/rounds")
      .send({
        source: "score_ssa",
        date: "2026-01-15",
        holes: 18,
        score: 60,
        ssa: 50,
        courseName: "Test Course",
      });

    expect(res.status).toBe(201);
    // SSA 50 -> 10 points per throw, so 10 throws over = 900.
    expect(res.body.round.computedRating).toBe(900);
    expect(res.body.round.estimated).toBe(false);
  });

  test("ignores a client-supplied computedRating", async () => {
    authAs(USER_A);

    const res = await request(app)
      .post("/api/handicap/rounds")
      .send({
        source: "score_ssa",
        date: "2026-01-15",
        holes: 18,
        score: 60,
        ssa: 50,
        computedRating: 1200, // must not be trusted
      });

    expect(res.status).toBe(201);
    expect(res.body.round.computedRating).toBe(900);
  });

  test("flags a UDisc round as estimated", async () => {
    authAs(USER_A);

    const res = await request(app)
      .post("/api/handicap/rounds")
      .send({ source: "udisc", date: "2026-01-15", holes: 18, providedRating: 200 });

    expect(res.status).toBe(201);
    expect(res.body.round.computedRating).toBe(900);
    expect(res.body.round.estimated).toBe(true);
  });

  test("rejects a round missing the fields its source needs", async () => {
    authAs(USER_A);

    const res = await request(app)
      .post("/api/handicap/rounds")
      .send({ source: "score_par", date: "2026-01-15", holes: 18, score: 58 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid round");
  });

  test("returns only the requesting user's rounds", async () => {
    await seedRound(USER_A, 950, 1);
    await seedRound(USER_B, 800, 1);

    authAs(USER_A);
    const res = await request(app).get("/api/handicap/rounds");

    expect(res.status).toBe(200);
    expect(res.body.rounds).toHaveLength(1);
    expect(res.body.rounds[0].computedRating).toBe(950);
  });

  test("GET does not write a snapshot", async () => {
    await seedRound(USER_A, 950, 1);
    await seedRound(USER_A, 950, 2);
    await seedRound(USER_A, 950, 3);

    authAs(USER_A);
    await request(app).get("/api/handicap/rounds");

    expect(await HandicapSnapshot.countDocuments({ userId: USER_A })).toBe(0);
  });
});

describe("/api/handicap/rounds auto-snapshot behaviour", () => {
  test("writes one snapshot when a new round changes the rating", async () => {
    await seedRound(USER_A, 900, 1);
    await seedRound(USER_A, 900, 2);

    // Third round takes the user over the 3-round minimum, so a rating appears.
    authAs(USER_A);
    const res = await request(app)
      .post("/api/handicap/rounds")
      .send({ source: "pdga", date: "2026-01-15", holes: 18, providedRating: 900 });

    expect(res.status).toBe(201);
    expect(res.body.snapshotCreated).toBe(true);
    expect(await HandicapSnapshot.countDocuments({ userId: USER_A })).toBe(1);
  });

  test("does not write a second snapshot when the rating is unchanged", async () => {
    // Eight rounds puts the record past the small-sample rows where adding a
    // round shifts the table adjustment, so the rating is genuinely stable.
    for (let i = 1; i <= 8; i += 1) await seedRound(USER_A, 900, i);

    authAs(USER_A);
    await request(app)
      .post("/api/handicap/rounds")
      .send({ source: "pdga", date: "2026-01-10", holes: 18, providedRating: 900 });

    const first = await HandicapSnapshot.countDocuments({ userId: USER_A });
    expect(first).toBe(1);

    // A worse round cannot displace anything in the best-of selection.
    authAs(USER_A);
    const res = await request(app)
      .post("/api/handicap/rounds")
      .send({ source: "pdga", date: "2026-01-11", holes: 18, providedRating: 600 });

    expect(res.body.handicap.rating).toBe(900);
    expect(res.body.snapshotCreated).toBe(false);
    expect(await HandicapSnapshot.countDocuments({ userId: USER_A })).toBe(first);
  });

  test("a backfill writes one snapshot for the day, not one per round", async () => {
    // The bug this guards: entering a season in one sitting produced a snapshot
    // per round, all stamped today, which made the progress chart unreadable.
    for (let i = 1; i <= 12; i += 1) {
      authAs(USER_A);
      const res = await request(app)
        .post("/api/handicap/rounds")
        .send({
          source: "pdga",
          date: `2026-0${i < 10 ? "1" : "2"}-${String((i % 28) + 1).padStart(2, "0")}`,
          holes: 18,
          providedRating: 880 + i * 5,
        });
      expect(res.status).toBe(201);
    }

    // Twelve rounds, each shifting the rating, but only one auto snapshot row.
    const autoCount = await HandicapSnapshot.countDocuments({
      userId: USER_A,
      trigger: "auto",
    });
    expect(autoCount).toBe(1);
  });

  test("the day's single auto snapshot tracks the latest rating", async () => {
    for (let i = 1; i <= 4; i += 1) await seedRound(USER_A, 900, i);

    authAs(USER_A);
    await request(app)
      .post("/api/handicap/rounds")
      .send({ source: "pdga", date: "2026-01-10", holes: 18, providedRating: 900 });

    authAs(USER_A);
    const second = await request(app)
      .post("/api/handicap/rounds")
      .send({ source: "pdga", date: "2026-01-11", holes: 18, providedRating: 1050 });

    const snapshots = await HandicapSnapshot.find({
      userId: USER_A,
      trigger: "auto",
    }).lean<{ rating: number }[]>();

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].rating).toBe(second.body.handicap.rating);
  });

  test("manual snapshots are not collapsed into the daily auto snapshot", async () => {
    for (let i = 1; i <= 4; i += 1) await seedRound(USER_A, 900, i);

    authAs(USER_A);
    await request(app)
      .post("/api/handicap/rounds")
      .send({ source: "pdga", date: "2026-01-10", holes: 18, providedRating: 900 });

    authAs(USER_A);
    await request(app).post("/api/handicap/snapshots").send({ note: "milestone" });

    expect(
      await HandicapSnapshot.countDocuments({ userId: USER_A, trigger: "auto" })
    ).toBe(1);
    expect(
      await HandicapSnapshot.countDocuments({ userId: USER_A, trigger: "manual" })
    ).toBe(1);
  });

  test("a bad round can still lift the rating by clearing a small-sample penalty", async () => {
    // With 4 rounds the WHS table applies a -1.0 stroke penalty; at 5 rounds it
    // does not. So a fifth round - even a poor one - raises the number. This is
    // intended: the penalty exists to stop a thin record from flattering you.
    for (let i = 1; i <= 4; i += 1) await seedRound(USER_A, 900, i);

    authAs(USER_A);
    const before = await request(app).get("/api/handicap/rounds");
    expect(before.body.handicap.rating).toBe(890);

    authAs(USER_A);
    const res = await request(app)
      .post("/api/handicap/rounds")
      .send({ source: "pdga", date: "2026-01-11", holes: 18, providedRating: 600 });

    expect(res.body.handicap.rating).toBe(900);
  });
});

describe("/api/handicap/rounds/[id]", () => {
  test("forbids editing another user's round", async () => {
    const round = await seedRound(USER_B, 950, 1);

    authAs(USER_A);
    const res = await request(app)
      .patch(`/api/handicap/rounds/${round._id.toString()}`)
      .send({ source: "pdga", date: "2026-01-15", holes: 18, providedRating: 1000 });

    expect(res.status).toBe(403);
  });

  test("forbids deleting another user's round", async () => {
    const round = await seedRound(USER_B, 950, 1);

    authAs(USER_A);
    const res = await request(app).delete(
      `/api/handicap/rounds/${round._id.toString()}`
    );

    expect(res.status).toBe(403);
    expect(await HandicapRound.countDocuments({ _id: round._id })).toBe(1);
  });

  test("returns 404 for a round that does not exist", async () => {
    authAs(USER_A);
    const res = await request(app).delete(
      `/api/handicap/rounds/${new mongoose.Types.ObjectId().toString()}`
    );

    expect(res.status).toBe(404);
  });

  test("owner can delete their own round", async () => {
    const round = await seedRound(USER_A, 950, 1);

    authAs(USER_A);
    const res = await request(app).delete(
      `/api/handicap/rounds/${round._id.toString()}`
    );

    expect(res.status).toBe(200);
    expect(await HandicapRound.countDocuments({ _id: round._id })).toBe(0);
  });

  test("editing to a different source clears the stale fields", async () => {
    const round = await HandicapRound.create({
      userId: USER_A,
      source: "score_par",
      date: new Date(),
      holes: 18,
      score: 58,
      par: 54,
      computedRating: 960,
      estimated: true,
      completed: true,
    });

    authAs(USER_A);
    const res = await request(app)
      .patch(`/api/handicap/rounds/${round._id.toString()}`)
      .send({ source: "pdga", date: "2026-01-15", holes: 18, providedRating: 985 });

    expect(res.status).toBe(200);

    const updated = await HandicapRound.findById(round._id).lean<{
      par?: number;
      score?: number;
      computedRating: number;
      estimated: boolean;
    }>();
    expect(updated?.par).toBeUndefined();
    expect(updated?.score).toBeUndefined();
    expect(updated?.computedRating).toBe(985);
    expect(updated?.estimated).toBe(false);
  });
});

describe("/api/handicap/snapshots", () => {
  test("requires authentication", async () => {
    const { UnauthorizedError } = await import("@/lib/errors/UnauthorizedError");
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app).get("/api/handicap/snapshots");
    expect(res.status).toBe(401);
  });

  test("refuses a manual save below the minimum round count", async () => {
    await seedRound(USER_A, 950, 1);

    authAs(USER_A);
    const res = await request(app).post("/api/handicap/snapshots").send({});

    expect(res.status).toBe(400);
    expect(await HandicapSnapshot.countDocuments({ userId: USER_A })).toBe(0);
  });

  test("saves a manual snapshot even when the rating is unchanged", async () => {
    await seedRound(USER_A, 950, 1);
    await seedRound(USER_A, 950, 2);
    await seedRound(USER_A, 950, 3);

    authAs(USER_A);
    await request(app).post("/api/handicap/snapshots").send({ note: "first" });
    authAs(USER_A);
    const res = await request(app).post("/api/handicap/snapshots").send({ note: "second" });

    expect(res.status).toBe(201);
    expect(await HandicapSnapshot.countDocuments({ userId: USER_A })).toBe(2);
  });

  test("returns only the requesting user's snapshots", async () => {
    await HandicapSnapshot.create({ userId: USER_A, rating: 950 });
    await HandicapSnapshot.create({ userId: USER_B, rating: 800 });

    authAs(USER_A);
    const res = await request(app).get("/api/handicap/snapshots");

    expect(res.status).toBe(200);
    expect(res.body.snapshots).toHaveLength(1);
    expect(res.body.snapshots[0].rating).toBe(950);
  });
});

describe("/api/handicap/share", () => {
  test("requires authentication", async () => {
    const { UnauthorizedError } = await import("@/lib/errors/UnauthorizedError");
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));

    const res = await request(app).post("/api/handicap/share");
    expect(res.status).toBe(401);
  });

  test("returns 404 when the user no longer exists", async () => {
    authAs(USER_A);

    const res = await request(app).post("/api/handicap/share");
    expect(res.status).toBe(404);
  });

  test("creates a share id and persists it", async () => {
    const user = await User.create({ name: "Sharer", email: "sharer@test.com" });
    mockRequireUser.mockResolvedValueOnce({
      user: { id: user._id.toString(), email: "sharer@test.com" },
    } as never);

    const res = await request(app)
      .post("/api/handicap/share")
      .set("origin", "http://localhost:3000");

    expect(res.status).toBe(200);
    expect(res.body.shareUrl).toBe(
      `http://localhost:3000/share/handicap/${res.body.shareableHandicapId}`
    );

    const saved = await User.findById(user._id);
    expect(saved?.shareableHandicapId).toBe(res.body.shareableHandicapId);
  });

  test("reuses the existing share id so old links keep working", async () => {
    const user = await User.create({
      name: "Sharer",
      email: "sharer@test.com",
      shareableHandicapId: "already-shared-123",
    });

    for (let i = 0; i < 2; i += 1) {
      mockRequireUser.mockResolvedValueOnce({
        user: { id: user._id.toString(), email: "sharer@test.com" },
      } as never);
    }

    const first = await request(app).post("/api/handicap/share");
    const second = await request(app).post("/api/handicap/share");

    expect(first.body.shareableHandicapId).toBe("already-shared-123");
    expect(second.body.shareableHandicapId).toBe("already-shared-123");
  });
});
