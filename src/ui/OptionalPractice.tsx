import { useMemo, useState } from "react";

export const PRACTICE_TYPES = [
  "spelling",
  "en-to-zh-choice",
  "zh-to-en-choice",
  "completion",
  "multiple-choice",
  "cloze",
] as const;

export type PracticeType = (typeof PRACTICE_TYPES)[number];

export type OptionalPracticeItem = {
  id: string;
  type: PracticeType;
  promptZh?: string;
  promptEn?: string;
  stem?: string;
  stemZh?: string;
  choices?: string[];
  answer?: string;
  answers?: string[];
  acceptedAnswers?: string[];
  scoringNote?: string;
};

export type PracticeAction = "skipped" | "revealed" | "answered";

export type PracticeEvent = {
  itemId: string;
  action: PracticeAction;
  correct?: boolean;
};

const KIND_LABEL: Record<PracticeType, string> = {
  spelling: "拼写",
  "en-to-zh-choice": "英选中",
  "zh-to-en-choice": "中选英",
  completion: "补全",
  "multiple-choice": "选择题",
  cloze: "完形填空",
};

export function normalizePracticeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function practiceAnswers(item: OptionalPracticeItem): string[] {
  const raw = [
    ...(item.answers ?? []),
    ...(item.acceptedAnswers ?? []),
    ...(item.answer ? [item.answer] : []),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of raw) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = normalizePracticeAnswer(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function isAcceptedPracticeAnswer(
  item: OptionalPracticeItem,
  value: string,
): boolean {
  const got = normalizePracticeAnswer(value);
  return practiceAnswers(item).some(
    (answer) => normalizePracticeAnswer(answer) === got,
  );
}

export function OptionalPractice({
  items,
  title = "练习",
  defaultOpen = false,
  onEvent,
}: {
  items?: readonly OptionalPracticeItem[] | null;
  title?: string;
  defaultOpen?: boolean;
  onEvent?: (event: PracticeEvent) => void;
}) {
  const visible = (items ?? []).filter((item) =>
    (PRACTICE_TYPES as readonly string[]).includes(item.type),
  );
  const [open, setOpen] = useState(defaultOpen);
  if (!visible.length) return null;
  return (
    <details
      className="doli-practice"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary>{title}</summary>
      <ol className="doli-practice-list">
        {visible.map((item) => (
          <li key={item.id}>
            <PracticeQuestion item={item} onEvent={onEvent} />
          </li>
        ))}
      </ol>
    </details>
  );
}

function PracticeQuestion({
  item,
  onEvent,
}: {
  item: OptionalPracticeItem;
  onEvent?: (event: PracticeEvent) => void;
}) {
  const answers = useMemo(() => practiceAnswers(item), [item]);
  const isClozePassage = item.type === "cloze" && answers.length > 1;
  const [value, setValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [blankValues, setBlankValues] = useState<string[]>(() =>
    answers.map(() => ""),
  );
  const prompt = item.promptZh || item.promptEn || "";
  const stem = item.stemZh || item.stem;

  function emit(action: PracticeAction, submitted?: string) {
    if (action === "answered") {
      const correct = isClozePassage
        ? answers.every(
            (answer, index) =>
              normalizePracticeAnswer(answer) ===
              normalizePracticeAnswer(blankValues[index] || ""),
          )
        : isAcceptedPracticeAnswer(item, submitted ?? "");
      onEvent?.({ itemId: item.id, action, correct });
      return;
    }
    onEvent?.({ itemId: item.id, action });
  }

  function submit() {
    if (isClozePassage) {
      const correct = answers.every(
        (answer, index) =>
          normalizePracticeAnswer(answer) ===
          normalizePracticeAnswer(blankValues[index] || ""),
      );
      setChecked(correct);
      emit("answered");
      return;
    }
    const correct = isAcceptedPracticeAnswer(item, value);
    setChecked(correct);
    emit("answered", value);
  }

  return (
    <fieldset className="doli-practice-question" disabled={skipped}>
      <legend>
        <span className="doli-topic-related-kind">{KIND_LABEL[item.type]}</span>
        <span>{prompt}</span>
      </legend>
      {stem && <p className="doli-practice-stem">{stem}</p>}
      {isClozePassage ? (
        <div className="doli-practice-blanks">
          {answers.map((_, index) => (
            <label key={index}>
              空 {index + 1}
              <input
                value={blankValues[index] || ""}
                onChange={(event) =>
                  setBlankValues((cur) => {
                    const next = cur.slice();
                    next[index] = event.target.value;
                    return next;
                  })
                }
              />
            </label>
          ))}
        </div>
      ) : item.choices?.length ? (
        <div className="doli-practice-choices">
          {item.choices.map((choice) => (
            <label key={choice}>
              <input
                type="radio"
                name={item.id}
                value={choice}
                checked={value === choice}
                onChange={() => {
                  setValue(choice);
                  setChecked(null);
                }}
              />
              {choice}
            </label>
          ))}
        </div>
      ) : (
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setChecked(null);
          }}
          aria-label="回答"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      )}
      <div className="doli-practice-actions">
        <button type="button" className="doli-secondary" onClick={submit}>
          核对
        </button>
        <button
          type="button"
          className="doli-text-button"
          onClick={() => {
            setRevealed(true);
            emit("revealed");
          }}
        >
          查看答案
        </button>
        <button
          type="button"
          className="doli-text-button"
          onClick={() => {
            setSkipped(true);
            emit("skipped");
          }}
        >
          跳过
        </button>
      </div>
      {checked !== null && (
        <p className="doli-muted">
          {checked
            ? "和参考答案一致。这不算掌握。"
            : "和参考答案不一致，可以再改，或先看答案。这不算掌握。"}
        </p>
      )}
      {revealed && <p className="doli-practice-answer">参考答案：{answers.join(" / ")}</p>}
      {skipped && (
        <p className="doli-muted">已跳过。这不算掌握，也不影响继续学习。</p>
      )}
    </fieldset>
  );
}
