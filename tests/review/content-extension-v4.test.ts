import { describe, expect, it } from 'vitest';
import { CONTENT_PACKS } from '../../src/content/manifest';
import {
  CONTENT_CARD_GROUPS,
  NEW_READING_V3_CARD_IDS,
  NEW_SCENE_CARD_IDS,
  NEW_SCENE_V4_CARD_IDS,
  REVIEW_SESSION_KEY,
  REVIEW_UNIT_ID_PREFIX,
  findReading,
  findScene,
  getCard,
  loadLearningCatalog,
  loadReviewCatalog,
  loadVocabCatalog,
  spanSurfaceMatches,
} from '../../src/lib/review';

const CJK = /[\u3400-\u9fff\u3040-\u30ff\uf900-\ufaff]/;

describe('nov12 v4 scenes and v3 readings', () => {
  const learning = loadLearningCatalog();
  const review = loadReviewCatalog();
  const vocab = loadVocabCatalog();

  it('does not change review catalog size, encounter order, prefix, or session key', () => {
    expect(review.cards).toHaveLength(273);
    expect(review.reviewPack.reviewEncounters).toHaveLength(36);
    expect(review.reviewPack.reviewEncounters.map((item) => item.id)).toEqual(
      learning.review.reviewPack.reviewEncounters.map((item) => item.id),
    );
    expect(REVIEW_SESSION_KEY).toBe('doliguo:refactor:sandbox:review-session:v1');
    expect(REVIEW_UNIT_ID_PREFIX).toBe('independent-vocab-review-pack-v1');
    expect(review.anchorsPack.units).toHaveLength(122);
  });

  it('keeps all previous scene and reading ids and appends the new ones', () => {
    expect(learning.scenes.map((scene) => scene.id).slice(0, 6)).toEqual([
      'scene-one-more-round',
      'scene-page-wont-load',
      'scene-change-dinner-time',
      'scene-store-out-of-stock',
      'scene-voice-keeps-cutting',
      'scene-try-it-again',
    ]);
    expect(learning.scenes.map((scene) => scene.id)).toContain('scene-next-bus-delayed');
    expect(learning.readings.map((item) => item.id).slice(0, 4)).toEqual([
      'reading-shops-afternoon',
      'reading-lunch-later',
      'reading-weekend-plans-change',
      'reading-right-floor',
    ]);
    expect(learning.readingPack.id).toBe('everyday-reading-pack-v2.1');
    expect(learning.readingPack.readings).toHaveLength(2);
    expect(findScene(learning, 'scene-can-you-still-make-it')).toBeUndefined();
  });

  it('fills the fields the learning pages already consume', () => {
    for (const scene of learning.scenes) {
      expect(scene.title.trim()).not.toHaveLength(0);
      expect(scene.titleEn.trim()).not.toHaveLength(0);
      expect(scene.levelSuggestionZh.trim()).not.toHaveLength(0);
      expect(scene.settingZh.trim()).not.toHaveLength(0);
      expect(scene.lines.length).toBeGreaterThan(0);
      for (const line of scene.lines) {
        expect(line.id).toMatch(new RegExp(`^${scene.id}-l\\d+$`));
        expect(line.en.trim()).not.toHaveLength(0);
        expect(CJK.test(line.zh)).toBe(true);
      }
    }
    for (const reading of learning.readings) {
      expect(reading.title.trim()).not.toHaveLength(0);
      expect(reading.titleEn.trim()).not.toHaveLength(0);
      expect(reading.levelSuggestionZh.trim()).not.toHaveLength(0);
      expect(reading.paragraphs.length).toBeGreaterThan(0);
      expect(reading.wordCount).toBeGreaterThan(0);
      for (const para of reading.paragraphs) {
        expect(para.id).toMatch(new RegExp(`^${reading.id}-p\\d+$`));
        expect(para.en.trim()).not.toHaveLength(0);
        expect(CJK.test(para.zh)).toBe(true);
      }
      for (const note of reading.notes) {
        expect(note.expression.trim()).not.toHaveLength(0);
        expect(CJK.test(note.meaningZh)).toBe(true);
      }
    }
    expect(findReading(learning, 'reading-weekend-plans-change')?.wordCount).toBe(295);
    expect(findReading(learning, 'reading-right-floor')?.wordCount).toBe(430);
    expect(findScene(learning, 'scene-voice-keeps-cutting')?.lineCount).toBe(16);
    expect(findScene(learning, 'scene-try-it-again')?.lineCount).toBe(17);
  });

  it('keeps every span unique, non-overlapping, and equal to a unicode end-exclusive slice', () => {
    const ids = learning.anchorsPack.units.map((unit) => unit.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.slice(0, 122)).toEqual(review.anchorsPack.units.map((unit) => unit.id));
    const cardIds = new Set(learning.cards.map((card) => card.id));
    for (const unit of learning.anchorsPack.units) {
      const points = Array.from(unit.textEn);
      let cursor = -1;
      const starts: number[] = [];
      for (const span of [...unit.spans].sort((a, b) => a.start - b.start)) {
        expect(span.start).toBeGreaterThanOrEqual(0);
        expect(span.end).toBeLessThanOrEqual(points.length);
        expect(span.start).toBeLessThan(span.end);
        expect(span.start).toBeGreaterThanOrEqual(cursor);
        expect(spanSurfaceMatches(unit.textEn, span), `${unit.id}:${span.surface}`).toBe(true);
        expect(cardIds.has(span.cardId) || getCard(learning.cardIndex, span.cardId), span.cardId).toBeTruthy();
        cursor = span.end;
        starts.push(span.start);
      }
      expect(new Set(starts).size).toBe(starts.length);
    }
  });

  it('resolves new cards in the vocab catalog without changing the original eight supplements', () => {
    expect(vocab.supplementalCards.map((card) => card.id)).toEqual([...NEW_SCENE_CARD_IDS]);
    expect(CONTENT_CARD_GROUPS.scenesV3.cardIds).toEqual(NEW_SCENE_CARD_IDS);
    const extensionIds = [...NEW_SCENE_V4_CARD_IDS, ...NEW_READING_V3_CARD_IDS];
    expect(vocab.extensionCards.map((card) => card.id).slice(0, extensionIds.length)).toEqual(extensionIds);
    for (const cardId of extensionIds) {
      const card = getCard(vocab.cardIndex, cardId);
      expect(card, cardId).toBeDefined();
      expect(getCard(review.cardIndex, cardId)).toBeUndefined();
      expect(card?.standalone).toBe(true);
      expect(card?.senseZh && CJK.test(card.senseZh)).toBe(true);
      expect(card?.exampleEn?.trim().length).toBeGreaterThan(0);
      expect(card?.exampleZh && CJK.test(card.exampleZh)).toBe(true);
      expect(card?.transferEn?.trim().length).toBeGreaterThan(0);
      expect(card?.transferZh && CJK.test(card.transferZh)).toBe(true);
      expect(card?.transferEn).not.toBe(card?.exampleEn);
    }
    const reviewMentions = new Set<string>();
    for (const encounter of review.reviewPack.reviewEncounters) {
      for (const cardId of encounter.targetCardIds ?? []) reviewMentions.add(cardId);
      for (const sentence of encounter.sentences ?? []) {
        for (const cardId of sentence.targetCardIds ?? []) reviewMentions.add(cardId);
      }
    }
    for (const cardId of extensionIds) {
      expect(reviewMentions.has(cardId), cardId).toBe(false);
    }
  });

  it('lists the new packs in the manifest without dropping older entries', () => {
    const ids = CONTENT_PACKS.map((pack) => pack.id);
    expect(ids.slice(0, 10)).toEqual([
      'independent-vocab-review-pack-v1.2',
      'independent-vocab-review-pack-v1.1',
      'content-text-anchors-v1.1',
      'english-foundation-8-lessons',
      'english-expansion-everyday-v4',
      'english-expansion-everyday-v4.1-patch',
      'everyday-scenes-pack-v1.1',
      'everyday-reading-pack-v2.1',
      'everyday-scenes-pack-v3',
      'content-text-anchors-scenes-v3',
    ]);
    expect(ids).toContain('everyday-scenes-pack-v4');
    expect(ids).toContain('everyday-reading-pack-v3');
    expect(ids).not.toContain('everyday-scenes-pack-v2');
  });
});
