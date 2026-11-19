export type CardId = string;
export type UnitId = string;
export type EncounterId = string;

export type CardPriority = 'primary' | 'optional' | string;
export type CardKind = 'vocab' | 'wordCard' | 'phrase' | 'expression' | string;
export type EncounterKind = 'v4-transfer' | 'cross-source' | 'new-snippet' | string;
export type TargetBinding = 'per-sentence' | 'per-example' | string;
export type SpanForm = 'exact' | 'variant' | string;
export type UnitType = 'review-sentence' | 'scene-line' | 'reading-paragraph' | string;

export type DifficultyTier = 'foundational' | 'everyday' | 'advanced';

export type DifficultyAnnotation = {
  tier: DifficultyTier;
  tierZh: '基础' | '常用' | '进阶';
  basisZh?: string;
  noteZh?: string;
  zipf?: number | null;
  availableTiers?: DifficultyTier[];
  availableTiersZh?: Array<'基础' | '常用' | '进阶'>;
  cardIdsByTier?: Partial<Record<DifficultyTier, string[]>>;
  recommendedMixIds?: string[];
  recommendedMixCounts?: Partial<Record<'基础' | '常用' | '进阶', number>>;
  mixPolicyZh?: string;
  bindingSourceZh?: string;
};

export type ExtraExample = {
  en: string;
  zh: string;
  sourcePack?: string;
  sourceRef?: string;
  foldedId?: string;
  setting?: string;
};

export type VocabCard = {
  id: CardId;
  headword: string;
  pos: string;
  posZh: string;
  senseZh: string;
  collocation?: string;
  exampleEn?: string;
  exampleZh?: string;
  transferEn?: string;
  transferZh?: string;
  notesZh?: string | null;
  extraExamples?: ExtraExample[];
  aliasIds?: CardId[];
  sourcePack?: string;
  sourceRef?: string;
  sourceTitle?: string;
  sourceRefs?: string[];
  sourceKey?: string;
  category?: string;
  tags?: string[];
  kind?: CardKind;
  priority?: CardPriority;
  standalone?: boolean;
  provenance?: string;
  lemmaFrequencySource?: {
    name: string;
    dataLicense?: string;
    codeLicense?: string;
    credit?: string;
    rank?: number | null;
    zipf?: number;
    extraction?: string;
  };
  glossAndExampleSource?: string;
  noCefrCertificate?: boolean;
  difficulty?: DifficultyAnnotation;
};

export type ReviewSentence = {
  en: string;
  zh: string;
  setting?: string;
  targetCardIds?: CardId[];
};

export type ReviewEncounter = {
  id: EncounterId;
  kind: EncounterKind;
  expression?: string;
  targetCardIds: CardId[];
  sourcePack?: string;
  sourceRef?: string;
  sentences: ReviewSentence[];
  noteZh?: string;
  optionalCheck?: boolean;
  provenance?: string;
  targetBinding?: TargetBinding;
  consumerNoteZh?: string;
};

export type ReviewPack = {
  id: string;
  title?: string;
  version: string;
  accessSpec?: unknown;
  cards: VocabCard[];
  reviewEncounters: ReviewEncounter[];
  [key: string]: unknown;
};

export type TextSpan = {
  start: number;
  end: number;
  surface: string;
  cardId: CardId;
  form?: SpanForm;
  priority?: string;
};

export type AnchorUnit = {
  id: UnitId;
  sourcePack?: string;
  sourceVersion?: string;
  unitType: UnitType;
  sourceId?: string;
  textEn: string;
  spans: TextSpan[];
  parentId?: string;
  encounterId?: EncounterId;
  sentenceIndex?: number;
};

export type AnchorsPack = {
  id: string;
  version: string;
  offsetSpec?: {
    indexBase?: number;
    endExclusive?: boolean;
    unit?: string;
    noteZh?: string;
  };
  units: AnchorUnit[];
  [key: string]: unknown;
};

export type CardIndex = {
  byId: Map<CardId, VocabCard>;
  aliasToCanonical: Map<CardId, CardId>;
};

export type TextSegment =
  | { type: 'text'; text: string }
  | {
      type: 'tap';
      text: string;
      start: number;
      end: number;
      cardId: CardId;
      surface: string;
      form?: SpanForm;
      priority?: string;
    };

export type CardRevealState = {
  senseOpen: boolean;
  examplesOpen: boolean;
  notesOpen: boolean;
};

/** The open card is identified by both the text unit and the card, never by cardId alone. */
export type ReviewExpandState = {
  unitId: UnitId;
  cardId: CardId;
} | null;

export type ReviewCardSession = {
  expanded: ReviewExpandState;
  reveal: CardRevealState;
};

export type ReviewSentenceView = {
  encounterId: EncounterId;
  sentenceIndex: number;
  unitId: UnitId;
  en: string;
  zh: string;
  setting?: string;
  targetCardIds: CardId[];
  spans: TextSpan[];
  segments: TextSegment[];
};

export type ReviewEncounterView = {
  id: EncounterId;
  kind: EncounterKind;
  expression?: string;
  noteZh?: string;
  optionalCheck: boolean;
  targetBinding?: TargetBinding;
  /** Union of sentence targets; compatibility only, do not apply to every sentence. */
  unionTargetCardIds: CardId[];
  sentences: ReviewSentenceView[];
};


export type SceneLine = {
  id: string;
  speaker: string;
  en: string;
  zh: string;
};

export type SceneNote = {
  id?: string;
  expression: string;
  meaningZh: string;
};

export type SceneEntry = {
  id: string;
  title: string;
  titleEn: string;
  levelSuggestionZh: string;
  settingZh: string;
  situationZh?: string;
  narratorNote?: string;
  lines: SceneLine[];
  notes: Array<SceneNote | string>;
  optionalTakeaways?: unknown[];
  optionalQuestions?: unknown[];
  spokenWordCount?: number;
  lineCount?: number;
  parentSceneId?: string;
  speakers?: Record<string, string>;
  difficulty?: DifficultyAnnotation;
};

export type SceneWordCard = {
  id: CardId;
  headword: string;
  pos: string;
  posZh?: string;
  senseZh: string;
  collocation?: string;
  exampleEn?: string;
  exampleZh?: string;
  transferEn?: string;
  transferZh?: string;
  notesZh?: string | null;
  extraExamples?: ExtraExample[];
  aliasIds?: CardId[];
  sourcePack?: string;
  sourceRef?: string;
  sourceKey?: string;
  category?: string;
  tags?: string[];
  sourceLine?: string;
  sourceScene?: string;
  sourceTitle?: string;
  kind?: CardKind;
  priority?: CardPriority;
  standalone?: boolean;
  provenance?: string;
  lemmaFrequencySource?: VocabCard['lemmaFrequencySource'];
  glossAndExampleSource?: string;
  noCefrCertificate?: boolean;
  difficulty?: DifficultyAnnotation;
};

export type SceneSourcePack = {
  id: string;
  version: string;
  scenes: SceneEntry[];
  wordCards?: SceneWordCard[];
};

export type ReadingSentence = {
  id?: string;
  en: string;
  zh: string;
  start?: number;
  end?: number;
};

export type ReadingParagraph = {
  id: string;
  en: string;
  zh: string;
  sentences?: ReadingSentence[];
};

export type ReadingSourceLink = {
  label: string;
  href: string;
};

/** Learner-visible attribution for licensed or adapted readings. */
export type ReadingSourceAttribution = {
  attributionEn: string;
  attributionZh: string;
  links: ReadingSourceLink[];
  changeEn: string;
  changeZh: string;
  translationEn: string;
  translationZh: string;
  noEndorsementEn: string;
  noEndorsementZh: string;
};

/** Structured source and license fields. Optional on original lessons. */
export type ReadingSourceRecord = {
  sourceType: 'external-adaptation' | 'original' | 'link-only' | string;
  sourceTitle: string;
  sourceSite: string;
  sourceArticleUrl: string;
  permanentRevisionUrl: string;
  sourceOldid?: number;
  revisionTimestamp?: string;
  historyUrl: string;
  contributorsAttribution: string;
  sourceLicense: string;
  sourceLicenseUrl: string;
  adaptedLicense: string;
};

export type ReadingEntry = {
  id: string;
  title: string;
  titleEn: string;
  levelSuggestionZh: string;
  paragraphs: ReadingParagraph[];
  notes?: Array<SceneNote | string>;
  narratorNote?: string;
  optionalTakeaways?: unknown[];
  optionalQuestions?: unknown[];
  wordCount?: number;
  wordCountEn?: number;
  targetWords?: number[];
  sourceAttribution?: ReadingSourceAttribution;
  source?: ReadingSourceRecord;
  endOfReadingAttribution?: { en: string; zh: string };
  changeNotice?: string;
  changeNoticeZh?: string;
  shareAlikeScope?: string;
  category?: string;
  tags?: string[];
  relatedSceneIds?: string[];
  topic?: string;
  sourceCategory?: string;
  textMode?: string;
  adaptedLicense?: string;
  difficulty?: DifficultyAnnotation;
};

export type ReadingSourcePack = {
  id: string;
  version?: string;
  readings: ReadingEntry[];
  wordCards?: SceneWordCard[];
};

/** Merged scenes + reading catalog. Review encounters stay on ReviewCatalog. */
export type LearningCatalog = {
  review: {
    reviewPack: ReviewPack;
    anchorsPack: AnchorsPack;
    cards: VocabCard[];
    cardIndex: CardIndex;
  };
  scenes: SceneEntry[];
  readings: ReadingEntry[];
  readingPack: ReadingSourcePack;
  anchorsPack: AnchorsPack;
  cards: VocabCard[];
  cardIndex: CardIndex;
  wiredScenePackIds: string[];
  unwiredScenePackIds: string[];
  /** Legacy field: the original wired reading pack, still everyday-reading-pack-v2.1. */
  wiredReadingPackId: string;
  /** All currently wired reading packs, including incremental supplements. */
  wiredReadingPackIds: string[];
};

/** Independent word-study catalog. Does not include review encounters. */
export type VocabCatalog = {
  /** 273 existing cards, then v3 eight, then later supplements; old ids and aliases unchanged. */
  cards: VocabCard[];
  cardIndex: CardIndex;
  /** Cards that can be studied on their own (standalone is not false). */
  studyCards: VocabCard[];
  /** Default new-card pool: study cards whose priority is not optional. */
  defaultQueueCards: VocabCard[];
  /** The eight v3 scene cards only, in pack order. Not later supplements. */
  supplementalCards: VocabCard[];
  /** Incremental cards after the original eight v3 supplements. */
  extensionCards: VocabCard[];
  /** Reviewed library words that are not a study-group queue. */
  libraryCards: VocabCard[];
  sourcePackIds: string[];
  extensionSourcePackIds: string[];
};

