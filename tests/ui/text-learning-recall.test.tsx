import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TextLearningView } from "../../src/ui/TextLearningView";

const JUBAN = "juban.user-data.v1";
const REVIEW_KEY = "doliguo:refactor:sandbox:review-session:v1";
const LUNCH = "reading-lunch-later";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (
    globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  sessionStorage.clear();
  location.hash = "/";
  localStorage.setItem(JUBAN, "fictional-do-not-touch");
  localStorage.setItem(REVIEW_KEY, "fictional-review");
  HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function settle(frames = 6) {
  for (let i = 0; i < frames; i++) {
    await act(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    });
  }
}

const practiceItems = [
  {
    id: "practice-demo-1",
    type: "en-to-zh-choice" as const,
    promptEn: "ticket",
    choices: ["票", "箱子"],
    answer: "票",
  },
];

const difficultyLinks = [
  {
    id: "words-foundational",
    title: "基础词",
    route: "#/words/demo-foundational",
    kind: "words" as const,
    difficulty: { tier: "foundational" as const, tierZh: "基础" as const },
  },
  {
    id: "words-everyday",
    title: "常用词",
    route: "#/words/demo-everyday",
    kind: "words" as const,
    difficulty: { tier: "everyday" as const, tierZh: "常用" as const },
  },
  {
    id: "words-advanced",
    title: "进阶词",
    route: "#/words/demo-advanced",
    kind: "words" as const,
    difficulty: { tier: "advanced" as const, tierZh: "进阶" as const },
  },
];

it("does not show judgement, practice, or difficulty links until they are passed in", async () => {
  act(() => {
    root.render(
      <TextLearningView
        kind="reading"
        startId={LUNCH}
        onBack={() => undefined}
      />,
    );
  });
  await settle();
  expect(container.querySelector("h1")).toBeTruthy();
  expect(container.textContent).not.toContain("完全不记得");
  expect(container.textContent).not.toContain("有点印象");
  expect(container.textContent).not.toContain("我记得");
  expect(container.textContent).not.toContain("可选练习");
  expect(container.textContent).not.toContain("同一场景还可以");
  expect(container.querySelector("select")).toBeNull();
  expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
});

it("looks up same-scene family links when App does not pass difficultyLinks", async () => {
  const opened: string[] = [];
  act(() => {
    root.render(
      <TextLearningView
        kind="scene"
        startId="scene-next-bus-delayed"
        onBack={() => undefined}
        onOpenRelated={(route) => opened.push(route)}
      />,
    );
  });
  await settle();
  expect(container.textContent).toContain("同一场景");
  expect(container.textContent).toContain("高峰时段在站台等车");
  expect(container.textContent).not.toContain("不必先筛选");
  expect(container.querySelector("select")).toBeNull();
  expect(container.querySelector("[role='tablist']")).toBeNull();
  expect(container.querySelector(".doli-practice summary")?.textContent).toBe("练习");
  expect(container.textContent).toContain("优先座位");
  const practice = container.querySelector("details.doli-practice");
  expect(practice).toBeTruthy();
  expect((practice as HTMLDetailsElement).open).toBe(false);
  const nav = container.querySelector("nav.doli-scene-difficulty");
  expect(nav).toBeTruthy();
  const extension = Array.from(nav!.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("高峰时段在站台等车"),
  );
  act(() => (extension as HTMLButtonElement).click());
  expect(opened).toEqual(["#/scenes/scene-next-bus-delayed-extension-1"]);
  expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
});

it("lets an empty difficultyLinks prop hide the catalog lookup", async () => {
  act(() => {
    root.render(
      <TextLearningView
        kind="scene"
        startId="scene-next-bus-delayed"
        onBack={() => undefined}
        difficultyLinks={[]}
      />,
    );
  });
  await settle();
  expect(container.querySelector("h1")).toBeTruthy();
  expect(container.textContent).not.toContain("同一场景还可以");
  expect(container.querySelector("nav.doli-scene-difficulty")).toBeNull();
  expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
});

it("lets an empty practiceItems prop hide the hung practice lookup", async () => {
  act(() => {
    root.render(
      <TextLearningView
        kind="scene"
        startId="scene-next-bus-delayed"
        onBack={() => undefined}
        practiceItems={[]}
      />,
    );
  });
  await settle();
  expect(container.querySelector("h1")).toBeTruthy();
  expect(container.textContent).not.toContain("可选练习");
  expect(container.querySelector("details.doli-practice")).toBeNull();
  expect(container.textContent).toContain("同一场景");
  expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
});

it("shows sentence judgements, skippable practice, and all difficulty tiers when passed in", async () => {
  const onRate = vi.fn();
  const onSkip = vi.fn();
  const onPracticeEvent = vi.fn();
  const opened: string[] = [];
  act(() => {
    root.render(
      <TextLearningView
        kind="reading"
        startId={LUNCH}
        onBack={() => undefined}
        onOpenRelated={(route) => opened.push(route)}
        recall={{ onRate, onSkip }}
        practiceItems={practiceItems}
        onPracticeEvent={onPracticeEvent}
        difficultyLinks={difficultyLinks}
      />,
    );
  });
  await settle();
  expect(container.textContent).toContain("完全不记得");
  expect(container.textContent).toContain("有点印象");
  expect(container.textContent).toContain("我记得");
  expect(container.textContent).not.toContain("选一个就进入");
  expect(container.textContent).not.toContain("这一项你觉得怎么样");
  expect(container.textContent).not.toContain("很快会再见到");
  expect(container.textContent).not.toContain("还要再看");
  const remembered = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("我记得"),
  );
  act(() => remembered!.click());
  expect(onRate).toHaveBeenCalledWith("remembered", expect.any(String));
  expect(onSkip).not.toHaveBeenCalled();

  expect(container.querySelector(".doli-practice summary")?.textContent).toBe("练习");
  const practice = container.querySelector("details.doli-practice");
  expect(practice).toBeTruthy();
  expect((practice as HTMLDetailsElement).open).toBe(false);

  expect(container.textContent).toContain("同一场景");
  expect(container.textContent).toContain("基础");
  expect(container.textContent).toContain("常用");
  expect(container.textContent).toContain("进阶");
  expect(container.textContent).not.toContain("不必先筛选");
  expect(container.querySelector("select")).toBeNull();
  expect(container.querySelector('input[type="search"]')).toBeNull();
  const advanced = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("进阶词"),
  );
  const beforeHash = location.hash;
  act(() => (advanced as HTMLButtonElement).click());
  expect(opened).toEqual(["#/words/demo-advanced"]);
  expect(location.hash).toBe(beforeHash);
  expect(onPracticeEvent).not.toHaveBeenCalled();
  expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
});

it("renders a nov18 reading that has paragraphs but no notes", async () => {
  act(() => {
    root.render(
      <TextLearningView
        kind="reading"
        startId="reading-using-public-transport-depth"
        onBack={() => undefined}
      />,
    );
  });
  await settle();
  expect(container.textContent).toContain("出行时怎么坐公共交通");
  expect(container.textContent).toContain("A driver or an inspector may check your ticket");
  expect(container.textContent).toContain("look for seats marked as priority seats");
  expect(container.querySelectorAll(".doli-document-unit").length).toBe(9);
  expect(container.textContent).toContain("表达说明");
  expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
});

it("uses paragraph copy on readings even if App still passes 下一句", async () => {
  const onRate = vi.fn();
  act(() => {
    root.render(
      <TextLearningView
        kind="reading"
        startId={LUNCH}
        onBack={() => undefined}
        recall={{ onRate, onSkip: vi.fn(), unitLabel: "下一句" }}
      />,
    );
  });
  await settle();
  expect(container.textContent).not.toContain("选一个就进入");
  expect(container.textContent).not.toContain("这一项你觉得怎么样");
  expect(container.textContent).toContain("跳过，先看下一段");
  expect(container.textContent).not.toContain("跳过，先看下一句");
  expect(container.textContent).not.toContain("已经到最后一段了");
  const units = container.querySelectorAll("[data-progress-unit]").length;
  for (let i = 0; i < units; i++) {
    const button = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("跳过，先看下一段"),
    );
    act(() => button!.click());
  }
  expect(container.querySelector("[data-recall-complete]")).toBeTruthy();
  expect(container.textContent).toContain("已经到最后一段了，可以返回列表。");
  expect(container.textContent).not.toContain("已经到最后一句了");
  expect(container.querySelector("h1")).toBeTruthy();
  expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
});

it("keeps sentence copy on scenes", async () => {
  act(() => {
    root.render(
      <TextLearningView
        kind="scene"
        startId="scene-next-bus-delayed"
        onBack={() => undefined}
        recall={{ onRate: vi.fn(), onSkip: vi.fn(), unitLabel: "下一句" }}
      />,
    );
  });
  await settle();
  expect(container.querySelector("h1")).toBeTruthy();
  expect(container.textContent).not.toContain("选一个就进入");
  expect(container.textContent).not.toContain("这一项你觉得怎么样");
  expect(container.textContent).toContain("跳过，先看下一句");
  expect(container.textContent).not.toContain("跳过，先看下一段");
  expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
});

it("offers the next hung scene and does not write the address itself", async () => {
  const opened: string[] = [];
  act(() => {
    root.render(
      <TextLearningView
        kind="scene"
        startId="scene-next-bus-delayed"
        onBack={() => undefined}
        onOpenRelated={(route) => opened.push(route)}
      />,
    );
  });
  await settle();
  const next = container.querySelector("[data-next-document] button");
  expect(next).toBeTruthy();
  expect(next?.textContent).toContain("开始下一篇");
  expect(next?.textContent).toContain("高峰时段在站台等车");
  expect(container.querySelector("select")).toBeNull();
  const beforeHash = location.hash;
  act(() => (next as HTMLButtonElement).click());
  expect(opened).toEqual(["#/scenes/scene-next-bus-delayed-extension-1"]);
  expect(location.hash).toBe(beforeHash);
  expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
});

it("lets an empty nextDocument prop hide the catalog lookup", async () => {
  act(() => {
    root.render(
      <TextLearningView
        kind="scene"
        startId="scene-next-bus-delayed"
        onBack={() => undefined}
        onOpenRelated={() => undefined}
        nextDocument={null}
      />,
    );
  });
  await settle();
  expect(container.querySelector("[data-next-document]")).toBeNull();
  expect(container.textContent).not.toContain("开始下一篇");
  expect(container.textContent).toContain("同一场景");
  expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
});

it("does not show a next-article primary button on a travel article", async () => {
  act(() => {
    root.render(
      <TextLearningView
        kind="reading"
        startId="reading-using-public-transport-depth"
        onBack={() => undefined}
        onOpenRelated={() => undefined}
      />,
    );
  });
  await settle();
  expect(container.querySelector("[data-next-document]")).toBeNull();
  expect(container.textContent).not.toContain("开始下一篇");
  expect(container.textContent).toContain("相关文章");
  expect(container.textContent).toContain("换乘和出站时可以注意什么");
  expect(container.textContent).toContain("返回阅读列表");
  expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
});

it("does not invent a next article for a lone lunch reading", async () => {
  act(() => {
    root.render(
      <TextLearningView
        kind="reading"
        startId={LUNCH}
        onBack={() => undefined}
        onOpenRelated={() => undefined}
      />,
    );
  });
  await settle();
  expect(container.querySelector("[data-next-document]")).toBeNull();
  expect(container.textContent).not.toContain("开始下一篇");
  expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
});
