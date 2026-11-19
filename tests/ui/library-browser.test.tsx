import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  randomRecommendationIds,
  suggestedLevel,
} from "../../src/ui/LibraryBrowser";
import {
  TextLibraryView,
  type LearningDocument,
} from "../../src/ui/TextLibraryView";
import { WordGroupPicker } from "../../src/ui/WordGroupPicker";
import { WordLibraryView } from "../../src/ui/WordLibraryView";
const docs: LearningDocument[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `qa-only-${i}`,
  title: `隔离示例 ${i}`,
  titleEn: `Example ${i}`,
  category: i % 2 ? "旅行" : "日常",
  levelSuggestion: "建议 A2",
  tags: ["qa-tag"],
  units: [{ id: `p-${i}`, en: `unique-body-${i}.`, zh: "测试。" }],
  notes: [],
}));
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (
    globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem("juban.user-data.v1", "real-data-sentinel");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
function click(label: string) {
  const button = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(label),
  );
  expect(button).toBeTruthy();
  act(() => button!.click());
}
function search(value: string) {
  const input = container.querySelector(
    'input[type="search"]',
  ) as HTMLInputElement;
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function labels() {
  return Array.from(container.querySelectorAll(".doli-document-choice")).map(
    (b) => b.textContent,
  );
}
it("recommends three unique items and changes the set without touching the source", () => {
  const before = docs.map((d) => d.id);
  const first = randomRecommendationIds(docs);
  const next = randomRecommendationIds(docs, first);
  expect(first).toHaveLength(3);
  expect(new Set(first).size).toBe(3);
  expect(next.some((id) => first.includes(id))).toBe(false);
  expect(docs.map((d) => d.id)).toEqual(before);
  expect(randomRecommendationIds([])).toEqual([]);
  expect(randomRecommendationIds(docs.slice(0, 2))).toHaveLength(2);
  expect(suggestedLevel("建议 A2+ 到 B1")).toBe("A2+ 到 B1");
});
it("shows only three recommendations, a search box and shuffle, never pages or filters", () => {
  act(() =>
    root.render(
      <TextLibraryView
        kind="reading"
        documents={docs}
        onOpen={() => {}}
        onBack={() => {}}
      />,
    ),
  );
  expect(labels()).toHaveLength(3);
  expect(container.querySelectorAll("select")).toHaveLength(0);
  expect(container.querySelector(".doli-library-pagination")).toBeNull();
  expect(container.textContent).not.toContain("共 1000");
  const before = labels();
  click("换一批");
  expect(labels()).not.toEqual(before);
  expect(localStorage.length).toBe(1);
});
it("searches the full thousand-item library including body text and limits initial search rendering", () => {
  const open = vi.fn();
  act(() =>
    root.render(
      <TextLibraryView
        kind="reading"
        documents={docs}
        onOpen={open}
        onBack={() => {}}
      />,
    ),
  );
  search("unique-body-999.");
  expect(labels()).toHaveLength(1);
  click("隔离示例 999");
  expect(open).toHaveBeenCalledWith("qa-only-999");
  search("example");
  expect(labels()).toHaveLength(8);
  expect(container.textContent).toContain("找到 1000 项");
  click("显示更多结果");
  expect(labels()).toHaveLength(16);
  search("not-found");
  expect(labels()).toHaveLength(0);
  click("返回推荐");
  expect(labels()).toHaveLength(3);
  expect(localStorage.getItem("juban.user-data.v1")).toBe("real-data-sentinel");
  expect(localStorage.length).toBe(1);
});
it("preserves search on return and ignores old pagination UI state", () => {
  sessionStorage.setItem(
    "doliguo.ui.library.v1:reading",
    JSON.stringify({ query: "not-found", category: "stale", page: 999 }),
  );
  act(() =>
    root.render(
      <TextLibraryView
        kind="reading"
        documents={docs}
        onOpen={() => {}}
        onBack={() => {}}
      />,
    ),
  );
  expect(labels()).toHaveLength(3);
  search("Example 999");
  act(() => root.render(<div />));
  act(() =>
    root.render(
      <TextLibraryView
        kind="reading"
        documents={docs}
        onOpen={() => {}}
        onBack={() => {}}
      />,
    ),
  );
  expect(labels()).toHaveLength(1);
  act(() => root.render(<div />));
  act(() =>
    root.render(
      <TextLibraryView
        kind="scene"
        documents={docs}
        onOpen={() => {}}
        onBack={() => {}}
      />,
    ),
  );
  expect(labels()).toHaveLength(3);
});
it("keeps 500 groups discoverable via search and single-word entries separate", () => {
  const open = vi.fn();
  const groups = Array.from({ length: 500 }, (_, i) => ({
    id: `group-${i}`,
    title: `词组 ${i}`,
    total: 20,
  }));
  act(() =>
    root.render(
      <WordGroupPicker groups={groups} onSelect={open} onBack={() => {}} />,
    ),
  );
  expect(labels()).toHaveLength(3);
  search("词组 499");
  expect(labels()).toHaveLength(1);
  click("词组 499");
  expect(open).toHaveBeenCalledWith("group-499");
  act(() => root.render(<div />));
  const words = Array.from({ length: 30 }, (_, i) => ({
    id: `word-${i}`,
    title: `word-${i}`,
    meaning: `释义-${i}`,
  }));
  act(() =>
    root.render(
      <WordLibraryView words={words} onSelect={open} onBack={() => {}} />,
    ),
  );
  expect(labels()).toHaveLength(3);
  search("释义-29");
  expect(labels()).toHaveLength(1);
  click("word-29");
  expect(open).toHaveBeenCalledWith("word-29");
  expect(localStorage.length).toBe(1);
});
