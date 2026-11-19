import { describe, expect, it } from 'vitest';
import {
  REVIEW_SESSION_KEY, createReviewSession, loadReviewSession, currentReviewEncounterId,
  commitReviewAdvance, commitReviewRestart, advanceReviewSession,
} from '../../src/lib/review';
import type { ReviewStorage } from '../../src/lib/review';
const ids = ['one', 'two'];
function memory() {
  const data = new Map<string, string>();
  const storage: ReviewStorage = { getItem: key => data.get(key) ?? null, setItem: (key,value) => { data.set(key,value); } };
  return { data, storage };
}
describe('isolated review session', () => {
  it('starts at the first encounter without a mark or storage write', () => {
    const {storage,data} = memory();
    const loaded = loadReviewSession(storage, ids);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(currentReviewEncounterId(loaded.session)).toBe('one');
    expect(loaded.session.marks).toEqual({});
    expect(data.size).toBe(0);
  });
  it('saves an explicit again mark and resumes at the next encounter', () => {
    const {storage} = memory();
    const result = commitReviewAdvance(storage, createReviewSession(ids), 'again');
    expect(result.ok).toBe(true);
    const loaded = loadReviewSession(storage, ids);
    if (!loaded.ok) throw new Error(loaded.error);
    expect(currentReviewEncounterId(loaded.session)).toBe('two');
    expect(loaded.session.marks).toEqual({one:'again'});
  });
  it('allows Next without any self report and does not invent mastery', () => {
    const next = advanceReviewSession(createReviewSession(ids));
    expect(next.position).toBe(1);
    expect(next.marks).toEqual({});
  });
  it('does not mutate input or advance UI state when saving fails', () => {
    const old = createReviewSession(ids);
    const blocked: ReviewStorage = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
    expect(commitReviewAdvance(blocked, old, 'recognized').ok).toBe(false);
    expect(old.position).toBe(0);
    expect(old.marks).toEqual({});
  });
  it('finishes at the end instead of sticking on the last encounter', () => {
    const {storage} = memory();
    let session = advanceReviewSession(createReviewSession(ids), 'again');
    const result = commitReviewAdvance(storage, session, 'recognized');
    if (!result.ok) throw new Error(result.error);
    session = result.session;
    expect(session.completed).toBe(true);
    expect(session.position).toBe(2);
    expect(currentReviewEncounterId(session)).toBeUndefined();
    expect(loadReviewSession(storage, ids)).toEqual(result);
    expect(advanceReviewSession(session)).toBe(session);
  });
  it('restarts position but retains all marks, including again', () => {
    const {storage} = memory();
    const done = advanceReviewSession(advanceReviewSession(createReviewSession(ids), 'again'), 'recognized');
    const result = commitReviewRestart(storage, done);
    if (!result.ok) throw new Error(result.error);
    expect(result.session.position).toBe(0);
    expect(result.session.completed).toBe(false);
    expect(result.session.marks).toEqual({one:'again',two:'recognized'});
    expect(done.position).toBe(2);
  });
  it('only touches the isolated key, preserving unrelated records', () => {
    const {storage,data} = memory();
    data.set('legacy-real-records','unchanged');
    commitReviewAdvance(storage, createReviewSession(ids));
    expect(data.get('legacy-real-records')).toBe('unchanged');
    expect([...data.keys()]).toEqual(['legacy-real-records',REVIEW_SESSION_KEY]);
  });
  it.each(['broken-json', JSON.stringify({version:99}), JSON.stringify({...createReviewSession(ids),position:-1})])('rejects corrupt data without overwriting: %s', raw => {
    const {storage,data} = memory();
    data.set(REVIEW_SESSION_KEY,raw);
    expect(loadReviewSession(storage, ids).ok).toBe(false);
    expect(data.get(REVIEW_SESSION_KEY)).toBe(raw);
  });
  it('does not silently discard records when the encounter list changes', () => {
    const {storage,data} = memory();
    commitReviewAdvance(storage, createReviewSession(ids), 'again');
    const before = data.get(REVIEW_SESSION_KEY);
    expect(loadReviewSession(storage, ['one','three']).ok).toBe(false);
    expect(data.get(REVIEW_SESSION_KEY)).toBe(before);
  });
  it('handles empty catalogs and read failures', () => {
    expect(createReviewSession([]).completed).toBe(true);
    const broken: ReviewStorage = {getItem: () => {throw new Error('blocked');},setItem:()=>{}};
    expect(loadReviewSession(broken, ids).ok).toBe(false);
  });
});
