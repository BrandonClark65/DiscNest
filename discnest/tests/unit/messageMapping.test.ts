/// <reference types="vitest/globals" />

import { describe, test, expect } from "vitest";
import { Types } from "mongoose";
import { mapMessageDBtoUI, mapThreadDBtoUI } from "@/lib/messageMapping";

import type { MessageDB } from "@/types/message";
import type { ThreadDB } from "@/types/thread";

/* -------------------------------------------------------
   HELPERS
-------------------------------------------------------- */

function oid(hex?: string) {
  return hex ? new Types.ObjectId(hex) : new Types.ObjectId();
}

function makeMessageDB(overrides: Partial<MessageDB> = {}): MessageDB {
  return {
    sender: oid("aaaaaaaaaaaaaaaaaaaaaaaa"),
    content: "Hello world",
    timestamp: new Date("2024-01-01T00:00:00Z"),
    readBy: [oid("111111111111111111111111"), oid("222222222222222222222222")],
    flagged: false,
    flaggedCategories: {},
    ...overrides,
  };
}

function makeThreadDB(overrides: Partial<ThreadDB> = {}): ThreadDB {
  return {
    _id: oid("bbbbbbbbbbbbbbbbbbbbbbbb"),

    participants: [
      oid("111111111111111111111111"),
      oid("222222222222222222222222"),
    ],

    messages: [
      makeMessageDB(),
      makeMessageDB({ content: "Another message" }),
    ],

    listingId: {
      _id: oid("999999999999999999999999"),
      title: "Awesome Disc",
      imageUrls: ["img1.jpg"],
    } as any,

    requestId: {
      _id: oid("555555555555555555555555"),
      title: "Looking for a Zone",
    } as any,

    updatedAt: new Date("2024-01-02T00:00:00Z"),

    ...overrides,
  };
}

/* -------------------------------------------------------
   TESTS — mapMessageDBtoUI
-------------------------------------------------------- */

describe("mapMessageDBtoUI", () => {
  test("maps a normal ObjectId message", () => {
    const db = makeMessageDB();
    const ui = mapMessageDBtoUI(db);

    expect(ui.sender._id).toBe("aaaaaaaaaaaaaaaaaaaaaaaa");
    expect(ui.sender.name).toBe("Unknown");
    expect(ui.readBy).toEqual([
      "111111111111111111111111",
      "222222222222222222222222",
    ]);
    expect(ui.timestamp instanceof Date).toBe(true);
  });

  test("maps populated sender object correctly", () => {
    const db = makeMessageDB({
      sender: {
        _id: oid("cccccccccccccccccccccccc"),
        name: "Alice",
      } as any,
    });

    const ui = mapMessageDBtoUI(db);

    expect(ui.sender._id).toBe("cccccccccccccccccccccccc");
    expect(ui.sender.name).toBe("Alice");
  });

  test("maps system message via null sender", () => {
    const db = makeMessageDB({ sender: null as any });
    const ui = mapMessageDBtoUI(db);

    expect(ui.sender._id).toBe("system");
    expect(ui.sender.name).toBe("Automated Message");
  });

  test("maps system message via 'system' string sender", () => {
    const db = makeMessageDB({ sender: "system" as any });
    const ui = mapMessageDBtoUI(db);

    expect(ui.sender._id).toBe("system");
    expect(ui.sender.name).toBe("Automated Message");
  });

  test("maps flagged categories", () => {
    const db = makeMessageDB({
      flagged: true,
      flaggedCategories: { harassment: true, spam: false },
    });

    const ui = mapMessageDBtoUI(db);

    expect(ui.flagged).toBe(true);
    expect(ui.flaggedCategories).toEqual({
      harassment: true,
      spam: false,
    });
  });
});

/* -------------------------------------------------------
   TESTS — mapThreadDBtoUI
-------------------------------------------------------- */

describe("mapThreadDBtoUI", () => {
  test("maps thread id and ObjectId participants", () => {
    const db = makeThreadDB();

    const ui = mapThreadDBtoUI(db);

    expect(ui._id).toBe("bbbbbbbbbbbbbbbbbbbbbbbb");
    expect(ui.participants).toEqual([
      { _id: "111111111111111111111111", name: "Unknown" },
      { _id: "222222222222222222222222", name: "Unknown" },
    ]);
  });

  test("maps populated participant users", () => {
    const db = makeThreadDB({
      participants: [
        { _id: oid("111111111111111111111111"), name: "Alice" } as any,
        { _id: oid("222222222222222222222222"), name: "Bob" } as any,
      ],
    });

    const ui = mapThreadDBtoUI(db);

    expect(ui.participants).toEqual([
      { _id: "111111111111111111111111", name: "Alice" },
      { _id: "222222222222222222222222", name: "Bob" },
    ]);
  });

  test("maps listingId (populated object)", () => {
    const db = makeThreadDB();

    const ui = mapThreadDBtoUI(db);

    expect(ui.listingId).toEqual({
      _id: "999999999999999999999999",
      title: "Awesome Disc",
      imageUrls: ["img1.jpg"],
    });
  });

  test("maps listingId = null", () => {
    const db = makeThreadDB({ listingId: null });

    const ui = mapThreadDBtoUI(db);

    expect(ui.listingId).toEqual({
      _id: "unknown",
      title: "Listing Unavailable",
      imageUrls: [],
    });
  });

  test("maps listingId as raw ObjectId", () => {
    const db = makeThreadDB({
      listingId: oid("123123123123123123123123"),
    });

    const ui = mapThreadDBtoUI(db);

    expect(ui.listingId).toEqual({
      _id: "123123123123123123123123",
      title: "",
      imageUrls: [],
    });
  });

  test("maps populated requestId", () => {
    const db = makeThreadDB();

    const ui = mapThreadDBtoUI(db);

    expect(ui.requestId).toEqual({
      _id: "555555555555555555555555",
      title: "Looking for a Zone",
    });
  });

  test("maps requestId = null", () => {
    const db = makeThreadDB({ requestId: null });

    const ui = mapThreadDBtoUI(db);

    expect(ui.requestId).toBeNull();
  });

  test("maps requestId as raw ObjectId", () => {
    const db = makeThreadDB({
      requestId: oid("121212121212121212121212"),
    });

    const ui = mapThreadDBtoUI(db);

    expect(ui.requestId).toEqual({
      _id: "121212121212121212121212",
      title: "Disc Request",
    });
  });

  test("maps messages array using message mapping", () => {
    const db = makeThreadDB();
    const ui = mapThreadDBtoUI(db);

    expect(ui.messages.length).toBe(2);
    expect(ui.messages[0].content).toBe("Hello world");
  });

  test("normalizes updatedAt to ISO", () => {
    const db = makeThreadDB({
      updatedAt: new Date("2024-03-01T10:00:00Z"),
    });

    const ui = mapThreadDBtoUI(db);

    expect(ui.updatedAt).toBe("2024-03-01T10:00:00.000Z");
  });
});
