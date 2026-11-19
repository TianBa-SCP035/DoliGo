import rawPracticeNov18 from "../content/optional-practice-nov18.json";
import rawLearningPathsNov18 from "../content/learning-paths-nov18.json";
import {
  PRACTICE_TYPES,
  type OptionalPracticeItem,
  type PracticeType,
} from "./OptionalPractice";

export type PracticeLookupItem = OptionalPracticeItem & {
  pathId?: string;
  after?: string;
  relatedCardIds?: string[];
};

export type PracticeLookupPack = {
  items?: readonly PracticeLookupItem[] | null;
};

export type PracticeLookupPath = {
  id?: string;
  sceneIds?: readonly string[] | null;
  sceneExtensionIds?: readonly string[] | null;
  readingIds?: readonly string[] | null;
  practiceIds?: readonly string[] | null;
};

export type PracticeLookupPathPack = {
  paths?: readonly PracticeLookupPath[] | null;
};

const defaultPack = rawPracticeNov18 as PracticeLookupPack;
const defaultPaths = rawLearningPathsNov18 as PracticeLookupPathPack;

function isPracticeType(value: unknown): value is PracticeType {
  return (PRACTICE_TYPES as readonly string[]).includes(String(value));
}

function asItem(raw: PracticeLookupItem): OptionalPracticeItem | undefined {
  if (!raw?.id || !isPracticeType(raw.type)) return undefined;
  return raw;
}

function packItems(
  pack: PracticeLookupPack | null | undefined = defaultPack,
): PracticeLookupItem[] {
  return (pack?.items ?? []).filter((item) => Boolean(asItem(item)));
}

/**
 * Optional practice already hung in the official pack.
 * App may still pass practiceItems; when it does, the view should keep that list.
 * This lookup does not write mastery, and it does not invent items for unlisted cards
 * or documents.
 */
export function practiceItemsForCard(
  cardId?: string | null,
  pack: PracticeLookupPack | null | undefined = defaultPack,
): OptionalPracticeItem[] {
  if (!cardId) return [];
  return packItems(pack)
    .filter(
      (item) =>
        item.after === "words" &&
        (item.relatedCardIds ?? []).includes(cardId),
    )
    .map((item) => asItem(item)!);
}

function pathContainsDocument(
  path: PracticeLookupPath,
  kind: "scene" | "reading",
  docId: string,
): boolean {
  if (kind === "reading") {
    return (path.readingIds ?? []).includes(docId);
  }
  return (
    (path.sceneIds ?? []).includes(docId) ||
    (path.sceneExtensionIds ?? []).includes(docId)
  );
}

/**
 * Scene or reading practice from hung learning paths.
 * A document only receives items tagged after that kind on a path that lists it.
 * Word-card items stay on the card page. Unknown documents get nothing.
 */
export function practiceItemsForDocument(
  kind: "scene" | "reading",
  docId?: string | null,
  pack: PracticeLookupPack | null | undefined = defaultPack,
  paths: PracticeLookupPathPack | null | undefined = defaultPaths,
): OptionalPracticeItem[] {
  if ((kind !== "scene" && kind !== "reading") || !docId) return [];
  const matchingPaths = (paths?.paths ?? []).filter((path) =>
    pathContainsDocument(path, kind, docId),
  );
  if (!matchingPaths.length) return [];
  const pathIds = new Set(
    matchingPaths.map((path) => path.id).filter((id): id is string => Boolean(id)),
  );
  const allowedIds = new Set(
    matchingPaths.flatMap((path) => path.practiceIds ?? []),
  );
  const hasAllowlist = allowedIds.size > 0;
  const seen = new Set<string>();
  const out: OptionalPracticeItem[] = [];
  for (const item of packItems(pack)) {
    if (item.after !== kind) continue;
    if (!item.pathId || !pathIds.has(item.pathId)) continue;
    if (hasAllowlist && !allowedIds.has(item.id)) continue;
    if (seen.has(item.id)) continue;
    const normalized = asItem(item);
    if (!normalized) continue;
    seen.add(item.id);
    out.push(normalized);
  }
  return out;
}
