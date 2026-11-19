import { describe,it,expect } from 'vitest';
import { advanceWord,initialWordSession,queueWordForReview,readWordSession,saveWordSession } from '../../src/adapters/word-session';
import { REFACTOR_STORAGE_KEY } from '../../src/lib/progress/types';
describe('home/words wiring persistence',()=>{
 it('reveal, next, exit and reload preserve current card without marking mastery',()=>{
  localStorage.clear();
  const start=initialWordSession();
  const revealed={...start,meaningVisible:true,exampleVisible:true};
  saveWordSession(localStorage,revealed);
  const loaded=readWordSession(localStorage);
  expect(loaded).toMatchObject({...revealed,updatedAt:expect.any(Number)});
  const next=advanceWord(revealed);saveWordSession(localStorage,next);
  expect(readWordSession(localStorage)).toMatchObject({...next,updatedAt:expect.any(Number)});
  expect(next.index).toBe(1);expect(next.meaningVisible).toBe(false);
  expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).not.toMatch(/master|correctCount|practicedAt/);
 });
 it('preserves sibling and fictional unknown fields, touches no old store',()=>{
  localStorage.clear();localStorage.setItem('juban.user-data.v1','fictional-do-not-touch');
  localStorage.setItem(REFACTOR_STORAGE_KEY,JSON.stringify({scenes:{s:{unitId:'l8'}},readings:{r:{unitId:'p4'}},review:{foo:1},unknown:42,wordSession:{...initialWordSession(),extra:'keep'}}));
  saveWordSession(localStorage,initialWordSession());
  const stored=JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
  expect(stored.scenes.s.unitId).toBe('l8');expect(stored.readings.r.unitId).toBe('p4');
  expect(stored.review).toEqual({foo:1});expect(stored.unknown).toBe(42);expect(stored.wordSession.extra).toBe('keep');
  expect(localStorage.getItem('juban.user-data.v1')).toBe('fictional-do-not-touch');
 });
 it('does not overwrite corrupt sandbox and adds review only by explicit request',()=>{
  localStorage.clear();localStorage.setItem(REFACTOR_STORAGE_KEY,'{bad');
  expect(()=>saveWordSession(localStorage,initialWordSession())).toThrow();
  expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe('{bad');
  const session=queueWordForReview(initialWordSession());
  expect(session.reviewIds).toEqual(['L01-V01']);expect(queueWordForReview(session)).toEqual(session);
 });
 it('ends the small queue without cycling silently',()=>{
  let s=initialWordSession();for(let i=0;i<10;i++)s=advanceWord(s);
  expect(s.index).toBe(8);
 });

 it('leaves index, review mark and envelope unchanged when save fails after composing 还要再看',()=>{
  localStorage.clear();
  const start={...initialWordSession(),meaningVisible:true};
  saveWordSession(localStorage,start);
  const before=localStorage.getItem(REFACTOR_STORAGE_KEY)!;
  const marked=advanceWord(queueWordForReview(start));
  expect(marked.index).toBe(1);
  expect(marked.reviewIds).toEqual(['L01-V01']);
  const storage={getItem:(k:string)=>localStorage.getItem(k),setItem:()=>{throw new Error('quota exceeded');},removeItem:()=>{}};
  expect(()=>saveWordSession(storage,marked)).toThrow(/quota exceeded/);
  expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe(before);
  const kept=readWordSession(localStorage);
  expect(kept.index).toBe(0);
  expect(kept.reviewIds).toEqual([]);
  expect(kept.meaningVisible).toBe(true);
  expect(before).not.toMatch(/master|correctCount|practicedAt/);
 });
});
