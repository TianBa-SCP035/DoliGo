/** Isolated review-session persistence. No global browser/storage access. */
export const REVIEW_SESSION_KEY = 'doliguo:refactor:sandbox:review-session:v1';
export type ReviewStorage = Pick<Storage, 'getItem' | 'setItem'>;
/** An encounter-level self report, NOT proof of mastery of every card in it. */
export type ReviewSelfMark = 'again' | 'recognized';
export type ReviewSession = {
  version: 1;
  encounterIds: string[];
  position: number;
  completed: boolean;
  marks: Record<string, ReviewSelfMark>;
};
export type ReviewSessionResult =
  | { ok: true; session: ReviewSession }
  | { ok: false; error: string };

export function createReviewSession(ids: readonly string[]): ReviewSession {
  return { version: 1, encounterIds: [...ids], position: 0, completed: ids.length === 0, marks: {} };
}

function validIds(ids: readonly string[]): boolean {
  return ids.every(id => typeof id === 'string' && id.length > 0) && new Set(ids).size === ids.length;
}

function isSession(value: unknown, ids: readonly string[]): value is ReviewSession {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const s = value as ReviewSession;
  if (s.version !== 1 || !Array.isArray(s.encounterIds) || !validIds(s.encounterIds)) return false;
  // No silent reset/migration when content changes. Preserve stored data for a deliberate migration.
  if (JSON.stringify(s.encounterIds) !== JSON.stringify(ids)) return false;
  if (!Number.isInteger(s.position) || s.position < 0 || s.position > ids.length) return false;
  if (s.completed !== (s.position === ids.length)) return false;
  if (!s.marks || typeof s.marks !== 'object' || Array.isArray(s.marks)) return false;
  return Object.entries(s.marks).every(([id, mark]) => ids.includes(id) && (mark === 'again' || mark === 'recognized'));
}

export function loadReviewSession(storage: ReviewStorage, ids: readonly string[]): ReviewSessionResult {
  if (!validIds(ids)) return { ok: false, error: '复习内容标识无效，未改动记录。' };
  try {
    const raw = storage.getItem(REVIEW_SESSION_KEY);
    if (raw === null) return { ok: true, session: createReviewSession(ids) };
    const parsed: unknown = JSON.parse(raw);
    if (!isSession(parsed, ids)) return { ok: false, error: '复习记录格式或内容版本不匹配，原记录已保留。' };
    return { ok: true, session: parsed };
  } catch {
    return { ok: false, error: '无法读取复习记录，原记录未改动。' };
  }
}

export function currentReviewEncounterId(session: ReviewSession): string | undefined {
  return session.completed ? undefined : session.encounterIds[session.position];
}

/** Viewing/translating/revealing must not call this function. Only explicit Next or a self mark. */
export function advanceReviewSession(session: ReviewSession, mark?: ReviewSelfMark): ReviewSession {
  const id = currentReviewEncounterId(session);
  if (!id) return session;
  const position = session.position + 1;
  return {
    ...session, position, completed: position === session.encounterIds.length,
    marks: mark ? { ...session.marks, [id]: mark } : { ...session.marks },
  };
}

export function restartReviewSession(session: ReviewSession): ReviewSession {
  return { ...session, position: 0, completed: session.encounterIds.length === 0, marks: { ...session.marks } };
}

export function saveReviewSession(storage: ReviewStorage, next: ReviewSession): ReviewSessionResult {
  if (!isSession(next, next.encounterIds)) return { ok: false, error: '复习记录无效，未保存。' };
  try {
    storage.setItem(REVIEW_SESSION_KEY, JSON.stringify(next));
    return { ok: true, session: next };
  } catch {
    return { ok: false, error: '保存失败，仍停留在当前条目，请重试。' };
  }
}

/** UI updates its session only when result.ok; on failure keep the old session and reveal state. */
export function commitReviewAdvance(storage: ReviewStorage, session: ReviewSession, mark?: ReviewSelfMark): ReviewSessionResult {
  return saveReviewSession(storage, advanceReviewSession(session, mark));
}

export function commitReviewRestart(storage: ReviewStorage, session: ReviewSession): ReviewSessionResult {
  return saveReviewSession(storage, restartReviewSession(session));
}
