import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEPTH_NOV16_VOCAB_CARD_IDS,
  DEPTH_NOV18_READING_IDS,
  DEPTH_NOV18_SCENE_IDS,
  DEPTH_NOV18_VOCAB_CARD_IDS,
  LIBRARY_VOCAB_CARD_IDS,
  WIRED_READING_PACK_IDS,
  WIRED_SCENE_PACK_IDS,
  difficultyTiersNov18,
  loadLearningCatalog,
  loadReviewCatalog,
  loadVocabCatalog,
  optionalPracticePackNov18,
  readDifficulty,
} from '../../src/lib/review';
import { libraryWordEntries, libraryWords, wordGroups } from '../../src/adapters/wiring-words';
import { topicLinks, topicLinksForScene } from '../../src/adapters/topic-links';

const QUEUE_LENGTHS = [
  ['basic', 8],
  ['daily-scenes-v3', 8],
  ['game-work-reading-v1', 10],
  ['daily-scenes-v5', 5],
  ['daily-reading-v4', 4],
  ['daily-scenes-v6', 7],
  ['daily-reading-v5', 2],
  ['daily-scenes-v7', 6],
  ['daily-reading-v6', 3],
] as const;

const PARENTS = [
  'scene-store-out-of-stock',
  'scene-next-bus-delayed',
  'scene-one-more-round',
  'scene-restaurant-is-full',
  'scene-package-at-the-door',
  'scene-wrong-drink',
  'scene-ill-be-right-down',
] as const;

describe('nov18 depth catalog hang', () => {
  const review = loadReviewCatalog();
  const vocab = loadVocabCatalog();
  const learning = loadLearningCatalog();

  it('keeps the nine published queues and the 273 review cards unchanged', () => {
    expect(wordGroups).toHaveLength(9);
    expect(wordGroups.map((group) => [group.id, group.words.length])).toEqual([...QUEUE_LENGTHS]);
    expect(review.cards).toHaveLength(273);
    expect(vocab.defaultQueueCards.some((card) => (LIBRARY_VOCAB_CARD_IDS as readonly string[]).includes(card.id))).toBe(false);
  });

  it('appends 93 library cards without replacing the earlier 121', () => {
    expect(DEPTH_NOV18_VOCAB_CARD_IDS).toHaveLength(181);
    expect(LIBRARY_VOCAB_CARD_IDS).toHaveLength(302);
    expect(vocab.libraryCards).toHaveLength(302);
    expect(libraryWords).toHaveLength(302);
    expect(libraryWordEntries).toHaveLength(302);
    expect(vocab.libraryCards.slice(0, 30).every((card) => card.id.startsWith('ready-nov16-'))).toBe(true);
    expect(vocab.libraryCards.slice(30, 121).map((card) => card.id)).toEqual([...DEPTH_NOV16_VOCAB_CARD_IDS]);
    expect(vocab.libraryCards.slice(121).map((card) => card.id)).toEqual([...DEPTH_NOV18_VOCAB_CARD_IDS]);
    expect(new Set(vocab.libraryCards.map((card) => card.id)).size).toBe(302);
    expect(learning.cards).toHaveLength(620);
    expect(vocab.cards).toHaveLength(620);
  });

  it('attaches foundational|everyday|advanced labels to the 93 new cards', () => {
    for (const id of DEPTH_NOV18_VOCAB_CARD_IDS) {
      const card = vocab.libraryCards.find((item) => item.id === id);
      const difficulty = readDifficulty(card?.difficulty);
      expect(difficulty, id).toBeTruthy();
      expect(['foundational', 'everyday', 'advanced']).toContain(difficulty!.tier);
      expect(['基础', '常用', '进阶']).toContain(difficulty!.tierZh);
    }
    const leak = libraryWords.find((card) => card.id === 'depth-nov18-leak');
    expect(leak?.difficulty?.tierZh).toBeTruthy();
  });

  it('adds seven scene continuations by parentSceneId and leaves parent lines intact', () => {
    expect(DEPTH_NOV18_SCENE_IDS).toHaveLength(11);
    expect(learning.scenes).toHaveLength(26);
    expect(WIRED_SCENE_PACK_IDS).toContain('everyday-scenes-depth-nov18');
    const parentLines = Object.fromEntries(
      PARENTS.map((id) => {
        const scene = learning.scenes.find((item) => item.id === id);
        expect(scene, id).toBeTruthy();
        return [id, scene!.lines.length];
      }),
    );
    for (const id of DEPTH_NOV18_SCENE_IDS) {
      const scene = learning.scenes.find((item) => item.id === id);
      expect(scene, id).toBeTruthy();
      if (/-extension-\d+$/.test(id)) {
        expect(scene!.parentSceneId).toBe(id.replace(/-extension-\d+$/, ''));
      } else {
        expect(scene!.parentSceneId == null || scene!.parentSceneId === '').toBe(true);
      }
      expect(scene!.lines.length).toBeGreaterThan(0);
      expect(readDifficulty(scene!.difficulty)?.tierZh).toBeTruthy();
    }
    expect(learning.scenes.find((item) => item.id === 'scene-reply-to-a-short-email')?.parentSceneId == null || learning.scenes.find((item) => item.id === 'scene-reply-to-a-short-email')?.parentSceneId === '').toBe(true);
    expect(learning.scenes.find((item) => item.id === 'scene-write-a-readers-letter')?.parentSceneId == null || learning.scenes.find((item) => item.id === 'scene-write-a-readers-letter')?.parentSceneId === '').toBe(true);
    expect(learning.scenes.find((item) => item.id === 'scene-wrong-drink-extension-1')?.parentSceneId).toBe('scene-wrong-drink');
    expect(learning.scenes.find((item) => item.id === 'scene-ill-be-right-down-extension-1')?.parentSceneId).toBe('scene-ill-be-right-down');
    expect(learning.scenes.find((item) => item.id === 'scene-next-bus-delayed-extension-2')?.parentSceneId).toBe('scene-next-bus-delayed');
    for (const id of PARENTS) {
      expect(learning.scenes.find((item) => item.id === id)?.lines.length).toBe(parentLines[id]);
    }
  });

  it('adds the two formal readings and the travel/game readings', () => {
    expect(DEPTH_NOV18_READING_IDS).toEqual([
      'reading-writing-a-short-email-depth',
      'reading-what-a-newspaper-does-depth',
      'reading-using-public-transport-depth',
      'reading-what-a-video-game-is-depth',
      'reading-buying-clothes-in-a-store-depth',
      'reading-transfers-and-leaving-depth',
      'reading-trains-and-stations-depth',
      'reading-city-and-long-distance-buses-depth',
      'reading-eating-out-when-you-go-depth',
      'reading-laundry-in-an-apartment-depth',
      'reading-buying-food-to-cook-depth',
      'reading-eating-on-the-way-depth',
      'reading-ordering-with-a-language-barrier-depth',
      'reading-table-manners-when-you-eat-depth',
      'reading-restaurant-ads-and-reviews-depth',
      'reading-packing-food-to-take-with-you-depth',
      'reading-food-customs-and-taboos-depth',
      'reading-staying-healthy-around-food-depth',
    ]);
    expect(learning.readings).toHaveLength(35);
    expect(WIRED_READING_PACK_IDS).toContain('sourced-reading-pack-depth-nov18');
    expect(WIRED_READING_PACK_IDS).toContain('sourced-reading-pack-travel-game-nov18');
    expect(WIRED_READING_PACK_IDS).toContain('sourced-reading-pack-shopping-nov18');
    const transport = learning.readings.find((item) => item.id === 'reading-using-public-transport-depth');
    const game = learning.readings.find((item) => item.id === 'reading-what-a-video-game-is-depth');
    const email = learning.readings.find((item) => item.id === 'reading-writing-a-short-email-depth');
    const newspaper = learning.readings.find((item) => item.id === 'reading-what-a-newspaper-does-depth');
    expect(transport?.wordCount ?? transport?.wordCountEn).toBe(241);
    expect(transport?.paragraphs).toHaveLength(9);
    expect(game?.wordCount ?? game?.wordCountEn).toBe(217);
    expect(game?.paragraphs).toHaveLength(7);
    expect(email?.wordCount ?? email?.wordCountEn).toBe(316);
    expect(email?.paragraphs).toHaveLength(9);
    const transfer = learning.readings.find((item) => item.id === 'reading-transfers-and-leaving-depth');
    expect(newspaper?.wordCount ?? newspaper?.wordCountEn).toBe(215);
    expect(newspaper?.paragraphs).toHaveLength(6);
    expect(transfer?.wordCount ?? transfer?.wordCountEn).toBe(269);
    expect(transfer?.paragraphs).toHaveLength(6);
    const rail = learning.readings.find((item) => item.id === 'reading-trains-and-stations-depth');
    const bus = learning.readings.find((item) => item.id === 'reading-city-and-long-distance-buses-depth');
    expect(rail?.wordCount ?? rail?.wordCountEn).toBe(243);
    expect(rail?.paragraphs).toHaveLength(6);
    expect(bus?.wordCount ?? bus?.wordCountEn).toBe(260);
    expect(bus?.paragraphs).toHaveLength(6);
    const apartment = learning.readings.find((item) => item.id === 'reading-apartment-life-depth');
    const restaurant = learning.readings.find((item) => item.id === 'reading-choosing-restaurant-depth');
    expect(apartment?.wordCount ?? apartment?.wordCountEn).toBe(297);
    expect(apartment?.paragraphs).toHaveLength(8);
    expect(restaurant?.wordCount ?? restaurant?.wordCountEn).toBe(268);
    expect(restaurant?.paragraphs).toHaveLength(7);
    const eatingOut = learning.readings.find((item) => item.id === 'reading-eating-out-when-you-go-depth');
    const laundryApt = learning.readings.find((item) => item.id === 'reading-laundry-in-an-apartment-depth');
    const buyingFood = learning.readings.find((item) => item.id === 'reading-buying-food-to-cook-depth');
    const onTheWay = learning.readings.find((item) => item.id === 'reading-eating-on-the-way-depth');
    const language = learning.readings.find((item) => item.id === 'reading-ordering-with-a-language-barrier-depth');
    const manners = learning.readings.find((item) => item.id === 'reading-table-manners-when-you-eat-depth');
    expect(eatingOut?.wordCount ?? eatingOut?.wordCountEn).toBe(235);
    expect(eatingOut?.paragraphs).toHaveLength(6);
    expect(laundryApt?.wordCount ?? laundryApt?.wordCountEn).toBe(229);
    expect(laundryApt?.paragraphs).toHaveLength(6);
    expect(buyingFood?.wordCount ?? buyingFood?.wordCountEn).toBe(235);
    expect(buyingFood?.paragraphs).toHaveLength(6);
    expect(onTheWay?.wordCount ?? onTheWay?.wordCountEn).toBe(260);
    expect(onTheWay?.paragraphs).toHaveLength(6);
    expect(language?.wordCount ?? language?.wordCountEn).toBe(254);
    expect(language?.paragraphs).toHaveLength(6);
    expect(manners?.wordCount ?? manners?.wordCountEn).toBe(278);
    expect(manners?.paragraphs).toHaveLength(6);
    const ads = learning.readings.find((item) => item.id === 'reading-restaurant-ads-and-reviews-depth');
    const packing = learning.readings.find((item) => item.id === 'reading-packing-food-to-take-with-you-depth');
    const customs = learning.readings.find((item) => item.id === 'reading-food-customs-and-taboos-depth');
    const healthy = learning.readings.find((item) => item.id === 'reading-staying-healthy-around-food-depth');
    expect(ads?.wordCount ?? ads?.wordCountEn).toBe(242);
    expect(ads?.paragraphs).toHaveLength(6);
    expect(packing?.wordCount ?? packing?.wordCountEn).toBe(278);
    expect(packing?.paragraphs).toHaveLength(6);
    expect(customs?.wordCount ?? customs?.wordCountEn).toBe(263);
    expect(customs?.paragraphs).toHaveLength(6);
    expect(healthy?.wordCount ?? healthy?.wordCountEn).toBe(271);
    expect(healthy?.paragraphs).toHaveLength(6);
    for (const id of DEPTH_NOV18_READING_IDS) {
      const reading = learning.readings.find((item) => item.id === id);
      expect(reading, id).toBeTruthy();
      expect(readDifficulty(reading!.difficulty)?.tierZh).toBeTruthy();
      const license =
        reading!.source?.sourceLicense ||
        reading!.source?.license ||
        reading!.adaptedLicense ||
        reading!.sourceAttribution?.license;
      expect(String(license)).toMatch(/CC BY-SA 4\.0/);
    }
  });

  it('keeps optional practice skippable and out of mastery', () => {
    expect(optionalPracticePackNov18.items).toHaveLength(130);
  });

  it('links the new dining and home extensions without turning topics into a study group', () => {
    const dining = topicLinks().find((topic) => topic.id === 'dining');
    const home = topicLinks().find((topic) => topic.id === 'home');
    const travel = topicLinks().find((topic) => topic.id === 'travel');
    const game = topicLinks().find((topic) => topic.id === 'game');
    expect(dining?.isStudyGroup).toBe(false);
    expect(dining?.scenes.map((scene) => scene.id)).toEqual(expect.arrayContaining([
      'scene-restaurant-is-full-extension-1',
      'scene-wrong-drink-extension-1',
    ]));
    expect(home?.scenes.map((scene) => scene.id)).toEqual(expect.arrayContaining([
      'scene-package-at-the-door-extension-1',
      'scene-ill-be-right-down-extension-1',
    ]));
    expect(travel?.scenes.map((scene) => scene.id)).toEqual(expect.arrayContaining([
      'scene-next-bus-delayed-extension-1',
      'scene-next-bus-delayed-extension-2',
    ]));
    expect(travel?.readings.some((item) => item.id === 'reading-using-public-transport-depth')).toBe(true);
    expect(travel?.readings.some((item) => item.id === 'reading-transfers-and-leaving-depth')).toBe(true);
    expect(travel?.readings.some((item) => item.id === 'reading-trains-and-stations-depth')).toBe(true);
    expect(travel?.readings.some((item) => item.id === 'reading-city-and-long-distance-buses-depth')).toBe(true);
    expect(game?.readings.some((item) => item.id === 'reading-what-a-video-game-is-depth')).toBe(true);
    expect(dining?.readings.some((item) => item.id === 'reading-choosing-restaurant-depth')).toBe(true);
    expect(dining?.readings.some((item) => item.id === 'reading-eating-out-when-you-go-depth')).toBe(true);
    expect(dining?.readings.some((item) => item.id === 'reading-buying-food-to-cook-depth')).toBe(true);
    expect(dining?.readings.some((item) => item.id === 'reading-eating-on-the-way-depth')).toBe(true);
    expect(dining?.readings.some((item) => item.id === 'reading-ordering-with-a-language-barrier-depth')).toBe(true);
    expect(dining?.readings.some((item) => item.id === 'reading-table-manners-when-you-eat-depth')).toBe(true);
    expect(dining?.readings.some((item) => item.id === 'reading-restaurant-ads-and-reviews-depth')).toBe(true);
    expect(dining?.readings.some((item) => item.id === 'reading-packing-food-to-take-with-you-depth')).toBe(true);
    expect(dining?.readings.some((item) => item.id === 'reading-food-customs-and-taboos-depth')).toBe(true);
    expect(dining?.readings.some((item) => item.id === 'reading-staying-healthy-around-food-depth')).toBe(true);
    expect(home?.readings.some((item) => item.id === 'reading-apartment-life-depth')).toBe(true);
    expect(home?.readings.some((item) => item.id === 'reading-laundry-in-an-apartment-depth')).toBe(true);
    expect(topicLinksForScene('scene-wrong-drink-extension-1').some((topic) => topic.id === 'dining')).toBe(true);
  });

  it('leaves library-basics and laundry mixes empty and keeps the official neighbor mix', () => {
    const mixOf = (row: { difficulty?: { recommendedMixIds?: string[] } } | undefined) =>
      [...(row?.difficulty?.recommendedMixIds ?? [])].sort();
    const byId = Object.fromEntries(
      (difficultyTiersNov18.readings ?? []).map((row: { id: string; difficulty?: { recommendedMixIds?: string[] } }) => [row.id, row]),
    );
    expect(mixOf(byId['reading-library-basics'])).toEqual([]);
    expect(mixOf(byId['reading-laundry-while-traveling'])).toEqual([]);
    expect(mixOf(byId['reading-neighbor-kept-the-box'])).toEqual([
      'l12-w-message',
      'l13-w-door',
      'l17-w-miss',
      'reading-delivery-w04',
      'reading-delivery-w09',
      'sc11-courier',
      'sc11-locker',
    ]);
  });

  it('does not treat undownloaded pronunciation matches as ready audio', () => {
    const pack = JSON.parse(
      readFileSync(resolve(__dirname, '../../src/content/pronunciation-sources-nov18.json'), 'utf8'),
    ) as { files?: Record<string, { cardId?: string; audioUrl?: string }> };
    expect(Object.keys(pack.files ?? {})).toEqual(['depth-nov18-leak']);
    expect(pack.files?.['depth-nov18-leak']?.audioUrl).toBe('/audio/depth-nov18-leak.ogg');
  });
});
