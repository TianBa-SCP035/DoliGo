import { useEffect, type Dispatch, type SetStateAction } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  REFACTOR_STORAGE_KEY,
  useReadingProgress,
  type UseReadingProgressResult,
} from "../../src/lib/progress";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function Probe({
  onApi,
}: {
  onApi: Dispatch<SetStateAction<UseReadingProgressResult | undefined>>;
}) {
  const api = useReadingProgress({
    kind: "reading",
    id: "reading-apartment-life-depth",
  });
  useEffect(() => {
    onApi(api);
  }, [api, onApi]);
  return <p>{api.warning ?? ""}</p>;
}

function renderHook() {
  let api: UseReadingProgressResult | undefined;
  const setApi = (value: SetStateAction<UseReadingProgressResult | undefined>) => {
    api = typeof value === "function" ? value(api) : value;
  };
  act(() => {
    root.render(<Probe onApi={setApi} />);
  });
  expect(api).toBeTruthy();
  return {
    get api() {
      return api!;
    },
  };
}

describe("useReadingProgress corrupt and sibling protection", () => {
  it("does not overwrite an unreadable sandbox key when remember is called after restore", () => {
    localStorage.setItem(REFACTOR_STORAGE_KEY, "{not-json");
    localStorage.setItem("juban.user-data.v1", "fictional-do-not-touch");
    const hook = renderHook();
    expect(hook.api.warning).toMatch(/无法读取/);
    expect(hook.api.isRestoring).toBe(false);
    let accepted = true;
    act(() => {
      hook.api.completeRestore();
      accepted = hook.api.remember("p-1", "visibility");
    });
    expect(accepted).toBe(false);
    expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe("{not-json");
    expect(localStorage.getItem("juban.user-data.v1")).toBe("fictional-do-not-touch");
  });

  it("writes a reading position without replacing word or library sessions", () => {
    localStorage.setItem(
      REFACTOR_STORAGE_KEY,
      JSON.stringify({
        wordSession: { version: 1, ids: ["L01-V01"], index: 2 },
        wordLibrarySessions: {
          "depth-nov16-sweater": { version: 1, ids: ["depth-nov16-sweater"], index: 0, cardId: "depth-nov16-sweater" },
        },
      }),
    );
    localStorage.setItem("doliguo:refactor:sandbox:review-session:v1", "fictional-review");
    const hook = renderHook();
    expect(hook.api.warning).toBeUndefined();
    let accepted = false;
    act(() => {
      hook.api.completeRestore();
      accepted = hook.api.remember("p-3", "visibility");
    });
    expect(accepted).toBe(true);
    const stored = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    expect(stored.wordSession.index).toBe(2);
    expect(stored.wordLibrarySessions["depth-nov16-sweater"].cardId).toBe("depth-nov16-sweater");
    expect(stored.readings["reading-apartment-life-depth"].unitId).toBe("p-3");
    expect(localStorage.getItem("doliguo:refactor:sandbox:review-session:v1")).toBe("fictional-review");
  });
});
