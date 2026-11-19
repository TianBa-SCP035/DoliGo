import { loadLearningCatalog, REVIEW_SESSION_KEY } from "../../src/lib/review";
import {
  extensionWords,
  sceneV5Words,
  readingV4Words,
  sceneV6Words,
  readingV5Words,
  sceneV7Words,
  readingV6Words,
  wordGroups,
} from "../../src/adapters/wiring-words";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import { REFACTOR_STORAGE_KEY } from "../../src/lib/progress/types";
import {
  emptyProgressStore,
  rememberPosition,
  makePosition,
  saveProgressStore,
} from "../../src/lib/progress";
import {
  initialWordSession,
  saveWordSession,
} from "../../src/adapters/word-session";

let root: Root;
let host: HTMLDivElement;
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  location.hash = "/";
  host = document.createElement("div");
  document.body.append(host);
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function setSearch(value: string) {
  const input = host.querySelector('input[type="search"]') as HTMLInputElement;
  if (!input) return;
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function allLibraryChoices() {
  const catalog = loadLearningCatalog();
  const titles = location.hash.includes("/words")
    ? wordGroups.map((g) => g.title)
    : location.hash.includes("/scenes")
      ? catalog.scenes.map((s) => s.title)
      : catalog.readings.map((r) => r.title);
  const labels = new Set<string>();
  for (const title of titles) {
    setSearch(title);
    for (const card of host.querySelectorAll(".doli-document-choice"))
      labels.add(card.textContent ?? "");
  }
  setSearch("");
  return [...labels];
}
function click(label: string) {
  let b = Array.from(host.querySelectorAll("button")).find((btn) =>
    btn.textContent?.includes(label),
  );
  if (!b && host.querySelector('input[type="search"]')) {
    setSearch(label);
    b = Array.from(host.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes(label),
    );
  }
  expect(b).toBeTruthy();
  act(() => b!.click());
}

describe("home words and review wiring", () => {
  it("keeps words flow and opens all four entries", () => {
    expect(host.textContent).toContain("今天，想从哪里开始");
    expect(host.textContent).not.toContain("重构沙盒：");
    const nav = Array.from(
      host.querySelectorAll("nav button"),
    ) as HTMLButtonElement[];
    const byLabel = Object.fromEntries(
      nav.map((b) => [b.textContent?.trim(), b]),
    );
    expect(byLabel["背单词"]?.disabled).toBe(false);
    expect(byLabel["复习"]?.disabled).toBe(false);
    expect(byLabel["场景对话"]?.disabled).toBe(false);
    expect(byLabel["读点英语"]?.disabled).toBe(false);
    click("背单词");
    click("日常基础");
    expect(host.querySelector(".doli-word-panel h1")?.textContent).toBe(
      "tired",
    );
    expect(host.querySelector(".doli-meaning")).toBeNull();
    expect(host.querySelector("blockquote")).toBeNull();
    click("查看意思");
    expect(host.querySelector(".doli-meaning")?.textContent).toBe("累的");
    expect(host.querySelector("blockquote")).toBeNull();
    click("查看例句");
    expect(host.querySelector("blockquote")?.textContent).toContain(
      "I'm tired.",
    );
    click("这张先这样");
    expect(host.querySelector(".doli-word-panel h1")?.textContent).toBe("fine");
    click("退出背词");
    expect(host.textContent).toContain("停在第 2 / 8 张");
    click("继续学习");
    expect(host.querySelector(".doli-word-panel h1")?.textContent).toBe("fine");
    act(() => root.unmount());
    act(() => {
      root = createRoot(host);
      root.render(<App />);
    });
    expect(host.querySelector(".doli-word-panel h1")?.textContent).toBe("fine");
    expect(host.querySelector("blockquote")).toBeNull();
  });

  it("opens the review due list and both text libraries", () => {
    click("复习");
    expect(location.hash).toBe("#/review");
    expect(host.querySelector(".doli-review-due")).toBeTruthy();
    expect(host.querySelector("#review-due-title")?.textContent).toContain(
      "现在可以复习",
    );
    expect(host.querySelector(".doli-review")).toBeNull();
    expect(host.querySelector("#review-title")).toBeNull();
    expect(host.querySelectorAll(".doli-sentence").length).toBe(0);
    expect(host.textContent).not.toContain("这一义还不太熟");
    expect(host.textContent).not.toContain("这句里的意思，我还记得");
    expect(host.textContent).not.toContain("下一条");
    const homeButton = host.querySelector(
      'button[aria-label="多莉国首页"]',
    ) as HTMLButtonElement;
    expect(homeButton).toBeTruthy();
    act(() => homeButton.click());
    expect(host.textContent).toContain("今天，想从哪里开始");
    const scenes = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("场景对话"),
    ) as HTMLButtonElement;
    const reading = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("读点英语"),
    ) as HTMLButtonElement;
    expect(scenes.disabled).toBe(false);
    expect(reading.disabled).toBe(false);
    act(() => scenes.click());
    expect(host.querySelector(".doli-review")).toBeNull();
    expect(host.querySelector(".doli-word-panel")).toBeNull();
    expect(host.querySelector(".doli-library h1")?.textContent).toBe(
      "生活里的对话",
    );
    expect(allLibraryChoices()).toHaveLength(
      loadLearningCatalog().scenes.length,
    );
    click("返回首页");
    click("读点英语");
    expect(location.hash).toBe("#/reading");
    expect(host.querySelector(".doli-library h1")?.textContent).toBe(
      "安静读一会儿",
    );
    expect(allLibraryChoices()).toHaveLength(
      loadLearningCatalog().readings.length,
    );
  });
});

it("marks the current word for review then advances, resets reveals, and resumes without mastery", () => {
  click("背单词");
  click("日常基础");
  click("查看意思");
  click("查看例句");
  click("还要再看");
  expect(host.querySelector(".doli-word-panel h1")?.textContent).toBe("fine");
  expect(host.querySelector(".doli-meaning")).toBeNull();
  expect(host.querySelector("blockquote")).toBeNull();
  const raw = localStorage.getItem(REFACTOR_STORAGE_KEY)!;
  const saved = JSON.parse(raw).wordSession;
  expect(saved.index).toBe(1);
  expect(saved.reviewIds).toEqual(["L01-V01"]);
  expect(raw).not.toMatch(/master|correctCount|practicedAt/);
  click("退出背词");
  expect(host.textContent).toContain("停在第 2 / 8 张");
  click("继续学习");
  act(() => root.unmount());
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  expect(host.querySelector(".doli-word-panel h1")?.textContent).toBe("fine");
});

it("finishes the final card with its review mark rather than cycling", () => {
  const start = initialWordSession();
  saveWordSession(localStorage, { ...start, index: start.ids.length - 1 });
  act(() => root.unmount());
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  click("背单词");
  click("日常基础");
  click("还要再看");
  expect(host.querySelector(".doli-completion")).toBeTruthy();
  expect(host.textContent).toContain("这组先看到这里");
  expect(host.textContent).toContain("浏览了 8 张词卡");
  const saved = JSON.parse(
    localStorage.getItem(REFACTOR_STORAGE_KEY)!,
  ).wordSession;
  expect(saved.index).toBe(8);
  expect(saved.reviewIds).toEqual(["L01-V08"]);
});

it("does not advance or overwrite a corrupt sandbox when saving the mark fails", () => {
  click("背单词");
  click("日常基础");
  click("查看意思");
  localStorage.setItem(REFACTOR_STORAGE_KEY, "{bad");
  click("还要再看");
  expect(host.querySelector(".doli-word-panel h1")?.textContent).toBe("tired");
  expect(host.querySelector(".doli-meaning")?.textContent).toBe("累的");
  expect(host.textContent).toContain("1 / 8");
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "保存失败",
  );
  const raw = localStorage.getItem(REFACTOR_STORAGE_KEY)!;
  expect(raw).toBe("{bad");
  expect(raw).not.toMatch(/master|correctCount|practicedAt/);
});

it("keeps the current index and writes no mastery when setItem fails after 还要再看", () => {
  click("背单词");
  click("日常基础");
  click("查看意思");
  const before = localStorage.getItem(REFACTOR_STORAGE_KEY)!;
  expect(JSON.parse(before).wordSession.index).toBe(0);
  expect(JSON.parse(before).wordSession.reviewIds).toEqual([]);
  const original = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    if (key === REFACTOR_STORAGE_KEY) throw new Error("quota exceeded");
    return original.call(this, key, value);
  };
  try {
    click("还要再看");
  } finally {
    Storage.prototype.setItem = original;
  }
  expect(host.querySelector(".doli-word-panel h1")?.textContent).toBe("tired");
  expect(host.querySelector(".doli-meaning")?.textContent).toBe("累的");
  expect(host.textContent).toContain("1 / 8");
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "保存失败",
  );
  const raw = localStorage.getItem(REFACTOR_STORAGE_KEY)!;
  expect(raw).toBe(before);
  const saved = JSON.parse(raw).wordSession;
  expect(saved.index).toBe(0);
  expect(saved.reviewIds).toEqual([]);
  expect(raw).not.toMatch(/master|correctCount|practicedAt/);
});

it("restarts only position and reveals, keeping review marks and sibling data after reload", () => {
  const start = initialWordSession();
  localStorage.setItem(
    REFACTOR_STORAGE_KEY,
    JSON.stringify({ unknown: "keep", scenes: { demo: { unitId: "u2" } } }),
  );
  saveWordSession(localStorage, {
    ...start,
    index: start.ids.length,
    meaningVisible: true,
    exampleVisible: true,
    reviewIds: [start.ids[0], start.ids[7]],
  });
  act(() => root.unmount());
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  click("背单词");
  click("日常基础");
  click("再看这组");
  expect(host.querySelector(".doli-word-panel h1")?.textContent).toBe("tired");
  expect(host.querySelector(".doli-meaning")).toBeNull();
  expect(host.querySelector("blockquote")).toBeNull();
  const saved = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
  expect(saved.wordSession.index).toBe(0);
  expect(saved.wordSession.reviewIds).toEqual([start.ids[0], start.ids[7]]);
  expect(saved.unknown).toBe("keep");
  expect(saved.scenes.demo.unitId).toBe("u2");
  act(() => root.unmount());
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  expect(
    JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!).wordSession
      .reviewIds,
  ).toEqual([start.ids[0], start.ids[7]]);
});

it("stays on completion and retains all marks when restart saving fails", () => {
  const start = initialWordSession();
  saveWordSession(localStorage, {
    ...start,
    index: start.ids.length,
    reviewIds: [start.ids[0]],
  });
  act(() => root.unmount());
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  click("背单词");
  click("日常基础");
  const before = localStorage.getItem(REFACTOR_STORAGE_KEY);
  const original = Storage.prototype.setItem;
  Storage.prototype.setItem = function () {
    throw new Error("quota exceeded");
  };
  try {
    click("再看这组");
  } finally {
    Storage.prototype.setItem = original;
  }
  expect(host.querySelector(".doli-completion")).toBeTruthy();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "保存失败",
  );
  expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe(before);
});

it("restores each text library from its direct hash without falling into words", () => {
  for (const kind of ["scenes", "reading"]) {
    act(() => root.unmount());
    location.hash = "/" + kind;
    act(() => {
      root = createRoot(host);
      root.render(<App />);
    });
    expect(allLibraryChoices()).toHaveLength(
      kind === "scenes"
        ? loadLearningCatalog().scenes.length
        : loadLearningCatalog().readings.length,
    );
    expect(host.querySelector(".doli-word-panel")).toBeNull();
  }
});

it("resumes the last scene document from home instead of stopping at the list", () => {
  const start = initialWordSession();
  saveWordSession(localStorage, { ...start, index: 1, updatedAt: 10 });
  const wordSaved = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
  const later = Number(wordSaved.wordSession.updatedAt) + 10;
  saveProgressStore(
    localStorage,
    rememberPosition(
      emptyProgressStore(later),
      makePosition(
        "scene",
        "scene-one-more-round",
        "unit-last",
        "visibility",
        later,
      ),
      later,
    ),
    REFACTOR_STORAGE_KEY,
    later,
  );
  expect(JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!).wordSession.index).toBe(1);
  act(() => root.unmount());
  location.hash = "/";
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  expect(host.textContent).toContain("场景 · 今晚还打吗？");
  expect(host.textContent).toContain("停在上次读到的位置");
  click("继续学习");
  expect(location.hash).toBe("#/scenes/scene-one-more-round");
  expect(host.querySelector(".doli-document h1")?.textContent).toBe(
    "One More Round?",
  );
  expect(host.querySelector(".doli-library")).toBeNull();
  expect(localStorage.getItem("juban.user-data.v1")).toBeNull();
});

it("switches documents within the same column on hash changes without a reload", () => {
  function route(hash: string) {
    act(() => {
      location.hash = hash;
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
  }
  route("/scenes/scene-one-more-round");
  expect(host.querySelector(".doli-document h1")?.textContent).toBe(
    "One More Round?",
  );
  route("/scenes/scene-page-wont-load");
  expect(host.querySelector(".doli-document h1")?.textContent).toBe(
    "The Page Won't Load",
  );
  route("/scenes/scene-one-more-round");
  expect(host.querySelector(".doli-document h1")?.textContent).toBe(
    "One More Round?",
  );
  route("/scenes");
  expect(host.querySelector(".doli-library")).toBeTruthy();
  route("/reading/reading-shops-afternoon");
  expect(host.querySelector(".doli-document h1")?.textContent).toBe(
    "A Quick Shopping Trip",
  );
  route("/reading/reading-lunch-later");
  expect(host.querySelector(".doli-document h1")?.textContent).toBe(
    "Lunch a Little Later",
  );
  route("/reading/reading-shops-afternoon");
  expect(host.querySelector(".doli-document h1")?.textContent).toBe(
    "A Quick Shopping Trip",
  );
  route("/reading");
  expect(host.querySelector(".doli-library")).toBeTruthy();
});

it.each(["scene-change-dinner-time", "scene-store-out-of-stock"])(
  "opens new scene %s from home resume",
  (id) => {
    saveProgressStore(
      localStorage,
      rememberPosition(
        emptyProgressStore(40),
        makePosition("scene", id, "test-saved-unit", "visibility", 40),
        40,
      ),
      REFACTOR_STORAGE_KEY,
      40,
    );
    act(() => root.unmount());
    location.hash = "/";
    act(() => {
      root = createRoot(host);
      root.render(<App />);
    });
    expect(host.textContent).toContain("停在上次读到的位置");
    click("继续学习");
    expect(location.hash).toBe("#/scenes/" + id);
    expect(host.querySelector(".doli-document")).toBeTruthy();
    expect(host.querySelector(".doli-library")).toBeNull();
    expect(localStorage.getItem("juban.user-data.v1")).toBeNull();
  },
);

it("keeps supplemental learning and home resume separate from the original queue", () => {
  saveWordSession(localStorage, {
    ...initialWordSession(),
    index: 3,
    reviewIds: ["L01-V01"],
    updatedAt: 1,
  });
  const original = JSON.parse(
    localStorage.getItem(REFACTOR_STORAGE_KEY)!,
  ).wordSession;
  act(() => root.unmount());
  location.hash = "/words/daily-scenes-v3";
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  expect(host.textContent).toContain("1 / 8");
  const firstWord = host.querySelector(".doli-word-panel h1")?.textContent;
  click("查看意思");
  click("还要再看");
  expect(host.textContent).toContain("2 / 8");
  expect(host.querySelector(".doli-word-panel h1")?.textContent).not.toBe(
    firstWord,
  );
  click("退出背词");
  click("继续学习");
  expect(location.hash).toBe("#/words/daily-scenes-v3");
  expect(host.textContent).toContain("2 / 8");
  act(() => root.unmount());
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  expect(host.textContent).toContain("2 / 8");
  for (let i = 1; i < 8; i++) click("这张先这样");
  expect(host.querySelector(".doli-completion")).toBeTruthy();
  click("再看这组");
  expect(host.textContent).toContain("1 / 8");
  const after = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
  expect(after.wordSession).toEqual(original);
  expect(after.wordSessions["daily-scenes-v3"].reviewIds).toHaveLength(1);
});

it("blocks corrupt supplemental progress rather than replacing it", () => {
  localStorage.setItem(
    REFACTOR_STORAGE_KEY,
    JSON.stringify({
      wordSessions: { "daily-scenes-v3": { version: 2, ids: [] } },
    }),
  );
  const before = localStorage.getItem(REFACTOR_STORAGE_KEY);
  act(() => root.unmount());
  location.hash = "/words/daily-scenes-v3";
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "无法恢复背词记录",
  );
  expect(host.querySelector(".doli-word-panel")).toBeNull();
  expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe(before);
});

it("offers both groups without writing records and restores each saved position", () => {
  saveWordSession(localStorage, {
    ...initialWordSession(),
    index: 3,
    reviewIds: ["L01-V01"],
  });
  saveWordSession(localStorage, {
    ...initialWordSession("daily-scenes-v3"),
    index: 5,
  });
  const before = localStorage.getItem(REFACTOR_STORAGE_KEY);
  act(() => root.unmount());
  location.hash = "/words";
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  expect(allLibraryChoices()).toHaveLength(wordGroups.length);
  setSearch("日常基础");
  expect(host.textContent).toContain("上次停在第 4 张");
  setSearch("订餐与购物");
  expect(host.textContent).toContain("上次停在第 6 张");
  click("订餐与购物");
  expect(location.hash).toBe("#/words/daily-scenes-v3");
  expect(host.textContent).toContain("6 / 8");
  expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe(before);
  act(() => {
    location.hash = "/words";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  click("日常基础");
  expect(location.hash).toBe("#/words/basic");
  expect(host.textContent).toContain("4 / 8");
  expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe(before);
});

it("learns all ten extension cards and resumes without rewriting either older queue or review", () => {
  saveWordSession(localStorage, {
    ...initialWordSession(),
    index: 3,
    reviewIds: ["L01-V01"],
  });
  saveWordSession(localStorage, {
    ...initialWordSession("daily-scenes-v3"),
    index: 5,
  });
  localStorage.setItem(REVIEW_SESSION_KEY, "fictional-review-original");
  const before = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
  act(() => root.unmount());
  location.hash = "/words";
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  click("游戏、工作与阅读");
  expect(location.hash).toBe("#/words/game-work-reading-v1");
  expect(host.textContent).toContain("1 / 10");
  click("查看意思");
  click("查看例句");
  expect(
    host.querySelector("details.doli-transfer-example")?.hasAttribute("open"),
  ).toBe(false);
  click("还要再看");
  click("退出背词");
  click("继续学习");
  expect(location.hash).toBe("#/words/game-work-reading-v1");
  expect(host.textContent).toContain("2 / 10");
  act(() => root.unmount());
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  for (let i = 1; i < 10; i++) {
    expect(host.querySelector(".doli-word-panel h1")?.textContent).toBe(
      extensionWords[i].word,
    );
    click("这张先这样");
  }
  expect(host.querySelector(".doli-completion")).toBeTruthy();
  click("再看这组");
  const after = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
  expect(after.wordSession).toEqual(before.wordSession);
  expect(after.wordSessions["daily-scenes-v3"]).toEqual(
    before.wordSessions["daily-scenes-v3"],
  );
  expect(after.wordSessions["game-work-reading-v1"].reviewIds).toEqual([
    extensionWords[0].id,
  ]);
  expect(localStorage.getItem(REVIEW_SESSION_KEY)).toBe(
    "fictional-review-original",
  );
});

it.each([
  ["scene", "scene-voice-keeps-cutting", "scenes"],
  ["scene", "scene-try-it-again", "scenes"],
  ["reading", "reading-weekend-plans-change", "reading"],
  ["reading", "reading-right-floor", "reading"],
] as const)("opens extension %s %s from home resume", (kind, id, entry) => {
  saveProgressStore(
    localStorage,
    rememberPosition(
      emptyProgressStore(40),
      makePosition(kind, id, "fictional-saved-unit", "visibility", 40),
      40,
    ),
    REFACTOR_STORAGE_KEY,
    40,
  );
  act(() => root.unmount());
  location.hash = "/";
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  click("继续学习");
  expect(location.hash).toBe("#/" + entry + "/" + id);
  const catalog = loadLearningCatalog();
  const doc = (kind === "scene" ? catalog.scenes : catalog.readings).find(
    (doc) => doc.id === id,
  )!;
  expect(host.querySelector(".doli-document h1")?.textContent).toBe(
    doc.titleEn,
  );
});

it.each([
  ["daily-scenes-v5", "改乘与换店", sceneV5Words, 5],
  ["daily-reading-v4", "野餐与坐过站", readingV4Words, 4],
] as const)(
  "learns new group %s without rewriting earlier vocab queues",
  (groupId, title, words, total) => {
    saveWordSession(localStorage, {
      ...initialWordSession(),
      index: 3,
      reviewIds: ["L01-V01"],
    });
    saveWordSession(localStorage, {
      ...initialWordSession("daily-scenes-v3"),
      index: 5,
    });
    saveWordSession(localStorage, {
      ...initialWordSession("game-work-reading-v1"),
      index: 2,
      reviewIds: [extensionWords[0].id],
    });
    localStorage.setItem(REVIEW_SESSION_KEY, "fictional-review-original");
    const before = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    act(() => root.unmount());
    location.hash = "/words";
    act(() => {
      root = createRoot(host);
      root.render(<App />);
    });
    click(title);
    expect(location.hash).toBe("#/words/" + groupId);
    expect(host.textContent).toContain("1 / " + total);
    click("查看意思");
    click("还要再看");
    expect(host.textContent).toContain("2 / " + total);
    click("退出背词");
    click("继续学习");
    expect(location.hash).toBe("#/words/" + groupId);
    expect(host.textContent).toContain("2 / " + total);
    const after = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    expect(after.wordSession).toEqual(before.wordSession);
    expect(after.wordSessions["daily-scenes-v3"]).toEqual(
      before.wordSessions["daily-scenes-v3"],
    );
    expect(after.wordSessions["game-work-reading-v1"]).toEqual(
      before.wordSessions["game-work-reading-v1"],
    );
    expect(after.wordSessions[groupId].reviewIds).toEqual([words[0].id]);
    expect(localStorage.getItem(REVIEW_SESSION_KEY)).toBe(
      "fictional-review-original",
    );
  },
);

it.each([
  ["scene", "scene-next-bus-delayed", "scenes"],
  ["scene", "scene-restaurant-is-full", "scenes"],
  ["reading", "reading-picnic-in-the-rain", "reading"],
  ["reading", "reading-missed-my-stop", "reading"],
] as const)("opens incremental %s %s from home resume", (kind, id, entry) => {
  saveProgressStore(
    localStorage,
    rememberPosition(
      emptyProgressStore(40),
      makePosition(kind, id, "fictional-saved-unit", "visibility", 40),
      40,
    ),
    REFACTOR_STORAGE_KEY,
    40,
  );
  act(() => root.unmount());
  location.hash = "/";
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  click("继续学习");
  expect(location.hash).toBe("#/" + entry + "/" + id);
  const catalog = loadLearningCatalog();
  const doc = (kind === "scene" ? catalog.scenes : catalog.readings).find(
    (doc) => doc.id === id,
  )!;
  expect(host.querySelector(".doli-document h1")?.textContent).toBe(
    doc.titleEn,
  );
  expect(host.querySelector(".doli-library")).toBeNull();
});

it.each([
  ["daily-scenes-v6", "快递与拿错杯", sceneV6Words, 7],
  ["daily-reading-v5", "充电器与代收", readingV5Words, 2],
] as const)(
  "learns incremental group %s without rewriting earlier vocab queues",
  (groupId, title, words, total) => {
    saveWordSession(localStorage, {
      ...initialWordSession(),
      index: 3,
      reviewIds: ["L01-V01"],
    });
    saveWordSession(localStorage, {
      ...initialWordSession("daily-scenes-v3"),
      index: 5,
    });
    saveWordSession(localStorage, {
      ...initialWordSession("game-work-reading-v1"),
      index: 2,
      reviewIds: [extensionWords[0].id],
    });
    saveWordSession(localStorage, {
      ...initialWordSession("daily-scenes-v5"),
      index: 1,
    });
    saveWordSession(localStorage, {
      ...initialWordSession("daily-reading-v4"),
      index: 2,
    });
    localStorage.setItem(REVIEW_SESSION_KEY, "fictional-review-original");
    const before = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    act(() => root.unmount());
    location.hash = "/words";
    act(() => {
      root = createRoot(host);
      root.render(<App />);
    });
    click(title);
    expect(location.hash).toBe("#/words/" + groupId);
    expect(host.textContent).toContain("1 / " + total);
    click("查看意思");
    click("还要再看");
    expect(host.textContent).toContain("2 / " + total);
    click("退出背词");
    click("继续学习");
    expect(location.hash).toBe("#/words/" + groupId);
    expect(host.textContent).toContain("2 / " + total);
    const after = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    expect(after.wordSession).toEqual(before.wordSession);
    expect(after.wordSessions["daily-scenes-v3"]).toEqual(
      before.wordSessions["daily-scenes-v3"],
    );
    expect(after.wordSessions["game-work-reading-v1"]).toEqual(
      before.wordSessions["game-work-reading-v1"],
    );
    expect(after.wordSessions["daily-scenes-v5"]).toEqual(
      before.wordSessions["daily-scenes-v5"],
    );
    expect(after.wordSessions["daily-reading-v4"]).toEqual(
      before.wordSessions["daily-reading-v4"],
    );
    expect(after.wordSessions[groupId].reviewIds).toEqual([words[0].id]);
    expect(localStorage.getItem(REVIEW_SESSION_KEY)).toBe(
      "fictional-review-original",
    );
  },
);

it.each([
  ["scene", "scene-package-at-the-door", "scenes"],
  ["scene", "scene-wrong-drink", "scenes"],
  ["reading", "reading-left-my-charger", "reading"],
  ["reading", "reading-neighbor-kept-the-box", "reading"],
] as const)(
  "opens later incremental %s %s from home resume",
  (kind, id, entry) => {
    saveProgressStore(
      localStorage,
      rememberPosition(
        emptyProgressStore(40),
        makePosition(kind, id, "fictional-saved-unit", "visibility", 40),
        40,
      ),
      REFACTOR_STORAGE_KEY,
      40,
    );
    act(() => root.unmount());
    location.hash = "/";
    act(() => {
      root = createRoot(host);
      root.render(<App />);
    });
    click("继续学习");
    expect(location.hash).toBe("#/" + entry + "/" + id);
    const catalog = loadLearningCatalog();
    const doc = (kind === "scene" ? catalog.scenes : catalog.readings).find(
      (doc) => doc.id === id,
    )!;
    expect(host.querySelector(".doli-document h1")?.textContent).toBe(
      doc.titleEn,
    );
    expect(host.querySelector(".doli-library")).toBeNull();
  },
);

it.each([
  ["daily-scenes-v7", "退换与下楼", sceneV7Words],
  ["daily-reading-v6", "电梯与改约", readingV6Words],
] as const)(
  "completes and resumes %s without changing old queues",
  (groupId, title, words) => {
    const oldGroups = wordGroups.filter(
      (g) => g.id !== "daily-scenes-v7" && g.id !== "daily-reading-v6",
    );
    for (const group of oldGroups)
      saveWordSession(localStorage, {
        ...initialWordSession(group.id),
        index: 1,
      });
    const before = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    localStorage.setItem(REVIEW_SESSION_KEY, "fictional-review-original");
    act(() => root.unmount());
    location.hash = "/words";
    act(() => {
      root = createRoot(host);
      root.render(<App />);
    });
    const pickerSnapshot = localStorage.getItem(REFACTOR_STORAGE_KEY);
    expect(allLibraryChoices()).toHaveLength(wordGroups.length);
    expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe(pickerSnapshot);
    click(title);
    expect(host.textContent).toContain("1 / " + words.length);
    click("查看意思");
    click("还要再看");
    click("退出背词");
    click("继续学习");
    expect(location.hash).toBe("#/words/" + groupId);
    expect(host.textContent).toContain("2 / " + words.length);
    act(() => root.unmount());
    act(() => {
      root = createRoot(host);
      root.render(<App />);
    });
    for (let i = 1; i < words.length; i++) {
      expect(host.querySelector(".doli-word-panel h1")?.textContent).toBe(
        words[i].word,
      );
      click("这张先这样");
    }
    expect(host.querySelector(".doli-completion")).toBeTruthy();
    click("再看这组");
    const after = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    expect(after.wordSession).toEqual(before.wordSession);
    for (const group of oldGroups.filter((g) => g.id !== "basic"))
      expect(after.wordSessions[group.id]).toEqual(
        before.wordSessions[group.id],
      );
    expect(after.wordSessions[groupId].reviewIds).toEqual([words[0].id]);
    expect(localStorage.getItem(REVIEW_SESSION_KEY)).toBe(
      "fictional-review-original",
    );
  },
);

it.each([
  ["scene", "scene-have-the-receipt", "scenes"],
  ["scene", "scene-ill-be-right-down", "scenes"],
  ["reading", "reading-elevator-is-out", "reading"],
  ["reading", "reading-had-to-reschedule", "reading"],
] as const)("resumes latest %s %s directly", (kind, id, entry) => {
  saveProgressStore(
    localStorage,
    rememberPosition(
      emptyProgressStore(40),
      makePosition(kind, id, "fictional-unit", "visibility", 40),
      40,
    ),
    REFACTOR_STORAGE_KEY,
    40,
  );
  act(() => root.unmount());
  location.hash = "/";
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  click("继续学习");
  expect(location.hash).toBe("#/" + entry + "/" + id);
  const cat = loadLearningCatalog();
  const doc = (kind === "scene" ? cat.scenes : cat.readings).find(
    (d) => d.id === id,
  )!;
  expect(host.querySelector(".doli-document h1")?.textContent).toBe(
    doc.titleEn,
  );
});

it("opens the sourced travel reading with visible end attribution and leaves original readings unmarked", () => {
  saveProgressStore(
    localStorage,
    rememberPosition(
      emptyProgressStore(40),
      makePosition(
        "reading",
        "reading-arriving-new-city",
        "fictional-unit",
        "visibility",
        40,
      ),
      40,
    ),
    REFACTOR_STORAGE_KEY,
    40,
  );
  act(() => root.unmount());
  location.hash = "/";
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  click("继续学习");
  expect(location.hash).toBe("#/reading/reading-arriving-new-city");
  expect(host.querySelector(".doli-document h1")?.textContent).toBe(
    "Arriving in a New City",
  );
  expect(host.querySelector(".doli-source-attribution")).toBeTruthy();
  expect(host.querySelector(".doli-source-attribution")?.textContent).toContain(
    "CC BY-SA 4.0",
  );
  expect(host.querySelector(".doli-source-attribution")?.textContent).toContain(
    "Wikivoyage",
  );
  const before = localStorage.getItem(REFACTOR_STORAGE_KEY);
  act(() => root.unmount());
  location.hash = "#/reading/reading-elevator-is-out";
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
  expect(host.querySelector(".doli-document h1")?.textContent).toBe(
    "The Elevator Is Out.",
  );
  expect(host.querySelector(".doli-source-attribution")).toBeNull();
  expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe(before);
});
