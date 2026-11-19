import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PronunciationControl } from "../../src/ui/PronunciationControl";
import { pronunciationSourceForCard } from "../../src/ui/pronunciation-lookup";
import { WordStudyView, type StudyWord } from "../../src/ui/LearningViews";
import { ReviewDueList } from "../../src/ui/ReviewDueList";
import { SceneDifficultyLinks } from "../../src/ui/SceneDifficultyLinks";
import { TranslationScopeNote } from "../../src/ui/TranslationScopeNote";

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

it("shows attributed recording and does not invent a dictionary url", () => {
  act(() => {
    root.render(
      <PronunciationControl
        source={{
          kind: "recording",
          audioUrl: "https://example.org/warranty.ogg",
          attribution: {
            author: "Example Speaker",
            licenseName: "CC BY-SA 4.0",
            licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
            sourcePageUrl: "https://commons.wikimedia.org/wiki/File:warranty.ogg",
          },
        }}
      />,
    );
  });
  const audio = container.querySelector("audio");
  expect(audio?.getAttribute("src")).toBe("https://example.org/warranty.ogg");
  expect(container.textContent).toContain("Example Speaker");
  expect(container.textContent).toContain("CC BY-SA 4.0");
  expect(container.textContent).not.toContain("forvo");
  expect(container.textContent).not.toContain("translate.google");
});

it("labels synthesis as a fallback, not a dictionary recording", () => {
  const speak = vi.fn();
  act(() => {
    root.render(
      <PronunciationControl
        source={{ kind: "synthesis-fallback", text: "warranty", lang: "en" }}
        speak={speak}
      />,
    );
  });
  expect(container.textContent).toContain("系统朗读（不是词典录音）");
  const play = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent === "播放",
  );
  act(() => play!.click());
  expect(speak).toHaveBeenCalledWith("warranty", "en");
});

it("renders nothing when no pronunciation source is given", () => {
  act(() => {
    root.render(<PronunciationControl source={null} />);
  });
  expect(container.textContent).toBe("");
});

it("lists only due review items and has no interval settings", () => {
  const now = Date.parse("2026-11-18T11:00:00+08:00");
  const onOpen = vi.fn();
  act(() => {
    root.render(
      <ReviewDueList
        now={now}
        onOpen={onOpen}
        textItems={[]}
        items={[
          {
            id: "due-word",
            title: "warranty",
            kind: "word",
            dueAt: now - 1000,
            difficulty: { tier: "everyday", tierZh: "常用" },
          },
          {
            id: "later-word",
            title: "receipt",
            kind: "word",
            dueAt: now + 86_400_000,
          },
        ]}
      />,
    );
  });
  expect(container.textContent).toContain("warranty");
  expect(container.textContent).not.toContain("receipt");
  expect(container.textContent).toContain("另外 1 项还没到时间");
  expect(container.textContent).not.toContain("遗忘曲线");
  expect(container.textContent).not.toContain("很快会再见到");
  expect(container.textContent).not.toContain("间隔设置");
  expect(container.querySelector("input")).toBeNull();
});

it("lists same-scene tiers together without a filter bar", () => {
  const onOpen = vi.fn();
  act(() => {
    root.render(
      <SceneDifficultyLinks
        sceneTitle="店里缺货"
        onOpen={onOpen}
        items={[
          {
            id: "basic-words",
            title: "基础词",
            route: "#/words/basic",
            kind: "words",
            difficulty: { tier: "foundational" },
          },
          {
            id: "everyday-words",
            title: "常用词",
            route: "#/words/everyday",
            kind: "words",
            difficulty: { tier: "everyday" },
          },
          {
            id: "advanced-ext",
            title: "进阶后续",
            route: "#/scenes/scene-store-out-of-stock-extension-1",
            kind: "scene",
            difficulty: { tier: "advanced" },
          },
        ]}
      />,
    );
  });
  expect(container.textContent).toContain("同一场景");
  expect(container.textContent).toContain("基础词");
  expect(container.textContent).toContain("常用词");
  expect(container.textContent).toContain("进阶后续");
  expect(container.textContent).not.toContain("同一场景还可以");
  expect(container.textContent).not.toContain("不必先筛选");
  expect(container.querySelector("select")).toBeNull();
  expect(container.querySelector("[role='tablist']")).toBeNull();
  const advanced = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("进阶后续"),
  );
  act(() => advanced!.click());
  expect(onOpen).toHaveBeenCalledWith(
    "#/scenes/scene-store-out-of-stock-extension-1",
  );
});

it("keeps online translation clearly unavailable", () => {
  act(() => {
    root.render(<TranslationScopeNote />);
  });
  expect(container.textContent).toContain("任意文本在线翻译：尚未接入");
  expect(container.textContent).not.toContain("翻译已上线");
});

it("resolves only the licensed leak recording and does not invent fallback audio", () => {
  const leak = pronunciationSourceForCard("depth-nov18-leak");
  expect(leak).toEqual({
    kind: "recording",
    audioUrl: "/audio/depth-nov18-leak.ogg",
    attribution: {
      author: "Dvortygirl",
      licenseName: "Public domain",
      licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      sourcePageUrl: "https://commons.wikimedia.org/wiki/File:En-us-leak.ogg",
    },
  });
  expect(pronunciationSourceForCard("depth-nov18-checkout")).toBeUndefined();
  expect(pronunciationSourceForCard("L01-V01")).toBeUndefined();
  expect(pronunciationSourceForCard("")).toBeUndefined();
});

const noopStudy = {
  current: 1,
  total: 1,
  meaningVisible: false,
  exampleVisible: false,
  onMeaning: () => undefined,
  onExample: () => undefined,
  onNext: () => undefined,
  onBack: () => undefined,
  onReview: () => undefined,
};

const leakCard: StudyWord = {
  id: "depth-nov18-leak",
  word: "leak",
  meaning: "漏水；泄漏",
};

it("shows leak recording on a word card when App does not pass a source", () => {
  act(() => {
    root.render(<WordStudyView {...noopStudy} card={leakCard} />);
  });
  expect(container.querySelector("audio")?.getAttribute("src")).toBe(
    "/audio/depth-nov18-leak.ogg",
  );
  expect(container.textContent).toContain("发音来源");
  expect(container.textContent).toContain("Dvortygirl");
  expect(container.textContent).toContain("Public domain");
  expect(container.textContent).not.toContain("系统朗读（不是词典录音）");
});

it("keeps an explicit pronunciationSource and does not substitute another card", () => {
  act(() => {
    root.render(
      <WordStudyView
        {...noopStudy}
        card={leakCard}
        pronunciationSource={{
          kind: "recording",
          audioUrl: "https://example.org/override.ogg",
          attribution: {
            author: "Override Speaker",
            licenseName: "CC BY 4.0",
          },
        }}
      />,
    );
  });
  expect(container.querySelector("audio")?.getAttribute("src")).toBe(
    "https://example.org/override.ogg",
  );
  expect(container.textContent).toContain("Override Speaker");
  expect(container.textContent).not.toContain("Dvortygirl");
});

it("does not invent synthesis when a card has no licensed recording", () => {
  act(() => {
    root.render(
      <WordStudyView
        {...noopStudy}
        card={{ id: "depth-nov18-checkout", word: "checkout", meaning: "收银" }}
      />,
    );
  });
  expect(container.querySelector("audio")).toBeNull();
  expect(container.textContent).not.toContain("发音来源");
  expect(container.textContent).not.toContain("系统朗读（不是词典录音）");
});

it("honors an explicit null pronunciationSource and does not look up leak", () => {
  act(() => {
    root.render(
      <WordStudyView
        {...noopStudy}
        card={leakCard}
        pronunciationSource={null}
      />,
    );
  });
  expect(container.querySelector("audio")).toBeNull();
  expect(container.textContent).not.toContain("Dvortygirl");
});

it("lists due sentences and paragraphs looked up beside word cards", () => {
  const now = Date.parse("2026-11-18T14:20:00+08:00");
  const onOpen = vi.fn();
  act(() => {
    root.render(
      <ReviewDueList
        now={now}
        onOpen={onOpen}
        items={[
          {
            id: "due-word",
            title: "warranty",
            kind: "word",
            dueAt: now - 1000,
          },
        ]}
        textItems={[
          {
            id: "scene-next-bus-delayed-l5",
            title: "下一班要多久？ · I will wait here for a bit.",
            kind: "sentence",
            dueAt: now - 1000,
            documentId: "scene-next-bus-delayed",
            route: "#/scenes/scene-next-bus-delayed",
          },
          {
            id: "reading-lunch-later-p2",
            title: "午饭可以晚点再吃 · I can have lunch a little later.",
            kind: "paragraph",
            dueAt: now + 86_400_000,
            documentId: "reading-lunch-later",
            route: "#/reading/reading-lunch-later",
          },
        ]}
      />,
    );
  });
  expect(container.textContent).toContain("warranty");
  expect(container.textContent).toContain("下一班要多久？");
  expect(container.textContent).toContain("I will wait here for a bit.");
  expect(container.textContent).toContain("句");
  expect(container.textContent).not.toContain("午饭可以晚点再吃");
  expect(container.textContent).toContain("另外 1 项还没到时间");
  const sentence = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("下一班要多久？"),
  );
  act(() => sentence!.click());
  expect(onOpen).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "scene-next-bus-delayed-l5",
      kind: "sentence",
      documentId: "scene-next-bus-delayed",
    }),
  );
});
