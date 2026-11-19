import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CONTENT_PACKS } from '../../src/content/manifest';
import {
  buildReviewEncounterView,
  getCard,
  getReviewEncounter,
  loadReviewCatalog,
  resolveCardId,
} from '../../src/lib/review';

const contentDir = join(dirname(fileURLToPath(import.meta.url)), '../../src/content');

describe('v1.1 content fixtures in src/content', () => {
  it('keeps the published SHA-256 for every staged pack', () => {
    for (const pack of CONTENT_PACKS) {
      const bytes = readFileSync(join(contentDir, pack.file));
      const digest = createHash('sha256').update(bytes).digest('hex');
      expect(digest, pack.file).toBe(pack.sha256);
    }
  });

  it('loads 273 cards and 36 review encounters', () => {
    const catalog = loadReviewCatalog();
    expect(catalog.reviewPack.id).toBe('independent-vocab-review-pack-v1.2');
    expect(catalog.anchorsPack.id).toBe('content-text-anchors-v1.1');
    expect(catalog.cards).toHaveLength(273);
    expect(catalog.reviewPack.reviewEncounters).toHaveLength(36);
    expect(catalog.anchorsPack.units).toHaveLength(122);
  });

  it('resolves merged alias ids to the canonical card', () => {
    const { cardIndex } = loadReviewCatalog();
    expect(resolveCardId(cardIndex, 'L07-P02')).toBe('L01-P01');
    expect(getCard(cardIndex, 'L07-P02')?.id).toBe('L01-P01');
    expect(getCard(cardIndex, 'L01-P01')?.headword).toBe('go home');
  });

  it('keeps last weekend on L08-V02 in both sentence targets and anchors', () => {
    const { reviewPack, anchorsPack } = loadReviewCatalog();
    const encounter = getReviewEncounter(reviewPack.reviewEncounters, 'v4-transfer-16');
    expect(encounter).toBeDefined();
    expect(encounter?.targetBinding).toBe('per-sentence');
    const view = buildReviewEncounterView(encounter!, anchorsPack.units);
    expect(view.sentences).toHaveLength(2);
    expect(view.sentences[0]).toMatchObject({
      en: 'The last bus is at ten.',
      unitId: 'independent-vocab-review-pack-v1::v4-transfer-16::s0',
      targetCardIds: ['l17-w-last'],
    });
    expect(view.sentences[1]).toMatchObject({
      en: 'I was home last weekend.',
      unitId: 'independent-vocab-review-pack-v1::v4-transfer-16::s1',
      targetCardIds: ['L08-V02'],
    });
    expect(view.unionTargetCardIds).toEqual(['l17-w-last', 'L08-V02']);
    expect(view.sentences[0].spans[0]?.cardId).toBe('l17-w-last');
    expect(view.sentences[1].spans[0]?.cardId).toBe('L08-V02');
    const weekendTap = view.sentences[1].segments.find((segment) => segment.type === 'tap');
    expect(weekendTap).toMatchObject({ type: 'tap', text: 'last', cardId: 'L08-V02' });
  });


  it('keeps wait aliases and does not repeat the waiting-for-the-bus card example', () => {
    const { cardIndex } = loadReviewCatalog();
    const wait = getCard(cardIndex, 'L06-V03');
    expect(wait?.aliasIds).toEqual(['L07-V04', 'L07-P04', 'reading-delivery-w03']);
    expect(getCard(cardIndex, 'L07-P04')?.id).toBe('L06-V03');
    const extras = wait?.extraExamples?.map((example) => example.en) ?? [];
    expect(extras).toEqual(["I'm waiting for the bus.", "Don't wait for me."]);
    expect(wait?.exampleEn).toBe('You can wait there.');
    expect(new Set(extras).size).toBe(extras.length);
  });

  it('does not keep a duplicate waiting-for-the-bus sentence or s2 unit', () => {
    const { reviewPack, anchorsPack } = loadReviewCatalog();
    const encounter = getReviewEncounter(reviewPack.reviewEncounters, 'rv-cross-L06-V03');
    expect(encounter?.sentences).toHaveLength(2);
    expect(encounter?.sentences.map((sentence) => sentence.en)).toEqual([
      'You can wait there.',
      "I'm waiting for the bus.",
    ]);
    const units = anchorsPack.units.filter((unit) => unit.encounterId === 'rv-cross-L06-V03');
    expect(units.map((unit) => unit.id)).toEqual([
      'independent-vocab-review-pack-v1::rv-cross-L06-V03::s0',
      'independent-vocab-review-pack-v1::rv-cross-L06-V03::s1',
    ]);
    expect(
      anchorsPack.units.some((unit) => unit.id === 'independent-vocab-review-pack-v1::rv-cross-L06-V03::s2'),
    ).toBe(false);
    const view = buildReviewEncounterView(encounter!, anchorsPack.units);
    expect(view.sentences[0].spans[0]?.cardId).toBe('L06-V03');
    expect(view.sentences[1].spans[0]).toMatchObject({ cardId: 'L06-V03', surface: 'waiting' });
  });
});
