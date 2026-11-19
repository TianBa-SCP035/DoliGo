import { describe, expect, it } from "vitest";
import { difficultyLinksForDocument } from "../../src/ui/difficulty-links-lookup";

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
    {
      id: "scene-one-more-round",
      title: "今晚还打吗？",
      difficulty: { tier: "everyday" as const, tierZh: "常用" as const },
    },
    {
      id: "scene-one-more-round-extension-1",
      title: "排位卡顿之后再来一局",
      parentSceneId: "scene-one-more-round",
      difficulty: { tier: "advanced" as const, tierZh: "进阶" as const },
    },
    { id: "scene-alone", title: "单独一篇" },
  ],
  readings: [
    { id: "reading-lunch-later", title: "午饭晚一点吃" },
  ],
};

describe("difficultyLinksForDocument", () => {
  it("lists official extensions from a parent scene and skips the current page", () => {
    const result = difficultyLinksForDocument(
      catalog,
      "scene",
      "scene-store-out-of-stock",
    );
    expect(result.sceneTitle).toBe("这个没有了");
    expect(result.items.map((item) => item.id).sort()).toEqual([
      "scene-store-out-of-stock-extension-1",
      "scene-store-out-of-stock-extension-2",
    ]);
    expect(result.items.every((item) => item.route.startsWith("#/scenes/"))).toBe(
      true,
    );
    expect(result.items.every((item) => item.kind === "scene")).toBe(true);
  });

  it("lists the parent and siblings from an extension", () => {
    const result = difficultyLinksForDocument(
      catalog,
      "scene",
      "scene-store-out-of-stock-extension-2",
    );
    expect(result.sceneTitle).toBe("这个没有了");
    expect(result.items.map((item) => item.id)).toEqual([
      "scene-store-out-of-stock",
      "scene-store-out-of-stock-extension-1",
    ]);
  });

  it("keeps mixed tiers together without inventing a missing parenthetical filter", () => {
    const result = difficultyLinksForDocument(
      catalog,
      "scene",
      "scene-one-more-round",
    );
    expect(result.items).toEqual([
      {
        id: "scene-one-more-round-extension-1",
        title: "排位卡顿之后再来一局",
        route: "#/scenes/scene-one-more-round-extension-1",
        kind: "scene",
        difficulty: { tier: "advanced", tierZh: "进阶" },
      },
    ]);
  });

  it("returns no links for a lone scene, a reading, or an unknown id", () => {
    expect(
      difficultyLinksForDocument(catalog, "scene", "scene-alone").items,
    ).toEqual([]);
    expect(
      difficultyLinksForDocument(catalog, "reading", "reading-lunch-later")
        .items,
    ).toEqual([]);
    expect(difficultyLinksForDocument(catalog, "scene", "missing").items).toEqual(
      [],
    );
  });
});
