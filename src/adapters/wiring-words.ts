import {
  loadVocabCatalog,
  getCard,
  NEW_SCENE_V4_CARD_IDS,
  NEW_READING_V3_CARD_IDS,
  NEW_SCENE_V5_CARD_IDS,
  NEW_READING_V4_CARD_IDS,
  NEW_SCENE_V6_CARD_IDS,
  NEW_READING_V5_CARD_IDS,
  NEW_SCENE_V7_CARD_IDS,
  NEW_READING_V6_CARD_IDS,
  readDifficulty,
} from "../lib/review";
import type { VocabCard } from "../lib/review";
import type { StudyWord } from "../ui/LearningViews";
export const WIRING_VERSION = "four-entry-wiring-v1.9";
export type WordGroupId = (typeof wordGroups)[number]["id"];
export type StudyWordWithTransfer = StudyWord & {
  transferExample?: { english: string; chinese?: string };
};
const catalog = loadVocabCatalog();
export const sourcePack = "independent-vocab-review-pack-v1.2";
const selectedIds = [
  "L01-V01",
  "L01-V02",
  "L01-V03",
  "L01-V04",
  "L01-V05",
  "L01-V06",
  "L01-V07",
  "L01-V08",
];
function toStudyWord(card: VocabCard): StudyWordWithTransfer {
  const difficulty = readDifficulty(card.difficulty);
  return {
    id: card.id,
    word: card.headword,
    partOfSpeech: card.pos,
    meaning: card.senseZh,
    example: card.exampleEn
      ? { english: card.exampleEn, chinese: card.exampleZh }
      : undefined,
    transferExample: card.transferEn
      ? { english: card.transferEn, chinese: card.transferZh }
      : undefined,
    ...(difficulty
      ? { difficulty: { tier: difficulty.tier, tierZh: difficulty.tierZh } }
      : {}),
  };
}
function wordsFromIds(ids: readonly string[]): StudyWordWithTransfer[] {
  return ids.map((id) => {
    const card = getCard(catalog.cardIndex, id);
    if (!card) throw new Error(`教材卡缺失：${id}`);
    return toStudyWord(card);
  });
}
export const wiringWords = wordsFromIds(selectedIds);
// Explicit supplemental group includes all eight cards, including the optional expression.
export const supplementalWords = catalog.supplementalCards.map(toStudyWord);
// Keep the original ten-card queue: do not grow it when later packs append to extensionCards.
export const extensionWords = wordsFromIds([
  ...NEW_SCENE_V4_CARD_IDS,
  ...NEW_READING_V3_CARD_IDS,
]);
export const sceneV5Words = wordsFromIds(NEW_SCENE_V5_CARD_IDS);
export const readingV4Words = wordsFromIds(NEW_READING_V4_CARD_IDS);
export const sceneV6Words = wordsFromIds(NEW_SCENE_V6_CARD_IDS);
export const readingV5Words = wordsFromIds(NEW_READING_V5_CARD_IDS);
export const sceneV7Words = wordsFromIds(NEW_SCENE_V7_CARD_IDS);
export const readingV6Words = wordsFromIds(NEW_READING_V6_CARD_IDS);
export const wordGroups = [
  { id: "basic" as const, title: "日常基础", words: wiringWords },
  {
    id: "daily-scenes-v3" as const,
    title: "订餐与购物",
    words: supplementalWords,
  },
  {
    id: "game-work-reading-v1" as const,
    title: "游戏、工作与阅读",
    words: extensionWords,
  },
  { id: "daily-scenes-v5" as const, title: "改乘与换店", words: sceneV5Words },
  {
    id: "daily-reading-v4" as const,
    title: "野餐与坐过站",
    words: readingV4Words,
  },
  {
    id: "daily-scenes-v6" as const,
    title: "快递与拿错杯",
    words: sceneV6Words,
  },
  {
    id: "daily-reading-v5" as const,
    title: "充电器与代收",
    words: readingV5Words,
  },
  { id: "daily-scenes-v7" as const, title: "退换与下楼", words: sceneV7Words },
  {
    id: "daily-reading-v6" as const,
    title: "电梯与改约",
    words: readingV6Words,
  },
];
export function isWordGroupId(id: unknown): id is WordGroupId {
  return wordGroups.some((group) => group.id === id);
}
export function wordsForGroup(
  groupId: WordGroupId = "basic",
): StudyWordWithTransfer[] {
  return wordGroups.find((group) => group.id === groupId)!.words;
}
export function studyWordById(id: string): StudyWordWithTransfer | undefined {
  return (
    wordGroups.flatMap((group) => group.words).find((card) => card.id === id) ??
    libraryWords.find((card) => card.id === id)
  );
}
export const libraryWords = catalog.libraryCards.map((card) => ({
  ...toStudyWord(card),
  notes: card.notesZh,
  partOfSpeech: card.posZh || card.pos,
}));
export const libraryWordEntries = catalog.libraryCards.map((card) => {
  const difficulty = readDifficulty(card.difficulty);
  return {
    id: card.id,
    title: card.headword,
    meaning: card.senseZh,
    partOfSpeech: card.posZh || card.pos,
    category: card.category,
    tags: [
      ...(card.tags ?? []),
      ...(difficulty ? [difficulty.tierZh, difficulty.tier] : []),
    ],
  };
});
export function isLibraryWordId(id: unknown): id is string {
  return typeof id === "string" && libraryWords.some((card) => card.id === id);
}
