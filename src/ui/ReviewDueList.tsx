import React, { useMemo } from "react";
import { type DifficultyMark } from "./difficulty-ui";
import { lookupDueTextRecallItems, openDueTextRoute } from "./due-text-recall-lookup";

export type DueReviewItem = {
  id: string;
  title: string;
  kind: "word" | "sentence" | "paragraph";
  dueAt: number;
  difficulty?: DifficultyMark;
  documentId?: string;
  route?: string;
};

function kindLabel(kind: DueReviewItem["kind"]): string {
  if (kind === "word") return "词";
  if (kind === "paragraph") return "段";
  return "句";
}

/**
 * Lists items already due under an Ebbinghaus-style schedule.
 * No interval settings page. Timing comes from earlier self-ratings.
 * When App only passes word cards, previously rated sentences and
 * paragraphs are looked up from the sandbox spacing store.
 */
export function ReviewDueList({
  items,
  textItems,
  now,
  onStart,
  onOpen,
}: {
  items?: readonly DueReviewItem[] | null;
  textItems?: readonly DueReviewItem[] | null;
  now?: number;
  onStart?: () => void;
  onOpen?: (item: DueReviewItem) => void;
}) {
  const passed = items ?? [];
  const lookedUp = useMemo(() => {
    if (textItems !== undefined) return textItems ?? [];
    return lookupDueTextRecallItems({ skipIds: passed.map((item) => item.id) });
  }, [passed, textItems]);
  const list = useMemo(() => {
    const seen = new Set(passed.map((item) => item.id));
    return [...passed, ...lookedUp.filter((item) => !seen.has(item.id))];
  }, [lookedUp, passed]);
  const clock = now ?? Date.now();
  const due = list.filter((item) => item.dueAt <= clock);
  const later = list.length - due.length;

  return (
    <section className="doli-review-due" aria-labelledby="review-due-title">
      <h1 id="review-due-title">现在可以复习</h1>
      {due.length === 0 ? (
        <p>
          这一会儿没有到期的词、句子或段落。
          {later > 0 ? `另外还有 ${later} 项会在之后出现。` : ""}
        </p>
      ) : (
        <>
          <p>
            有 {due.length} 项到期。
            {later > 0 ? `另外 ${later} 项还没到时间。` : ""}
          </p>
          <ul className="doli-review-due-list">
            {due.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="doli-text-button"
                  onClick={() => {
                    if (item.kind !== "word") openDueTextRoute(item);
                    onOpen?.(item);
                  }}
                >
                  <span className="doli-topic-related-kind">
                    {kindLabel(item.kind)}
                  </span>
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
          {onStart && (
            <button type="button" className="doli-primary" onClick={onStart}>
              开始复习
            </button>
          )}
        </>
      )}
    </section>
  );
}
