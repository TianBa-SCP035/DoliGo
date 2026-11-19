import { useState } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TextLearningView } from "../../src/ui/TextLearningView";
import { REFACTOR_STORAGE_KEY } from "../../src/lib/progress/types";
import { loadLearningCatalog } from "../../src/lib/review";
import { topicLinksForReading, topicLinksForScene } from "../../src/adapters/topic-links";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const APARTMENT = "reading-apartment-life-depth";
const LUNCH = "reading-lunch-later";
const TRAVEL_SCENE = "scene-next-bus-delayed";
const JUBAN = "juban.user-data.v1";
const REVIEW_KEY = "doliguo:refactor:sandbox:review-session:v1";

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  location.hash = "/";
  localStorage.setItem(JUBAN, "fictional-do-not-touch");
  localStorage.setItem(REVIEW_KEY, "fictional-review");
  HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

async function settle(frames = 6) {
  for (let i = 0; i < frames; i++) {
    await act(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    });
  }
}

function Harness({
  kind,
  startId,
}: {
  kind: "scene" | "reading";
  startId: string;
}) {
  const [id] = useState(startId);
  return (
    <TextLearningView
      kind={kind}
      startId={id}
      onBack={() => undefined}
      onOpenRelated={(route) => {
        opened.push(route);
      }}
    />
  );
}

const opened: string[] = [];

function setSearch(value: string) {
  const input = host.querySelector('input[type="search"]') as HTMLInputElement | null;
  if (!input) return;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
      input,
      value,
    );
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}


describe("TextLearningView related topic links", () => {
  beforeEach(() => {
    opened.length = 0;
  });

  it("computes links from the current document, not a stale startId", async () => {
    act(() => {
      root.render(
        <TextLearningView
          kind="reading"
          startId={APARTMENT}
          onBack={() => undefined}
          onOpenRelated={(route) => opened.push(route)}
        />,
      );
    });
    await settle();
    expect(host.textContent).toContain("同一主题还可以（居家）");
    const homeLinks = topicLinksForReading(APARTMENT);
    const homeTopic = homeLinks.find((topic) => topic.id === "home");
    expect(homeTopic).toBeTruthy();
    expect(homeTopic!.scenes.length).toBeLessThanOrEqual(2);
    expect(homeTopic!.readings.length).toBeLessThanOrEqual(1);
    expect(homeTopic!.cards.filter((card) => card.route).length).toBeLessThanOrEqual(3);
    const relatedScene = homeTopic!.scenes[0];
    expect(relatedScene?.route).toMatch(/^#\/scenes\//);
    const beforeHash = location.hash;
    const sceneButton = Array.from(
      host.querySelectorAll(".doli-topic-related button"),
    ).find((button) => button.textContent?.includes(relatedScene!.title));
    expect(sceneButton).toBeTruthy();
    act(() => (sceneButton as HTMLButtonElement).click());
    expect(opened).toEqual([relatedScene!.route]);
    expect(location.hash).toBe(beforeHash);
    expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");

    const listButton = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("返回阅读列表"),
    );
    act(() => listButton!.click());
    const lunch = loadLearningCatalog().readings.find((reading) => reading.id === LUNCH)!;
    setSearch(lunch.title);
    const lunchChoice = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(lunch.title),
    );
    expect(lunchChoice).toBeTruthy();
    act(() => lunchChoice!.click());
    await settle();
    expect(host.querySelector("h1")?.textContent).toContain(lunch.titleEn);
    expect(topicLinksForReading(LUNCH)).toEqual([]);
    expect(host.textContent).not.toContain("同一主题还可以");
  });

  it("shows at most one official travel reading and does not invent a stub article", async () => {
    act(() => {
      root.render(
        <Harness kind="scene" startId={TRAVEL_SCENE} />,
      );
    });
    await settle();
    const related = topicLinksForScene(TRAVEL_SCENE).find((topic) => topic.id === "travel");
    expect(related?.readings.map((item) => item.id)).toEqual([
      "reading-using-public-transport-depth",
    ]);
    const kinds = Array.from(
      host.querySelectorAll(".doli-topic-related-kind"),
    ).map((node) => node.textContent);
    expect(kinds.filter((kind) => kind === "文章")).toHaveLength(1);
    expect(host.textContent).toContain("出行时怎么坐公共交通");
    expect(host.textContent).not.toMatch(/编一篇|配套阅读/);
  });
});
