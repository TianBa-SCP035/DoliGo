import { hashForEntry } from "./routes";
import type { WordSession } from "./word-session";
import { isWordGroupId, wordGroups } from "./wiring-words";
import type { WordGroupId } from "./wiring-words";

/** Existing picker and library list routes. Do not treat these as study-group IDs. */
export const WORD_GROUP_PICKER_ROUTE = "#/words";
export const WORD_LIBRARY_ROUTE = "#/words/library";

export type WordGroupStatus = "not-started" | "in-progress" | "completed";

export type WordGroupProgress = {
  id: WordGroupId;
  title: string;
  total: number;
  index: number;
  status: WordGroupStatus;
  route: string;
};

export function wordGroupRoute(groupId: WordGroupId): string {
  return hashForEntry("words", groupId);
}

export function isWordGroupCompleted(session: WordSession): boolean {
  return session.index >= session.ids.length;
}

/**
 * Matches the picker/start rules in App: a group is started if it has
 * updatedAt, a progressed index, or a revealed meaning.
 */
export function wordGroupStatus(
  session: WordSession | undefined,
): WordGroupStatus {
  if (!session) return "not-started";
  if (isWordGroupCompleted(session)) return "completed";
  if (session.updatedAt || session.index > 0 || session.meaningVisible) {
    return "in-progress";
  }
  return "not-started";
}

function sessionList(
  sessions: readonly WordSession[] | Record<string, WordSession>,
): WordSession[] {
  return Array.isArray(sessions) ? [...sessions] : Object.values(sessions);
}

export function sessionForWordGroup(
  sessions: readonly WordSession[] | Record<string, WordSession>,
  groupId: WordGroupId,
): WordSession | undefined {
  return sessionList(sessions).find(
    (session) => (session.groupId ?? "basic") === groupId,
  );
}

/** Read-only snapshot of the nine frozen queues. Does not write storage. */
export function listWordGroupProgress(
  sessions: readonly WordSession[] | Record<string, WordSession> = [],
): WordGroupProgress[] {
  return wordGroups.map((group) => {
    const session = sessionForWordGroup(sessions, group.id);
    return {
      id: group.id,
      title: group.title,
      total: session?.ids.length ?? group.words.length,
      index: session?.index ?? 0,
      status: wordGroupStatus(session),
      route: wordGroupRoute(group.id),
    };
  });
}

/**
 * First unfinished group after `currentId` in `wordGroups` order, wrapping
 * around and skipping the current group. Returns undefined when every other
 * group is already completed. Pure; does not write storage or change queues.
 */
export function nextWordGroup(
  currentId: WordGroupId,
  sessions: readonly WordSession[] | Record<string, WordSession> = [],
): WordGroupProgress | undefined {
  if (!isWordGroupId(currentId)) return undefined;
  const progress = listWordGroupProgress(sessions);
  const start = progress.findIndex((group) => group.id === currentId);
  if (start < 0) return undefined;
  const ordered = [...progress.slice(start + 1), ...progress.slice(0, start)];
  return ordered.find((group) => group.status !== "completed");
}
