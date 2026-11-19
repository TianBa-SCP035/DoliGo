import { describe, expect, it } from 'vitest';
import { resolveWordQueueSnapshot } from '../../src/adapters/word-queue-snapshot';
import { WORD_GROUP_QUEUE_HISTORY } from '../../src/adapters/word-queue-history';
import { initialWordSession, readWordSession, saveWordSession, advanceWord } from '../../src/adapters/word-session';
import { wordGroups } from '../../src/adapters/wiring-words';
import { REFACTOR_STORAGE_KEY } from '../../src/lib/progress/types';
function memory() {
 const map = new Map<string,string>(); let writes = 0;
 return { getItem:(key:string)=>map.get(key)??null, setItem:(key:string,value:string)=>{ writes++; map.set(key,value); }, removeItem:(key:string)=>{map.delete(key);}, count:()=>writes };
}
describe('append-only group expansion',()=>{
 it('accepts current or published historical snapshots, never arbitrary prefixes',()=>{
  expect(resolveWordQueueSnapshot(['a','b'],['a','b','c'],[['a','b']])).toEqual(['a','b']);
  expect(resolveWordQueueSnapshot(['a','b','c'],['a','b','c'])).toEqual(['a','b','c']);
  expect(()=>resolveWordQueueSnapshot(['a'],['a','b','c'],[['a','b']])).toThrow();
  expect(()=>resolveWordQueueSnapshot(['b','a'],['a','b','c'],[['b','a']])).toThrow();
  expect(()=>resolveWordQueueSnapshot(['a','x'],['a','b','c'],[['a','x']])).toThrow();
  expect(()=>resolveWordQueueSnapshot(['a','a'],['a','a','b'],[['a','a']])).toThrow();
  expect(()=>resolveWordQueueSnapshot([],['a'],[[]])).toThrow();
  expect(()=>resolveWordQueueSnapshot([1],['1'],[])).toThrow();
 });
 for(const group of wordGroups) {
  it(`preserves in-flight and completed ${group.id} snapshots after appended content`,()=>{
   const storage=memory(); const old=initialWordSession(group.id);
   const session={...old,index:1,meaningVisible:true,exampleVisible:true,reviewIds:[old.ids[0]],updatedAt:42};
   const untouched={version:1,ids:['fictional'],index:0};
   const envelope={wordSession:group.id==='basic'?session:untouched,wordSessions:group.id==='basic'?{foreign:untouched}:{[group.id]:session,foreign:untouched},wordLibrarySessions:{fictional:untouched},review:{keep:true},scenes:{scene:{unitId:'line'}},readings:{reading:{unitId:'paragraph'}},unknown:'preserve'};
   storage.setItem(REFACTOR_STORAGE_KEY,JSON.stringify(envelope));
   storage.setItem('juban.user-data.v1','fictional untouched sentinel');
   const before=storage.getItem(REFACTOR_STORAGE_KEY); const writes=storage.count(); const size=group.words.length;
   const history=WORD_GROUP_QUEUE_HISTORY[group.id].map(ids=>[...ids]);
   try {
    group.words.push({...group.words[0],id:`fictional-expansion-${group.id}`});
    const restored=readWordSession(storage,group.id);
    expect(restored.ids).toEqual(old.ids); expect(restored.index).toBe(1);
    expect(restored.meaningVisible).toBe(true); expect(restored.exampleVisible).toBe(true); expect(restored.reviewIds).toEqual([old.ids[0]]);
    expect(storage.getItem(REFACTOR_STORAGE_KEY)).toBe(before); expect(storage.count()).toBe(writes);
    const fresh=initialWordSession(group.id); expect(fresh.ids).toHaveLength(size+1); expect(fresh.index).toBe(0);
    expect(WORD_GROUP_QUEUE_HISTORY[group.id]).toEqual(history);
    saveWordSession(storage,advanceWord(restored));
    const saved=JSON.parse(storage.getItem(REFACTOR_STORAGE_KEY)!);
    expect(saved.review).toEqual(envelope.review); expect(saved.scenes).toEqual(envelope.scenes); expect(saved.readings).toEqual(envelope.readings);
    expect(saved.wordLibrarySessions).toEqual(envelope.wordLibrarySessions); expect(saved.wordSessions.foreign).toEqual(untouched); expect(saved.unknown).toBe('preserve');
    if(group.id!=='basic') expect(saved.wordSession).toEqual(untouched);
    expect(storage.getItem('juban.user-data.v1')).toBe('fictional untouched sentinel');
    saveWordSession(storage,{...restored,index:old.ids.length});
    expect(readWordSession(storage,group.id).index).toBe(old.ids.length);
    expect(readWordSession(storage,group.id).ids).toEqual(old.ids);
   } finally { group.words.splice(size); }
  });
 }
 it('does not hide or overwrite corrupt legacy base progress',()=>{
  const storage=memory(); const invalid={...initialWordSession(),ids:['wrong-card']};
  storage.setItem(REFACTOR_STORAGE_KEY,JSON.stringify({wordSession:invalid,unknown:42}));
  const raw=storage.getItem(REFACTOR_STORAGE_KEY); const count=storage.count();
  expect(()=>readWordSession(storage)).toThrow(/不兼容/);
  expect(()=>saveWordSession(storage,initialWordSession())).toThrow(/不兼容/);
  expect(storage.getItem(REFACTOR_STORAGE_KEY)).toBe(raw); expect(storage.count()).toBe(count);
 });
 it('refuses a mismatched stored group identity without writes',()=>{
  const storage=memory(); const group=wordGroups[1];
  storage.setItem(REFACTOR_STORAGE_KEY,JSON.stringify({wordSessions:{[group.id]:{...initialWordSession(group.id),groupId:'basic'}}}));
  const before=storage.getItem(REFACTOR_STORAGE_KEY);
  expect(()=>readWordSession(storage,group.id)).toThrow();
  expect(storage.getItem(REFACTOR_STORAGE_KEY)).toBe(before);
 });
});
