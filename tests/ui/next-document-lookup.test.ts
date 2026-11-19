import { describe, expect, it } from "vitest";
import { nextDocumentForDocument } from "../../src/ui/next-document-lookup";

const catalog = {
  scenes: [
    { id: "scene-store-out-of-stock", title: "这个没有了" },
    {
      id: "scene-store-out-of-stock-extension-1",
      title: "试穿后换一件送人",
      parentSceneId: "scene-store-out-of-stock",
      difficulty: { tier: "everyday" as const, tierZh: "常用" as const },
    },
    {
      id: "scene-store-out-of-stock-extension-2",
      title: "收银处发现袖口有污渍",
      parentSceneId: "scene-store-out-of-stock",
      difficulty: { tier: "everyday" as const, tierZh: "常用" as const },
    },
    { id: "scene-have-the-receipt", title: "有小票吗？" },
    { id: "scene-alone", title: "单独一篇" },
  ],
  readings: [
    { id: "reading-clothes-for-everyday-depth", title: "日常穿衣服" },
    { id: "reading-buying-clothes-in-a-store-depth", title: "在店里买衣服" },
    { id: "reading-lunch-later", title: "午饭晚一点吃" },
  ],
};

const paths = {
  paths: [
    {
      sceneIds: ["scene-have-the-receipt", "scene-store-out-of-stock"],
      sceneExtensionIds: [
        "scene-store-out-of-stock-extension-1",
        "scene-store-out-of-stock-extension-2",
        "scene-missing-extension",
      ],
      readingIds: [
        "reading-not-hung-yet",
        "reading-clothes-for-everyday-depth",
        "reading-buying-clothes-in-a-store-depth",
      ],
    },
  ],
};

describe("nextDocumentForDocument", () => {
  it("takes the next official scene in the same family", () => {
    expect(
      nextDocumentForDocument(
        catalog,
        "scene",
        "scene-store-out-of-stock",
        paths,
      ),
    ).toEqual({
      id: "scene-store-out-of-stock-extension-1",
      title: "试穿后换一件送人",
      route: "#/scenes/scene-store-out-of-stock-extension-1",
      kind: "scene",
    });
    expect(
      nextDocumentForDocument(
        catalog,
        "scene",
        "scene-store-out-of-stock-extension-1",
        paths,
      )?.id,
    ).toBe("scene-store-out-of-stock-extension-2");
  });

  it("falls through to the next hung path item and skips missing catalog ids", () => {
    expect(
      nextDocumentForDocument(
        catalog,
        "scene",
        "scene-store-out-of-stock-extension-2",
        paths,
      ),
    ).toEqual({
      id: "reading-clothes-for-everyday-depth",
      title: "日常穿衣服",
      route: "#/reading/reading-clothes-for-everyday-depth",
      kind: "reading",
    });
    expect(
      nextDocumentForDocument(
        catalog,
        "reading",
        "reading-clothes-for-everyday-depth",
        paths,
      ),
    ).toEqual({
      id: "reading-buying-clothes-in-a-store-depth",
      title: "在店里买衣服",
      route: "#/reading/reading-buying-clothes-in-a-store-depth",
      kind: "reading",
    });
  });

  it("does not wrap and does not invent a next item for lone or unknown documents", () => {
    expect(
      nextDocumentForDocument(
        catalog,
        "reading",
        "reading-buying-clothes-in-a-store-depth",
        paths,
      ),
    ).toBeUndefined();
    expect(
      nextDocumentForDocument(catalog, "scene", "scene-alone", paths),
    ).toBeUndefined();
    expect(
      nextDocumentForDocument(catalog, "reading", "reading-lunch-later", paths),
    ).toBeUndefined();
    expect(
      nextDocumentForDocument(catalog, "scene", "missing", paths),
    ).toBeUndefined();
    expect(nextDocumentForDocument(catalog, "scene", "", paths)).toBeUndefined();
  });

  it("uses a later path scene when the current scene has no family", () => {
    expect(
      nextDocumentForDocument(catalog, "scene", "scene-have-the-receipt", paths),
    ).toEqual({
      id: "scene-store-out-of-stock",
      title: "这个没有了",
      route: "#/scenes/scene-store-out-of-stock",
      kind: "scene",
    });
  });
});
