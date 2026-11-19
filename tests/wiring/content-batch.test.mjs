import { describe, it, expect } from 'vitest';
import { stageBatch, stableId } from '../../scripts/content-batch.mjs';
// Fictional test records, not sourced teaching material.
const source = { id:'fixture', url:'https://example.org/text', license:'example-only', licenseUrl:'https://example.org/license', attribution:'Fictional QA data', reuseDecision:'approved', reviewedBy:'fixture-reviewer', reviewedAt:'2026-11-16' };
const word = { kind:'word', sourceId:'fixture', headword:'test', posZh:'名词', senseZh:'测试', exampleEn:'A test.', exampleZh:'一次测试。', textMode:'original' };
const batch = items => ({ schemaVersion:1, sources:[source], items });
describe('batch ingestion staging', () => {
 it('gives repeatable IDs and detects duplicate senses', () => {
   expect(stableId(word)).toBe(stableId({...word}));
   const r=stageBatch(batch([word,{...word, headword:' TEST '},{...word,senseZh:'另一义项'}]));
   expect(r.counts).toEqual({ready:2,review:0,rejected:0,duplicates:1});
 });
 it('does not change or reuse existing IDs', () => {
   const r=stageBatch(batch([{...word,id:'old-card'}]),[{...word,id:'old-card'}]);
   expect(r.duplicates).toHaveLength(1); expect(r.ready).toHaveLength(0);
 });
 it('quarantines unreviewed licenses and missing translations', () => {
   const b=batch([word]); b.sources[0]={...source,reuseDecision:'pending'};
   expect(stageBatch(b).review[0].reasons).toContain('source-review-required');
   expect(stageBatch(batch([{...word,senseZh:''}])).review).toHaveLength(1);
 });
 it('rejects denied reuse and incomplete provenance', () => {
   const b=batch([word]); b.sources[0]={...source,reuseDecision:'denied'};
   expect(stageBatch(b).rejected).toHaveLength(1);
   b.sources[0]={...source,url:'not-a-url'};
   expect(stageBatch(b).rejected[0].reasons).toContain('incomplete-provenance');
 });
 it('requires adaptation disclosure and stable paragraph identities', () => {
   const reading={kind:'reading',sourceId:'fixture',title:'测试',titleEn:'Test',textMode:'adapted',paragraphs:[{en:'Test.',zh:'测试。'}]};
   expect(stageBatch(batch([reading])).review[0].reasons).toContain('adaptation-notice-required');
   const r=stageBatch(batch([{...reading,changeNotice:'Fictional QA simplification',adaptedLicense:'example-only'}]));
   expect(r.ready[0].paragraphs[0].id).toBe(r.ready[0].id+'-p1');
 });
 it('does not let pending candidates mask reviewed candidates', () => {
   const r=stageBatch(batch([{...word,exampleZh:''},word]));
   expect(r.review).toHaveLength(1); expect(r.ready).toHaveLength(1);
 });
 it('rejects duplicate paragraph IDs', () => {
   const reading={kind:'reading',sourceId:'fixture',title:'测试',titleEn:'Test',textMode:'original',paragraphs:[{id:'p',en:'First.',zh:'一。'},{id:'p',en:'Next.',zh:'二。'}]};
   expect(stageBatch(batch([reading])).rejected[0].reasons).toContain('duplicate-paragraph-id');
 });
});
