import { describe, expect, it } from "vitest";
import { pickHomeResume, textDocumentIdFromHash } from "../../src/adapters/text-resume";
import { initialWordSession } from "../../src/adapters/word-session";
import { emptyProgressStore, rememberPosition, makePosition } from "../../src/lib/progress";

describe("home resume for words, scenes and reading", () => {
  it("opens the latest text document rather than only words", () => {
    const words = {...initialWordSession(), index: 2, updatedAt: 10};
    const store = rememberPosition(emptyProgressStore(20), makePosition("scene", "scene-one-more-round", "line-8", "visibility", 20), 20);
    const resume = pickHomeResume(words, store)!;
    expect(resume.entry).toBe("scenes");
    expect(resume.documentId).toBe("scene-one-more-round");
    expect(resume.title).toContain("今晚还打吗？");
  });

  it("keeps the word resume when it is newer", () => {
    const words = {...initialWordSession(), index: 1, updatedAt: 50};
    const store = rememberPosition(emptyProgressStore(20), makePosition("reading", "reading-lunch-later", "p-3", "visibility", 20), 20);
    const resume = pickHomeResume(words, store)!;
    expect(resume.entry).toBe("words");
    expect(resume.documentId).toBe("basic");
    expect(resume.title).toBe("背词 · fine");
  });

  it("ignores unknown document ids in the hash", () => {
    expect(textDocumentIdFromHash("#/scenes/scene-one-more-round", "scenes")).toBe("scene-one-more-round");
    expect(textDocumentIdFromHash("#/scenes/not-a-doc", "scenes")).toBeUndefined();
    expect(textDocumentIdFromHash("#/scenes", "scenes")).toBeUndefined();
  });
});


describe("merged learning catalog home resume", () => {
  it.each(["scene-change-dinner-time", "scene-store-out-of-stock"])("recognizes new scene %s without changing saved records", (id) => {
    const store = rememberPosition(emptyProgressStore(40), makePosition("scene", id, "test-saved-unit", "visibility", 40), 40);
    const before = JSON.stringify(store);
    const resume = pickHomeResume(initialWordSession(), store)!;
    expect(resume.entry).toBe("scenes");
    expect(resume.documentId).toBe(id);
    expect(resume.title).toMatch(/^场景 · .+/);
    expect(textDocumentIdFromHash("#/scenes/" + id, "scenes")).toBe(id);
    expect(JSON.stringify(store)).toBe(before);
  });

  it.each([
    ["scene", "scene-one-more-round", "scenes"],
    ["scene", "scene-page-wont-load", "scenes"],
    ["reading", "reading-shops-afternoon", "reading"],
    ["reading", "reading-lunch-later", "reading"],
  ] as const)("preserves old %s document %s", (kind, id, entry) => {
    const store = rememberPosition(emptyProgressStore(30), makePosition(kind, id, "old-saved-unit", "visibility", 30), 30);
    const before = JSON.stringify(store);
    expect(pickHomeResume(initialWordSession(), store)?.documentId).toBe(id);
    expect(textDocumentIdFromHash("#/" + entry + "/" + id, entry)).toBe(id);
    expect(JSON.stringify(store)).toBe(before);
  });

  it("chooses the newer reading over a new scene and rejects mismatched routes", () => {
    let store = rememberPosition(emptyProgressStore(20), makePosition("scene", "scene-change-dinner-time", "test-unit", "visibility", 20), 20);
    store = rememberPosition(store, makePosition("reading", "reading-lunch-later", "p-3", "visibility", 50), 50);
    expect(pickHomeResume(initialWordSession(), store)?.documentId).toBe("reading-lunch-later");
    expect(textDocumentIdFromHash("#/reading/scene-change-dinner-time", "reading")).toBeUndefined();
  });
});
