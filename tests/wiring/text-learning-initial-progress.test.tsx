import { useState } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TextLearningView } from "../../src/ui/TextLearningView";
import { REFACTOR_STORAGE_KEY } from "../../src/lib/progress/types";
import { loadLearningCatalog } from "../../src/lib/review";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const LUNCH = "reading-lunch-later";
const LUNCH_LAST = "reading-lunch-later-p5";
const APARTMENT = "reading-apartment-life-depth";
const APARTMENT_P3 = "reading-apartment-life-depth-p3";
const APARTMENT_P6 = "reading-apartment-life-depth-p6";
const REVIEW_KEY = "doliguo:refactor:sandbox:review-session:v1";
const JUBAN = "juban.user-data.v1";

let root: Root;
let host: HTMLDivElement;
let sandboxWrites = 0;
let setItemImpl: typeof localStorage.setItem;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  sandboxWrites = 0;
  setItemImpl = localStorage.setItem.bind(localStorage);
  localStorage.setItem = ((key: string, value: string) => {
    if (key === REFACTOR_STORAGE_KEY) sandboxWrites += 1;
    setItemImpl(key, value);
  }) as typeof localStorage.setItem;
  Object.defineProperty(window, "innerHeight", { value: 2400, configurable: true });
  HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      x: 0,
      y: 120,
      top: 120,
      bottom: 400,
      left: 0,
      right: 1280,
      width: 1280,
      height: 280,
      toJSON() {
        return {};
      },
    };
  };
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  localStorage.setItem = setItemImpl;
});

async function settle(frames = 8) {
  for (let i = 0; i < frames; i++) {
    await act(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    });
  }
}

function sandbox(): Record<string, unknown> {
  return JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
}

function seedReadableEnvelope(extra: Record<string, unknown> = {}) {
  localStorage.setItem(
    REFACTOR_STORAGE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      kind: "doliguo-refactor-sandbox",
      wordSession: { version: 1, ids: ["L01-V01"], index: 3 },
      wordSessions: { "daily-scenes-v7": { version: 1, ids: ["x"], index: 1, groupId: "daily-scenes-v7" } },
      wordLibrarySessions: {
        "depth-nov16-sweater": {
          version: 1,
          ids: ["depth-nov16-sweater"],
          index: 0,
          cardId: "depth-nov16-sweater",
        },
      },
      ...extra,
    }),
  );
  localStorage.setItem(JUBAN, "fictional-do-not-touch");
  localStorage.setItem(REVIEW_KEY, "fictional-review");
}

function siblingUntouched(raw: Record<string, unknown>) {
  expect((raw.wordSession as { index: number }).index).toBe(3);
  expect((raw.wordSessions as Record<string, { index: number }>)["daily-scenes-v7"].index).toBe(1);
  expect(
    (raw.wordLibrarySessions as Record<string, { cardId: string }>)["depth-nov16-sweater"].cardId,
  ).toBe("depth-nov16-sweater");
  expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");
  expect(localStorage.getItem(REVIEW_KEY)).toBe("fictional-review");
}

function Harness({
  kind,
  startId,
  tickRef,
}: {
  kind: "scene" | "reading";
  startId: string;
  tickRef: { current?: () => void };
}) {
  const [, setTick] = useState(0);
  tickRef.current = () => setTick((value) => value + 1);
  return <TextLearningView kind={kind} startId={startId} onBack={() => undefined} />;
}

async function openReading(startId: string) {
  const tickRef: { current?: () => void } = {};
  act(() => {
    root.render(<Harness kind="reading" startId={startId} tickRef={tickRef} />);
  });
  await settle();
  return {
    rerenderParent() {
      act(() => tickRef.current?.());
    },
  };
}

describe("initial visibility progress after restore", () => {
  it("writes lunch continue-reading after restore with no scroll when the article is fully visible", async () => {
    seedReadableEnvelope();
    await openReading(LUNCH);
    const raw = sandbox();
    expect(raw.lastReadingId).toBe(LUNCH);
    expect((raw.readings as Record<string, { unitId: string }>)[LUNCH].unitId).toBe(LUNCH_LAST);
    expect((raw.readings as Record<string, { source: string }>)[LUNCH].source).toBe("visibility");
    expect(raw).not.toMatchObject({ lastSceneId: expect.anything() });
    siblingUntouched(raw);
    expect(host.textContent).not.toMatch(/掌握|已完成/);
  });

  it("keeps a restored mid-article and p6 position without rolling back or advancing on the first visible layout", async () => {
    seedReadableEnvelope({
      lastReadingId: "reading-shops-afternoon",
      readings: {
        "reading-shops-afternoon": {
          kind: "reading",
          id: "reading-shops-afternoon",
          unitId: "p-keep",
          updatedAt: 5,
        },
        [APARTMENT]: {
          kind: "reading",
          id: APARTMENT,
          unitId: APARTMENT_P3,
          updatedAt: 8,
        },
      },
    });
    await openReading(APARTMENT);
    const raw = sandbox();
    expect((raw.readings as Record<string, { unitId: string }>)[APARTMENT].unitId).toBe(APARTMENT_P3);
    expect(raw.lastReadingId).toBe(APARTMENT);
    expect((raw.readings as Record<string, { unitId: string }>)["reading-shops-afternoon"].unitId).toBe("p-keep");
    siblingUntouched(raw);

    act(() => root.unmount());
    host.remove();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    seedReadableEnvelope({
      lastReadingId: LUNCH,
      readings: {
        [APARTMENT]: {
          kind: "reading",
          id: APARTMENT,
          unitId: APARTMENT_P6,
          updatedAt: 9,
        },
      },
    });
    await openReading(APARTMENT);
    const restored = sandbox();
    expect((restored.readings as Record<string, { unitId: string }>)[APARTMENT].unitId).toBe(APARTMENT_P6);
    expect(restored.lastReadingId).toBe(APARTMENT);
  });

  it("switches articles without rewriting the previous reading unit or word queues", async () => {
    seedReadableEnvelope({
      lastReadingId: APARTMENT,
      readings: {
        [APARTMENT]: {
          kind: "reading",
          id: APARTMENT,
          unitId: APARTMENT_P6,
          updatedAt: 9,
        },
      },
    });
    await openReading(LUNCH);
    const raw = sandbox();
    expect(raw.lastReadingId).toBe(LUNCH);
    expect((raw.readings as Record<string, { unitId: string }>)[LUNCH].unitId).toBe(LUNCH_LAST);
    expect((raw.readings as Record<string, { unitId: string }>)[APARTMENT].unitId).toBe(APARTMENT_P6);
    siblingUntouched(raw);
  });

  it("does not overwrite a corrupt envelope and does not loop writes when the parent re-renders", async () => {
    localStorage.setItem(REFACTOR_STORAGE_KEY, "{not-json");
    localStorage.setItem(JUBAN, "fictional-do-not-touch");
    const opened = await openReading(LUNCH);
    expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe("{not-json");
    expect(host.querySelector("[role='alert']")?.textContent).toMatch(/无法读取/);
    expect(localStorage.getItem(JUBAN)).toBe("fictional-do-not-touch");

    seedReadableEnvelope();
    act(() => root.unmount());
    host.remove();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    const again = await openReading(LUNCH);
    const afterOpen = sandboxWrites;
    again.rerenderParent();
    await settle(3);
    expect(sandboxWrites).toBe(afterOpen);
    expect(sandbox().lastReadingId).toBe(LUNCH);
  });

  it("uses the same initial-visibility path for a fully visible scene without adding a new flow", async () => {
    const scene = loadLearningCatalog().scenes[0];
    expect(scene.lines.length).toBeGreaterThan(0);
    seedReadableEnvelope();
    act(() => {
      root.render(<TextLearningView kind="scene" startId={scene.id} onBack={() => undefined} />);
    });
    await settle();
    const raw = sandbox();
    expect(raw.lastSceneId).toBe(scene.id);
    expect((raw.scenes as Record<string, { unitId: string }>)[scene.id].unitId).toBe(
      scene.lines[scene.lines.length - 1].id,
    );
    expect(raw.lastReadingId).toBeUndefined();
    siblingUntouched(raw);
  });
});
