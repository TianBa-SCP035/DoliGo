import { isWordGroupId, isLibraryWordId, studyWordById } from "./wiring-words";
import type { WordGroupId } from "./wiring-words";
import type { LearningEntry } from "../ui/LearningViews";
export type AppPage = "home" | LearningEntry;
export const AVAILABLE_ENTRIES: readonly LearningEntry[] = [
  "words",
  "scenes",
  "reading",
  "review",
];
export function pageFromHash(hash: string): AppPage {
  const segment = hash.replace(/^#/, "").split("/")[1];
  return AVAILABLE_ENTRIES.includes(segment as LearningEntry)
    ? (segment as LearningEntry)
    : "home";
}
export function isStudyWordCardId(id: string | undefined): id is string {
  return Boolean(id) && !isWordGroupId(id) && Boolean(studyWordById(id));
}

export function hashForEntry(
  entry: LearningEntry,
  documentId?: string,
): string {
  const base = "#/" + entry;
  if (entry === "words" && documentId === "library") return "#/words/library";
  if (entry === "words" && isStudyWordCardId(documentId))
    return base + "/card/" + encodeURIComponent(documentId);
  return (entry === "scenes" ||
    entry === "reading" ||
    (entry === "words" && isWordGroupId(documentId))) &&
    documentId
    ? base + "/" + encodeURIComponent(documentId)
    : base;
}
export function isWordsLibraryList(hash: string): boolean {
  return /^#\/words\/library\/?$/.test(hash);
}
export function isLibraryWordHash(hash: string): boolean {
  return hash.startsWith("#/words/card/");
}
export function studyWordIdFromHash(hash: string): string | undefined {
  if (!isLibraryWordHash(hash)) return undefined;
  try {
    const id = decodeURIComponent(hash.slice("#/words/card/".length)).replace(/\/$/, "");
    return isStudyWordCardId(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

export function libraryWordFromHash(hash: string): string | undefined {
  const id = studyWordIdFromHash(hash);
  return id && isLibraryWordId(id) ? id : undefined;
}

export function wordGroupFromHash(hash: string): WordGroupId {
  if (!hash.startsWith("#/words/")) return "basic";
  try {
    const id = decodeURIComponent(hash.slice("#/words/".length));
    return isWordGroupId(id) ? id : "basic";
  } catch {
    return "basic";
  }
}
