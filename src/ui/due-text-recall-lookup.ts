import { loadRecallStore, type RecallSpacingStore } from "../adapters/memory-spacing";
import { loadLearningCatalog } from "../lib/review";
import type { DifficultyMark } from "./difficulty-ui";
import { isDifficultyTier } from "./difficulty-ui";
import type { DueReviewItem } from "./ReviewDueList";

export const REVIEW_OPEN_UNIT_KEY = "doliguo:refactor:sandbox:review-open-unit:v1";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};

export type ReviewOpenUnit = {
  documentId: string;
  unitId: string;
  openedAt: number;
};

export type CatalogUnit = {
  id?: string;
  en?: string;
  zh?: string;
};

export type CatalogDocument = {
  id: string;
  title?: string;
  difficulty?: DifficultyMark;
  lines?: readonly CatalogUnit[] | null;
  paragraphs?: readonly CatalogUnit[] | null;
};

export type TextRecallCatalog = {
  scenes?: readonly CatalogDocument[] | null;
  readings?: readonly CatalogDocument[] | null;
};

export type ResolvedTextUnit = {
  id: string;
  documentId: string;
  documentTitle: string;
  kind: "sentence" | "paragraph";
  route: string;
  title: string;
  difficulty?: DifficultyMark;
};

type RecallTarget = {
  nextDueAt: number;
};

function difficultyMark(value: CatalogDocument["difficulty"]): DifficultyMark | undefined {
  if (!value || !isDifficultyTier(value.tier)) return undefined;
  return value;
}

function previewText(en: string | undefined, fallback: string): string {
  const compact = (en ?? "").replace(/\s+/g, " ").trim();
  if (!compact) return fallback;
  return compact.length > 28 ? `${compact.slice(0, 28)}…` : compact;
}

function indexDocuments(
  documents: readonly CatalogDocument[] | null | undefined,
  kind: "sentence" | "paragraph",
  entry: "scenes" | "reading",
  unitsOf: (doc: CatalogDocument) => readonly CatalogUnit[] | null | undefined,
  unique: Map<string, ResolvedTextUnit>,
  ambiguous: Set<string>,
) {
  for (const doc of documents ?? []) {
    if (!doc?.id) continue;
    const units = unitsOf(doc) ?? [];
    units.forEach((unit, index) => {
      if (!unit?.id) return;
      if (ambiguous.has(unit.id)) return;
      const existing = unique.get(unit.id);
      if (existing && existing.documentId !== doc.id) {
        unique.delete(unit.id);
        ambiguous.add(unit.id);
        return;
      }
      const ordinal = kind === "paragraph" ? `第 ${index + 1} 段` : `第 ${index + 1} 句`;
      const documentTitle = doc.title?.trim() || doc.id;
      unique.set(unit.id, {
        id: unit.id,
        documentId: doc.id,
        documentTitle,
        kind,
        route: `#/${entry}/${encodeURIComponent(doc.id)}`,
        title: `${documentTitle} · ${previewText(unit.en, ordinal)}`,
        difficulty: difficultyMark(doc.difficulty),
      });
    });
  }
}

export function indexTextRecallUnits(catalog: TextRecallCatalog): Map<string, ResolvedTextUnit> {
  const unique = new Map<string, ResolvedTextUnit>();
  const ambiguous = new Set<string>();
  indexDocuments(catalog.scenes, "sentence", "scenes", (doc) => doc.lines, unique, ambiguous);
  indexDocuments(
    catalog.readings,
    "paragraph",
    "reading",
    (doc) => doc.paragraphs,
    unique,
    ambiguous,
  );
  return unique;
}

export function textRecallItemsFromStore(
  targets: Record<string, RecallTarget>,
  units: Map<string, ResolvedTextUnit>,
  skipIds: Iterable<string> = [],
): DueReviewItem[] {
  const skip = new Set(skipIds);
  const items: DueReviewItem[] = [];
  for (const [id, record] of Object.entries(targets)) {
    if (!id || skip.has(id) || typeof record?.nextDueAt !== "number") continue;
    const unit = units.get(id);
    if (!unit) continue;
    items.push({
      id: unit.id,
      title: unit.title,
      kind: unit.kind,
      dueAt: record.nextDueAt,
      difficulty: unit.difficulty,
      documentId: unit.documentId,
      route: unit.route,
    });
  }
  return items;
}

function emptyTargets(): Record<string, RecallTarget> {
  return {};
}

function targetsFromStore(store: RecallSpacingStore | undefined): Record<string, RecallTarget> {
  if (!store?.targets) return emptyTargets();
  return store.targets;
}

/**
 * App.dueRecallItems only keeps word cards. When the review list is shown,
 * this lookup adds previously rated scene lines and reading paragraphs from
 * the same sandbox spacing store. Ambiguous bare ids are skipped.
 */
export function lookupDueTextRecallItems(
  options: {
    recallStorage?: StorageLike | null;
    catalog?: TextRecallCatalog | null;
    skipIds?: Iterable<string>;
  } = {},
): DueReviewItem[] {
  try {
    const storage = options.recallStorage ?? (typeof localStorage === "undefined" ? null : localStorage);
    if (!storage) return [];
    const loaded = loadRecallStore(storage);
    if (!loaded.ok) return [];
    const catalog = options.catalog ?? (loadLearningCatalog() as TextRecallCatalog);
    return textRecallItemsFromStore(
      targetsFromStore(loaded.store),
      indexTextRecallUnits(catalog),
      options.skipIds,
    );
  } catch {
    return [];
  }
}

const reviewOpenMemory = new Map<string, ReviewOpenUnit>();
export const REVIEW_OPEN_UNIT_TTL_MS = 15_000;

function asReviewOpenUnit(value: unknown): ReviewOpenUnit | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const hint = value as ReviewOpenUnit;
  if (!hint.documentId || typeof hint.unitId !== "string") return undefined;
  return {
    documentId: hint.documentId,
    unitId: hint.unitId,
    openedAt: typeof hint.openedAt === "number" ? hint.openedAt : Date.now(),
  };
}

function isFresh(hint: ReviewOpenUnit, now: number): boolean {
  return now - hint.openedAt <= REVIEW_OPEN_UNIT_TTL_MS;
}

export function writeReviewOpenUnit(
  storage: StorageLike | null | undefined,
  hint: ReviewOpenUnit,
): boolean {
  if (!hint.documentId || !hint.unitId) return false;
  const next = {
    documentId: hint.documentId,
    unitId: hint.unitId,
    openedAt: hint.openedAt,
  };
  reviewOpenMemory.set(hint.documentId, next);
  if (!storage) return true;
  try {
    storage.setItem(REVIEW_OPEN_UNIT_KEY, JSON.stringify(next));
    return true;
  } catch {
    return true;
  }
}

export function peekReviewOpenUnit(
  storage: StorageLike | null | undefined,
  documentId: string,
  now = Date.now(),
): ReviewOpenUnit | undefined {
  if (!documentId) return undefined;
  const fromMemory = reviewOpenMemory.get(documentId);
  if (fromMemory) return isFresh(fromMemory, now) ? fromMemory : undefined;
  if (!storage) return undefined;
  try {
    const raw = storage.getItem(REVIEW_OPEN_UNIT_KEY);
    if (!raw) return undefined;
    const parsed = asReviewOpenUnit(JSON.parse(raw));
    if (!parsed || parsed.documentId !== documentId || !isFresh(parsed, now)) {
      return undefined;
    }
    reviewOpenMemory.set(documentId, parsed);
    return parsed;
  } catch {
    return undefined;
  }
}

/** @deprecated Use peekReviewOpenUnit; kept so a one-shot read still works in tests. */
export function takeReviewOpenUnit(
  storage: StorageLike | null | undefined,
  documentId: string,
  now = Date.now(),
): ReviewOpenUnit | undefined {
  return peekReviewOpenUnit(storage, documentId, now);
}

export function clearReviewOpenUnit(
  storage: StorageLike | null | undefined,
  documentId?: string,
): void {
  if (documentId) reviewOpenMemory.delete(documentId);
  else reviewOpenMemory.clear();
  try {
    storage?.removeItem?.(REVIEW_OPEN_UNIT_KEY);
  } catch {
    // Ignore storage failures; the in-memory hint is already cleared.
  }
}

export function initialUnitCursor(
  unitIds: readonly string[],
  hintedUnitId?: string | null,
  savedUnitId?: string | null,
): number {
  if (hintedUnitId) {
    const hinted = unitIds.indexOf(hintedUnitId);
    if (hinted >= 0) return hinted;
  }
  if (savedUnitId) {
    const saved = unitIds.indexOf(savedUnitId);
    if (saved >= 0) return saved;
  }
  return 0;
}

export function openDueTextRoute(item: DueReviewItem, storage: StorageLike | null | undefined = typeof sessionStorage === "undefined" ? null : sessionStorage) {
  if (item.kind === "word" || !item.route || !item.documentId) return;
  writeReviewOpenUnit(storage, {
    documentId: item.documentId,
    unitId: item.id,
    openedAt: Date.now(),
  });
  if (typeof location !== "undefined" && location.hash !== item.route) {
    location.hash = item.route;
  }
}
