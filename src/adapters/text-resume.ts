import type { ContinueLearning, LearningEntry } from "../ui/LearningViews";
import type { LibraryWordSession, WordSession } from "./word-session";
import type { ReadingPosition, RefactorProgressStore } from "../lib/progress";
import { studyWordById } from "./wiring-words";
import { loadLearningCatalog } from "../lib/review";

export type HomeResume = ContinueLearning & { updatedAt: number };

const learningCatalog = loadLearningCatalog();
const sceneTitles = Object.fromEntries(
  learningCatalog.scenes.map((s) => [
    s.id,
    { title: s.title, titleEn: s.titleEn },
  ]),
);
const readingTitles = Object.fromEntries(
  learningCatalog.readings.map((s) => [
    s.id,
    { title: s.title, titleEn: s.titleEn },
  ]),
);

export function textDocumentIdFromHash(
  hash: string,
  page: LearningEntry | "home",
): string | undefined {
  const prefix =
    page === "scenes" ? "#/scenes/" : page === "reading" ? "#/reading/" : "";
  if (!prefix || !hash.startsWith(prefix)) return undefined;
  let id: string;
  try {
    id = decodeURIComponent(hash.slice(prefix.length));
  } catch {
    return undefined;
  }
  const known = page === "scenes" ? sceneTitles : readingTitles;
  return id && known[id] ? id : undefined;
}

function latestPosition(
  map: Record<string, ReadingPosition>,
  preferred?: string,
): ReadingPosition | undefined {
  if (preferred && map[preferred]) return map[preferred];
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

function wordResume(session: WordSession): HomeResume | undefined {
  if (!(session.index > 0 || session.meaningVisible)) return undefined;
  const completed = session.index >= session.ids.length;
  const card = studyWordById(session.ids[session.index]);
  return {
    title: completed ? "本组背词已浏览完" : `背词 · ${card?.word}`,
    detail: completed
      ? "可返回查看或重新开始；浏览不代表掌握。"
      : `停在第 ${session.index + 1} / ${session.ids.length} 张`,
    entry: "words",
    documentId: session.groupId ?? "basic",
    updatedAt: session.updatedAt ?? 0,
  };
}

function textResume(
  kind: "scene" | "reading",
  store: RefactorProgressStore,
): HomeResume | undefined {
  const pos =
    kind === "scene"
      ? latestPosition(store.scenes, store.lastSceneId)
      : latestPosition(store.readings, store.lastReadingId);
  if (!pos) return undefined;
  const meta = kind === "scene" ? sceneTitles[pos.id] : readingTitles[pos.id];
  if (!meta) return undefined;
  return {
    title: `${kind === "scene" ? "场景" : "阅读"} · ${meta.title}`,
    detail: `${meta.titleEn} · 停在上次读到的位置`,
    entry: kind === "scene" ? "scenes" : "reading",
    documentId: pos.id,
    updatedAt: pos.updatedAt,
  };
}

function libraryWordResume(
  session: LibraryWordSession,
): HomeResume | undefined {
  if (!(session.index > 0 || session.meaningVisible)) return undefined;
  const completed = session.index >= session.ids.length;
  const card = studyWordById(session.cardId);
  return {
    title: completed ? "这张词卡已浏览完" : `背词 · ${card?.word}`,
    detail: completed
      ? "可返回查看或重新开始；浏览不代表掌握。"
      : "上次学到这里",
    entry: "words",
    documentId: session.cardId,
    updatedAt: session.updatedAt ?? 0,
  };
}

export function pickHomeResume(
  session: WordSession,
  store: RefactorProgressStore,
  otherWordSessions: WordSession[] = [],
  libraryWordSessions: LibraryWordSession[] = [],
): HomeResume | undefined {
  const candidates = [
    wordResume(session),
    ...otherWordSessions.map(wordResume),
    ...libraryWordSessions.map(libraryWordResume),
    textResume("scene", store),
    textResume("reading", store),
  ].filter((item): item is HomeResume => Boolean(item));
  if (!candidates.length) return undefined;
  return candidates.sort(
    (a, b) => b.updatedAt - a.updatedAt || order(b.entry) - order(a.entry),
  )[0];
}

function order(entry: LearningEntry) {
  return entry === "reading" ? 3 : entry === "scenes" ? 2 : 1;
}
