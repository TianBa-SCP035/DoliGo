import { hashForEntry } from "./routes";
import {
  isLibraryWordId,
  isWordGroupId,
  wordGroups,
} from "./wiring-words";
import type { WordGroupId } from "./wiring-words";
import {
  getCard,
  loadLearningCatalog,
  readDifficulty,
  topicVocabularyDepthNov16,
  topicVocabularyDepthNov18,
} from "../lib/review";
import type { DifficultyAnnotation, LearningCatalog } from "../lib/review";

export const TOPIC_IDS = [
  "shopping",
  "dining",
  "travel",
  "home",
  "game",
  "formal",
  "spoken",
] as const;

export type TopicId = (typeof TOPIC_IDS)[number];

export const TOPIC_LABELS: Record<
  TopicId,
  { titleZh: string; titleEn: string }
> = {
  shopping: { titleZh: "购物", titleEn: "Shopping" },
  dining: { titleZh: "餐饮", titleEn: "Dining" },
  travel: { titleZh: "出行", titleEn: "Travel" },
  home: { titleZh: "居家", titleEn: "Home" },
  game: { titleZh: "游戏", titleEn: "Games" },
  formal: { titleZh: "正式书面", titleEn: "Formal writing" },
  spoken: { titleZh: "口语短句", titleEn: "Spoken phrases" },
};

/** Caps for related-item copies only. topicLinks() stays a full catalog. */
export const RELATED_OPEN_CARD_LIMIT = 3;
export const RELATED_NOTED_CARD_LIMIT = 2;
export const RELATED_SCENE_LIMIT = 2;
export const RELATED_READING_LIMIT = 1;

export function isTopicId(id: unknown): id is TopicId {
  return typeof id === "string" && (TOPIC_IDS as readonly string[]).includes(id);
}

export type TopicCardOpenAs =
  | "library-card"
  | "group-queue-card"
  | "catalog-only";

export type TopicCardRef = {
  id: string;
  headword: string;
  meaning: string;
  openAs: TopicCardOpenAs;
  /** Set only when the existing single-card route can open this card. */
  route?: string;
  groupIds: WordGroupId[];
  difficulty?: Pick<DifficultyAnnotation, "tier" | "tierZh">;
};

export type TopicTextRef = {
  id: string;
  title: string;
  titleEn: string;
  route: string;
  relatedSceneIds?: string[];
  difficulty?: Pick<DifficultyAnnotation, "tier" | "tierZh">;
};

export type TopicLink = {
  /** Catalog topics use TopicId. Related copies may use a word-group id such as basic. */
  id: TopicId | WordGroupId;
  titleZh: string;
  titleEn: string;
  /** Topic references are not a tenth study-group queue. */
  isStudyGroup: false;
  cards: TopicCardRef[];
  scenes: TopicTextRef[];
  readings: TopicTextRef[];
  /** Optional path hint only. Never a prerequisite or default filter. */
  suggestedOrder: readonly ["words", "scenes", "reading"];
};

const SUGGESTED_ORDER = ["words", "scenes", "reading"] as const;

let cached: readonly TopicLink[] | undefined;

function mark(
  value: unknown,
): Pick<DifficultyAnnotation, "tier" | "tierZh"> | undefined {
  const difficulty = readDifficulty(value);
  return difficulty
    ? { tier: difficulty.tier, tierZh: difficulty.tierZh }
    : undefined;
}

function unique(ids: readonly string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function cardRef(cardId: string, catalog: LearningCatalog): TopicCardRef {
  const card = getCard(catalog.cardIndex, cardId);
  if (!card) throw new Error(`主题引用缺少词卡：${cardId}`);
  const groupIds = wordGroups
    .filter((group) => group.words.some((word) => word.id === cardId))
    .map((group) => group.id);
  const difficulty = mark(card.difficulty);
  if (isLibraryWordId(cardId)) {
    return {
      id: cardId,
      headword: card.headword,
      meaning: card.senseZh,
      openAs: "library-card",
      route: hashForEntry("words", cardId),
      groupIds,
      difficulty,
    };
  }
  return {
    id: cardId,
    headword: card.headword,
    meaning: card.senseZh,
    openAs: groupIds.length ? "group-queue-card" : "catalog-only",
    groupIds,
    difficulty,
  };
}

function nov16CardIds(id: TopicId): string[] {
  return topicVocabularyDepthNov16.topicCardIds[id] ?? [];
}

function nov18CardIds(id: TopicId): string[] {
  return topicVocabularyDepthNov18.topicCardIds[id] ?? [];
}

function sceneIdsForTopic(id: TopicId): string[] {
  const fromNov16 = topicVocabularyDepthNov16.topicBindings[id] ?? [];
  const binding = topicVocabularyDepthNov18.topicBindings[id];
  const fromNov18 = [
    ...(binding?.sceneIds ?? []),
    ...(binding?.sceneExtensionIds ?? []),
  ];
  return unique([...fromNov16, ...fromNov18]);
}

function readingIdsForTopic(id: TopicId, catalog: LearningCatalog): string[] {
  const byTopic = catalog.readings
    .filter((reading) => reading.topic === id)
    .map((reading) => reading.id);
  const authored = topicVocabularyDepthNov18.topicBindings[id]?.readingIds ?? [];
  return unique([...authored, ...byTopic]);
}

function buildTopicLink(id: TopicId, catalog: LearningCatalog): TopicLink {
  const cardIds = unique([...nov16CardIds(id), ...nov18CardIds(id)]);
  return {
    id,
    ...TOPIC_LABELS[id],
    isStudyGroup: false,
    cards: cardIds.map((cardId) => cardRef(cardId, catalog)),
    scenes: sceneIdsForTopic(id).flatMap((sceneId) => {
      const scene = catalog.scenes.find((entry) => entry.id === sceneId);
      if (!scene) return [];
      return [
        {
          id: scene.id,
          title: scene.title,
          titleEn: scene.titleEn,
          route: hashForEntry("scenes", scene.id),
          difficulty: mark(scene.difficulty),
        },
      ];
    }),
    readings: readingIdsForTopic(id, catalog).flatMap((readingId) => {
      const reading = catalog.readings.find((entry) => entry.id === readingId);
      if (!reading) return [];
      return [
        {
          id: reading.id,
          title: reading.title,
          titleEn: reading.titleEn,
          route: hashForEntry("reading", reading.id),
          relatedSceneIds: reading.relatedSceneIds
            ? [...reading.relatedSceneIds]
            : undefined,
          difficulty: mark(reading.difficulty),
        },
      ];
    }),
    suggestedOrder: SUGGESTED_ORDER,
  };
}

type RelatedExclude = {
  cardIds?: readonly string[];
  sceneIds?: readonly string[];
  readingIds?: readonly string[];
};

function relatedCopy(topic: TopicLink, exclude: RelatedExclude = {}): TopicLink {
  const skipCards = new Set(exclude.cardIds ?? []);
  const skipScenes = new Set(exclude.sceneIds ?? []);
  const skipReadings = new Set(exclude.readingIds ?? []);
  let openCards = 0;
  let notedCards = 0;
  const cards = topic.cards.filter((card) => {
    if (skipCards.has(card.id)) return false;
    if (card.route) {
      if (openCards >= RELATED_OPEN_CARD_LIMIT) return false;
      openCards += 1;
      return true;
    }
    if (notedCards >= RELATED_NOTED_CARD_LIMIT) return false;
    notedCards += 1;
    return true;
  });
  return {
    ...topic,
    cards,
    scenes: topic.scenes.filter((scene) => !skipScenes.has(scene.id)).slice(0, RELATED_SCENE_LIMIT),
    readings: topic.readings
      .filter((reading) => !skipReadings.has(reading.id))
      .slice(0, RELATED_READING_LIMIT),
  };
}

/** Read-only topic associations from existing packs. Does not create groups. */
export function topicLinks(): readonly TopicLink[] {
  if (!cached) {
    const catalog = loadLearningCatalog();
    cached = Object.freeze(TOPIC_IDS.map((id) => buildTopicLink(id, catalog)));
  }
  return cached;
}

export function topicLinkById(id: string): TopicLink | undefined {
  return topicLinks().find((topic) => topic.id === id);
}

const WORD_GROUP_TITLE_EN: Partial<Record<WordGroupId, string>> = {
  basic: "Everyday basics",
};

function wordGroupTopicLink(groupId: WordGroupId): TopicLink {
  const group = wordGroups.find((entry) => entry.id === groupId);
  if (!group) {
    throw new Error(`缺少词组：${groupId}`);
  }
  const catalog = loadLearningCatalog();
  return {
    id: group.id,
    titleZh: group.title,
    titleEn: WORD_GROUP_TITLE_EN[group.id] ?? group.title,
    isStudyGroup: false,
    cards: group.words.map((word) => cardRef(word.id, catalog)),
    scenes: [],
    readings: [],
    suggestedOrder: SUGGESTED_ORDER,
  };
}

export function topicLinksForCard(cardId: string): TopicLink[] {
  const fromTopics = topicLinks()
    .filter((topic) => topic.cards.some((card) => card.id === cardId))
    .map((topic) => relatedCopy(topic, { cardIds: [cardId] }));
  if (fromTopics.length) return fromTopics;
  const group = wordGroups.find((entry) =>
    entry.words.some((word) => word.id === cardId),
  );
  if (!group) return [];
  return [relatedCopy(wordGroupTopicLink(group.id), { cardIds: [cardId] })];
}

export function topicLinksForScene(sceneId: string): TopicLink[] {
  return topicLinks()
    .filter((topic) => topic.scenes.some((scene) => scene.id === sceneId))
    .map((topic) => relatedCopy(topic, { sceneIds: [sceneId] }));
}

export function topicLinksForReading(readingId: string): TopicLink[] {
  return topicLinks()
    .filter((topic) => topic.readings.some((reading) => reading.id === readingId))
    .map((topic) => relatedCopy(topic, { readingIds: [readingId] }));
}

export function topicLinksForWordGroup(groupId: WordGroupId): TopicLink[] {
  if (!isWordGroupId(groupId)) return [];
  const group = wordGroups.find((entry) => entry.id === groupId);
  const ids = new Set(group?.words.map((word) => word.id));
  if (!group || !ids.size) return [];
  // The basic queue should relate to itself, not inherit a theme from one reused card.
  if (groupId === "basic") {
    return [relatedCopy(wordGroupTopicLink("basic"), { cardIds: [] })];
  }
  return topicLinks()
    .filter((topic) => topic.cards.some((card) => ids.has(card.id)))
    .map((topic) => relatedCopy(topic, { cardIds: [...ids] }));
}
