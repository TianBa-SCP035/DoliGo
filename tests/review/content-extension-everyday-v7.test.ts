import { describe, expect, it } from 'vitest';
import { CONTENT_PACKS } from '../../src/content/manifest';
import {
  CONTENT_CARD_GROUPS,
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
  findReading,
  findScene,
  getCard,
  loadLearningCatalog,
  loadReviewCatalog,
  loadVocabCatalog,
  spanSurfaceMatches,
} from '../../src/lib/review';

const CJK = /[\u3400-\u9fff\u3040-\u30ff\uf900-\ufaff]/;

describe('everyday increment scenes v7 and readings v6', () => {
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
    expect([...NEW_SCENE_V6_CARD_IDS]).toEqual([
      'sc11-package',
      'sc11-courier',
      'sc11-locker',
      'sc11-leave-it',
      'sc12-isnt-what-i-ordered',
      'sc12-make-it-again',
      'sc12-keep-it',
    ]);
    expect([...NEW_READING_V5_CARD_IDS]).toEqual(['rd5-left-behind', 'rd5-charger']);
    expect(vocab.supplementalCards.map((card) => card.id)).toEqual([...NEW_SCENE_CARD_IDS]);
    expect(CONTENT_CARD_GROUPS.scenesV6.cardIds).toEqual(NEW_SCENE_V6_CARD_IDS);
    expect(CONTENT_CARD_GROUPS.readingV5.cardIds).toEqual(NEW_READING_V5_CARD_IDS);
    expect(CONTENT_CARD_GROUPS.scenesV7.cardIds).toEqual(NEW_SCENE_V7_CARD_IDS);
    expect(CONTENT_CARD_GROUPS.readingV6.cardIds).toEqual(NEW_READING_V6_CARD_IDS);
  });

  it('appends the new increment after existing game, work, and earlier everyday documents', () => {
    expect(learning.scenes.map((scene) => scene.id)).toEqual([
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
      'scene-have-the-receipt',
      'scene-ill-be-right-down',
      'scene-have-the-receipt-extension-1',
      'scene-change-dinner-time-extension-1',
      'scene-voice-keeps-cutting-extension-1',
    ]);
    expect(learning.readings.map((item) => item.id)).toEqual([
      'reading-shops-afternoon',
      'reading-lunch-later',
      'reading-weekend-plans-change',
      'reading-right-floor',
      'reading-picnic-in-the-rain',
      'reading-missed-my-stop',
      'reading-left-my-charger',
      'reading-neighbor-kept-the-box',
      'reading-elevator-is-out',
      'reading-had-to-reschedule',
      'reading-arriving-new-city',
      'reading-library-basics', 'reading-weather-everyday', 'reading-laundry-while-traveling',
      'reading-apartment-life-depth', 'reading-clothes-for-everyday-depth', 'reading-choosing-restaurant-depth',
    ]);
    expect(learning.readingPack.id).toBe('everyday-reading-pack-v2.1');
    expect(learning.readingPack.readings).toHaveLength(2);
    expect(findScene(learning, 'scene-can-you-still-make-it')).toBeUndefined();
    expect(findScene(learning, 'scene-have-the-receipt')?.titleEn).toBe('Do You Have the Receipt.');
    expect(findScene(learning, 'scene-ill-be-right-down')?.titleEn).toBe("I'll Be Right Down.");
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
    expect(findScene(learning, 'scene-have-the-receipt')?.lineCount).toBe(16);
    expect(findScene(learning, 'scene-have-the-receipt')?.spokenWordCount).toBe(143);
    expect(findScene(learning, 'scene-ill-be-right-down')?.lineCount).toBe(16);
    expect(findScene(learning, 'scene-ill-be-right-down')?.spokenWordCount).toBe(133);
    expect(findReading(learning, 'reading-elevator-is-out')?.wordCount).toBe(308);
    expect(findReading(learning, 'reading-had-to-reschedule')?.wordCount).toBe(424);
    expect(findReading(learning, 'reading-elevator-is-out')?.paragraphs).toHaveLength(10);
    expect(findReading(learning, 'reading-had-to-reschedule')?.paragraphs).toHaveLength(11);
  });

  it('keeps every span unique, non-overlapping, and equal to a unicode end-exclusive slice', () => {
    const ids = learning.anchorsPack.units.map((unit) => unit.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.slice(0, 122)).toEqual(review.anchorsPack.units.map((unit) => unit.id));
    expect(learning.anchorsPack.units).toHaveLength(366);
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
    const newIds = [...NEW_SCENE_V7_CARD_IDS, ...NEW_READING_V6_CARD_IDS];
    expect(vocab.extensionCards.map((card) => card.id).slice(-newIds.length)).toEqual(newIds);
    expect(NEW_SCENE_V7_CARD_IDS).toHaveLength(6);
    expect(NEW_READING_V6_CARD_IDS).toHaveLength(3);
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
    expect(ids).toContain('everyday-scenes-pack-v6');
    expect(ids).toContain('everyday-reading-pack-v5');
    expect(ids).toContain('everyday-scenes-pack-v7');
    expect(ids).toContain('everyday-reading-pack-v6');
    expect(ids).toContain('content-text-anchors-scenes-v7');
    expect(ids).toContain('content-text-anchors-reading-v6');
    expect(ids).not.toContain('everyday-scenes-pack-v2');
  });
});
