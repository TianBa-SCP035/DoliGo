import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { TopicLink } from "../../src/adapters/topic-links";
import { TopicRelatedLinks } from "../../src/ui/TopicRelatedLinks";

const dining: TopicLink = {
  id: "dining",
  titleZh: "餐饮",
  titleEn: "Dining",
  isStudyGroup: false,
  suggestedOrder: ["words", "scenes", "reading"],
  cards: [
    {
      id: "depth-nov16-menu",
      headword: "menu",
      meaning: "菜单",
      openAs: "library-card",
      route: "#/words/card/depth-nov16-menu",
      groupIds: [],
    },
    {
      id: "L04-V07",
      headword: "wait",
      meaning: "等待",
      openAs: "catalog-only",
      groupIds: ["basic"],
    },
  ],
  scenes: [
    {
      id: "scene-change-dinner-time",
      title: "改晚饭时间",
      titleEn: "Change dinner time",
      route: "#/scenes/scene-change-dinner-time",
    },
  ],
  readings: [
    {
      id: "reading-choosing-restaurant-depth",
      title: "怎么选餐厅",
      titleEn: "Choosing a restaurant",
      route: "#/reading/reading-choosing-restaurant-depth",
    },
  ],
};

const travel: TopicLink = {
  id: "travel",
  titleZh: "出行",
  titleEn: "Travel",
  isStudyGroup: false,
  suggestedOrder: ["words", "scenes", "reading"],
  cards: [
    {
      id: "depth-nov16-platform",
      headword: "platform",
      meaning: "站台",
      openAs: "library-card",
      route: "#/words/card/depth-nov16-platform",
      groupIds: [],
    },
  ],
  scenes: [
    {
      id: "scene-next-bus-delayed",
      title: "下一班车晚了",
      titleEn: "The next bus is delayed",
      route: "#/scenes/scene-next-bus-delayed",
    },
  ],
  readings: [],
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

it("does not render an empty or missing topic list", () => {
  act(() => {
    root.render(<TopicRelatedLinks topics={[]} />);
  });
  expect(container.querySelector(".doli-topic-related")).toBeNull();
  act(() => {
    root.render(<TopicRelatedLinks />);
  });
  expect(container.querySelector(".doli-topic-related")).toBeNull();
});

it("links only cards that have a route and does not invent a card path", () => {
  const onOpen = vi.fn();
  act(() => {
    root.render(<TopicRelatedLinks topics={[dining]} onOpen={onOpen} />);
  });
  expect(container.textContent).toContain("相关词");
  expect(container.textContent).toContain("相关对话");
  expect(container.textContent).toContain("相关文章");
  expect(container.textContent).not.toContain("同一主题还可以");
  expect(container.textContent).not.toContain("主题不是新的背词组");
  expect(container.textContent).toContain("menu");
  expect(container.textContent).toContain("改晚饭时间");
  expect(container.textContent).toContain("怎么选餐厅");
  expect(container.textContent).not.toContain("wait");
  expect(container.textContent).not.toContain("不能当作词库单卡打开");
  const waitButton = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("wait"),
  );
  expect(waitButton).toBeUndefined();
  const menu = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("menu"),
  );
  expect(menu).toBeTruthy();
  act(() => menu!.click());
  expect(onOpen).toHaveBeenCalledWith("#/words/card/depth-nov16-menu");
});

it("omits a reading section when a topic has no readings", () => {
  act(() => {
    root.render(<TopicRelatedLinks topics={[travel]} />);
  });
  expect(container.textContent).toContain("相关词");
  expect(container.textContent).toContain("相关对话");
  expect(container.textContent).not.toContain("相关文章");
  expect(container.textContent).toContain("下一班车晚了");
  expect(container.textContent).toContain("platform");
  expect(container.textContent).not.toContain("同一主题还可以");
  expect(container.textContent).not.toContain("暂无文章");
});
