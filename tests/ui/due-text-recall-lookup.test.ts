import { describe, expect, it } from "vitest";
import {
  REVIEW_OPEN_UNIT_KEY,
  indexTextRecallUnits,
  initialUnitCursor,
  clearReviewOpenUnit,
  peekReviewOpenUnit,
  textRecallItemsFromStore,
  writeReviewOpenUnit,
  type TextRecallCatalog,
} from "../../src/ui/due-text-recall-lookup";

const catalog: TextRecallCatalog = {
  scenes: [
    {
      id: "scene-next-bus-delayed",
      title: "下一班要多久？",
      difficulty: { tier: "everyday", tierZh: "常用" },
      lines: [
        { id: "scene-next-bus-delayed-l1", en: "How long is the next bus?" },
        { id: "scene-next-bus-delayed-l5", en: "I will wait here for a bit." },
      ],
    },
  ],
  readings: [
    {
      id: "reading-lunch-later",
      title: "午饭可以晚点再吃",
      paragraphs: [
        { id: "reading-lunch-later-p1", en: "The morning ran longer than planned." },
        { id: "reading-lunch-later-p2", en: "I can have lunch a little later." },
      ],
    },
    {
      id: "reading-other",
      title: "另一篇",
      paragraphs: [{ id: "p1", en: "Ambiguous short id in another article." }],
    },
    {
      id: "reading-also",
      title: "也有短号",
      paragraphs: [{ id: "p1", en: "Same bare id, must be skipped." }],
    },
  ],
};

describe("text recall lookup", () => {
  it("lists rated scene lines and reading paragraphs, and skips words and ambiguous ids", () => {
    const now = Date.parse("2026-11-18T14:20:00+08:00");
    const items = textRecallItemsFromStore(
      {
        "scene-next-bus-delayed-l5": { nextDueAt: now - 1000 },
        "reading-lunch-later-p2": { nextDueAt: now + 86_400_000 },
        "depth-nov18-warranty": { nextDueAt: now - 1000 },
        p1: { nextDueAt: now - 1000 },
        "unknown-unit": { nextDueAt: now - 1000 },
      },
      indexTextRecallUnits(catalog),
      ["depth-nov18-warranty"],
    );
    expect(items.map((item) => item.id)).toEqual([
      "scene-next-bus-delayed-l5",
      "reading-lunch-later-p2",
    ]);
    expect(items[0]).toMatchObject({
      kind: "sentence",
      documentId: "scene-next-bus-delayed",
      route: "#/scenes/scene-next-bus-delayed",
      difficulty: { tier: "everyday", tierZh: "常用" },
    });
    expect(items[0].title).toContain("下一班要多久？");
    expect(items[0].title).toContain("I will wait here for a bit.");
    expect(items[1]).toMatchObject({
      kind: "paragraph",
      documentId: "reading-lunch-later",
      route: "#/reading/reading-lunch-later",
    });
    expect(items[1].title).toContain("午饭可以晚点再吃");
  });

  it("prefers a review-open hint over saved reading progress", () => {
    const ids = [
      "scene-next-bus-delayed-l1",
      "scene-next-bus-delayed-l5",
      "scene-next-bus-delayed-l6",
    ];
    expect(initialUnitCursor(ids, "scene-next-bus-delayed-l5", "scene-next-bus-delayed-l1")).toBe(1);
    expect(initialUnitCursor(ids, "missing", "scene-next-bus-delayed-l6")).toBe(2);
    expect(initialUnitCursor(ids)).toBe(0);
  });

  it("keeps a review-open hint readable for the same document until it is cleared", () => {
    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    };
    writeReviewOpenUnit(storage, {
      documentId: "scene-next-bus-delayed",
      unitId: "scene-next-bus-delayed-l5",
      openedAt: 1,
    });
    expect(peekReviewOpenUnit(storage, "reading-lunch-later", 1)).toBeUndefined();
    expect(memory.get(REVIEW_OPEN_UNIT_KEY)).toBeTruthy();
    expect(peekReviewOpenUnit(storage, "scene-next-bus-delayed", 1)).toEqual({
      documentId: "scene-next-bus-delayed",
      unitId: "scene-next-bus-delayed-l5",
      openedAt: 1,
    });
    expect(memory.get(REVIEW_OPEN_UNIT_KEY)).toBeTruthy();
    expect(peekReviewOpenUnit(storage, "scene-next-bus-delayed", 1)).toEqual({
      documentId: "scene-next-bus-delayed",
      unitId: "scene-next-bus-delayed-l5",
      openedAt: 1,
    });
    clearReviewOpenUnit(storage, "scene-next-bus-delayed");
    expect(memory.get(REVIEW_OPEN_UNIT_KEY)).toBeUndefined();
    expect(peekReviewOpenUnit(storage, "scene-next-bus-delayed")).toBeUndefined();
  });

  it("ignores an expired review-open hint", () => {
    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    };
    writeReviewOpenUnit(storage, {
      documentId: "scene-next-bus-delayed",
      unitId: "scene-next-bus-delayed-l5",
      openedAt: 1,
    });
    expect(
      peekReviewOpenUnit(storage, "scene-next-bus-delayed", 1 + 16_000),
    ).toBeUndefined();
  });
});
