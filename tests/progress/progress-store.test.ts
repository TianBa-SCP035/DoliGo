import { describe, expect, it } from "vitest";
import {
  REFACTOR_STORAGE_KEY,
  emptyProgressStore,
  getPosition,
  loadProgressStore,
  makePosition,
  mergePreservingUnknown,
  rememberPosition,
  saveProgressStore,
} from "../../src/lib/progress";

function mem(): Storage {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear() { map.clear(); },
    getItem(k) { return map.has(k) ? map.get(k)! : null; },
    key(i) { return [...map.keys()][i] ?? null; },
    removeItem(k) { map.delete(k); },
    setItem(k, v) { map.set(k, v); },
  } as Storage;
}

describe("refactor sandbox storage key", () => {
  it("uses doliguo.refactor.sandbox.v1 and does not write juban keys", () => {
    expect(REFACTOR_STORAGE_KEY).toBe("doliguo.refactor.sandbox.v1");
    const storage = mem();
    const saved = saveProgressStore(storage, emptyProgressStore(1), REFACTOR_STORAGE_KEY, 2);
    expect(storage.getItem("doliguo.refactor.sandbox.v1")).toBeTruthy();
    expect(storage.getItem("juban.user-data.v1")).toBeNull();
    expect(storage.getItem("juban.user-data.sandbox.v1")).toBeNull();
    expect(saved.kind).toBe("doliguo-refactor-sandbox");
  });
});

describe("scenes and readings are isolated", () => {
  it("updates one kind without moving the other", () => {
    let store = emptyProgressStore(10);
    store = rememberPosition(store, makePosition("scene", "scene-a", "line-2", "visibility", 11), 11);
    store = rememberPosition(store, makePosition("reading", "reading-a", "p-3", "visibility", 12), 12);
    store = rememberPosition(store, makePosition("scene", "scene-a", "line-8", "scroll", 13), 13);
    expect(getPosition(store, "scene", "scene-a")?.unitId).toBe("line-8");
    expect(getPosition(store, "reading", "reading-a")?.unitId).toBe("p-3");
    expect(store.lastSceneId).toBe("scene-a");
    expect(store.lastReadingId).toBe("reading-a");
  });
});

describe("exit and resume", () => {
  it("reloads the same scene and reading positions from the sandbox key", () => {
    const storage = mem();
    let store = emptyProgressStore(1);
    store = rememberPosition(store, makePosition("scene", "scene-one", "l-8", "visibility"), 20);
    store = rememberPosition(store, makePosition("reading", "reading-lunch", "p-5", "scroll"), 21);
    saveProgressStore(storage, store, REFACTOR_STORAGE_KEY, 21);
    const loaded = loadProgressStore(storage);
    expect(loaded.empty).toBe(false);
    expect(getPosition(loaded.store, "scene", "scene-one")?.unitId).toBe("l-8");
    expect(getPosition(loaded.store, "reading", "reading-lunch")?.unitId).toBe("p-5");
  });
});

describe("unknown field retention", () => {
  it("keeps fictional unknown fields that this module does not define", () => {
    const raw = {
      schemaVersion: 1,
      kind: "doliguo-refactor-sandbox",
      updatedAt: 5,
      scenes: {
        "scene-a": { kind: "scene", id: "scene-a", unitId: "l-1", updatedAt: 5, experimentalCursor: 42 },
      },
      readings: {},
      fictionalFlag: true,
      legacyBlob: { nested: "keep-me" },
    };
    const known = rememberPosition(
      mergePreservingUnknown(raw, emptyProgressStore(5)),
      makePosition("scene", "scene-a", "l-4", "visibility", 9),
      9,
    );
    const merged = mergePreservingUnknown(raw, known) as Record<string, unknown> & typeof known;
    expect(merged.fictionalFlag).toBe(true);
    expect(merged.legacyBlob).toEqual({ nested: "keep-me" });
    expect((merged.scenes["scene-a"] as { experimentalCursor?: number }).experimentalCursor).toBe(42);
    expect(merged.scenes["scene-a"].unitId).toBe("l-4");
    const storage = mem();
    saveProgressStore(storage, merged, REFACTOR_STORAGE_KEY, 9);
    const reloaded = JSON.parse(storage.getItem(REFACTOR_STORAGE_KEY)!) as Record<string, unknown>;
    // saveProgressStore spreads the store, so unknown top-level fields that remain on the object are kept
    expect(reloaded.fictionalFlag).toBe(true);
    expect((reloaded.scenes as Record<string, { experimentalCursor: number }>)["scene-a"].experimentalCursor).toBe(42);
  });
});

describe("save merges the existing envelope", () => {
  it("keeps word and library sessions when a reading position is saved from an empty store object", () => {
    const storage = mem();
    storage.setItem("juban.user-data.v1", "{\"keep\":true}");
    storage.setItem("doliguo:refactor:sandbox:review-session:v1", "fictional-review");
    storage.setItem(
      REFACTOR_STORAGE_KEY,
      JSON.stringify({
        wordSession: { version: 1, ids: ["L01-V01"], index: 3 },
        wordSessions: { "daily-scenes-v3": { version: 1, ids: ["x"], index: 1 } },
        wordLibrarySessions: {
          "depth-nov16-sweater": {
            version: 1,
            ids: ["depth-nov16-sweater"],
            index: 0,
            cardId: "depth-nov16-sweater",
          },
        },
        unknown: 7,
        scenes: {
          "scene-keep": { kind: "scene", id: "scene-keep", unitId: "line-2", updatedAt: 4 },
        },
      }),
    );
    const saved = saveProgressStore(
      storage,
      rememberPosition(
        emptyProgressStore(8),
        makePosition("reading", "reading-apartment-life-depth", "p-3", "visibility", 8),
        8,
      ),
      REFACTOR_STORAGE_KEY,
      8,
    );
    const raw = JSON.parse(storage.getItem(REFACTOR_STORAGE_KEY)!) as Record<string, unknown>;
    expect((raw.wordSession as { index: number }).index).toBe(3);
    expect((raw.wordSessions as Record<string, { index: number }>)["daily-scenes-v3"].index).toBe(1);
    expect(
      (raw.wordLibrarySessions as Record<string, { cardId: string }>)["depth-nov16-sweater"].cardId,
    ).toBe("depth-nov16-sweater");
    expect(raw.unknown).toBe(7);
    expect((raw.scenes as Record<string, { unitId: string }>)["scene-keep"].unitId).toBe("line-2");
    expect(getPosition(saved, "reading", "reading-apartment-life-depth")?.unitId).toBe("p-3");
    expect(storage.getItem("juban.user-data.v1")).toBe("{\"keep\":true}");
    expect(storage.getItem("doliguo:refactor:sandbox:review-session:v1")).toBe("fictional-review");
  });
});

describe("corrupt sandbox payload", () => {
  it("starts empty and does not write other keys", () => {
    const storage = mem();
    storage.setItem(REFACTOR_STORAGE_KEY, "{not-json");
    storage.setItem("juban.user-data.v1", "{\"keep\":true}");
    const loaded = loadProgressStore(storage);
    expect(loaded.empty).toBe(true);
    expect(loaded.unreadable).toBe(true);
    expect(loaded.warning).toMatch(/无法读取/);
    expect(storage.getItem("juban.user-data.v1")).toBe("{\"keep\":true}");
    expect(storage.getItem(REFACTOR_STORAGE_KEY)).toBe("{not-json");
  });

  it.each(["{not-json", "null", "[]", "\"x\""])("refuses to overwrite unreadable payload %s", (payload) => {
    const storage = mem();
    storage.setItem(REFACTOR_STORAGE_KEY, payload);
    storage.setItem("juban.user-data.v1", "{\"keep\":true}");
    const loaded = loadProgressStore(storage);
    expect(loaded.empty).toBe(true);
    expect(loaded.unreadable).toBe(true);
    expect(loaded.warning).toMatch(/无法读取/);
    expect(() =>
      saveProgressStore(storage, emptyProgressStore(1), REFACTOR_STORAGE_KEY, 2),
    ).toThrow(/未覆盖原记录/);
    expect(storage.getItem(REFACTOR_STORAGE_KEY)).toBe(payload);
    expect(storage.getItem("juban.user-data.v1")).toBe("{\"keep\":true}");
  });
});
