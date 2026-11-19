import { describe, expect, it } from 'vitest';
import { CONTENT_PACKS } from '../../src/content/manifest';
import {
  MERGED_ANCHORS_PACK_ID,
  NEW_SCENE_CARD_IDS,
  REVIEW_SESSION_KEY,
  REVIEW_UNIT_ID_PREFIX,
  UNWIRED_SCENE_PACK_IDS,
  WIRED_READING_PACK_ID,
  WIRED_SCENE_PACK_IDS,
  findReading,
  findScene,
  getCard,
  loadLearningCatalog,
  loadReviewCatalog,
  loadSceneCatalog,
  resolveCardId,
  spanSurfaceMatches,
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

const OLD_SCENE_IDS = ['scene-one-more-round', 'scene-page-wont-load'] as const;
const V3_SCENE_IDS = ['scene-change-dinner-time', 'scene-store-out-of-stock'] as const;
const V4_SCENE_IDS = ['scene-voice-keeps-cutting', 'scene-try-it-again'] as const;
const V5_SCENE_IDS = ['scene-next-bus-delayed', 'scene-restaurant-is-full'] as const;
const V6_SCENE_IDS = ['scene-package-at-the-door', 'scene-wrong-drink'] as const;
const READING_IDS = ['reading-shops-afternoon', 'reading-lunch-later'] as const;
const READING_V3_IDS = ['reading-weekend-plans-change', 'reading-right-floor'] as const;
const READING_V4_IDS = ['reading-picnic-in-the-rain', 'reading-missed-my-stop'] as const;
const READING_V5_IDS = ['reading-left-my-charger', 'reading-neighbor-kept-the-box'] as const;
const V7_SCENE_IDS = ['scene-have-the-receipt', 'scene-ill-be-right-down'] as const;
const READING_V6_IDS = ['reading-elevator-is-out', 'reading-had-to-reschedule'] as const;

describe('learning catalog v3 merge', () => {
  it('keeps every previously wired content entry in the manifest', () => {
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
    expect(ids).toEqual([
      ...ids.slice(0, 10),
      'everyday-scenes-pack-v4',
      'everyday-reading-pack-v3',
      'content-text-anchors-scenes-v4',
      'content-text-anchors-reading-v3',
      'everyday-scenes-pack-v5',
      'everyday-reading-pack-v4',
      'content-text-anchors-scenes-v5',
      'content-text-anchors-reading-v4',
      'everyday-scenes-pack-v6',
      'everyday-reading-pack-v5',
      'content-text-anchors-scenes-v6',
      'content-text-anchors-reading-v5',
      'everyday-scenes-pack-v7',
      'everyday-reading-pack-v6',
      'content-text-anchors-scenes-v7',
      'content-text-anchors-reading-v6',
      'sourced-reading-pack-wikivoyage-v1',
      'sourced-reading-pack-bulk-v1', 'bulk-vocab-ready-nov16',
      'bulk-vocab-depth-nov16', 'sourced-reading-pack-depth-v1', 'everyday-scenes-depth-nov16', 'topic-vocabulary-depth-nov16',
    ]);
    const scenesV11 = CONTENT_PACKS.find((pack) => pack.id === 'everyday-scenes-pack-v1.1');
    expect(scenesV11?.sha256).toBe('42bfeb3a9f46b30cab4dfa6e68a156d29d2007ee20a1edc006472195eae15190');
    expect(scenesV11?.role).toBe('scenes-source');
    expect((CONTENT_PACKS.map((pack) => pack.id) as string[]).includes('everyday-scenes-pack-v2')).toBe(false);
  });

  it('leaves loadReviewCatalog cards, encounters, anchors, aliases and session key unchanged', () => {
    const catalog = loadReviewCatalog();
    expect(catalog.reviewPack.id).toBe('independent-vocab-review-pack-v1.2');
    expect(catalog.anchorsPack.id).toBe('content-text-anchors-v1.1');
    expect(catalog.cards).toHaveLength(273);
    expect(catalog.reviewPack.reviewEncounters).toHaveLength(36);
    expect(catalog.reviewPack.reviewEncounters.map((item) => item.id)).toEqual([...REVIEW_ENCOUNTER_IDS]);
    expect(catalog.anchorsPack.units).toHaveLength(122);
    expect(REVIEW_UNIT_ID_PREFIX).toBe('independent-vocab-review-pack-v1');
    expect(REVIEW_SESSION_KEY).toBe('doliguo:refactor:sandbox:review-session:v1');
    expect(resolveCardId(catalog.cardIndex, 'L07-P02')).toBe('L01-P01');
    expect(getCard(catalog.cardIndex, 'L07-P04')?.id).toBe('L06-V03');
    for (const cardId of NEW_SCENE_CARD_IDS) {
      expect(getCard(catalog.cardIndex, cardId), cardId).toBeUndefined();
    }
  });

  it('does not change the review encounter list or order via the learning catalog review slice', () => {
    const review = loadReviewCatalog();
    const learning = loadLearningCatalog();
    expect(learning.review.reviewPack).toBe(review.reviewPack);
    expect(learning.review.reviewPack.reviewEncounters.map((item) => item.id)).toEqual(
      review.reviewPack.reviewEncounters.map((item) => item.id),
    );
    expect(learning.review.anchorsPack.units).toHaveLength(122);
    expect(learning.review.cards).toHaveLength(273);
  });

  it('locates the two previously wired scenes and the two new v3 scenes, without v2', () => {
    const learning = loadLearningCatalog();
    expect(learning.wiredScenePackIds).toEqual([...WIRED_SCENE_PACK_IDS]);
    expect(learning.unwiredScenePackIds).toEqual([...UNWIRED_SCENE_PACK_IDS]);
    expect(learning.scenes.map((scene) => scene.id)).toEqual([...OLD_SCENE_IDS, ...V3_SCENE_IDS, ...V4_SCENE_IDS, ...V5_SCENE_IDS, ...V6_SCENE_IDS, ...V7_SCENE_IDS, 'scene-have-the-receipt-extension-1', 'scene-change-dinner-time-extension-1', 'scene-voice-keeps-cutting-extension-1']);
    expect(findScene(learning, 'scene-change-dinner-time')?.titleEn).toBe('Can We Eat a Little Later?');
    expect(findScene(learning, 'scene-voice-keeps-cutting')?.titleEn).toBe('I Can Barely Hear You');
    expect(findScene(learning, 'scene-try-it-again')?.titleEn).toBe('Can You Try It Again?');
    expect(findScene(learning, 'scene-store-out-of-stock')?.titleEn).toBe("We're Out of That One");
    expect(findScene(learning, 'scene-one-more-round')?.lines.length).toBeGreaterThan(0);
    expect(findScene(learning, 'scene-can-you-still-make-it')).toBeUndefined();
    expect(findScene(learning, 'scene-are-we-still-going')).toBeUndefined();
    expect(loadSceneCatalog().scenes).toEqual(learning.scenes);
  });

  it('keeps the existing reading pack and documents locatable', () => {
    const learning = loadLearningCatalog();
    expect(learning.wiredReadingPackId).toBe(WIRED_READING_PACK_ID);
    expect(learning.readingPack.id).toBe('everyday-reading-pack-v2.1');
    expect(learning.readingPack.readings.map((item) => item.id)).toEqual([...READING_IDS]);
    expect(learning.readings.map((item) => item.id)).toEqual([...READING_IDS, ...READING_V3_IDS, ...READING_V4_IDS, ...READING_V5_IDS, ...READING_V6_IDS, 'reading-arriving-new-city', 'reading-library-basics', 'reading-weather-everyday', 'reading-laundry-while-traveling', 'reading-apartment-life-depth', 'reading-clothes-for-everyday-depth', 'reading-choosing-restaurant-depth']);
    expect(learning.wiredReadingPackIds).toEqual(['everyday-reading-pack-v2.1', 'everyday-reading-pack-v3', 'everyday-reading-pack-v4', 'everyday-reading-pack-v5', 'everyday-reading-pack-v6', 'sourced-reading-pack-wikivoyage-v1', 'sourced-reading-pack-bulk-v1', 'sourced-reading-pack-depth-v1']);
    expect(findReading(learning, 'reading-shops-afternoon')?.paragraphs.length).toBeGreaterThan(0);
    expect(findReading(learning, 'reading-lunch-later')?.paragraphs.length).toBeGreaterThan(0);
    expect(findReading(learning, 'reading-weekend-plans-change')?.titleEn).toBe('A Weekend Plan That Changed');
    expect(findReading(learning, 'reading-right-floor')?.titleEn).toBe('The Right Floor');
    expect(findReading(learning, 'reading-weekend-plans-change')?.wordCount).toBe(295);
    expect(findReading(learning, 'reading-right-floor')?.wordCount).toBe(430);
    expect(findReading(learning, 'reading-picnic-in-the-rain')?.titleEn).toBe('A Picnic Plan in the Rain');
    expect(findReading(learning, 'reading-missed-my-stop')?.titleEn).toBe('I Missed My Stop');
    expect(findReading(learning, 'reading-picnic-in-the-rain')?.wordCount).toBe(306);
    expect(findReading(learning, 'reading-missed-my-stop')?.wordCount).toBe(436);
    expect(findScene(learning, 'scene-next-bus-delayed')?.titleEn).toBe("When's the Next One?");
    expect(findScene(learning, 'scene-restaurant-is-full')?.titleEn).toBe("They're Full Right Now");
    expect(findScene(learning, 'scene-package-at-the-door')?.titleEn).toBe("It's at the Door.");
    expect(findScene(learning, 'scene-wrong-drink')?.titleEn).toBe("This Isn't What I Ordered.");
    expect(findReading(learning, 'reading-left-my-charger')?.titleEn).toBe('I Left My Charger.');
    expect(findReading(learning, 'reading-neighbor-kept-the-box')?.titleEn).toBe('The Neighbor Took the Box.');
    expect(findReading(learning, 'reading-left-my-charger')?.wordCount).toBe(299);
    expect(findReading(learning, 'reading-neighbor-kept-the-box')?.wordCount).toBe(422);
    expect(findScene(learning, 'scene-have-the-receipt')?.titleEn).toBe('Do You Have the Receipt.');
    expect(findScene(learning, 'scene-ill-be-right-down')?.titleEn).toBe("I'll Be Right Down.");
    expect(findReading(learning, 'reading-elevator-is-out')?.titleEn).toBe('The Elevator Is Out.');
    expect(findReading(learning, 'reading-had-to-reschedule')?.titleEn).toBe('I Had to Reschedule.');
    expect(findReading(learning, 'reading-elevator-is-out')?.wordCount).toBe(308);
    expect(findReading(learning, 'reading-had-to-reschedule')?.wordCount).toBe(424);
    expect(findReading(learning, 'reading-arriving-new-city')?.titleEn).toBe('Arriving in a New City');
    expect(findReading(learning, 'reading-arriving-new-city')?.wordCount).toBe(400);
    expect(findReading(learning, 'reading-arriving-new-city')?.paragraphs).toHaveLength(8);
    expect(findReading(learning, 'reading-arriving-new-city')?.source?.sourceType).toBe('external-adaptation');
    expect(findReading(learning, 'reading-arriving-new-city')?.source?.sourceOldid).toBe(5414939);
    expect(findReading(learning, 'reading-arriving-new-city')?.source?.sourceLicense).toBe('CC BY-SA 4.0');
    expect(findReading(learning, 'reading-arriving-new-city')?.sourceAttribution?.attributionEn).toContain('CC BY-SA 4.0');
    expect(findReading(learning, 'reading-arriving-new-city')?.sourceAttribution?.links.map((item) => item.href)).toEqual([
      'https://en.wikivoyage.org/wiki/Arriving_in_a_new_city',
      'https://en.wikivoyage.org/w/index.php?title=Arriving_in_a_new_city&oldid=5414939',
      'https://en.wikivoyage.org/w/index.php?title=Arriving_in_a_new_city&action=history',
      'https://creativecommons.org/licenses/by-sa/4.0/',
    ]);
    expect(findScene(learning, 'scene-voice-keeps-cutting')).toBeDefined();
    expect(findScene(learning, 'scene-try-it-again')).toBeDefined();
  });

  it('resolves the eight new scene cards without changing old card ids or aliases', () => {
    const learning = loadLearningCatalog();
    expect(learning.cards.slice(0, 273 + NEW_SCENE_CARD_IDS.length).map((card) => card.id)).toEqual([
      ...loadReviewCatalog().cards.map((card) => card.id),
      ...NEW_SCENE_CARD_IDS,
    ]);
    expect(learning.cards).toHaveLength(273 + NEW_SCENE_CARD_IDS.length + 10 + 9 + 9 + 9 + 30 + 91);
    expect(learning.cards.slice(0, 273).map((card) => card.id)).toEqual(
      loadReviewCatalog().cards.map((card) => card.id),
    );
    for (const cardId of NEW_SCENE_CARD_IDS) {
      const card = getCard(learning.cardIndex, cardId);
      expect(card, cardId).toBeDefined();
      expect(card?.id).toBe(cardId);
      expect(card?.senseZh?.length).toBeGreaterThan(0);
      expect(card?.sourcePack).toBe('everyday-scenes-pack-v3');
    }
    expect(getCard(learning.cardIndex, 'L07-P02')?.id).toBe('L01-P01');
    expect(getCard(learning.cardIndex, 'sc1-get-in')?.headword).toBe('get in');
  });

  it('merges anchors without dropping or colliding with existing units', () => {
    const review = loadReviewCatalog();
    const learning = loadLearningCatalog();
    expect(learning.anchorsPack.id).toBe(MERGED_ANCHORS_PACK_ID);
    expect(learning.anchorsPack.units).toHaveLength(122 + 27 + 34 + 21 + 34 + 21 + 33 + 21 + 32 + 21);
    const reviewIds = review.anchorsPack.units.map((unit) => unit.id);
    const mergedIds = learning.anchorsPack.units.map((unit) => unit.id);
    expect(mergedIds.slice(0, 122)).toEqual(reviewIds);
    expect(new Set(mergedIds).size).toBe(mergedIds.length);
    const dinner = learning.anchorsPack.units.filter((unit) => unit.parentId === 'scene-change-dinner-time');
    const store = learning.anchorsPack.units.filter((unit) => unit.parentId === 'scene-store-out-of-stock');
    expect(dinner).toHaveLength(13);
    expect(store).toHaveLength(14);
    expect(
      learning.anchorsPack.units.some(
        (unit) => unit.id === 'everyday-scenes-pack-v1.1::scene-one-more-round-l1',
      ),
    ).toBe(true);
  });

  it('keeps new and old anchor surfaces matching unicode code-point, end-exclusive slices', () => {
    const learning = loadLearningCatalog();
    const review = loadReviewCatalog();
    for (const unit of review.anchorsPack.units) {
      for (const span of unit.spans) {
        expect(spanSurfaceMatches(unit.textEn, span), unit.id).toBe(true);
        expect(span.end > span.start).toBe(true);
      }
    }
    const newUnits = learning.anchorsPack.units.filter((unit) =>
      unit.id.startsWith('everyday-scenes-pack-v3::'),
    );
    expect(newUnits).toHaveLength(27);
    let spanCount = 0;
    for (const unit of newUnits) {
      const scene = findScene(learning, unit.parentId ?? '');
      const line = scene?.lines.find((item) => item.id === unit.sourceId);
      expect(line?.en, unit.id).toBe(unit.textEn);
      for (const span of unit.spans) {
        spanCount += 1;
        expect(spanSurfaceMatches(unit.textEn, span), `${unit.id}:${span.surface}`).toBe(true);
        expect(getCard(learning.cardIndex, span.cardId)?.id).toBe(span.cardId);
        expect(span.start).toBeGreaterThanOrEqual(0);
        expect(span.end).toBeLessThanOrEqual(Array.from(unit.textEn).length);
        expect(span.start).toBeLessThan(span.end);
      }
    }
    expect(spanCount).toBe(8);
  });
});
