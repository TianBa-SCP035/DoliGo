import { describe, expect, it } from 'vitest';
import { loadLearningCatalog, loadVocabCatalog, loadReviewCatalog, isDefaultVocabQueueCard } from '../../src/lib/review';
import { wordGroups } from '../../src/adapters/wiring-words';
const readingIds = ['reading-library-basics','reading-weather-everyday','reading-laundry-while-traveling'];
describe('reviewed bulk import', () => {
 it('keeps 30 library words separate from all frozen queues and review', () => {
  const vocab=loadVocabCatalog(); const review=loadReviewCatalog();
  expect(vocab.libraryCards.filter(c=>c.id.startsWith('ready-nov16-'))).toHaveLength(30);
  expect(vocab.libraryCards).toHaveLength(222);
  expect(vocab.cards).toHaveLength(540);
  expect(vocab.cards.slice(-222)).toEqual(vocab.libraryCards);
  expect(wordGroups.map(g=>[g.id,g.words.length])).toEqual([['basic',8],['daily-scenes-v3',8],['game-work-reading-v1',10],['daily-scenes-v5',5],['daily-reading-v4',4],['daily-scenes-v6',7],['daily-reading-v5',2],['daily-scenes-v7',6],['daily-reading-v6',3]]);
  expect(vocab.libraryCards.slice(0, 121).every((card)=>typeof card.sourceKey==='string' && /^wf-en-/.test(card.sourceKey))).toBe(true);
  for(const card of vocab.libraryCards) {
   expect(card.senseZh).toBeTruthy(); expect(card.exampleEn).toBeTruthy(); expect(card.exampleZh).toBeTruthy();
   expect(isDefaultVocabQueueCard(card)).toBe(false);
   for(const queue of [vocab.defaultQueueCards,vocab.extensionCards,review.cards,...wordGroups.map(g=>g.words)]) expect(queue.some(c=>c.id===card.id)).toBe(false);
  }
 });
 it('adds only three reviewed readings with source, categories, bilingual text and attribution', () => {
  const cat=loadLearningCatalog(); expect(cat.readings).toHaveLength(21);
  expect(readingIds.every(id=>cat.readings.some(r=>r.id===id))).toBe(true);
  for(const reading of cat.readings.filter(r=>readingIds.includes(r.id))) {
   expect(reading.category).toBeTruthy(); expect(reading.source?.sourceOldid).toBeGreaterThan(0);
   expect(reading.source?.sourceLicense).toBe('CC BY-SA 4.0');
   expect(reading.changeNotice).toBeTruthy(); expect(reading.changeNoticeZh).toBeTruthy();
   expect(reading.endOfReadingAttribution?.en).toContain('CC BY-SA');
   expect(reading.sourceAttribution?.links).toHaveLength(4);
   expect(reading.paragraphs).toHaveLength(4);
   for(const p of reading.paragraphs) { expect(p.en).toBeTruthy(); expect(p.zh).toBeTruthy(); }
  }
 });
 it('merges reviewed sentence alignments onto the three live readings without changing paragraph ids or body text', () => {
  const cat=loadLearningCatalog();
  const readingIds = ['reading-library-basics','reading-weather-everyday','reading-laundry-while-traveling'];
  const readings=readingIds.map(id=>cat.readings.find(r=>r.id===id));
  expect(readings.every(Boolean)).toBe(true);
  expect(readings.flatMap(r=>r!.paragraphs)).toHaveLength(12);
  expect(readings.flatMap(r=>r!.paragraphs.flatMap(p=>p.sentences??[]))).toHaveLength(54);
  const weatherP2=readings[1]!.paragraphs.find(p=>p.id==='reading-weather-everyday-p2');
  expect(weatherP2?.sentences).toHaveLength(4);
  expect(weatherP2?.sentences?.some(s=>s.en.includes('People wear different clothes') && s.en.includes('They may also choose different food'))).toBe(true);
  for(const reading of readings){
    for(const p of reading!.paragraphs){
      expect(p.id.startsWith(`${reading!.id}-p`)).toBe(true);
      expect((p.sentences??[]).length).toBeGreaterThan(0);
      expect((p.sentences??[]).map(s=>s.en).join(' ')).toBe(p.en);
      expect((p.sentences??[]).map(s=>s.zh).join('')).toBe(p.zh);
      for(const s of p.sentences??[]){
        expect(typeof s.start).toBe('number');
        expect(p.en.slice(s.start,s.end)).toBe(s.en);
      }
    }
  }
 });
});
