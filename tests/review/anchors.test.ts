import { describe, expect, it } from 'vitest';
import {
  cardIdAtCodePoint,
  reviewSentenceUnitId,
  segmentsForUnit,
  sliceByCodePoints,
  spanSurfaceMatches,
} from '../../src/lib/review';
import type { AnchorUnit } from '../../src/lib/review';

const lastBus: AnchorUnit = {
  id: 'independent-vocab-review-pack-v1::v4-transfer-16::s0',
  unitType: 'review-sentence',
  textEn: 'The last bus is at ten.',
  spans: [{ start: 4, end: 8, surface: 'last', cardId: 'l17-w-last', form: 'exact' }],
  encounterId: 'v4-transfer-16',
  sentenceIndex: 0,
};

const lastWeekend: AnchorUnit = {
  id: 'independent-vocab-review-pack-v1::v4-transfer-16::s1',
  unitType: 'review-sentence',
  textEn: 'I was home last weekend.',
  spans: [{ start: 11, end: 15, surface: 'last', cardId: 'L08-V02', form: 'exact' }],
  encounterId: 'v4-transfer-16',
  sentenceIndex: 1,
};

describe('review anchors', () => {
  it('keeps the v1 unit id prefix', () => {
    expect(reviewSentenceUnitId('v4-transfer-16', 1)).toBe(
      'independent-vocab-review-pack-v1::v4-transfer-16::s1',
    );
  });

  it('maps last in each sentence to the matching sense and validates offsets', () => {
    expect(spanSurfaceMatches(lastBus.textEn, lastBus.spans[0])).toBe(true);
    expect(spanSurfaceMatches(lastWeekend.textEn, lastWeekend.spans[0])).toBe(true);
    expect(sliceByCodePoints(lastWeekend.textEn, 11, 15)).toBe('last');
    expect(cardIdAtCodePoint(lastBus, 4)).toBe('l17-w-last');
    expect(cardIdAtCodePoint(lastWeekend, 11)).toBe('L08-V02');
    expect(cardIdAtCodePoint(lastWeekend, 0)).toBeUndefined();
  });

  it('splits a sentence into tappable segments without dropping surrounding text', () => {
    const segments = segmentsForUnit(lastWeekend);
    expect(segments).toEqual([
      { type: 'text', text: 'I was home ' },
      {
        type: 'tap',
        text: 'last',
        start: 11,
        end: 15,
        cardId: 'L08-V02',
        surface: 'last',
        form: 'exact',
        priority: undefined,
      },
      { type: 'text', text: ' weekend.' },
    ]);
  });
});
