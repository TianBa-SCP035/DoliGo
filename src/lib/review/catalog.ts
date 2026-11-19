/**
 * Merged learning catalog for scenes and reading.
 * Does not change loadReviewCatalog(), review encounters, or session keys.
 */
import rawReviewAnchors from '../../content/content-text-anchors-v1.1.json';
import rawSceneAnchorsV3 from '../../content/content-text-anchors-scenes-v3.json';
import rawSceneAnchorsV4 from '../../content/content-text-anchors-scenes-v4.json';
import rawReadingAnchorsV3 from '../../content/content-text-anchors-reading-v3.json';
import rawSceneAnchorsV5 from '../../content/content-text-anchors-scenes-v5.json';
import rawReadingAnchorsV4 from '../../content/content-text-anchors-reading-v4.json';
import rawSceneAnchorsV6 from '../../content/content-text-anchors-scenes-v6.json';
import rawReadingAnchorsV5 from '../../content/content-text-anchors-reading-v5.json';
import rawSceneAnchorsV7 from '../../content/content-text-anchors-scenes-v7.json';
import rawReadingAnchorsV6 from '../../content/content-text-anchors-reading-v6.json';
import rawReading from '../../content/everyday-reading-pack-v2.1.json';
import rawReadingV3 from '../../content/everyday-reading-pack-v3.json';
import rawReadingV4 from '../../content/everyday-reading-pack-v4.json';
import rawReadingV5 from '../../content/everyday-reading-pack-v5.json';
import rawReadingV6 from '../../content/everyday-reading-pack-v6.json';
import rawReadingSourcedV1 from '../../content/sourced-reading-pack-wikivoyage-v1.json';
import rawReadingBulkV1 from '../../content/sourced-reading-pack-bulk-v1.json';
import rawBulkVocabNov16 from '../../content/bulk-vocab-ready-nov16.json';
import rawBulkVocabDepthNov16 from '../../content/bulk-vocab-depth-nov16.json';
import rawReadingDepthV1 from '../../content/sourced-reading-pack-depth-v1.json';
import rawScenesDepthNov16 from '../../content/everyday-scenes-depth-nov16.json';
import rawTopicVocabularyDepthNov16 from '../../content/topic-vocabulary-depth-nov16.json';
import rawBulkVocabDepthNov18 from '../../content/bulk-vocab-depth-nov18.json';
import rawReadingDepthNov18 from '../../content/sourced-reading-pack-depth-nov18.json';
import rawReadingTravelGameNov18 from '../../content/sourced-reading-pack-travel-game-nov18.json';
import rawReadingShoppingNov18 from '../../content/sourced-reading-pack-shopping-nov18.json';
import rawScenesDepthNov18 from '../../content/everyday-scenes-depth-nov18.json';
import rawTopicVocabularyDepthNov18 from '../../content/topic-vocabulary-depth-nov18.json';
import rawDifficultyTiersNov18 from '../../content/difficulty-tiers-nov18.json';
import rawLearningPathsNov18 from '../../content/learning-paths-nov18.json';
import rawOptionalPracticeNov18 from '../../content/optional-practice-nov18.json';
import rawScenesV11 from '../../content/everyday-scenes-pack-v1.1.json';
import rawScenesV3 from '../../content/everyday-scenes-pack-v3.json';
import rawScenesV4 from '../../content/everyday-scenes-pack-v4.json';
import rawScenesV5 from '../../content/everyday-scenes-pack-v5.json';
import rawScenesV6 from '../../content/everyday-scenes-pack-v6.json';
import rawScenesV7 from '../../content/everyday-scenes-pack-v7.json';
import { getCard, indexCards } from './cards';
import { loadReviewCatalog } from './content';
import type {
  AnchorsPack,
  AnchorUnit,
  CardId,
  CardIndex,
  LearningCatalog,
  ReadingEntry,
  ReadingSourcePack,
  SceneEntry,
  SceneSourcePack,
  SceneWordCard,
  VocabCard,
  VocabCatalog,
  DifficultyAnnotation,
  DifficultyTier,
} from './types';

export const WIRED_SCENE_PACK_IDS = ['everyday-scenes-pack-v1.1', 'everyday-scenes-pack-v3', 'everyday-scenes-pack-v4', 'everyday-scenes-pack-v5', 'everyday-scenes-pack-v6', 'everyday-scenes-pack-v7', 'everyday-scenes-depth-nov16', 'everyday-scenes-depth-nov18'] as const;
export const UNWIRED_SCENE_PACK_IDS = ['everyday-scenes-pack-v2'] as const;
export const WIRED_READING_PACK_ID = 'everyday-reading-pack-v2.1';
export const WIRED_READING_PACK_IDS = ['everyday-reading-pack-v2.1', 'everyday-reading-pack-v3', 'everyday-reading-pack-v4', 'everyday-reading-pack-v5', 'everyday-reading-pack-v6', 'sourced-reading-pack-wikivoyage-v1', 'sourced-reading-pack-bulk-v1', 'sourced-reading-pack-depth-v1', 'sourced-reading-pack-depth-nov18', 'sourced-reading-pack-travel-game-nov18', 'sourced-reading-pack-shopping-nov18'] as const;
export const BULK_READY_VOCAB_CARD_IDS = [
  'ready-nov16-ask', 'ready-nov16-need', 'ready-nov16-want', 'ready-nov16-find', 'ready-nov16-pay',
  'ready-nov16-choose', 'ready-nov16-change', 'ready-nov16-plan', 'ready-nov16-visit', 'ready-nov16-return',
  'ready-nov16-share', 'ready-nov16-explain', 'ready-nov16-decide', 'ready-nov16-try', 'ready-nov16-keep',
  'ready-nov16-spend', 'ready-nov16-speak', 'ready-nov16-understand', 'ready-nov16-follow', 'ready-nov16-offer',
  'ready-nov16-cash', 'ready-nov16-quiet', 'ready-nov16-available', 'ready-nov16-heavy', 'ready-nov16-know',
  'ready-nov16-different', 'ready-nov16-sure', 'ready-nov16-job', 'ready-nov16-thank', 'ready-nov16-learn',
] as const;

export const DEPTH_NOV16_VOCAB_CARD_IDS = [
  'depth-nov16-sweater', 'depth-nov16-size', 'depth-nov16-color', 'depth-nov16-medium',
  'depth-nov16-large', 'depth-nov16-small', 'depth-nov16-tight', 'depth-nov16-loose',
  'depth-nov16-sleeve', 'depth-nov16-pocket', 'depth-nov16-button', 'depth-nov16-cotton',
  'depth-nov16-wool', 'depth-nov16-label', 'depth-nov16-refund', 'depth-nov16-discount',
  'depth-nov16-sale', 'depth-nov16-cashier', 'depth-nov16-extra', 'depth-nov16-menu',
  'depth-nov16-bill', 'depth-nov16-tip', 'depth-nov16-spicy', 'depth-nov16-sauce',
  'depth-nov16-side', 'depth-nov16-portion', 'depth-nov16-vegetarian', 'depth-nov16-allergic',
  'depth-nov16-peanut', 'depth-nov16-ingredient', 'depth-nov16-split', 'depth-nov16-separate',
  'depth-nov16-reservation', 'depth-nov16-waiter', 'depth-nov16-waitress', 'depth-nov16-dessert',
  'depth-nov16-recommend', 'depth-nov16-platform', 'depth-nov16-route', 'depth-nov16-transfer',
  'depth-nov16-fare', 'depth-nov16-traffic', 'depth-nov16-driver', 'depth-nov16-passenger',
  'depth-nov16-direct', 'depth-nov16-single', 'depth-nov16-journey', 'depth-nov16-luggage',
  'depth-nov16-suitcase', 'depth-nov16-backpack', 'depth-nov16-departure', 'depth-nov16-arrival',
  'depth-nov16-cancel', 'depth-nov16-schedule', 'depth-nov16-notice', 'depth-nov16-apartment',
  'depth-nov16-tenant', 'depth-nov16-landlord', 'depth-nov16-rent', 'depth-nov16-utility',
  'depth-nov16-heating', 'depth-nov16-electricity', 'depth-nov16-doorbell', 'depth-nov16-buzzer',
  'depth-nov16-lock', 'depth-nov16-balcony', 'depth-nov16-ceiling', 'depth-nov16-stairs',
  'depth-nov16-repair', 'depth-nov16-signature', 'depth-nov16-parcel', 'depth-nov16-address',
  'depth-nov16-instruction', 'depth-nov16-lobby', 'depth-nov16-teammate', 'depth-nov16-mute',
  'depth-nov16-headset', 'depth-nov16-microphone', 'depth-nov16-connection', 'depth-nov16-lag',
  'depth-nov16-disconnect', 'depth-nov16-reconnect', 'depth-nov16-update', 'depth-nov16-download',
  'depth-nov16-server', 'depth-nov16-round', 'depth-nov16-match', 'depth-nov16-practice',
  'depth-nov16-pause', 'depth-nov16-settings', 'depth-nov16-volume',
] as const;

export const DEPTH_NOV18_VOCAB_CARD_IDS = [
  'depth-nov18-fitting-room', 'depth-nov18-bargain', 'depth-nov18-exchange', 'depth-nov18-warranty', 'depth-nov18-damaged',
  'depth-nov18-stain', 'depth-nov18-checkout', 'depth-nov18-counter', 'depth-nov18-gift-wrap', 'depth-nov18-stripe',
  'depth-nov18-pattern', 'depth-nov18-try-on', 'depth-nov18-starving', 'depth-nov18-stuffed', 'depth-nov18-leftover',
  'depth-nov18-takeaway', 'depth-nov18-to-go', 'depth-nov18-tasty', 'depth-nov18-bland', 'depth-nov18-greasy',
  'depth-nov18-crispy', 'depth-nov18-napkin', 'depth-nov18-chopsticks', 'depth-nov18-fork', 'depth-nov18-crowded',
  'depth-nov18-missed', 'depth-nov18-announcement', 'depth-nov18-rush-hour', 'depth-nov18-window-seat', 'depth-nov18-ticket-office',
  'depth-nov18-delay', 'depth-nov18-trolley', 'depth-nov18-lease', 'depth-nov18-deposit', 'depth-nov18-upstairs',
  'depth-nov18-leak', 'depth-nov18-drip', 'depth-nov18-mailbox', 'depth-nov18-intercom', 'depth-nov18-recycling',
  'depth-nov18-tidy', 'depth-nov18-mess', 'depth-nov18-quiet-hours', 'depth-nov18-ping', 'depth-nov18-party',
  'depth-nov18-queue', 'depth-nov18-ranked', 'depth-nov18-casual', 'depth-nov18-warmup', 'depth-nov18-clutch',
  'depth-nov18-trash-talk', 'depth-nov18-lag-spike', 'depth-nov18-gg', 'depth-nov18-subject', 'depth-nov18-regards',
  'depth-nov18-sincerely', 'depth-nov18-inquire', 'depth-nov18-confirm', 'depth-nov18-attachment', 'depth-nov18-typo',
  'depth-nov18-formal', 'depth-nov18-informal', 'depth-nov18-headline', 'depth-nov18-editorial', 'depth-nov18-journalist',
  'depth-nov18-publish', 'depth-nov18-subscriber', 'depth-nov18-issue', 'depth-nov18-deadline', 'depth-nov18-hang-on',
  'depth-nov18-no-worries', 'depth-nov18-long-story-short', 'depth-nov18-better-safe-than-sorry', 'depth-nov18-its-not-the-end-of-the-world', 'depth-nov18-you-can-say-that-again',
  'depth-nov18-take-it-easy', 'depth-nov18-give-me-a-second', 'depth-nov18-that-works-for-me', 'depth-nov18-im-easy', 'depth-nov18-come-on-in',
  'depth-nov18-help-yourself', 'depth-nov18-by-the-way', 'depth-nov18-in-other-words', 'depth-nov18-to-be-honest', 'depth-nov18-as-soon-as-possible',
  'depth-nov18-for-your-information', 'depth-nov18-please-find-attached', 'depth-nov18-i-look-forward-to-hearing-from-you', 'depth-nov18-like-talking-to-a-wall', 'depth-nov18-a-fish-out-of-water',
  'depth-nov18-on-the-same-page', 'depth-nov18-the-ball-is-in-your-court', 'depth-nov18-once-in-a-blue-moon',
  'depth-nov18-inspector', 'depth-nov18-valid', 'depth-nov18-priority-seat', 'depth-nov18-genre',
  'depth-nov18-console', 'depth-nov18-portable', 'depth-nov18-arcade', 'depth-nov18-cartridge',
  'depth-nov18-shop-assistant', 'depth-nov18-measuring-tape', 'depth-nov18-second-hand', 'depth-nov18-defect',
  'depth-nov18-dear', 'depth-nov18-request', 'depth-nov18-draft', 'depth-nov18-inquiry', 'depth-nov18-kind-regards',
  'depth-nov18-editor', 'depth-nov18-opinion', 'depth-nov18-section', 'depth-nov18-subscription', 'depth-nov18-letter-to-the-editor',
  'depth-nov18-destination', 'depth-nov18-day-pass', 'depth-nov18-tap', 'depth-nov18-insert', 'depth-nov18-maintenance',
  'depth-nov18-boarding', 'depth-nov18-reserve', 'depth-nov18-in-advance', 'depth-nov18-coach', 'depth-nov18-express',
  'depth-nov18-signal', 'depth-nov18-seat-belt', 'depth-nov18-long-distance', 'depth-nov18-on-demand', 'depth-nov18-overnight',
  'depth-nov18-fast-casual', 'depth-nov18-drive-through', 'depth-nov18-street-food', 'depth-nov18-cover-charge', 'depth-nov18-apartment-complex',
  'depth-nov18-studio-apartment', 'depth-nov18-laundry', 'depth-nov18-laundry-room', 'depth-nov18-washing-machine', 'depth-nov18-soap',
  'depth-nov18-coin', 'depth-nov18-convenience-store', 'depth-nov18-oven', 'depth-nov18-ready-made', 'depth-nov18-farmers-market',
  'depth-nov18-produce', 'depth-nov18-bottle', 'depth-nov18-sandwich', 'depth-nov18-pack', 'depth-nov18-smell',
  'depth-nov18-prohibited', 'depth-nov18-staff', 'depth-nov18-meat', 'depth-nov18-local', 'depth-nov18-translation',
  'depth-nov18-language-barrier', 'depth-nov18-knife', 'depth-nov18-rude', 'depth-nov18-bite', 'depth-nov18-wrist',
  'depth-nov18-table-manners',
  'depth-nov18-tourist', 'depth-nov18-sign', 'depth-nov18-review', 'depth-nov18-reliable', 'depth-nov18-word-of-mouth',
  'depth-nov18-fresh', 'depth-nov18-cookie', 'depth-nov18-bulk', 'depth-nov18-ready-to-eat', 'depth-nov18-shelf-life',
  'depth-nov18-culture', 'depth-nov18-custom', 'depth-nov18-religion', 'depth-nov18-avoid', 'depth-nov18-dairy',
  'depth-nov18-healthy', 'depth-nov18-safe', 'depth-nov18-stomach', 'depth-nov18-treat', 'depth-nov18-food-poisoning',
] as const;

export const LIBRARY_VOCAB_CARD_IDS = [
  ...BULK_READY_VOCAB_CARD_IDS,
  ...DEPTH_NOV16_VOCAB_CARD_IDS,
  ...DEPTH_NOV18_VOCAB_CARD_IDS,
] as const;

export const DEPTH_NOV16_SCENE_IDS = ['scene-have-the-receipt-extension-1', 'scene-change-dinner-time-extension-1', 'scene-voice-keeps-cutting-extension-1'] as const;
export const DEPTH_NOV16_READING_IDS = ['reading-apartment-life-depth', 'reading-clothes-for-everyday-depth', 'reading-choosing-restaurant-depth'] as const;
export const DEPTH_NOV18_SCENE_IDS = [
  'scene-store-out-of-stock-extension-1',
  'scene-next-bus-delayed-extension-1',
  'scene-one-more-round-extension-1',
  'scene-restaurant-is-full-extension-1',
  'scene-package-at-the-door-extension-1',
  'scene-wrong-drink-extension-1',
  'scene-ill-be-right-down-extension-1',
  'scene-store-out-of-stock-extension-2',
  'scene-reply-to-a-short-email',
  'scene-write-a-readers-letter',
  'scene-next-bus-delayed-extension-2',
] as const;
export const DEPTH_NOV18_READING_IDS = [
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
] as const;


export const MERGED_ANCHORS_PACK_ID = 'content-text-anchors-v1.1+scenes-v3+v4+reading-v3+scenes-v5+reading-v4+scenes-v6+reading-v5+scenes-v7+reading-v6';
export const VOCAB_SOURCE_PACK_IDS = [
  'independent-vocab-review-pack-v1.2',
  'everyday-scenes-pack-v3',
] as const;
export const NEW_SCENE_CARD_IDS = [
  'sc5-something-came-up',
  'sc5-book-a-table',
  'sc5-be-full',
  'sc6-look-for',
  'sc6-out-of',
  'sc6-brand',
  'sc6-aisle',
  'sc6-something-else-like-it',
] as const satisfies readonly CardId[];

export const NEW_SCENE_V4_CARD_IDS = [
  'sc7-barely-hear',
  'sc7-cutting-out',
  'sc8-show-up',
  'sc8-save',
] as const satisfies readonly CardId[];

export const NEW_READING_V3_CARD_IDS = [
  'rd3-leave-out',
  'rd3-weekend-after-next',
  'rd3-take-care-of-it',
  'rd3-floor',
  'rd3-just-in-case',
  'rd3-reminder',
] as const satisfies readonly CardId[];

export const VOCAB_EXTENSION_PACK_IDS = [
  'everyday-scenes-pack-v4',
  'everyday-reading-pack-v3',
  'everyday-scenes-pack-v5',
  'everyday-reading-pack-v4',
  'everyday-scenes-pack-v6',
  'everyday-reading-pack-v5',
  'everyday-scenes-pack-v7',
  'everyday-reading-pack-v6',
] as const;

export const NEW_SCENE_V5_CARD_IDS = [
  'sc9-be-delayed',
  'sc9-get-off',
  'sc9-on-the-way',
  'sc9-train',
  'sc10-around-the-corner',
] as const satisfies readonly CardId[];

export const NEW_READING_V4_CARD_IDS = [
  'rd4-market',
  'rd4-picnic',
  'rd4-get-on',
  'rd4-closed',
] as const satisfies readonly CardId[];

export const NEW_SCENE_V6_CARD_IDS = [
  'sc11-package',
  'sc11-courier',
  'sc11-locker',
  'sc11-leave-it',
  'sc12-isnt-what-i-ordered',
  'sc12-make-it-again',
  'sc12-keep-it',
] as const satisfies readonly CardId[];

export const NEW_READING_V5_CARD_IDS = [
  'rd5-left-behind',
  'rd5-charger',
] as const satisfies readonly CardId[];

export const NEW_SCENE_V7_CARD_IDS = [
  'sc13-receipt',
  'sc13-return-it',
  'sc13-exchange-it',
  'sc13-fit',
  'sc14-ill-be-right-down',
  'sc14-downstairs',
] as const satisfies readonly CardId[];

export const NEW_READING_V6_CARD_IDS = [
  'rd6-elevator-is-out',
  'rd6-take-the-stairs',
  'rd6-reschedule',
] as const satisfies readonly CardId[];

export const CONTENT_CARD_GROUPS = {
  reviewIndex: { packId: 'independent-vocab-review-pack-v1.2', role: 'review-index' },
  scenesV3: { packId: 'everyday-scenes-pack-v3', cardIds: NEW_SCENE_CARD_IDS, role: 'vocab-supplement-v3' },
  scenesV4: { packId: 'everyday-scenes-pack-v4', cardIds: NEW_SCENE_V4_CARD_IDS, role: 'vocab-extension' },
  readingV3: { packId: 'everyday-reading-pack-v3', cardIds: NEW_READING_V3_CARD_IDS, role: 'vocab-extension' },
  scenesV5: { packId: 'everyday-scenes-pack-v5', cardIds: NEW_SCENE_V5_CARD_IDS, role: 'vocab-extension' },
  readingV4: { packId: 'everyday-reading-pack-v4', cardIds: NEW_READING_V4_CARD_IDS, role: 'vocab-extension' },
  scenesV6: { packId: 'everyday-scenes-pack-v6', cardIds: NEW_SCENE_V6_CARD_IDS, role: 'vocab-extension' },
  readingV5: { packId: 'everyday-reading-pack-v5', cardIds: NEW_READING_V5_CARD_IDS, role: 'vocab-extension' },
  scenesV7: { packId: 'everyday-scenes-pack-v7', cardIds: NEW_SCENE_V7_CARD_IDS, role: 'vocab-extension' },
  readingV6: { packId: 'everyday-reading-pack-v6', cardIds: NEW_READING_V6_CARD_IDS, role: 'vocab-extension' },
} as const;

const scenesV11 = rawScenesV11 as SceneSourcePack;
const scenesV3 = rawScenesV3 as SceneSourcePack;
const scenesV4 = rawScenesV4 as SceneSourcePack;
const scenesV5 = rawScenesV5 as SceneSourcePack;
const scenesV6 = rawScenesV6 as SceneSourcePack;
const scenesV7 = rawScenesV7 as SceneSourcePack;
const readingPack = rawReading as ReadingSourcePack;
const readingPackV3 = rawReadingV3 as ReadingSourcePack;
const readingPackV4 = rawReadingV4 as ReadingSourcePack;
const readingPackV5 = rawReadingV5 as ReadingSourcePack;
const readingPackV6 = rawReadingV6 as ReadingSourcePack;
const readingPackSourcedV1 = rawReadingSourcedV1 as ReadingSourcePack;
const readingPackBulkV1 = rawReadingBulkV1 as ReadingSourcePack;
const readingPackDepthV1 = rawReadingDepthV1 as ReadingSourcePack;
const bulkVocabNov16 = rawBulkVocabNov16 as { id: string; wordCards?: SceneWordCard[] };
const bulkVocabDepthNov16 = rawBulkVocabDepthNov16 as { id: string; wordCards?: SceneWordCard[] };
const scenesDepthNov16 = rawScenesDepthNov16 as SceneSourcePack;
export const topicVocabularyDepthNov16 = rawTopicVocabularyDepthNov16 as {
  id: string;
  topicBindings: Record<string, string[]>;
  topicCardIds: Record<string, string[]>;
  reuseCardIds: string[];
  newCardIds: string[];
};
const bulkVocabDepthNov18 = rawBulkVocabDepthNov18 as { id: string; wordCards?: SceneWordCard[] };
const readingPackDepthNov18 = rawReadingDepthNov18 as ReadingSourcePack;
const readingPackTravelGameNov18 = rawReadingTravelGameNov18 as ReadingSourcePack;
const readingPackShoppingNov18 = rawReadingShoppingNov18 as ReadingSourcePack;
const scenesDepthNov18 = rawScenesDepthNov18 as SceneSourcePack;
export const topicVocabularyDepthNov18 = rawTopicVocabularyDepthNov18 as {
  id: string;
  topicBindings: Record<string, { sceneIds?: string[]; sceneExtensionIds?: string[]; readingIds?: string[] }>;
  topicCardIds: Record<string, string[]>;
};
export const difficultyTiersNov18 = rawDifficultyTiersNov18 as {
  id: string;
  words: { id: string; difficulty?: DifficultyAnnotation }[];
  scenes: { id: string; difficulty?: DifficultyAnnotation }[];
  readings: { id: string; difficulty?: DifficultyAnnotation }[];
};
export const learningPathsNov18 = rawLearningPathsNov18 as { id?: string; paths?: unknown[] };
export const optionalPracticePackNov18 = rawOptionalPracticeNov18 as { id?: string; items?: unknown[] };

const TIER_ZH: Record<DifficultyTier, '基础' | '常用' | '进阶'> = {
  foundational: '基础',
  everyday: '常用',
  advanced: '进阶',
};

export function readDifficulty(value: unknown): DifficultyAnnotation | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as { tier?: unknown; tierZh?: unknown } & DifficultyAnnotation;
  const tier = record.tier;
  if (tier !== 'foundational' && tier !== 'everyday' && tier !== 'advanced') return undefined;
  const expected = TIER_ZH[tier];
  if (record.tierZh !== undefined && record.tierZh !== expected) return undefined;
  return { ...record, tier, tierZh: expected };
}

function difficultyIndex(
  rows: readonly { id: string; difficulty?: DifficultyAnnotation }[],
): Record<string, DifficultyAnnotation> {
  const out: Record<string, DifficultyAnnotation> = {};
  for (const row of rows) {
    const difficulty = readDifficulty(row.difficulty);
    if (difficulty) out[row.id] = difficulty;
  }
  return out;
}

function attachDifficulty<T extends { id: string; difficulty?: DifficultyAnnotation }>(
  items: readonly T[],
  index: Record<string, DifficultyAnnotation>,
): T[] {
  return items.map((item) => {
    const difficulty = readDifficulty(item.difficulty) ?? index[item.id];
    return difficulty ? { ...item, difficulty } : item;
  });
}
const reviewAnchors = rawReviewAnchors as AnchorsPack;
const sceneAnchorsV3 = rawSceneAnchorsV3 as AnchorsPack;
const sceneAnchorsV4 = rawSceneAnchorsV4 as AnchorsPack;
const readingAnchorsV3 = rawReadingAnchorsV3 as AnchorsPack;
const sceneAnchorsV5 = rawSceneAnchorsV5 as AnchorsPack;
const readingAnchorsV4 = rawReadingAnchorsV4 as AnchorsPack;
const sceneAnchorsV6 = rawSceneAnchorsV6 as AnchorsPack;
const readingAnchorsV5 = rawReadingAnchorsV5 as AnchorsPack;
const sceneAnchorsV7 = rawSceneAnchorsV7 as AnchorsPack;
const readingAnchorsV6 = rawReadingAnchorsV6 as AnchorsPack;

export function sceneCardToVocabCard(card: SceneWordCard, sourcePack: string): VocabCard {
  return {
    id: card.id,
    headword: card.headword,
    pos: card.pos,
    posZh: card.posZh ?? card.pos,
    senseZh: card.senseZh,
    collocation: card.collocation,
    exampleEn: card.exampleEn,
    exampleZh: card.exampleZh,
    transferEn: card.transferEn,
    transferZh: card.transferZh,
    notesZh: card.notesZh,
    extraExamples: card.extraExamples ?? [],
    aliasIds: card.aliasIds ?? [],
    sourcePack: card.sourcePack ?? sourcePack,
    sourceRef: card.sourceRef ?? card.sourceLine,
    sourceTitle: card.sourceTitle,
    sourceKey: typeof card.sourceKey === 'string' ? card.sourceKey : undefined,
    category: card.category,
    tags: card.tags,
    kind: card.kind ?? 'wordCard',
    priority: card.priority,
    standalone: card.standalone ?? true,
    provenance: card.provenance,
    lemmaFrequencySource: card.lemmaFrequencySource,
    glossAndExampleSource: card.glossAndExampleSource,
    noCefrCertificate: card.noCefrCertificate,
    difficulty: readDifficulty(card.difficulty) ?? card.difficulty,
  };
}

export function mergeAnchorUnits(base: AnchorsPack, ...supplements: AnchorsPack[]): AnchorsPack {
  const seen = new Set<string>();
  const units: AnchorUnit[] = [];
  for (const pack of [base, ...supplements]) {
    for (const unit of pack.units) {
      if (seen.has(unit.id)) {
        throw new Error(`锚点 unit id 冲突，拒绝合并：${unit.id}`);
      }
      seen.add(unit.id);
      units.push(unit);
    }
  }
  return {
    id: MERGED_ANCHORS_PACK_ID,
    version: 'merged',
    offsetSpec: base.offsetSpec,
    units,
  };
}

export function appendUniqueCards(existing: readonly VocabCard[], extra: readonly VocabCard[]): VocabCard[] {
  const seen = new Set(existing.map((card) => card.id));
  const appended: VocabCard[] = [];
  for (const card of extra) {
    if (seen.has(card.id)) {
      throw new Error(`拒绝覆盖已有词卡 id：${card.id}`);
    }
    seen.add(card.id);
    appended.push(card);
  }
  return [...existing, ...appended];
}

export function loadLearningCatalog(): LearningCatalog {
  const review = loadReviewCatalog();
  const scenes: SceneEntry[] = [...scenesV11.scenes, ...scenesV3.scenes, ...scenesV4.scenes, ...scenesV5.scenes, ...scenesV6.scenes, ...scenesV7.scenes, ...scenesDepthNov16.scenes, ...scenesDepthNov18.scenes];
  const readings: ReadingEntry[] = [...readingPack.readings, ...readingPackV3.readings, ...readingPackV4.readings, ...readingPackV5.readings, ...readingPackV6.readings, ...readingPackSourcedV1.readings, ...readingPackBulkV1.readings, ...readingPackDepthV1.readings, ...readingPackDepthNov18.readings, ...readingPackTravelGameNov18.readings, ...readingPackShoppingNov18.readings];
  const supplementalCards = (scenesV3.wordCards ?? []).map((card) => sceneCardToVocabCard(card, scenesV3.id));
  const extensionCards = [
    ...(scenesV4.wordCards ?? []).map((card) => sceneCardToVocabCard(card, scenesV4.id)),
    ...(readingPackV3.wordCards ?? []).map((card) => sceneCardToVocabCard(card, readingPackV3.id)),
    ...(scenesV5.wordCards ?? []).map((card) => sceneCardToVocabCard(card, scenesV5.id)),
    ...(readingPackV4.wordCards ?? []).map((card) => sceneCardToVocabCard(card, readingPackV4.id)),
    ...(scenesV6.wordCards ?? []).map((card) => sceneCardToVocabCard(card, scenesV6.id)),
    ...(readingPackV5.wordCards ?? []).map((card) => sceneCardToVocabCard(card, readingPackV5.id)),
    ...(scenesV7.wordCards ?? []).map((card) => sceneCardToVocabCard(card, scenesV7.id)),
    ...(readingPackV6.wordCards ?? []).map((card) => sceneCardToVocabCard(card, readingPackV6.id)),
  ];
  const bulkVocabCards = (bulkVocabNov16.wordCards ?? []).map((card) => sceneCardToVocabCard(card, bulkVocabNov16.id));
  const depthVocabCards = (bulkVocabDepthNov16.wordCards ?? []).map((card) => sceneCardToVocabCard(card, bulkVocabDepthNov16.id));
  const depthVocabNov18Cards = (bulkVocabDepthNov18.wordCards ?? []).map((card) => sceneCardToVocabCard(card, bulkVocabDepthNov18.id));
  const wordDifficulty = difficultyIndex(difficultyTiersNov18.words);
  const sceneDifficulty = difficultyIndex(difficultyTiersNov18.scenes);
  const readingDifficulty = difficultyIndex(difficultyTiersNov18.readings);
  const cards = attachDifficulty(
    appendUniqueCards(review.cards, [...supplementalCards, ...extensionCards, ...bulkVocabCards, ...depthVocabCards, ...depthVocabNov18Cards]),
    wordDifficulty,
  );
  const cardIndex: CardIndex = indexCards(cards);
  const titledScenes = attachDifficulty(scenes, sceneDifficulty);
  const sceneTitleById = Object.fromEntries(titledScenes.map((scene) => [scene.id, scene.title]));
  const withSearchTags = <T extends { tags?: string[]; difficulty?: DifficultyAnnotation; parentSceneId?: string }>(
    items: T[],
  ): T[] =>
    items.map((item) => {
      const difficulty = readDifficulty(item.difficulty);
      const extras = [
        ...(difficulty ? [difficulty.tier, difficulty.tierZh] : []),
        ...('parentSceneId' in item && item.parentSceneId && sceneTitleById[item.parentSceneId]
          ? [sceneTitleById[item.parentSceneId]]
          : []),
      ];
      const tags = [...new Set([...(item.tags ?? []), ...extras].filter(Boolean))];
      return tags.length ? { ...item, tags } : item;
    });
  return {
    review,
    scenes: withSearchTags(titledScenes),
    readings: withSearchTags(attachDifficulty(readings, readingDifficulty)),
    readingPack,
    anchorsPack: mergeAnchorUnits(reviewAnchors, sceneAnchorsV3, sceneAnchorsV4, readingAnchorsV3, sceneAnchorsV5, readingAnchorsV4, sceneAnchorsV6, readingAnchorsV5, sceneAnchorsV7, readingAnchorsV6),
    cards,
    cardIndex,
    wiredScenePackIds: [...WIRED_SCENE_PACK_IDS],
    unwiredScenePackIds: [...UNWIRED_SCENE_PACK_IDS],
    wiredReadingPackId: WIRED_READING_PACK_ID,
    wiredReadingPackIds: [...WIRED_READING_PACK_IDS],
  };
}

/** Alias for the same stable merge entry; does not load unwired packs such as scenes v2. */
export function loadSceneCatalog(): LearningCatalog {
  return loadLearningCatalog();
}

export function findScene(catalog: LearningCatalog, id: string): SceneEntry | undefined {
  return catalog.scenes.find((scene) => scene.id === id);
}

export function findReading(catalog: LearningCatalog, id: string): ReadingEntry | undefined {
  return catalog.readings.find((reading) => reading.id === id);
}

export function isDefaultVocabQueueCard(card: VocabCard): boolean {
  return card.standalone !== false && card.priority !== 'optional' && card.priority !== 'library';
}

/**
 * Independent word-study catalog: 273 existing cards plus the eight v3 cards.
 * Does not change loadReviewCatalog() or the 36 review encounters.
 */
export function loadVocabCatalog(): VocabCatalog {
  const learning = loadLearningCatalog();
  const supplementalCards: VocabCard[] = NEW_SCENE_CARD_IDS.map((cardId) => {
    const card = getCard(learning.cardIndex, cardId);
    if (!card) {
      throw new Error(`背词目录缺少新卡：${cardId}`);
    }
    return card;
  });
  const studyCards = learning.cards.filter((card) => card.standalone !== false);
  const extensionCards: VocabCard[] = [
    ...NEW_SCENE_V4_CARD_IDS,
    ...NEW_READING_V3_CARD_IDS,
    ...NEW_SCENE_V5_CARD_IDS,
    ...NEW_READING_V4_CARD_IDS,
    ...NEW_SCENE_V6_CARD_IDS,
    ...NEW_READING_V5_CARD_IDS,
    ...NEW_SCENE_V7_CARD_IDS,
    ...NEW_READING_V6_CARD_IDS,
  ].map((cardId) => {
    const card = getCard(learning.cardIndex, cardId);
    if (!card) {
      throw new Error(`背词目录缺少扩展卡：${cardId}`);
    }
    return card;
  });
  return {
    cards: learning.cards,
    cardIndex: learning.cardIndex,
    studyCards,
    defaultQueueCards: studyCards.filter((card) => isDefaultVocabQueueCard(card) && !(LIBRARY_VOCAB_CARD_IDS as readonly string[]).includes(card.id)),
    supplementalCards,
    extensionCards,
    libraryCards: LIBRARY_VOCAB_CARD_IDS.map((cardId) => {
      const card = getCard(learning.cardIndex, cardId);
      if (!card) throw new Error(`背词目录缺少资料库词卡：${cardId}`);
      return card;
    }),
    sourcePackIds: [...VOCAB_SOURCE_PACK_IDS],
    extensionSourcePackIds: [...VOCAB_EXTENSION_PACK_IDS],
  };
}
