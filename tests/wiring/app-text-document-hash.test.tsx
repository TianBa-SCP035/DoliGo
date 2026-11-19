import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import { loadLearningCatalog } from "../../src/lib/review";

let root: Root;
let host: HTMLDivElement;
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const TRAVEL_READING = "reading-using-public-transport-depth";
const TRAVEL_SCENE = "scene-next-bus-delayed";
const JUBAN = "juban.user-data.v1";
const REVIEW_KEY = "doliguo:refactor:sandbox:review-session:v1";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  location.hash = "/";
  localStorage.setItem(JUBAN, "fictional-do-not-touch");
  localStorage.setItem(REVIEW_KEY, "fictional-review");
  HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
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

async function settle(frames = 6) {
  for (let i = 0; i < frames; i++) {
    await act(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    });
  }
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

function click(label: string) {
  const button = Array.from(host.querySelectorAll("button")).find((btn) =>
    btn.textContent?.includes(label),
  );
  expect(button, `missing button: ${label}`).toBeTruthy();
  act(() => button!.click());
}

function openFromSearch(title: string) {
  setSearch(title);
  const choice = Array.from(
    host.querySelectorAll(".doli-document-choice"),
  ).find((card) => card.textContent?.includes(title));
  expect(choice, `missing list choice: ${title}`).toBeTruthy();
  act(() => (choice as HTMLButtonElement).click());
}

describe("App document hash wiring", () => {
  it("writes the travel reading hash from list or search and returns to the reading list", async () => {
    const travel = loadLearningCatalog().readings.find(
      (reading) => reading.id === TRAVEL_READING,
    )!;
    click("读点英语");
    expect(location.hash).toBe("#/reading");
    expect(host.querySelector(".doli-library")).toBeTruthy();
    openFromSearch(travel.title);
    await settle();
    expect(location.hash).toBe(`#/reading/${TRAVEL_READING}`);
    expect(host.querySelector(".doli-document")).toBeTruthy();
    expect(host.querySelector(".doli-library")).toBeNull();
    expect(host.textContent).toContain(travel.title);
    click("返回阅读列表");
    await settle();
    expect(location.hash).toBe("#/reading");
    expect(host.querySelector(".doli-library")).toBeTruthy();
    expect(host.querySelector(".doli-document")).toBeNull();
    expect(host.querySelector(".doli-library h1")?.textContent).toBe(
      "安静读一会儿",
    );
    expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
  });

  it("writes the scene hash from the list and returns to the scene list, not home", async () => {
    const scene = loadLearningCatalog().scenes.find(
      (entry) => entry.id === TRAVEL_SCENE,
    )!;
    click("场景对话");
    expect(location.hash).toBe("#/scenes");
    openFromSearch(scene.title);
    await settle();
    expect(location.hash).toBe(`#/scenes/${TRAVEL_SCENE}`);
    expect(host.querySelector(".doli-document")).toBeTruthy();
    expect(host.querySelector(".doli-library")).toBeNull();
    click("返回场景列表");
    await settle();
    expect(location.hash).toBe("#/scenes");
    expect(host.querySelector(".doli-library")).toBeTruthy();
    expect(host.querySelector(".doli-document")).toBeNull();
    expect(host.querySelector(".doli-library h1")?.textContent).toBe(
      "生活里的对话",
    );
    expect(host.textContent).not.toContain("今天，想从哪里开始");
    expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
  });
});
