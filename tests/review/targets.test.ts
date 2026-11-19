import { describe, expect, it } from 'vitest';
import { exampleTargetCardIds, sentenceTargetCardIds } from '../../src/lib/review';
import type { ReviewEncounter } from '../../src/lib/review';

const lastEncounter: ReviewEncounter = {
  id: 'v4-transfer-16',
  kind: 'v4-transfer',
  targetCardIds: ['l17-w-last', 'L08-V02'],
  targetBinding: 'per-sentence',
  sentences: [
    { en: 'The last bus is at ten.', zh: '末班公交车是十点。', targetCardIds: ['l17-w-last'] },
    { en: 'I was home last weekend.', zh: '我上周末在家。', targetCardIds: ['L08-V02'] },
  ],
};

describe('sentenceTargetCardIds', () => {
  it('reads per-sentence targets for last, and does not hang last weekend on the bus sense', () => {
    expect(sentenceTargetCardIds(lastEncounter, 0)).toEqual(['l17-w-last']);
    expect(sentenceTargetCardIds(lastEncounter, 1)).toEqual(['L08-V02']);
    expect(sentenceTargetCardIds(lastEncounter, 1)).not.toContain('l17-w-last');
  });

  it('does not fall back to the encounter union when binding is per-sentence', () => {
    const missingSentenceTargets: ReviewEncounter = {
      ...lastEncounter,
      sentences: [
        { en: 'The last bus is at ten.', zh: '末班公交车是十点。' },
        { en: 'I was home last weekend.', zh: '我上周末在家。' },
      ],
    };
    expect(sentenceTargetCardIds(missingSentenceTargets, 0)).toEqual([]);
    expect(sentenceTargetCardIds(missingSentenceTargets, 1)).toEqual([]);
  });

  it('falls back to encounter targets only when there is no per-sentence binding', () => {
    const shared: ReviewEncounter = {
      id: 'rv-cross-L06-V03',
      kind: 'cross-source',
      targetCardIds: ['L06-V03'],
      sentences: [
        { en: 'You can wait there.', zh: '你可以在那儿等。' },
        { en: "I'm waiting for the bus.", zh: '我在等公交车。' },
      ],
    };
    expect(sentenceTargetCardIds(shared, 0)).toEqual(['L06-V03']);
    expect(sentenceTargetCardIds(shared, 1)).toEqual(['L06-V03']);
  });

  it('returns an empty list for an out-of-range sentence', () => {
    expect(sentenceTargetCardIds(lastEncounter, 9)).toEqual([]);
  });
});

describe('exampleTargetCardIds', () => {
  it('uses example-level targets and ignores taughtReference for last weekend', () => {
    const patched = {
      taughtReference: 'l17-w-last' as const,
      taughtReferences: ['l17-w-last', 'L08-V02'],
      targetBinding: 'per-example',
      examples: [
        { en: 'The last bus is at ten.', targetCardIds: ['l17-w-last'] },
        { en: 'I was home last weekend.', targetCardIds: ['L08-V02'] },
      ],
    };
    expect(exampleTargetCardIds(patched, 0)).toEqual(['l17-w-last']);
    expect(exampleTargetCardIds(patched, 1)).toEqual(['L08-V02']);
    expect(exampleTargetCardIds(patched, 1)).not.toEqual(['l17-w-last']);
  });
});
