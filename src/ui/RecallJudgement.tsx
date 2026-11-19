import React from "react";
export const RECALL_RATINGS = ["forgotten", "vague", "remembered"] as const;
export type RecallRating = (typeof RECALL_RATINGS)[number];

export const RECALL_BUTTONS: {
  rating: RecallRating;
  label: string;
}[] = [
  { rating: "forgotten", label: "完全不记得" },
  { rating: "vague", label: "有点印象" },
  { rating: "remembered", label: "我记得" },
];

export type RecallJudgementProps = {
  onRate?: (rating: RecallRating) => void;
  onSkip?: () => void;
  disabled?: boolean;
  unitLabel?: string;
};

/**
 * The action that advances to the next word or sentence.
 * Do not place a separate “下一张” button in front of these three.
 * This component does not write storage or a mastery flag.
 */
export function RecallJudgement({
  onRate,
  onSkip,
  disabled,
  unitLabel = "下一张",
}: RecallJudgementProps) {
  return (
    <div className="doli-recall">
      <div className="doli-recall-buttons" role="group" aria-label="记忆判断">
        {RECALL_BUTTONS.map((button) => (
          <button
            key={button.rating}
            type="button"
            className={`doli-recall-${button.rating}`}
            disabled={disabled}
            onClick={() => onRate?.(button.rating)}
          >
            <strong>{button.label}</strong>
          </button>
        ))}
      </div>
      {onSkip && (
        <button
          type="button"
          className="doli-text-button"
          disabled={disabled}
          onClick={onSkip}
        >
          跳过，先看{unitLabel}
        </button>
      )}
    </div>
  );
}
