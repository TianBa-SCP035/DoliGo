import rawLearningPathsNov18 from "../content/learning-paths-nov18.json";
import {
  orderedSceneFamilyItems,
  type DifficultyLinkCatalog,
  type DifficultyLinkDoc,
} from "./difficulty-links-lookup";

export type NextDocumentLink = {
  id: string;
  title: string;
  route: string;
  kind: "scene" | "reading";
};

export type NextDocumentCatalog = DifficultyLinkCatalog & {
  readings?: readonly DifficultyLinkDoc[];
};

export type NextDocumentPath = {
  sceneIds?: readonly string[] | null;
  sceneExtensionIds?: readonly string[] | null;
  readingIds?: readonly string[] | null;
};

export type NextDocumentPathPack = {
  paths?: readonly NextDocumentPath[] | null;
};

const defaultPaths = rawLearningPathsNov18 as NextDocumentPathPack;

function routeFor(kind: "scene" | "reading", id: string): string {
  return kind === "scene" ? `#/scenes/${id}` : `#/reading/${id}`;
}

function catalogDoc(
  catalog: NextDocumentCatalog,
  kind: "scene" | "reading",
  id: string,
): DifficultyLinkDoc | undefined {
  const list = kind === "scene" ? catalog.scenes : (catalog.readings ?? []);
  return list.find((doc) => doc.id === id);
}

function asLink(
  catalog: NextDocumentCatalog,
  kind: "scene" | "reading",
  id: string,
): NextDocumentLink | undefined {
  const doc = catalogDoc(catalog, kind, id);
  if (!doc?.id || !doc.title) return undefined;
  return { id: doc.id, title: doc.title, route: routeFor(kind, doc.id), kind };
}

function pathSequence(
  path: NextDocumentPath,
  catalog: NextDocumentCatalog,
): NextDocumentLink[] {
  const seen = new Set<string>();
  const out: NextDocumentLink[] = [];
  const entries: { kind: "scene" | "reading"; id: string }[] = [
    ...(path.sceneIds ?? []).map((id) => ({ kind: "scene" as const, id })),
    ...(path.sceneExtensionIds ?? []).map((id) => ({
      kind: "scene" as const,
      id,
    })),
    ...(path.readingIds ?? []).map((id) => ({ kind: "reading" as const, id })),
  ];
  for (const entry of entries) {
    if (seen.has(entry.id)) continue;
    const link = asLink(catalog, entry.kind, entry.id);
    if (!link) continue;
    seen.add(entry.id);
    out.push(link);
  }
  return out;
}

function nextInFamily(
  catalog: NextDocumentCatalog,
  kind: "scene" | "reading",
  docId: string,
): NextDocumentLink | undefined {
  if (kind !== "scene") return undefined;
  const family = orderedSceneFamilyItems(catalog, docId);
  const index = family.findIndex((item) => item.id === docId);
  if (index < 0) return undefined;
  const next = family[index + 1];
  if (!next) return undefined;
  return {
    id: next.id,
    title: next.title,
    route: next.route,
    kind: "scene",
  };
}

function nextInPath(
  catalog: NextDocumentCatalog,
  kind: "scene" | "reading",
  docId: string,
  paths: NextDocumentPathPack | null | undefined,
): NextDocumentLink | undefined {
  for (const path of paths?.paths ?? []) {
    const sequence = pathSequence(path, catalog);
    const index = sequence.findIndex((item) => item.id === docId);
    if (index < 0) continue;
    return sequence[index + 1];
  }
  return undefined;
}

/**
 * After the current scene or reading, offer one next document.
 * Prefer the next official piece in the same scene family; otherwise the next
 * hung item on a learning path that already lists this document.
 * IDs missing from the live catalog are skipped. The list does not wrap.
 * This lookup does not write progress or invent a filter bar.
 */
export function nextDocumentForDocument(
  catalog: NextDocumentCatalog,
  kind: "scene" | "reading",
  docId?: string | null,
  paths: NextDocumentPathPack | null | undefined = defaultPaths,
): NextDocumentLink | undefined {
  if ((kind !== "scene" && kind !== "reading") || !docId) return undefined;
  return (
    nextInFamily(catalog, kind, docId) ??
    nextInPath(catalog, kind, docId, paths)
  );
}
