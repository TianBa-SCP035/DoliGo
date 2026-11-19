/**
 * Review and in-text card helpers for 七号 to merge into shared pages.
 * Import from `src/lib/review`. See ./README.md for the integration contract.
 * Pure functions only: no React, no DOM, no storage, no progress writes.
 */

export type {
  AnchorUnit,
  AnchorsPack,
  CardId,
  CardIndex,
  CardKind,
  CardPriority,
  CardRevealState,
  EncounterId,
  EncounterKind,
  ExtraExample,
  ReviewCardSession,
  ReviewEncounter,
  ReviewEncounterView,
  ReviewExpandState,
  ReviewPack,
  ReviewSentence,
  ReviewSentenceView,
  TargetBinding,
  TextSegment,
  TextSpan,
  UnitId,
  UnitType,
  VocabCard,
  SceneLine,
  SceneNote,
  SceneEntry,
  SceneWordCard,
  SceneSourcePack,
  ReadingParagraph,
  ReadingSentence,
  ReadingEntry,
  ReadingSourceAttribution,
  ReadingSourceLink,
  ReadingSourceRecord,
  ReadingSourcePack,
  LearningCatalog,
  VocabCatalog,
  DifficultyAnnotation,
  DifficultyTier,
} from './types';

export { anchorsPack, loadReviewCatalog, reviewPack } from './content';
export type { ReviewCatalog } from './content';

export {
  BULK_READY_VOCAB_CARD_IDS,
  DEPTH_NOV16_READING_IDS,
  DEPTH_NOV16_SCENE_IDS,
  DEPTH_NOV16_VOCAB_CARD_IDS,
  DEPTH_NOV18_READING_IDS,
  DEPTH_NOV18_SCENE_IDS,
  DEPTH_NOV18_VOCAB_CARD_IDS,
  LIBRARY_VOCAB_CARD_IDS,
  CONTENT_CARD_GROUPS,
  MERGED_ANCHORS_PACK_ID,
  NEW_READING_V3_CARD_IDS,
  NEW_READING_V4_CARD_IDS,
  NEW_READING_V5_CARD_IDS,
  NEW_READING_V6_CARD_IDS,
  NEW_SCENE_CARD_IDS,
  NEW_SCENE_V4_CARD_IDS,
  NEW_SCENE_V5_CARD_IDS,
  NEW_SCENE_V6_CARD_IDS,
  NEW_SCENE_V7_CARD_IDS,
  UNWIRED_SCENE_PACK_IDS,
  VOCAB_EXTENSION_PACK_IDS,
  VOCAB_SOURCE_PACK_IDS,
  WIRED_READING_PACK_ID,
  WIRED_READING_PACK_IDS,
  WIRED_SCENE_PACK_IDS,
  appendUniqueCards,
  findReading,
  findScene,
  isDefaultVocabQueueCard,
  loadLearningCatalog,
  loadSceneCatalog,
  loadVocabCatalog,
  mergeAnchorUnits,
  sceneCardToVocabCard,
  topicVocabularyDepthNov16,
  topicVocabularyDepthNov18,
  difficultyTiersNov18,
  learningPathsNov18,
  optionalPracticePackNov18,
  readDifficulty,
} from './catalog';

export { getCard, indexCards, resolveCardId } from './cards';

export { exampleTargetCardIds, isPerSentenceBinding, sentenceTargetCardIds } from './targets';
export type { ExampleWithTargets } from './targets';

export {
  REVIEW_UNIT_ID_PREFIX,
  cardIdAtCodePoint,
  codePoints,
  findReviewUnit,
  findUnitById,
  reviewSentenceUnitId,
  segmentsForUnit,
  sliceByCodePoints,
  spanSurfaceMatches,
} from './anchors';

export {
  SELF_MARK_LABELS,
  VIEWING_IS_NOT_MASTERY,
  canRevealDetails,
  hideSense,
  initialCardReveal,
  revealSense,
  toggleExamples,
  toggleNotes,
} from './reveal';

export {
  closeCard,
  closeCardSession,
  createReviewCardSession,
  createReviewExpandState,
  isCardExpandedAt,
  openCardAt,
  openCardSession,
  toggleCardAt,
  toggleCardSession,
  updateReveal,
} from './expand';

export { buildReviewEncounterView, getReviewEncounter } from './view';

export {
  REVIEW_SESSION_KEY, createReviewSession, loadReviewSession, currentReviewEncounterId,
  advanceReviewSession, restartReviewSession, saveReviewSession, commitReviewAdvance, commitReviewRestart,
} from './session';
export type { ReviewStorage, ReviewSelfMark, ReviewSession, ReviewSessionResult } from './session';
