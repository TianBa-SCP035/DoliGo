import { beforeEach, describe, expect, it } from "vitest";
import { wordGroups } from "../../src/adapters/wiring-words";
import {
  advanceWord,
  initialWordSession,
  readWordSession,
  saveWordSession,
} from "../../src/adapters/word-session";
import { REFACTOR_STORAGE_KEY } from "../../src/lib/progress/types";
import {
  WORD_GROUP_PICKER_ROUTE,
  WORD_LIBRARY_ROUTE,
  isWordGroupCompleted,
  listWordGroupProgress,
  nextWordGroup,
  wordGroupRoute,
  wordGroupStatus,
} from "../../src/adapters/word-group-flow";

const FROZEN_GROUP_IDS = [
  "basic",
  "daily-scenes-v3",
  "game-work-reading-v1",
  "daily-scenes-v5",
  "daily-reading-v4",
  "daily-scenes-v6",
  "daily-reading-v5",
  "daily-scenes-v7",
  "daily-reading-v6",
] as const;

beforeEach(() => localStorage.clear());

function complete(groupId: (typeof FROZEN_GROUP_IDS)[number]) {
  let session = initialWordSession(groupId);
  for (let i = 0; i < session.ids.length; i += 1) {
    session = advanceWord(session);
  }
  return { ...session, updatedAt: 1 };
}

describe("word group continuation helpers", () => {
  it("keeps the nine frozen queues and existing routes", () => {
    expect(wordGroups.map((group) => group.id)).toEqual([...FROZEN_GROUP_IDS]);
    expect(WORD_GROUP_PICKER_ROUTE).toBe("#/words");
    expect(WORD_LIBRARY_ROUTE).toBe("#/words/library");
    expect(wordGroupRoute("daily-scenes-v3")).toBe("#/words/daily-scenes-v3");
    expect(listWordGroupProgress([]).map((group) => group.id)).toEqual([
      ...FROZEN_GROUP_IDS,
    ]);
  });

  it("recommends the next unfinished group after a completed queue, wrapping around", () => {
    const firstDone = complete("basic");
    expect(isWordGroupCompleted(firstDone)).toBe(true);
    expect(nextWordGroup("basic", [firstDone])).toMatchObject({
      id: "daily-scenes-v3",
      status: "not-started",
      route: "#/words/daily-scenes-v3",
    });

    const around = [
      complete("daily-reading-v6"),
      complete("basic"),
      {
        ...initialWordSession("daily-scenes-v3"),
        index: 2,
        updatedAt: 2,
      },
    ];
    expect(nextWordGroup("daily-reading-v6", around)).toMatchObject({
      id: "daily-scenes-v3",
      status: "in-progress",
      index: 2,
      route: "#/words/daily-scenes-v3",
    });
  });

  it("returns undefined when every other group is already completed", () => {
    const sessions = FROZEN_GROUP_IDS.map((id) => complete(id));
    expect(nextWordGroup("basic", sessions)).toBeUndefined();
    expect(
      listWordGroupProgress(sessions).every((group) => group.status === "completed"),
    ).toBe(true);
  });

  it("does not write storage or reshape saved queues", () => {
    const saved = {
      ...initialWordSession("daily-scenes-v3"),
      index: 3,
      reviewIds: ["sc5-book-a-table"],
      meaningVisible: true,
    };
    saveWordSession(localStorage, saved);
    const before = localStorage.getItem(REFACTOR_STORAGE_KEY);
    const sessions = {
      basic: initialWordSession("basic"),
      "daily-scenes-v3": readWordSession(localStorage, "daily-scenes-v3"),
    };
    expect(wordGroupStatus(sessions["daily-scenes-v3"])).toBe("in-progress");
    expect(nextWordGroup("basic", sessions)?.id).toBe("daily-scenes-v3");
    expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe(before);
    expect(readWordSession(localStorage, "daily-scenes-v3")).toMatchObject({
      index: 3,
      reviewIds: saved.reviewIds,
    });
  });
});
