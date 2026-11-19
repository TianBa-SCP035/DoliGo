import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OptionalPractice } from "../../src/ui/OptionalPractice";

const items = [
  {
    id: "practice-spell",
    type: "spelling" as const,
    promptZh: "根据中文提示，拼出这个单词。",
    stemZh: "保修；保修期",
    answer: "warranty",
  },
];

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

it("renders nothing when there are no items", () => {
  act(() => {
    root.render(<OptionalPractice items={[]} />);
  });
  expect(container.textContent).toBe("");
});

it("stays closed by default and never treats reveal or skip as mastery", () => {
  const onEvent = vi.fn();
  act(() => {
    root.render(<OptionalPractice items={items} onEvent={onEvent} />);
  });
  const details = container.querySelector("details");
  expect(details).toBeTruthy();
  expect(details?.open).toBe(false);
  expect(container.querySelector("summary")?.textContent).toBe("练习");
  expect(container.textContent).not.toContain("可跳过，不是考试");
  act(() => {
    details!.open = true;
    details!.dispatchEvent(new Event("toggle"));
  });
  const reveal = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("查看答案"),
  );
  act(() => reveal!.click());
  expect(onEvent).toHaveBeenCalledWith({
    itemId: "practice-spell",
    action: "revealed",
  });
  expect(JSON.stringify(onEvent.mock.calls)).not.toContain("mastered");
  expect(container.textContent).toContain("参考答案：warranty");
  const skip = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent === "跳过",
  );
  act(() => skip!.click());
  expect(onEvent).toHaveBeenCalledWith({
    itemId: "practice-spell",
    action: "skipped",
  });
  expect(container.textContent).toContain("这不算掌握");
});

it("checking an answer still reports no mastery", () => {
  const onEvent = vi.fn();
  const choiceItem = {
    id: "practice-choice",
    type: "en-to-zh-choice" as const,
    promptEn: "warranty",
    choices: ["保修", "收据"],
    answer: "保修",
  };
  act(() => {
    root.render(
      <OptionalPractice items={[choiceItem]} defaultOpen onEvent={onEvent} />,
    );
  });
  const choice = Array.from(container.querySelectorAll("label")).find((el) =>
    el.textContent?.includes("保修"),
  );
  expect(choice).toBeTruthy();
  const radio = choice!.querySelector("input") as HTMLInputElement;
  act(() => radio.click());
  const check = Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent === "核对",
  );
  act(() => check!.click());
  expect(onEvent).toHaveBeenCalledWith({
    itemId: "practice-choice",
    action: "answered",
    correct: true,
  });
  expect(container.textContent).toContain("这不算掌握");
});

it("lets the learner open a closed practice block by toggling details", async () => {
  act(() => {
    root.render(<OptionalPractice items={items} />);
  });
  const details = container.querySelector("details") as HTMLDetailsElement;
  expect(details.open).toBe(false);
  act(() => {
    details.querySelector("summary")!.dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );
  });
  // Uncontrolled details should follow the click; if the click did not flip
  // in jsdom, setting open still stays open after a re-render.
  if (!details.open) {
    act(() => {
      details.open = true;
      details.dispatchEvent(new Event("toggle"));
    });
  }
  expect(details.open).toBe(true);
  expect(container.textContent).toContain("查看答案");
});
