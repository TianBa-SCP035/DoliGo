import { resolveWordQueueSnapshot } from "./word-queue-snapshot";
import { WORD_GROUP_QUEUE_HISTORY } from "./word-queue-history";
import { REFACTOR_STORAGE_KEY } from "../lib/progress/types";
import type { StorageLike } from "../lib/progress/types";
import {
  isWordGroupId,
  wordsForGroup,
  wordGroups,
  isLibraryWordId,
  libraryWords,
} from "./wiring-words";
import type { WordGroupId } from "./wiring-words";
export type WordSession = {
  version: 1;
  ids: string[];
  index: number;
  meaningVisible: boolean;
  exampleVisible: boolean;
  reviewIds: string[];
  updatedAt?: number;
  groupId?: WordGroupId;
  transferExampleVisible?: boolean;
};
export function initialWordSession(
  groupId: WordGroupId = "basic",
): WordSession {
  return {
    version: 1,
    ids: wordsForGroup(groupId).map((w) => w.id),
    index: 0,
    meaningVisible: false,
    exampleVisible: false,
    reviewIds: [],
    ...(groupId === "basic" ? {} : { groupId, transferExampleVisible: false }),
  };
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function readEnvelope(storage: StorageLike): Record<string, unknown> {
  const raw = storage.getItem(REFACTOR_STORAGE_KEY);
  if (!raw) return {};
  const value: unknown = JSON.parse(raw);
  if (!record(value)) throw new Error("重构沙盒记录格式无效，未覆盖原文。");
  return value;
}
function decodeSession(raw: unknown, groupId: WordGroupId): WordSession {
  const start = initialWordSession(groupId);
  if (raw === undefined) return start;
  if (!record(raw) || raw.version !== 1 || (raw.groupId !== undefined && raw.groupId !== groupId)) {
    throw new Error("背词记录队列不兼容，未覆盖原记录。");
  }
  const ids = resolveWordQueueSnapshot(raw.ids, start.ids, WORD_GROUP_QUEUE_HISTORY[groupId]);
  const index =
    Number.isInteger(raw.index) &&
    Number(raw.index) >= 0 &&
    Number(raw.index) <= ids.length
      ? Number(raw.index)
      : 0;
  return {
    ...start,
    ids,
    index,
    meaningVisible: raw.meaningVisible === true,
    exampleVisible: raw.meaningVisible === true && raw.exampleVisible === true,
    ...(raw.transferExampleVisible !== undefined
      ? {
          transferExampleVisible:
            raw.meaningVisible === true && raw.transferExampleVisible === true,
        }
      : {}),
    reviewIds: Array.isArray(raw.reviewIds)
      ? raw.reviewIds.filter(
          (x): x is string => typeof x === "string" && ids.includes(x),
        )
      : [],
    updatedAt:
      typeof raw.updatedAt === "number" && Number.isFinite(raw.updatedAt)
        ? raw.updatedAt
        : undefined,
  };
}
function groupRecords(
  envelope: Record<string, unknown>,
): Record<string, unknown> {
  if (envelope.wordSessions === undefined) return {};
  if (!record(envelope.wordSessions))
    throw new Error("分组背词记录格式无效，未覆盖原记录。");
  return envelope.wordSessions;
}
export function readWordSession(
  storage: StorageLike,
  groupId: WordGroupId = "basic",
): WordSession {
  const envelope = readEnvelope(storage);
  if (groupId !== "basic")
    return decodeSession(groupRecords(envelope)[groupId], groupId);
  // Keep the legacy storage location, but fail closed rather than reset corrupt progress.
  return decodeSession(envelope.wordSession, groupId);
}
/** Re-read latest envelope; supplemental writes do not touch legacy wordSession or review keys. */
export function saveWordSession(
  storage: StorageLike,
  session: WordSession,
): void {
  const groupId = session.groupId ?? "basic";
  if (!isWordGroupId(groupId)) throw new Error("未知背词分组。");
  decodeSession(session, groupId);
  const envelope = readEnvelope(storage),
    now = Date.now();
  const common = {
    ...envelope,
    schemaVersion: 1,
    kind: "doliguo-refactor-sandbox",
    updatedAt: now,
  };
  if (groupId === "basic") {
    decodeSession(envelope.wordSession, groupId);
    const prev = record(envelope.wordSession) ? envelope.wordSession : {};
    storage.setItem(
      REFACTOR_STORAGE_KEY,
      JSON.stringify({
        ...common,
        wordSession: { ...prev, ...session, updatedAt: now },
      }),
    );
  } else {
    const groups = groupRecords(envelope),
      previous = groups[groupId];
    decodeSession(previous, groupId);
    storage.setItem(
      REFACTOR_STORAGE_KEY,
      JSON.stringify({
        ...common,
        wordSessions: {
          ...groups,
          [groupId]: {
            ...(record(previous) ? previous : {}),
            ...session,
            updatedAt: now,
          },
        },
      }),
    );
  }
}
export function readWordSessions(storage: StorageLike): WordSession[] {
  return wordGroups.map((group) => readWordSession(storage, group.id));
}
export function advanceWord(session: WordSession): WordSession {
  return {
    ...session,
    index: Math.min(session.index + 1, session.ids.length),
    meaningVisible: false,
    exampleVisible: false,
    ...(session.transferExampleVisible !== undefined
      ? { transferExampleVisible: false }
      : {}),
  };
}
export function queueWordForReview(session: WordSession): WordSession {
  const id = session.ids[session.index];
  return !id || session.reviewIds.includes(id)
    ? session
    : { ...session, reviewIds: [...session.reviewIds, id] };
}

export type LibraryWordSession = {
  version: 1;
  ids: string[];
  index: number;
  meaningVisible: boolean;
  exampleVisible: boolean;
  notesVisible?: boolean;
  reviewIds: string[];
  updatedAt?: number;
  cardId: string;
};
export function initialLibraryWordSession(cardId: string): LibraryWordSession {
  if (!isLibraryWordId(cardId)) throw new Error("未知词条。");
  return {
    version: 1,
    ids: [cardId],
    index: 0,
    meaningVisible: false,
    exampleVisible: false,
    notesVisible: false,
    reviewIds: [],
    cardId,
  };
}
function decodeLibrarySession(
  raw: unknown,
  cardId: string,
): LibraryWordSession {
  const start = initialLibraryWordSession(cardId),
    ids = start.ids;
  if (raw === undefined) return start;
  if (
    !record(raw) ||
    raw.version !== 1 ||
    !Array.isArray(raw.ids) ||
    raw.ids.join("|") !== ids.join("|") ||
    raw.cardId !== cardId
  ) {
    throw new Error("词条背词记录不兼容，未覆盖原记录。");
  }
  const index =
    Number.isInteger(raw.index) &&
    Number(raw.index) >= 0 &&
    Number(raw.index) <= ids.length
      ? Number(raw.index)
      : 0;
  return {
    ...start,
    index,
    meaningVisible: raw.meaningVisible === true,
    exampleVisible: raw.meaningVisible === true && raw.exampleVisible === true,
    notesVisible: raw.meaningVisible === true && raw.notesVisible === true,
    reviewIds: Array.isArray(raw.reviewIds)
      ? raw.reviewIds.filter(
          (x): x is string => typeof x === "string" && ids.includes(x),
        )
      : [],
    updatedAt:
      typeof raw.updatedAt === "number" && Number.isFinite(raw.updatedAt)
        ? raw.updatedAt
        : undefined,
  };
}
function libraryRecords(
  envelope: Record<string, unknown>,
): Record<string, unknown> {
  if (envelope.wordLibrarySessions === undefined) return {};
  if (!record(envelope.wordLibrarySessions))
    throw new Error("词条背词记录格式无效，未覆盖原记录。");
  return envelope.wordLibrarySessions;
}
export function readLibraryWordSession(
  storage: StorageLike,
  cardId: string,
): LibraryWordSession {
  return decodeLibrarySession(
    libraryRecords(readEnvelope(storage))[cardId],
    cardId,
  );
}
export function saveLibraryWordSession(
  storage: StorageLike,
  session: LibraryWordSession,
): void {
  decodeLibrarySession(session, session.cardId);
  const envelope = readEnvelope(storage),
    now = Date.now();
  const groups = libraryRecords(envelope),
    previous = groups[session.cardId];
  decodeLibrarySession(previous, session.cardId);
  storage.setItem(
    REFACTOR_STORAGE_KEY,
    JSON.stringify({
      ...envelope,
      schemaVersion: 1,
      kind: "doliguo-refactor-sandbox",
      updatedAt: now,
      wordLibrarySessions: {
        ...groups,
        [session.cardId]: {
          ...(record(previous) ? previous : {}),
          ...session,
          updatedAt: now,
        },
      },
    }),
  );
}
export function readLibraryWordSessions(
  storage: StorageLike,
): LibraryWordSession[] {
  return libraryWords.map((card) => readLibraryWordSession(storage, card.id));
}
export function advanceLibraryWord(
  session: LibraryWordSession,
): LibraryWordSession {
  return {
    ...session,
    index: Math.min(session.index + 1, session.ids.length),
    meaningVisible: false,
    exampleVisible: false,
    notesVisible: false,
  };
}
