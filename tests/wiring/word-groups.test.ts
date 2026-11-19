import { pickHomeResume } from '../../src/adapters/text-resume';
import { emptyProgressStore } from '../../src/lib/progress';
import { hashForEntry } from '../../src/adapters/routes';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadVocabCatalog, loadReviewCatalog, REVIEW_SESSION_KEY } from '../../src/lib/review';
import { NEW_SCENE_V4_CARD_IDS, NEW_READING_V3_CARD_IDS, NEW_SCENE_V5_CARD_IDS, NEW_READING_V4_CARD_IDS, NEW_SCENE_V6_CARD_IDS, NEW_READING_V5_CARD_IDS, NEW_SCENE_V7_CARD_IDS, NEW_READING_V6_CARD_IDS } from '../../src/lib/review';
import { wordGroups, supplementalWords, extensionWords, sceneV5Words, readingV4Words, sceneV6Words, readingV5Words, sceneV7Words, readingV6Words, wiringWords, studyWordById } from '../../src/adapters/wiring-words';
import { initialWordSession, readWordSession, saveWordSession, advanceWord, queueWordForReview } from '../../src/adapters/word-session';
import { REFACTOR_STORAGE_KEY } from '../../src/lib/progress/types';
beforeEach(() => localStorage.clear());
describe('independent vocab groups', () => {
  it('keeps the original queue and exposes all eight supplemental cards with transfer examples', () => {
    expect(wiringWords.map(w => w.id)).toEqual(Array.from({length:8},(_,i) => 'L01-V0'+(i+1)));
    expect(wordGroups.map(group=>group.id)).toEqual(expect.arrayContaining(['basic','daily-scenes-v3','game-work-reading-v1','daily-scenes-v5','daily-reading-v4','daily-scenes-v6','daily-reading-v5','daily-scenes-v7','daily-reading-v6']));
    expect(new Set(wordGroups.map(group=>group.id)).size).toBe(wordGroups.length);
    expect(supplementalWords.map(w=>w.id)).toEqual(loadVocabCatalog().supplementalCards.map(c=>c.id));
    expect(supplementalWords).toHaveLength(8);
    for (const card of supplementalWords) {
      expect(card.meaning).toBeTruthy(); expect(card.example?.english).toBeTruthy();
      expect(card.transferExample?.english).toBeTruthy(); expect(studyWordById(card.id)).toEqual(card);
    }
    expect(loadReviewCatalog().reviewPack.reviewEncounters).toHaveLength(36);
  });
  it('saves and resumes the new queue without changing old queue, scene, reading, review or unknown data', () => {
    const base = {...initialWordSession(),index:3,reviewIds:['L01-V01'],meaningVisible:true};
    saveWordSession(localStorage,base);
    const before=JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    before.scenes={old:{unitId:'u9'}}; before.readings={old:{unitId:'p4'}};before.unknown={preserve:true};
    before.wordSessions={future:{keep:true}};
    localStorage.setItem(REFACTOR_STORAGE_KEY,JSON.stringify(before));
    localStorage.setItem(REVIEW_SESSION_KEY,'fictional-review-untouched');
    const next=advanceWord(queueWordForReview({...initialWordSession('daily-scenes-v3'),meaningVisible:true,exampleVisible:true,transferExampleVisible:true}));
    saveWordSession(localStorage,next);
    const after=JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
    expect(after.wordSession).toEqual(before.wordSession);
    for (const key of ['scenes','readings','unknown']) expect(after[key]).toEqual(before[key]);
    expect(after.wordSessions.future).toEqual({keep:true});
    expect(readWordSession(localStorage,'daily-scenes-v3')).toMatchObject({...next,updatedAt:expect.any(Number)});
    expect(readWordSession(localStorage)).toMatchObject(base);
    expect(localStorage.getItem(REVIEW_SESSION_KEY)).toBe('fictional-review-untouched');
    const groupBefore=after.wordSessions;
    saveWordSession(localStorage,advanceWord(readWordSession(localStorage)));
    expect(JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!).wordSessions).toEqual(groupBefore);
    expect(next.transferExampleVisible).toBe(false);
  });
  it('restarts only the supplemental position and reveals, preserving its marks', () => {
    let session=initialWordSession('daily-scenes-v3');
    for(let i=0;i<8;i++) session=advanceWord(queueWordForReview(session));
    expect(session.index).toBe(8); expect(session.reviewIds).toHaveLength(8);
    saveWordSession(localStorage,{...session,index:0,meaningVisible:false,exampleVisible:false,transferExampleVisible:false});
    expect(readWordSession(localStorage,'daily-scenes-v3').reviewIds).toEqual(session.reviewIds);
  });
  it.each(['{bad',JSON.stringify({wordSessions:[]}),JSON.stringify({wordSessions:{'daily-scenes-v3':{version:2,ids:[]}}})])('does not overwrite malformed or incompatible grouped records',raw => {
    localStorage.setItem(REFACTOR_STORAGE_KEY,raw);
    expect(()=>readWordSession(localStorage,'daily-scenes-v3')).toThrow();
    expect(()=>saveWordSession(localStorage,initialWordSession('daily-scenes-v3'))).toThrow();
    expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe(raw);
  });
  it('leaves saved queues unchanged when storage refuses a grouped write', () => {
    saveWordSession(localStorage,initialWordSession());
    const before=localStorage.getItem(REFACTOR_STORAGE_KEY);
    const storage={getItem:(key:string)=>localStorage.getItem(key),setItem:()=>{throw new Error('quota');},removeItem:()=>{}};
    expect(()=>saveWordSession(storage,advanceWord(initialWordSession('daily-scenes-v3')))).toThrow('quota');
    expect(localStorage.getItem(REFACTOR_STORAGE_KEY)).toBe(before);
  });
});

it('resumes the newest supplemental group through its own route', () => {
  const base={...initialWordSession(),index:1,updatedAt:10};
  const added={...initialWordSession('daily-scenes-v3'),index:2,updatedAt:50};
  const resume=pickHomeResume(base,emptyProgressStore(),[added])!;
  expect(resume.documentId).toBe('daily-scenes-v3');
  expect(resume.title).toBe('背词 · '+supplementalWords[2].word);
  expect(hashForEntry(resume.entry,resume.documentId)).toBe('#/words/daily-scenes-v3');
});

it('keeps the original ten extension cards and adds two incremental groups without growing that queue', () => {
  expect(extensionWords).toHaveLength(10);
  expect(extensionWords.map(card=>card.id)).toEqual([...NEW_SCENE_V4_CARD_IDS, ...NEW_READING_V3_CARD_IDS]);
  // Catalog may grow; frozen study queues must remain exact and resolvable.
  const available=new Set(loadVocabCatalog().extensionCards.map(card=>card.id));
  for(const words of [extensionWords,sceneV5Words,readingV4Words,sceneV6Words,readingV5Words,sceneV7Words,readingV6Words]) {
    for(const card of words) expect(available.has(card.id)).toBe(true);
  }
  expect(sceneV7Words.map(card=>card.id)).toEqual([...NEW_SCENE_V7_CARD_IDS]);
  expect(readingV6Words.map(card=>card.id)).toEqual([...NEW_READING_V6_CARD_IDS]);
  expect(initialWordSession('daily-scenes-v7').ids).toHaveLength(6);
  expect(initialWordSession('daily-reading-v6').ids).toHaveLength(3);
  expect(initialWordSession('daily-scenes-v3').ids).toEqual(supplementalWords.map(card=>card.id));
  expect(initialWordSession('game-work-reading-v1').ids).toEqual(extensionWords.map(card=>card.id));
  expect(sceneV5Words.map(card=>card.id)).toEqual([...NEW_SCENE_V5_CARD_IDS]);
  expect(readingV4Words.map(card=>card.id)).toEqual([...NEW_READING_V4_CARD_IDS]);
  expect(sceneV6Words.map(card=>card.id)).toEqual([...NEW_SCENE_V6_CARD_IDS]);
  expect(readingV5Words.map(card=>card.id)).toEqual([...NEW_READING_V5_CARD_IDS]);
  expect(initialWordSession('daily-scenes-v5').ids).toHaveLength(5);
  expect(initialWordSession('daily-reading-v4').ids).toHaveLength(4);
  expect(initialWordSession('daily-scenes-v6').ids).toHaveLength(7);
  expect(initialWordSession('daily-reading-v5').ids).toHaveLength(2);
  for(const card of [...extensionWords, ...sceneV5Words, ...readingV4Words, ...sceneV6Words, ...readingV5Words]) {
    expect(card.meaning).toBeTruthy(); expect(card.example?.english).toBeTruthy();
    expect(card.transferExample?.english).toBeTruthy();
  }
});

it('saves a new incremental group without rewriting the ten-card queue or earlier records', () => {
  saveWordSession(localStorage,{...initialWordSession('game-work-reading-v1'),index:4,reviewIds:[extensionWords[0].id]});
  saveWordSession(localStorage,{...initialWordSession('daily-scenes-v5'),index:2});
  saveWordSession(localStorage,{...initialWordSession('daily-reading-v4'),index:1});
  const kept=JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!).wordSessions;
  const next=advanceWord(initialWordSession('daily-scenes-v6'));
  saveWordSession(localStorage,next);
  const after=JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
  expect(after.wordSessions['game-work-reading-v1']).toEqual(kept['game-work-reading-v1']);
  expect(after.wordSessions['daily-scenes-v5']).toEqual(kept['daily-scenes-v5']);
  expect(after.wordSessions['daily-reading-v4']).toEqual(kept['daily-reading-v4']);
  expect(readWordSession(localStorage,'daily-scenes-v6')).toMatchObject({...next,updatedAt:expect.any(Number)});
  expect(readWordSession(localStorage,'game-work-reading-v1').ids).toHaveLength(10);
});


it.each(['daily-scenes-v7','daily-reading-v6'] as const)('preserves all seven earlier queues when saving %s', groupId=>{
  const oldGroups=wordGroups.filter(group=>group.id!=='daily-scenes-v7' && group.id!=='daily-reading-v6');
  for(const group of oldGroups) saveWordSession(localStorage,{...initialWordSession(group.id),index:1});
  const before=JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
  localStorage.setItem(REVIEW_SESSION_KEY,'fictional-untouched');
  saveWordSession(localStorage,advanceWord(initialWordSession(groupId)));
  const after=JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY)!);
  expect(after.wordSession).toEqual(before.wordSession);
  for(const group of oldGroups.filter(g=>g.id!=='basic')) expect(after.wordSessions[group.id]).toEqual(before.wordSessions[group.id]);
  expect(localStorage.getItem(REVIEW_SESSION_KEY)).toBe('fictional-untouched');
});
