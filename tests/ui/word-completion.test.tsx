import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { TopicLink } from "../../src/adapters/topic-links";
import { WordCompletionView } from "../../src/ui/WordCompletionView";

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
    {
      id: "reading-bus-w02",
      headword: "fare",
      meaning: "车费",
      openAs: "catalog-only",
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

function click(label: string) {
  const button = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(label),
  );
  expect(button).toBeTruthy();
  act(() => button!.click());
}

function labels() {
  return Array.from(container.querySelectorAll("button")).map((b) =>
    (b.textContent || "").replace(/\s+/g, " ").trim(),
  );
}

it("keeps only home and restart actions when no new props are passed", () => {
  const onHome = vi.fn();
  const onRestart = vi.fn();
  act(() => {
    root.render(
      <WordCompletionView total={8} onHome={onHome} onRestart={onRestart} />,
    );
  });
  expect(container.querySelector(".doli-completion")).toBeTruthy();
  expect(container.textContent).toContain("这组先看到这里");
  expect(container.textContent).not.toContain("今天这组");
  expect(labels()).toEqual(["回首页", "再看这组"]);
  expect(container.querySelector(".doli-topic-related")).toBeNull();
  expect(container.textContent).not.toContain("选另一组");
  expect(container.textContent).not.toContain("开始下一组");
  expect(container.textContent).not.toContain("继续下一组");
  expect(container.querySelector(".doli-primary")?.textContent).toContain(
    "回首页",
  );
  click("回首页");
  click("再看这组");
  expect(onHome).toHaveBeenCalledTimes(1);
  expect(onRestart).toHaveBeenCalledTimes(1);
});

it("shows 开始下一组 for a not-started next group and only calls onNextGroup", () => {
  const onNextGroup = vi.fn();
  const onHome = vi.fn();
  act(() => {
    root.render(
      <WordCompletionView
        total={8}
        onHome={onHome}
        onRestart={() => {}}
        nextGroup={{
          id: "daily-scenes-v5",
          title: "改乘与换店",
          route: "#/words/daily-scenes-v5",
          status: "not-started",
        }}
        onNextGroup={onNextGroup}
      />,
    );
  });
  expect(container.textContent).toContain("开始下一组");
  expect(container.textContent).toContain("改乘与换店");
  expect(container.textContent).not.toContain("继续下一组");
  click("开始下一组");
  expect(onNextGroup).toHaveBeenCalledTimes(1);
  expect(onHome).not.toHaveBeenCalled();
});

it("shows 继续下一组 when the next group is already in progress", () => {
  act(() => {
    root.render(
      <WordCompletionView
        total={8}
        onHome={() => {}}
        onRestart={() => {}}
        nextGroup={{
          id: "daily-scenes-v5",
          title: "改乘与换店",
          route: "#/words/daily-scenes-v5",
          status: "in-progress",
        }}
        onNextGroup={() => {}}
      />,
    );
  });
  expect(container.textContent).toContain("继续下一组");
  expect(container.textContent).toContain("改乘与换店");
  expect(container.textContent).not.toContain("开始下一组");
});

it("shows 选另一组 only when onChooseGroup is passed", () => {
  const onChooseGroup = vi.fn();
  act(() => {
    root.render(
      <WordCompletionView
        total={8}
        onHome={() => {}}
        onRestart={() => {}}
        onChooseGroup={onChooseGroup}
      />,
    );
  });
  expect(labels()).toEqual(["回首页", "再看这组", "选另一组"]);
  click("选另一组");
  expect(onChooseGroup).toHaveBeenCalledTimes(1);
});

it("keeps library-card copy and hides the next-group action when nextGroup is omitted", () => {
  act(() => {
    root.render(
      <WordCompletionView
        total={1}
        eyebrow="这张已浏览完"
        title="这个词，先到这里。"
        homeLabel="返回词条"
        restartLabel="再看这个词"
        onHome={() => {}}
        onRestart={() => {}}
      />,
    );
  });
  expect(container.textContent).toContain("这张已浏览完");
  expect(container.textContent).toContain("这个词，先到这里。");
  expect(labels()).toEqual(["返回词条", "再看这个词"]);
  expect(container.textContent).not.toContain("开始下一组");
  expect(container.textContent).not.toContain("继续下一组");
  expect(container.textContent).not.toContain("这组先看到这里");
});

it("renders topic links with routes only and does not invent a missing reading", () => {
  const onOpenRelated = vi.fn();
  act(() => {
    root.render(
      <WordCompletionView
        total={8}
        onHome={() => {}}
        onRestart={() => {}}
        relatedTopicLinks={[travel]}
        onOpenRelated={onOpenRelated}
      />,
    );
  });
  expect(container.textContent).toContain("相关词");
  expect(container.textContent).toContain("相关对话");
  expect(container.textContent).not.toContain("相关文章");
  expect(container.textContent).not.toContain("同一主题还可以");
  expect(container.textContent).toContain("platform");
  expect(container.textContent).toContain("下一班车晚了");
  expect(container.textContent).not.toContain("fare");
  expect(container.textContent).not.toContain("暂无文章");
  click("下一班车晚了");
  expect(onOpenRelated).toHaveBeenCalledWith(
    "#/scenes/scene-next-bus-delayed",
  );
  act(() => {
    root.render(
      <WordCompletionView
        total={8}
        onHome={() => {}}
        onRestart={() => {}}
        relatedTopicLinks={[]}
      />,
    );
  });
  expect(container.querySelector(".doli-topic-related")).toBeNull();
});
