import type { StorageLike } from "../lib/progress/types";

export const RECALL_SPACING_KEY = "doliguo:refactor:sandbox:recall-spacing:v1";

export const RECALL_RATINGS = ["forgotten", "vague", "remembered"] as const;
export type RecallRating = (typeof RECALL_RATINGS)[number];

export const RECALL_BUTTONS = [
  { id: "forgotten" as const, labelZh: "完全不记得" },
  { id: "vague" as const, labelZh: "很模糊猜到了" },
  { id: "remembered" as const, labelZh: "我记得" },
];

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
export const RECALL_INTERVALS_MS = {
  forgotten: 10 * MINUTE,
  vague: 1 * DAY,
  rememberedFirst: 3 * DAY,
  rememberedFactor: 2.5,
  rememberedMax: 90 * DAY,
} as const;

export type RecallRecord = {
  rating: RecallRating;
  intervalMs: number;
  nextDueAt: number;
  updatedAt: number;
  repetitions: number;
};

export type RecallSpacingStore = {
  version: 1;
  kind: "doliguo-refactor-sandbox-recall-spacing";
  targets: Record<string, RecallRecord>;
};

export type RecallResult =
  | { ok: true; store: RecallSpacingStore }
  | { ok: false; error: string };

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function isRating(value: unknown): value is RecallRating {
  return value === "forgotten" || value === "vague" || value === "remembered";
}

function isStore(value: unknown): value is RecallSpacingStore {
  if (!record(value) || value.version !== 1 || value.kind !== "doliguo-refactor-sandbox-recall-spacing") {
    return false;
  }
  if (!record(value.targets)) return false;
  return Object.values(value.targets).every((item) => {
    if (!record(item) || !isRating(item.rating)) return false;
    return (
      typeof item.intervalMs === "number" &&
      typeof item.nextDueAt === "number" &&
      typeof item.updatedAt === "number" &&
      typeof item.repetitions === "number"
    );
  });
}

export function emptyRecallStore(): RecallSpacingStore {
  return {
    version: 1,
    kind: "doliguo-refactor-sandbox-recall-spacing",
    targets: {},
  };
}

export function loadRecallStore(storage: StorageLike): RecallResult {
  try {
    const raw = storage.getItem(RECALL_SPACING_KEY);
    if (raw === null) return { ok: true, store: emptyRecallStore() };
    const parsed: unknown = JSON.parse(raw);
    if (!isStore(parsed)) {
      return { ok: false, error: "复习间隔记录格式无效，原记录已保留。" };
    }
    return { ok: true, store: parsed };
  } catch {
    return { ok: false, error: "无法读取复习间隔记录，原记录未改动。" };
  }
}

function nextInterval(previous: RecallRecord | undefined, rating: RecallRating): number {
  if (rating === "forgotten") return RECALL_INTERVALS_MS.forgotten;
  if (rating === "vague") return RECALL_INTERVALS_MS.vague;
  if (!previous || previous.rating !== "remembered") {
    return RECALL_INTERVALS_MS.rememberedFirst;
  }
  return Math.min(
    Math.round(previous.intervalMs * RECALL_INTERVALS_MS.rememberedFactor),
    RECALL_INTERVALS_MS.rememberedMax,
  );
}

/**
 * Record an explicit self-rating only. Viewing a meaning or answer must not
 * call this function, and this store never writes a mastery flag.
 */
export function recordRecall(
  storage: StorageLike,
  targetId: string,
  rating: RecallRating,
  now = Date.now(),
): RecallResult {
  if (!targetId || !isRating(rating)) {
    return { ok: false, error: "自评无效，未保存。" };
  }
  const loaded = loadRecallStore(storage);
  if (!loaded.ok) return loaded;
  const previous = loaded.store.targets[targetId];
  const intervalMs = nextInterval(previous, rating);
  const next: RecallSpacingStore = {
    ...loaded.store,
    targets: {
      ...loaded.store.targets,
      [targetId]: {
        rating,
        intervalMs,
        nextDueAt: now + intervalMs,
        updatedAt: now,
        repetitions: (previous?.repetitions ?? 0) + 1,
      },
    },
  };
  try {
    storage.setItem(RECALL_SPACING_KEY, JSON.stringify(next));
    return { ok: true, store: next };
  } catch {
    return { ok: false, error: "保存失败，间隔记录未被替换。" };
  }
}

/** Only previously rated targets. Does not reset or replace the 273-card review queue. */
export function dueRecallIds(
  storage: StorageLike,
  candidateIds: readonly string[] = [],
  now = Date.now(),
): string[] {
  const loaded = loadRecallStore(storage);
  if (!loaded.ok) return [];
  const known = candidateIds.length
    ? candidateIds
    : Object.keys(loaded.store.targets);
  return known.filter((id) => {
    const item = loaded.store.targets[id];
    return item && item.nextDueAt <= now;
  });
}

/** Stable-sort an existing review list: due rated items first, original order otherwise. */
export function prioritizeReviewIds(
  existingIds: readonly string[],
  storage: StorageLike,
  now = Date.now(),
): string[] {
  const due = new Set(dueRecallIds(storage, existingIds, now));
  return [
    ...existingIds.filter((id) => due.has(id)),
    ...existingIds.filter((id) => !due.has(id)),
  ];
}
