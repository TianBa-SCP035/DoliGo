import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import {
  libraryWordEntries,
  wordGroups,
} from "../../src/adapters/wiring-words";
import { REFACTOR_STORAGE_KEY } from "../../src/lib/progress/types";
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

function click(label: string) {
  let button = Array.from(host.querySelectorAll("button")).find((btn) =>
    btn.textContent?.includes(label),
  );
  if (!button && host.querySelector('input[type="search"]')) {
    setInput(label);
    button = Array.from(host.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes(label),
    );
  }
  expect(button).toBeTruthy();
  act(() => button!.click());
}
function setInput(value: string) {
  const input = host.querySelector('input[type="search"]') as HTMLInputElement;
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
describe("searchable library word entry", () => {
  it("keeps nine groups behind recommendations and searches the full word library", () => {
    click("背单词");
    expect(wordGroups).toHaveLength(9);
    expect(host.querySelectorAll(".doli-document-choice")).toHaveLength(3);
    expect(host.querySelector(".doli-library-pagination")).toBeNull();
    click("找一个单词");
    expect(location.hash).toBe("#/words/library");
    expect(libraryWordEntries).toHaveLength(222);
    expect(host.querySelectorAll(".doli-document-choice")).toHaveLength(3);
    setInput("ask");
    expect(host.querySelectorAll(".doli-document-choice")).toHaveLength(1);
    setInput("询问");
    expect(host.textContent).toContain("ask");
    expect(host.querySelectorAll("select")).toHaveLength(0);
  });

  it("starts, reveals, finishes and resumes a library word without touching group records", () => {
    saveWordSession(localStorage, {
      ...initialWordSession(),
      index: 3,
      reviewIds: ["L01-V01"],
    });
    const before = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    click("背单词");
    click("找一个单词");
    click("ask");
    expect(location.hash).toBe("#/words/card/ready-nov16-ask");
    expect(host.querySelector(".doli-word-panel h1")?.textContent).toBe("ask");
    expect(host.textContent).toContain("1 / 1");
    click("查看意思");
    expect(host.querySelector(".doli-meaning")?.textContent).toContain("问");
    click("查看例句");
    expect(host.querySelector("blockquote")?.textContent).toContain(
      "Can I ask you a question?",
    );
    click("跳过，先看下一张");
    expect(host.querySelector(".doli-completion")).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    expect(stored.wordSession).toEqual(before.wordSession);
    expect(stored.wordLibrarySessions["ready-nov16-ask"].index).toBe(1);
    expect(localStorage.getItem("juban.user-data.v1")).toBeNull();
    click("返回词条");
    expect(location.hash).toBe("#/words/library");
    setInput("ask");
    expect(host.textContent).toContain("这张已看完");
    act(() => {
      location.hash = "/";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(host.textContent).toContain("这张词卡已浏览完");
    click("继续学习");
    expect(location.hash).toBe("#/words/card/ready-nov16-ask");
    expect(host.querySelector(".doli-completion")).toBeTruthy();
  });

  it("blocks a corrupt library record and does not fall into the basic group", () => {
    localStorage.setItem(
      REFACTOR_STORAGE_KEY,
      JSON.stringify({
        wordLibrarySessions: { "ready-nov16-ask": { version: 2, ids: [] } },
      }),
    );
    const before = localStorage.getItem(REFACTOR_STORAGE_KEY);
    act(() => root.unmount());
    location.hash = "/words/card/ready-nov16-ask";
    act(() => {
      root = createRoot(host);
      root.render(<App />);
    });
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      "无法恢复背词记录",
    );
    expect(host.querySelector(".doli-word-panel")).toBeNull();
    expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe(before);
    act(() => {
      location.hash = "/words/card/not-a-real-card";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(host.textContent).toContain("没有这张词卡");
  });
});
