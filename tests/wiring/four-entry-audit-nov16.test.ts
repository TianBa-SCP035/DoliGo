import { describe, expect, it } from "vitest";
import { hashForEntry, pageFromHash } from "../../src/adapters/routes";
import { pickHomeResume, textDocumentIdFromHash } from "../../src/adapters/text-resume";
import {
  initialLibraryWordSession,
  initialWordSession,
  readLibraryWordSession,
  readWordSession,
  saveLibraryWordSession,
  saveWordSession,
} from "../../src/adapters/word-session";
import { isLibraryWordId, wordGroups } from "../../src/adapters/wiring-words";
import {
  DEPTH_NOV16_READING_IDS,
  DEPTH_NOV16_SCENE_IDS,
  topicVocabularyDepthNov16,
} from "../../src/lib/review";
import {
  REFACTOR_STORAGE_KEY,
  emptyProgressStore,
  getPosition,
  makePosition,
  rememberPosition,
  saveProgressStore,
} from "../../src/lib/progress";

describe("nov16 four-entry wiring compatibility", () => {
  it("resumes depth continuation scenes and readings by their own document ids", () => {
    for (const id of DEPTH_NOV16_SCENE_IDS) {
      const store = rememberPosition(
        emptyProgressStore(40),
        makePosition("scene", id, "test-saved-unit", "visibility", 40),
        40,
      );
      const before = JSON.stringify(store);
      const resume = pickHomeResume(initialWordSession(), store)!;
      expect(resume.entry).toBe("scenes");
      expect(resume.documentId).toBe(id);
      expect(hashForEntry("scenes", id)).toBe("#/scenes/" + encodeURIComponent(id));
      expect(textDocumentIdFromHash("#/scenes/" + id, "scenes")).toBe(id);
      expect(pageFromHash("#/scenes/" + id)).toBe("scenes");
      expect(JSON.stringify(store)).toBe(before);
    }
    for (const id of DEPTH_NOV16_READING_IDS) {
      const store = rememberPosition(
        emptyProgressStore(41),
        makePosition("reading", id, "p-saved", "visibility", 41),
        41,
      );
      const resume = pickHomeResume(initialWordSession(), store)!;
      expect(resume.entry).toBe("reading");
      expect(resume.documentId).toBe(id);
      expect(hashForEntry("reading", id)).toBe("#/reading/" + encodeURIComponent(id));
      expect(textDocumentIdFromHash("#/reading/" + id, "reading")).toBe(id);
    }
  });

  it("starts a depth library word without rewriting the nine group snapshots", () => {
    expect(wordGroups).toHaveLength(9);
    expect(isLibraryWordId("depth-nov16-sweater")).toBe(true);
    localStorage.clear();
    localStorage.setItem("juban.user-data.v1", "fictional-do-not-touch");
    for (const group of wordGroups) {
      saveWordSession(localStorage, {
        ...initialWordSession(group.id),
        index: 1,
        reviewIds: [initialWordSession(group.id).ids[0]],
      });
    }
    const before = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    saveLibraryWordSession(localStorage, {
      ...initialLibraryWordSession("depth-nov16-sweater"),
      meaningVisible: true,
      exampleVisible: true,
    });
    const after = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    expect(after.wordSession).toEqual(before.wordSession);
    expect(after.wordSessions).toEqual(before.wordSessions);
    expect(after.wordLibrarySessions["depth-nov16-sweater"].meaningVisible).toBe(true);
    expect(readWordSession(localStorage, "basic").index).toBe(1);
    expect(readWordSession(localStorage, "daily-scenes-v7").index).toBe(1);
    expect(readLibraryWordSession(localStorage, "depth-nov16-sweater").meaningVisible).toBe(true);
    expect(localStorage.getItem("juban.user-data.v1")).toBe("fictional-do-not-touch");
  });

  it("does not consume topic vocabulary bindings as a study group or home resume", () => {
    expect(Object.keys(topicVocabularyDepthNov16.topicCardIds).sort()).toEqual([
      "dining",
      "game",
      "home",
      "shopping",
      "travel",
    ]);
    expect(wordGroups.map((group) => group.id)).not.toEqual(
      expect.arrayContaining(["shopping", "dining", "travel", "home", "game"]),
    );
    expect(wordGroups).toHaveLength(9);
    const store = emptyProgressStore(1);
    const resume = pickHomeResume(initialWordSession(), store);
    expect(resume).toBeUndefined();
    expect(hashForEntry("words", "shopping")).toBe("#/words");
  });

  it("keeps group snapshots when a depth reading position is written into the shared envelope", () => {
    localStorage.clear();
    saveWordSession(localStorage, { ...initialWordSession(), index: 4 });
    saveLibraryWordSession(localStorage, {
      ...initialLibraryWordSession("depth-nov16-sweater"),
      meaningVisible: true,
    });
    const written = saveProgressStore(
      localStorage,
      rememberPosition(
        emptyProgressStore(9),
        makePosition("reading", "reading-clothes-for-everyday-depth", "p-2", "visibility", 9),
        9,
      ),
      REFACTOR_STORAGE_KEY,
      9,
    );
    expect(readWordSession(localStorage).index).toBe(4);
    expect(readLibraryWordSession(localStorage, "depth-nov16-sweater").meaningVisible).toBe(true);
    expect(getPosition(written, "reading", "reading-clothes-for-everyday-depth")?.unitId).toBe("p-2");
  });
});
