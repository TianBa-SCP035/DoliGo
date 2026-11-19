import React from "react";
import { type DifficultyMark } from "./difficulty-ui";

export type SceneDifficultyItem = {
  id: string;
  title: string;
  route: string;
  kind: "words" | "scene" | "reading";
  difficulty?: DifficultyMark;
};

const KIND_LABEL = {
  words: "词",
  scene: "对话",
  reading: "文章",
} as const;

/**
 * Optional same-scene links at foundational / everyday / advanced tiers.
 * All tiers are listed together. There is no filter bar.
 */
export function SceneDifficultyLinks({
  items,
  onOpen,
}: {
  sceneTitle?: string;
  items?: readonly SceneDifficultyItem[] | null;
  onOpen?: (route: string) => void;
}) {
  const visible = (items ?? []).filter((item) => item.route);
  if (!visible.length) return null;
  const heading = "同一场景";

  return (
    <nav className="doli-scene-difficulty" aria-label={heading}>
      <p className="doli-topic-related-heading">{heading}</p>
      <ul className="doli-topic-related-list">
        {visible.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="doli-text-button"
              onClick={() => onOpen?.(item.route)}
            >
              <span className="doli-topic-related-kind">
                {KIND_LABEL[item.kind]}
              </span>
              {item.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
