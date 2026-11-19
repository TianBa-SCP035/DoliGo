import { describe, expect, it } from 'vitest';
import {
  NEW_READING_V3_CARD_IDS,
  NEW_READING_V4_CARD_IDS,
  NEW_READING_V5_CARD_IDS,
  NEW_READING_V6_CARD_IDS,
  NEW_SCENE_CARD_IDS,
  NEW_SCENE_V4_CARD_IDS,
  NEW_SCENE_V5_CARD_IDS,
  NEW_SCENE_V6_CARD_IDS,
  NEW_SCENE_V7_CARD_IDS,
  REVIEW_SESSION_KEY,
  REVIEW_UNIT_ID_PREFIX,
  VOCAB_EXTENSION_PACK_IDS,
  VOCAB_SOURCE_PACK_IDS,
  getCard,
  isDefaultVocabQueueCard,
  loadReviewCatalog,
  loadVocabCatalog,
  resolveCardId,
} from '../../src/lib/review';

const REVIEW_ENCOUNTER_IDS = [
  'v4-transfer-01',
  'v4-transfer-02',
  'v4-transfer-03',
  'v4-transfer-04',
  'v4-transfer-05',
  'v4-transfer-06',
  'v4-transfer-07',
  'v4-transfer-08',
  'v4-transfer-09',
  'v4-transfer-10',
  'v4-transfer-11',
  'v4-transfer-12',
  'v4-transfer-13',
  'v4-transfer-14',
  'v4-transfer-15',
  'v4-transfer-16',
  'rv-cross-L01-P01',
  'rv-cross-L04-P01',
  'rv-cross-L06-V01',
  'rv-cross-L06-V03',
  'rv-cross-L06-V04',
  'rv-cross-L06-P04',
  'rv-cross-L07-V10',
  'rv-cross-l15-w-minute',
  'rv-new-01',
  'rv-new-02',
  'rv-new-03',
  'rv-new-04',
  'rv-new-05',
  'rv-new-06',
  'rv-new-07',
  'rv-new-08',
  'rv-new-09',
  'rv-new-10',
  'rv-new-11',
  'rv-new-12',
] as const;

const OPTIONAL_NEW_CARD_ID = 'sc6-something-else-like-it';

describe('independent vocab catalog (v3 cards)', () => {
  it('keeps the 273 review cards, 36 encounter ids and order, and the session key', () => {
    const review = loadReviewCatalog();
    expect(review.cards).toHaveLength(273);
    expect(review.reviewPack.reviewEncounters.map((item) => item.id)).toEqual([...REVIEW_ENCOUNTER_IDS]);
    expect(REVIEW_SESSION_KEY).toBe('doliguo:refactor:sandbox:review-session:v1');
    expect(REVIEW_UNIT_ID_PREFIX).toBe('independent-vocab-review-pack-v1');
    expect(resolveCardId(review.cardIndex, 'L07-P02')).toBe('L01-P01');
    for (const cardId of NEW_SCENE_CARD_IDS) {
      expect(getCard(review.cardIndex, cardId), cardId).toBeUndefined();
    }
  });

  it('does not insert the eight new cards into the review encounter list', () => {
    const review = loadReviewCatalog();
    const encounterIds = review.reviewPack.reviewEncounters.map((item) => item.id);
    const mentioned = new Set<string>();
    for (const encounter of review.reviewPack.reviewEncounters) {
      for (const cardId of encounter.targetCardIds ?? []) mentioned.add(cardId);
      for (const sentence of encounter.sentences ?? []) {
        for (const cardId of sentence.targetCardIds ?? []) mentioned.add(cardId);
      }
    }
    expect(encounterIds.some((id) => id.startsWith('sc5-') || id.startsWith('sc6-'))).toBe(false);
    for (const cardId of NEW_SCENE_CARD_IDS) {
      expect(mentioned.has(cardId), cardId).toBe(false);
    }
    expect(encounterIds).toEqual([...REVIEW_ENCOUNTER_IDS]);
  });

  it('resolves 273 existing cards plus the eight new standalone study cards', () => {
    const vocab = loadVocabCatalog();
    const review = loadReviewCatalog();
    expect(vocab.sourcePackIds).toEqual([...VOCAB_SOURCE_PACK_IDS]);
    expect(vocab.cards).toHaveLength(273 + NEW_SCENE_CARD_IDS.length + NEW_SCENE_V4_CARD_IDS.length + NEW_READING_V3_CARD_IDS.length + NEW_SCENE_V5_CARD_IDS.length + NEW_READING_V4_CARD_IDS.length + NEW_SCENE_V6_CARD_IDS.length + NEW_READING_V5_CARD_IDS.length + NEW_SCENE_V7_CARD_IDS.length + NEW_READING_V6_CARD_IDS.length + 30 + 91);
    expect(vocab.cards.slice(0, 273).map((card) => card.id)).toEqual(review.cards.map((card) => card.id));
    expect(new Set(vocab.cards.map((card) => card.id)).size).toBe(vocab.cards.length);
    expect(vocab.supplementalCards.map((card) => card.id)).toEqual([...NEW_SCENE_CARD_IDS]);
    expect(vocab.extensionCards.map((card) => card.id)).toEqual([...NEW_SCENE_V4_CARD_IDS, ...NEW_READING_V3_CARD_IDS, ...NEW_SCENE_V5_CARD_IDS, ...NEW_READING_V4_CARD_IDS, ...NEW_SCENE_V6_CARD_IDS, ...NEW_READING_V5_CARD_IDS, ...NEW_SCENE_V7_CARD_IDS, ...NEW_READING_V6_CARD_IDS]);
    expect(vocab.extensionSourcePackIds).toEqual([...VOCAB_EXTENSION_PACK_IDS]);
    expect(vocab.sourcePackIds).toEqual([...VOCAB_SOURCE_PACK_IDS]);
    expect(getCard(vocab.cardIndex, 'L01-V01')?.headword).toBe('tired');
    expect(getCard(vocab.cardIndex, 'L07-P02')?.id).toBe('L01-P01');
    for (const cardId of NEW_SCENE_CARD_IDS) {
      const card = getCard(vocab.cardIndex, cardId);
      expect(card, cardId).toBeDefined();
      expect(card?.id).toBe(cardId);
      expect(card?.standalone).toBe(true);
      expect(card?.senseZh?.trim().length).toBeGreaterThan(0);
      expect(card?.exampleEn?.trim().length).toBeGreaterThan(0);
      expect(card?.exampleZh?.trim().length).toBeGreaterThan(0);
      expect(card?.transferEn?.trim().length).toBeGreaterThan(0);
      expect(card?.transferZh?.trim().length).toBeGreaterThan(0);
      expect(card?.sourcePack).toBe('everyday-scenes-pack-v3');
      expect(vocab.studyCards.some((item) => item.id === cardId)).toBe(true);
    }
  });

  it('keeps optional new cards out of the default queue but still studyable', () => {
    const vocab = loadVocabCatalog();
    const optional = getCard(vocab.cardIndex, OPTIONAL_NEW_CARD_ID);
    expect(optional?.priority).toBe('optional');
    expect(isDefaultVocabQueueCard(optional!)).toBe(false);
    expect(vocab.defaultQueueCards.some((card) => card.id === OPTIONAL_NEW_CARD_ID)).toBe(false);
    const primaryNew = NEW_SCENE_CARD_IDS.filter((id) => id !== OPTIONAL_NEW_CARD_ID);
    expect(primaryNew).toHaveLength(7);
    for (const cardId of primaryNew) {
      expect(vocab.defaultQueueCards.some((card) => card.id === cardId), cardId).toBe(true);
    }
  });
});
