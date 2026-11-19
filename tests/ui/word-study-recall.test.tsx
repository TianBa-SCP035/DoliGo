import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WordStudyView } from "../../src/ui/LearningViews";

const card = {
  id: "demo-warranty",
  word: "warranty",
  meaning: "保修；保修期",
  difficulty: { tier: "everyday" as const },
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

const baseProps = {
  card,
  current: 1,
  total: 8,
  meaningVisible: false,
  exampleVisible: false,
  onMeaning: () => {},
  onExample: () => {},
  onNext: vi.fn(),
  onBack: () => {},
  onReview: vi.fn(),
};

it("keeps the existing next buttons when recall is not passed", () => {
  act(() => {
    root.render(<WordStudyView {...baseProps} />);
  });
  expect(container.textContent).toContain("还要再看");
  expect(container.textContent).toContain("这张先这样");
  expect(container.textContent).not.toContain("完全不记得");
  expect(container.textContent).not.toContain("可选练习");
  expect(container.querySelector("audio")).toBeNull();
});

it("replaces the old next buttons with the three judgements when recall is passed", () => {
  const onRate = vi.fn();
  const onNext = vi.fn();
  const onReview = vi.fn();
  act(() => {
    root.render(
      <WordStudyView
        {...baseProps}
        onNext={onNext}
        onReview={onReview}
        recall={{ onRate, onSkip: onNext }}
      />,
    );
  });
  expect(container.textContent).toContain("完全不记得");
  expect(container.textContent).toContain("有点印象");
  expect(container.textContent).toContain("我记得");
  expect(container.textContent).not.toContain("背单词");
  expect(container.textContent).not.toContain("常用");
  expect(container.textContent).not.toContain("还要再看");
  expect(container.textContent).not.toContain("这张先这样");
  const remembered = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("我记得"),
  );
  act(() => remembered!.click());
  expect(onRate).toHaveBeenCalledWith("remembered");
  expect(onReview).not.toHaveBeenCalled();
});

it("does not show 语块 as a standing part-of-speech label", () => {
  act(() => {
    root.render(
      <WordStudyView
        {...baseProps}
        card={{ ...card, word: "no rush", partOfSpeech: "语块", difficulty: undefined }}
      />,
    );
  });
  expect(container.textContent).toContain("no rush");
  expect(container.textContent).not.toContain("语块");
  expect(container.textContent).not.toContain("背单词");
});
