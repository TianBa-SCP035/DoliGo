import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RecallJudgement } from "../../src/ui/RecallJudgement";

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

it("shows the three judgement labels and advances only through them", () => {
  const onRate = vi.fn();
  const onSkip = vi.fn();
  act(() => {
    root.render(<RecallJudgement onRate={onRate} onSkip={onSkip} />);
  });
  expect(container.textContent).toContain("完全不记得");
  expect(container.textContent).toContain("有点印象");
  expect(container.textContent).toContain("我记得");
  expect(container.textContent).not.toContain("很快会再见到");
  expect(container.textContent).not.toContain("隔不久再看");
  expect(container.textContent).not.toContain("隔久一点再看");
  expect(container.textContent).not.toContain("这一项你觉得怎么样");
  expect(container.textContent).not.toContain("选一个就进入");
  expect(container.textContent).not.toContain("下一张按钮");
  expect(container.textContent).not.toContain("还要再看");
  click("有点印象");
  expect(onRate).toHaveBeenCalledTimes(1);
  expect(onRate).toHaveBeenCalledWith("vague");
  expect(onSkip).not.toHaveBeenCalled();
});

it("skip does not record a rating", () => {
  const onRate = vi.fn();
  const onSkip = vi.fn();
  act(() => {
    root.render(<RecallJudgement onRate={onRate} onSkip={onSkip} unitLabel="下一句" />);
  });
  click("跳过，先看下一句");
  expect(onSkip).toHaveBeenCalledTimes(1);
  expect(onRate).not.toHaveBeenCalled();
});
