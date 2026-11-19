import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App, { relatedRouteTarget } from "../../src/App";
import { wordGroups } from "../../src/adapters/wiring-words";
import { REFACTOR_STORAGE_KEY } from "../../src/lib/progress/types";
import {
  initialLibraryWordSession,
  initialWordSession,
  saveLibraryWordSession,
  saveWordSession,
} from "../../src/adapters/word-session";
import { hashForEntry } from "../../src/adapters/routes";
import { topicLinkById, topicLinksForWordGroup } from "../../src/adapters/topic-links";

let root: Root;
let host: HTMLDivElement;
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const JUBAN = "juban.user-data.v1";
const NEXT_GROUP_ID = "daily-scenes-v3";
const NEXT_GROUP_TITLE = "订餐与购物";
const SWEATER = "depth-nov16-sweater";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  location.hash = "/";
  host = document.createElement("div");
  document.body.append(host);
});

afterEach(() => {
  if (root) act(() => root.unmount());
  host?.remove();
});

function renderApp() {
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
}

function click(label: string) {
  const button = Array.from(host.querySelectorAll("button")).find((btn) =>
    btn.textContent?.includes(label),
  );
  expect(button, `missing button: ${label}`).toBeTruthy();
  act(() => button!.click());
}

function buttonLabels() {
  return Array.from(host.querySelectorAll("button")).map(
    (button) => button.textContent ?? "",
  );
}

function setSearch(value: string) {
  const input = host.querySelector('input[type="search"]') as HTMLInputElement;
  expect(input).toBeTruthy();
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function completeGroup(groupId: (typeof wordGroups)[number]["id"]) {
  const start = initialWordSession(groupId);
  saveWordSession(localStorage, {
    ...start,
    index: start.ids.length,
  });
}

describe("relatedRouteTarget", () => {
  it("uses existing route helpers and does not invent document ids", () => {
    expect(relatedRouteTarget("#/scenes/scene-package-at-the-door")).toEqual({
      entry: "scenes",
      documentId: "scene-package-at-the-door",
    });
    expect(
      relatedRouteTarget("#/reading/reading-apartment-life-depth"),
    ).toEqual({
      entry: "reading",
      documentId: "reading-apartment-life-depth",
    });
    expect(relatedRouteTarget(`#/words/card/${SWEATER}`)).toEqual({
      entry: "words",
      documentId: SWEATER,
    });
    expect(relatedRouteTarget("#/words/daily-scenes-v3")).toEqual({
      entry: "words",
      documentId: "daily-scenes-v3",
    });
    expect(relatedRouteTarget("#/words")).toEqual({ entry: "words" });
    expect(relatedRouteTarget("#/words/library")).toEqual({
      entry: "words",
      documentId: "library",
    });
    expect(relatedRouteTarget("#/words/not-a-group")).toBeUndefined();
    expect(relatedRouteTarget("#/words/card/not-a-real-card")).toBeUndefined();
    expect(relatedRouteTarget("#/scenes/not-a-scene")).toBeUndefined();
    expect(relatedRouteTarget("#/reading/not-a-reading")).toBeUndefined();
  });
});

describe("App next-group and topic-link wiring", () => {
  it("starts the next unfinished group from a completed group page", () => {
    completeGroup("basic");
    localStorage.setItem(JUBAN, "do-not-touch");
    const before = localStorage.getItem(REFACTOR_STORAGE_KEY);
    location.hash = "/words/basic";
    renderApp();
    expect(host.querySelector(".doli-completion")).toBeTruthy();
    expect(buttonLabels().some((label) => label.includes("开始下一组"))).toBe(
      true,
    );
    expect(host.textContent).toContain(NEXT_GROUP_TITLE);
    click("开始下一组");
    expect(location.hash).toBe(hashForEntry("words", NEXT_GROUP_ID));
    expect(host.querySelector(".doli-word-panel")).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    expect(stored.wordSession.index).toBe(
      JSON.parse(before!).wordSession.index,
    );
    expect(stored.wordSessions?.[NEXT_GROUP_ID]).toBeUndefined();
    expect(wordGroups).toHaveLength(9);
    expect(localStorage.getItem(JUBAN)).toBe("do-not-touch");
  });

  it("labels an in-progress next group as continue and can open the picker", () => {
    completeGroup("basic");
    const next = initialWordSession(NEXT_GROUP_ID);
    saveWordSession(localStorage, { ...next, index: 2, meaningVisible: true });
    location.hash = "/words/basic";
    renderApp();
    expect(buttonLabels().some((label) => label.includes("继续下一组"))).toBe(
      true,
    );
    expect(buttonLabels().some((label) => label.includes("开始下一组"))).toBe(
      false,
    );
    click("选另一组");
    expect(location.hash).toBe("#/words");
    expect(host.querySelector(".doli-document-choice")).toBeTruthy();
    setSearch(NEXT_GROUP_TITLE);
    expect(host.textContent).toContain(NEXT_GROUP_TITLE);
    expect(host.textContent).toContain("上次停在第 3 张");
  });

  it("hides next-group when every other group is finished, still offers the picker", () => {
    for (const group of wordGroups) completeGroup(group.id);
    location.hash = "/words/basic";
    renderApp();
    expect(host.querySelector(".doli-completion")).toBeTruthy();
    expect(buttonLabels().some((label) => label.includes("开始下一组"))).toBe(
      false,
    );
    expect(buttonLabels().some((label) => label.includes("继续下一组"))).toBe(
      false,
    );
    click("选另一组");
    expect(location.hash).toBe("#/words");
  });

  it("does not pass next-group controls on a library card, and opens a related reading through existing routes", () => {
    const session = initialLibraryWordSession(SWEATER);
    saveLibraryWordSession(localStorage, {
      ...session,
      index: session.ids.length,
    });
    location.hash = `/words/card/${SWEATER}`;
    renderApp();
    expect(host.querySelector(".doli-completion")).toBeTruthy();
    expect(buttonLabels().some((label) => label.includes("开始下一组"))).toBe(
      false,
    );
    expect(buttonLabels().some((label) => label.includes("继续下一组"))).toBe(
      false,
    );
    expect(buttonLabels().some((label) => label.includes("选另一组"))).toBe(
      false,
    );
    expect(host.textContent).toContain("同一主题还可以（购物）");
    const shoppingReading = topicLinkById("shopping")!.readings[0];
    click(shoppingReading.title);
    expect(location.hash).toBe(shoppingReading.route);
    expect(host.querySelector(".doli-document")).toBeTruthy();
  });

  it("opens a related scene from group study without writing a new study group", () => {
    location.hash = "/words/basic";
    renderApp();
    expect(host.textContent).toContain("同一主题还可以（游戏）");
    const beforeGroups = wordGroups.map((group) => ({
      id: group.id,
      length: group.words.length,
    }));
    const game = topicLinksForWordGroup("basic")[0];
    const openableScene = game.scenes[0] ?? game.readings[0];
    const openableCard = game.cards.find((card) => card.route);
    const route = openableScene?.route ?? openableCard?.route;
    const label = openableScene?.title ?? openableCard?.headword;
    expect(route).toBeTruthy();
    const relatedButton = Array.from(
      host.querySelectorAll(".doli-topic-related button"),
    ).find((button) => button.textContent?.includes(label!));
    expect(relatedButton).toBeTruthy();
    act(() => (relatedButton as HTMLButtonElement).click());
    expect(location.hash).toBe(route);
    expect(wordGroups.map((group) => ({ id: group.id, length: group.words.length }))).toEqual(
      beforeGroups,
    );
  });
});
