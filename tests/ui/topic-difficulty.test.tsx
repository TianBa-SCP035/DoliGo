import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { TopicRelatedLinks, type TopicRelatedLinksProps } from "../../src/ui/TopicRelatedLinks";

const dining = {
  id: "dining" as const,
  titleZh: "餐饮",
  titleEn: "Dining",
  isStudyGroup: false as const,
  suggestedOrder: ["words", "scenes", "reading"] as const,
  cards: [
    {
      id: "depth-nov16-menu",
      headword: "menu",
      meaning: "菜单",
      openAs: "library-card" as const,
      route: "#/words/card/depth-nov16-menu",
      groupIds: [],
      difficulty: { tier: "foundational" as const },
    },
  ],
  scenes: [
    {
      id: "scene-change-dinner-time",
      title: "改晚饭时间",
      titleEn: "Change dinner time",
      route: "#/scenes/scene-change-dinner-time",
      difficulty: { tier: "everyday" as const },
    },
  ],
  readings: [
    {
      id: "reading-choosing-restaurant-depth",
      title: "怎么选餐厅",
      titleEn: "Choosing a restaurant",
      route: "#/reading/reading-choosing-restaurant-depth",
      difficulty: { tier: "advanced" as const },
    },
  ],
};

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (
    globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it("lists related items without difficulty tags or a filter bar", () => {
  const topics: TopicRelatedLinksProps["topics"] = [dining];
  act(() => {
    root.render(<TopicRelatedLinks topics={topics} />);
  });
  expect(container.textContent).toContain("相关词");
  expect(container.textContent).toContain("menu");
  expect(container.textContent).toContain("相关对话");
  expect(container.textContent).toContain("改晚饭时间");
  expect(container.textContent).toContain("相关文章");
  expect(container.textContent).toContain("怎么选餐厅");
  expect(container.textContent).not.toContain("基础");
  expect(container.textContent).not.toContain("常用");
  expect(container.textContent).not.toContain("进阶");
  expect(container.querySelector("select")).toBeNull();
  expect(container.querySelector("[role='tablist']")).toBeNull();
});
