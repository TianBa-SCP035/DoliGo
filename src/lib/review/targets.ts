import type { CardId, ReviewEncounter, ReviewSentence } from './types';

export function isPerSentenceBinding(encounter: Pick<ReviewEncounter, 'targetBinding'>): boolean {
  return encounter.targetBinding === 'per-sentence' || encounter.targetBinding === 'per-example';
}

/**
 * Resolve the target card ids for one sentence.
 * Prefer `sentences[i].targetCardIds`. Never apply encounter-level
 * `targetCardIds` to every sentence when binding is per-sentence.
 */
export function sentenceTargetCardIds(
  encounter: Pick<ReviewEncounter, 'sentences' | 'targetCardIds' | 'targetBinding'>,
  sentenceIndex: number,
): CardId[] {
  const sentence: ReviewSentence | undefined = encounter.sentences[sentenceIndex];
  if (!sentence) return [];
  if (Array.isArray(sentence.targetCardIds)) {
    return [...sentence.targetCardIds];
  }
  if (isPerSentenceBinding(encounter)) {
    return [];
  }
  return [...(encounter.targetCardIds ?? [])];
}

export type ExampleWithTargets = {
  targetCardIds?: CardId[];
};

/**
 * Same rule for the v4.1 patch: prefer `examples[i].targetCardIds`.
 * Do not use `taughtReference` or the `taughtReferences` union for every example.
 */
export function exampleTargetCardIds<T extends ExampleWithTargets>(
  item: { examples: T[]; taughtReference?: CardId; taughtReferences?: CardId[]; targetBinding?: string },
  exampleIndex: number,
): CardId[] {
  const example = item.examples[exampleIndex];
  if (!example) return [];
  if (Array.isArray(example.targetCardIds)) {
    return [...example.targetCardIds];
  }
  if (item.targetBinding === 'per-example' || item.targetBinding === 'per-sentence') {
    return [];
  }
  if (Array.isArray(item.taughtReferences) && item.taughtReferences.length > 0) {
    // Still a union — callers must not use this when binding is per-example.
    return [...item.taughtReferences];
  }
  return item.taughtReference ? [item.taughtReference] : [];
}
