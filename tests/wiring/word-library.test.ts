import { describe, expect, it } from "vitest";
import {
  libraryWordEntries,
  libraryWords,
  wordGroups,
  isLibraryWordId,
} from "../../src/adapters/wiring-words";
import {
  hashForEntry,
  isWordsLibraryList,
  libraryWordFromHash,
} from "../../src/adapters/routes";
import {
  advanceLibraryWord,
  initialLibraryWordSession,
  queueWordForReview,
  readLibraryWordSession,
  readWordSession,
  saveLibraryWordSession,
  saveWordSession,
  initialWordSession,
} from "../../src/adapters/word-session";
import { pickHomeResume } from "../../src/adapters/text-resume";
import { REFACTOR_STORAGE_KEY } from "../../src/lib/progress/types";
import { emptyProgressStore } from "../../src/lib/progress";

describe("library word entry wiring", () => {
  it("exposes searchable library words without adding a study group", () => {
    expect(libraryWords).toHaveLength(222);
    expect(libraryWordEntries).toHaveLength(222);
    expect(wordGroups).toHaveLength(9);
    expect(libraryWordEntries[0]).toMatchObject({
      id: "ready-nov16-ask",
      title: "ask",
      category: "常用词",
    });
    expect(isLibraryWordId("ready-nov16-ask")).toBe(true);
    expect(isLibraryWordId("depth-nov16-sweater")).toBe(true);
    expect(isLibraryWordId("basic")).toBe(false);
  });

  it("routes the library list and a single card without treating them as groups", () => {
    expect(hashForEntry("words", "library")).toBe("#/words/library");
    expect(hashForEntry("words", "ready-nov16-ask")).toBe(
      "#/words/card/ready-nov16-ask",
    );
    expect(hashForEntry("words", "ignored")).toBe("#/words");
    expect(isWordsLibraryList("#/words/library")).toBe(true);
    expect(isWordsLibraryList("#/words/library/")).toBe(true);
    expect(isWordsLibraryList("#/words/basic")).toBe(false);
    expect(libraryWordFromHash("#/words/card/ready-nov16-ask")).toBe(
      "ready-nov16-ask",
    );
    expect(libraryWordFromHash("#/words/card/missing")).toBeUndefined();
    expect(libraryWordFromHash("#/words/basic")).toBeUndefined();
  });

  it("saves a one-card library session without rewriting groups or the old store", () => {
    localStorage.clear();
    localStorage.setItem("juban.user-data.v1", "fictional-do-not-touch");
    saveWordSession(localStorage, {
      ...initialWordSession(),
      index: 3,
      reviewIds: ["L01-V01"],
    });
    const before = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    const start = initialLibraryWordSession("ready-nov16-ask");
    saveLibraryWordSession(localStorage, {
      ...start,
      meaningVisible: true,
      exampleVisible: true,
    });
    const after = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    expect(after.wordSession).toEqual(before.wordSession);
    expect(after.wordLibrarySessions["ready-nov16-ask"].ids).toEqual([
      "ready-nov16-ask",
    ]);
    expect(after.wordLibrarySessions["ready-nov16-ask"].meaningVisible).toBe(
      true,
    );
    expect(readWordSession(localStorage).index).toBe(3);
    expect(localStorage.getItem("juban.user-data.v1")).toBe(
      "fictional-do-not-touch",
    );
    const current = readLibraryWordSession(localStorage, "ready-nov16-ask");
    const marked = queueWordForReview(current);
    const advanced = advanceLibraryWord({
      ...current,
      reviewIds: marked.reviewIds,
    });
    expect(advanced.index).toBe(1);
    expect(advanced.reviewIds).toEqual(["ready-nov16-ask"]);
    expect(advanced.meaningVisible).toBe(false);
  });

  it("does not overwrite a corrupt library record, and resumes from the home card", () => {
    localStorage.clear();
    localStorage.setItem(
      REFACTOR_STORAGE_KEY,
      JSON.stringify({
        wordLibrarySessions: { "ready-nov16-ask": { version: 2, ids: [] } },
        unknown: 7,
      }),
    );
    const before = localStorage.getItem(REFACTOR_STORAGE_KEY);
    expect(() =>
      saveLibraryWordSession(
        localStorage,
        initialLibraryWordSession("ready-nov16-ask"),
      ),
    ).toThrow();
    expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe(before);
    const resume = pickHomeResume(
      initialWordSession(),
      emptyProgressStore(40),
      [],
      [
        {
          ...initialLibraryWordSession("ready-nov16-ask"),
          meaningVisible: true,
          updatedAt: 9,
        },
      ],
    );
    expect(resume).toMatchObject({
      entry: "words",
      documentId: "ready-nov16-ask",
      title: "背词 · ask",
    });
  });
});
