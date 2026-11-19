import { describe, expect, it } from 'vitest';
import { CONTENT_PACKS } from '../../src/content/manifest';
import {
  CONTENT_CARD_GROUPS,
  NEW_READING_V3_CARD_IDS,
  NEW_READING_V4_CARD_IDS,
  NEW_READING_V5_CARD_IDS,
  NEW_SCENE_CARD_IDS,
  NEW_SCENE_V4_CARD_IDS,
  NEW_SCENE_V5_CARD_IDS,
  NEW_SCENE_V6_CARD_IDS,
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

describe('everyday increment scenes v6 and readings v5', () => {
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

  it('keeps all previously published card-group identifiers unchanged', () => {
    expect([...NEW_SCENE_CARD_IDS]).toEqual([
      'sc5-something-came-up',
      'sc5-book-a-table',
      'sc5-be-full',
      'sc6-look-for',
      'sc6-out-of',
      'sc6-brand',
      'sc6-aisle',
      'sc6-something-else-like-it',
    ]);
    expect([...NEW_SCENE_V4_CARD_IDS]).toEqual([
      'sc7-barely-hear',
      'sc7-cutting-out',
      'sc8-show-up',
      'sc8-save',
    ]);
    expect([...NEW_READING_V3_CARD_IDS]).toEqual([
      'rd3-leave-out',
      'rd3-weekend-after-next',
      'rd3-take-care-of-it',
      'rd3-floor',
      'rd3-just-in-case',
      'rd3-reminder',
    ]);
    expect([...NEW_SCENE_V5_CARD_IDS]).toEqual([
      'sc9-be-delayed',
      'sc9-get-off',
      'sc9-on-the-way',
      'sc9-train',
      'sc10-around-the-corner',
    ]);
    expect([...NEW_READING_V4_CARD_IDS]).toEqual([
      'rd4-market',
      'rd4-picnic',
      'rd4-get-on',
      'rd4-closed',
    ]);
    expect(vocab.supplementalCards.map((card) => card.id)).toEqual([...NEW_SCENE_CARD_IDS]);
    expect(CONTENT_CARD_GROUPS.scenesV5.cardIds).toEqual(NEW_SCENE_V5_CARD_IDS);
    expect(CONTENT_CARD_GROUPS.readingV4.cardIds).toEqual(NEW_READING_V4_CARD_IDS);
    expect(CONTENT_CARD_GROUPS.scenesV6.cardIds).toEqual(NEW_SCENE_V6_CARD_IDS);
    expect(CONTENT_CARD_GROUPS.readingV5.cardIds).toEqual(NEW_READING_V5_CARD_IDS);
  });

  it('appends the new increment after existing game, work, and earlier everyday documents', () => {
    expect(learning.scenes.map((scene) => scene.id).slice(0, 10)).toEqual([
      'scene-one-more-round',
      'scene-page-wont-load',
      'scene-change-dinner-time',
      'scene-store-out-of-stock',
      'scene-voice-keeps-cutting',
      'scene-try-it-again',
      'scene-next-bus-delayed',
      'scene-restaurant-is-full',
      'scene-package-at-the-door',
      'scene-wrong-drink',
    ]);
    expect(learning.readings.map((item) => item.id).slice(0, 8)).toEqual([
      'reading-shops-afternoon',
      'reading-lunch-later',
      'reading-weekend-plans-change',
      'reading-right-floor',
      'reading-picnic-in-the-rain',
      'reading-missed-my-stop',
      'reading-left-my-charger',
      'reading-neighbor-kept-the-box',
    ]);
    expect(learning.readingPack.id).toBe('everyday-reading-pack-v2.1');
    expect(learning.readingPack.readings).toHaveLength(2);
    expect(findScene(learning, 'scene-can-you-still-make-it')).toBeUndefined();
    expect(findScene(learning, 'scene-voice-keeps-cutting')?.titleEn).toBe('I Can Barely Hear You');
    expect(findScene(learning, 'scene-try-it-again')?.titleEn).toBe('Can You Try It Again?');
    expect((learning as { themePath?: unknown; topicPath?: unknown }).themePath).toBeUndefined();
    expect((learning as { themePath?: unknown; topicPath?: unknown }).topicPath).toBeUndefined();
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
    }
    expect(findScene(learning, 'scene-package-at-the-door')?.lineCount).toBe(16);
    expect(findScene(learning, 'scene-wrong-drink')?.lineCount).toBe(17);
    expect(findReading(learning, 'reading-left-my-charger')?.wordCount).toBe(299);
    expect(findReading(learning, 'reading-neighbor-kept-the-box')?.wordCount).toBe(422);
    expect(findReading(learning, 'reading-left-my-charger')?.paragraphs).toHaveLength(10);
    expect(findReading(learning, 'reading-neighbor-kept-the-box')?.paragraphs).toHaveLength(11);
  });

  it('keeps every span unique, non-overlapping, and equal to a unicode end-exclusive slice', () => {
    const ids = learning.anchorsPack.units.map((unit) => unit.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.slice(0, 122)).toEqual(review.anchorsPack.units.map((unit) => unit.id));
    expect(learning.anchorsPack.units.length).toBeGreaterThanOrEqual(313);
    expect(ids.slice(0, 313)).toHaveLength(313);
    const cardIds = new Set(learning.cards.map((card) => card.id));
    for (const unit of learning.anchorsPack.units) {
      let cursor = -1;
      for (const span of [...unit.spans].sort((a, b) => a.start - b.start)) {
        expect(span.start).toBeGreaterThanOrEqual(0);
        expect(span.end).toBeLessThanOrEqual(Array.from(unit.textEn).length);
        expect(span.start).toBeLessThan(span.end);
        expect(span.start).toBeGreaterThanOrEqual(cursor);
        expect(spanSurfaceMatches(unit.textEn, span), `${unit.id}:${span.surface}`).toBe(true);
        expect(cardIds.has(span.cardId) || getCard(learning.cardIndex, span.cardId), span.cardId).toBeTruthy();
        cursor = span.end;
      }
    }
  });

  it('resolves the new increment cards without placing them in review encounters', () => {
    const newIds = [...NEW_SCENE_V6_CARD_IDS, ...NEW_READING_V5_CARD_IDS];
    expect(vocab.extensionCards.map((card) => card.id).slice(19, 19 + newIds.length)).toEqual(newIds);
    expect(NEW_SCENE_V6_CARD_IDS).toHaveLength(7);
    expect(NEW_READING_V5_CARD_IDS).toHaveLength(2);
    for (const cardId of newIds) {
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
    for (const cardId of newIds) {
      expect(reviewMentions.has(cardId), cardId).toBe(false);
    }
  });

  it('lists the new packs in the manifest without dropping older entries', () => {
    const ids = CONTENT_PACKS.map((pack) => pack.id);
    expect(ids).toContain('everyday-scenes-pack-v5');
    expect(ids).toContain('everyday-reading-pack-v4');
    expect(ids).toContain('everyday-scenes-pack-v6');
    expect(ids).toContain('everyday-reading-pack-v5');
    expect(ids).toContain('content-text-anchors-scenes-v6');
    expect(ids).toContain('content-text-anchors-reading-v5');
    expect(ids).not.toContain('everyday-scenes-pack-v2');
  });
});
