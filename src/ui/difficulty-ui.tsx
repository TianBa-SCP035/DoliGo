import React from "react";
export const DIFFICULTY_TIERS = [
  "foundational",
  "everyday",
  "advanced",
] as const;

export type DifficultyTier = (typeof DIFFICULTY_TIERS)[number];

export const DIFFICULTY_TIER_ZH: Record<DifficultyTier, "基础" | "常用" | "进阶"> = {
  foundational: "基础",
  everyday: "常用",
  advanced: "进阶",
};

export type DifficultyMark = {
  tier: DifficultyTier;
  tierZh?: "基础" | "常用" | "进阶";
};

export function isDifficultyTier(value: unknown): value is DifficultyTier {
  return (
    value === "foundational" || value === "everyday" || value === "advanced"
  );
}

export function difficultyLabel(
  mark?: DifficultyMark | null,
): "基础" | "常用" | "进阶" | undefined {
  if (!mark || !isDifficultyTier(mark.tier)) return undefined;
  return mark.tierZh ?? DIFFICULTY_TIER_ZH[mark.tier];
}

export function DifficultyBadge({
  difficulty,
}: {
  difficulty?: DifficultyMark | null;
}) {
  const label = difficultyLabel(difficulty);
  if (!label) return null;
  return <span className="doli-topic-related-kind">{label}</span>;
}
