import { describe, expect, it } from 'vitest';
import {
  RECALL_INTERVALS_MS,
  RECALL_SPACING_KEY,
  dueRecallIds,
  emptyRecallStore,
  loadRecallStore,
  prioritizeReviewIds,
  recordRecall,
} from '../../src/adapters/memory-spacing';
import { REFACTOR_STORAGE_KEY } from '../../src/lib/progress/types';

const REVIEW_SESSION_KEY = 'doliguo:refactor:sandbox:review-session:v1';
const JUBAN = 'juban.user-data.v1';

function memory() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    snapshot: () => new Map(data),
  };
}

describe('recall spacing store', () => {
  it('writes only the isolated recall key and never a mastery flag', () => {
    const storage = memory();
    storage.setItem(REFACTOR_STORAGE_KEY, '{"keep":true}');
    storage.setItem(REVIEW_SESSION_KEY, '{"keep":"review"}');
    storage.setItem(JUBAN, '{"keep":"real"}');
    const now = 1_700_000_000_000;
    const result = recordRecall(storage, 'depth-nov18-leak', 'forgotten', now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.store.targets['depth-nov18-leak']).toEqual({
      rating: 'forgotten',
      intervalMs: RECALL_INTERVALS_MS.forgotten,
      nextDueAt: now + RECALL_INTERVALS_MS.forgotten,
      updatedAt: now,
      repetitions: 1,
    });
    const keys = [...storage.snapshot().keys()].sort();
    expect(keys).toEqual([JUBAN, REFACTOR_STORAGE_KEY, REVIEW_SESSION_KEY, RECALL_SPACING_KEY].sort());
    expect(storage.getItem(REFACTOR_STORAGE_KEY)).toBe('{"keep":true}');
    expect(storage.getItem(REVIEW_SESSION_KEY)).toBe('{"keep":"review"}');
    expect(storage.getItem(JUBAN)).toBe('{"keep":"real"}');
    expect(JSON.parse(storage.getItem(RECALL_SPACING_KEY)!)).not.toHaveProperty('mastery');
    expect(JSON.stringify(result.store)).not.toMatch(/mastery/);
  });

  it('uses 10 minutes, 1 day, then 3 days doubling to a 90-day cap', () => {
    const storage = memory();
    const now = 1_700_000_000_000;
    recordRecall(storage, 'a', 'vague', now);
    expect(loadRecallStore(storage).ok && loadRecallStore(storage).ok ? 1 : 0).toBe(1);
    const vague = (loadRecallStore(storage) as { ok: true; store: ReturnType<typeof emptyRecallStore> }).store.targets.a;
    expect(vague.intervalMs).toBe(RECALL_INTERVALS_MS.vague);
    recordRecall(storage, 'b', 'remembered', now);
    recordRecall(storage, 'b', 'remembered', now + 1);
    const remembered = (loadRecallStore(storage) as { ok: true; store: ReturnType<typeof emptyRecallStore> }).store.targets.b;
    expect(remembered.intervalMs).toBe(Math.round(RECALL_INTERVALS_MS.rememberedFirst * RECALL_INTERVALS_MS.rememberedFactor));
    let t = now;
    for (let i = 0; i < 12; i += 1) {
      recordRecall(storage, 'c', 'remembered', t);
      t += 1;
    }
    const capped = (loadRecallStore(storage) as { ok: true; store: ReturnType<typeof emptyRecallStore> }).store.targets.c;
    expect(capped.intervalMs).toBe(RECALL_INTERVALS_MS.rememberedMax);
  });

  it('lists due rated ids and only reorders an existing review list', () => {
    const storage = memory();
    const now = 1_700_000_000_000;
    recordRecall(storage, 'due-soon', 'forgotten', now - RECALL_INTERVALS_MS.forgotten - 1);
    recordRecall(storage, 'later', 'remembered', now);
    expect(dueRecallIds(storage, ['due-soon', 'later', 'unrated'], now)).toEqual(['due-soon']);
    expect(prioritizeReviewIds(['later', 'unrated', 'due-soon'], storage, now)).toEqual([
      'due-soon',
      'later',
      'unrated',
    ]);
  });
});
