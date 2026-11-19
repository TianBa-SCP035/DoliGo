import { describe, it, expect } from 'vitest';
import scenes from '../../src/content/everyday-scenes-pack-v1.1.json';
import readings from '../../src/content/everyday-reading-pack-v2.1.json';
import { loadReviewCatalog, segmentsForUnit, spanSurfaceMatches, getCard } from '../../src/lib/review';

const { anchorsPack, cardIndex } = loadReviewCatalog();
const documents = [
  ...scenes.scenes.map(d => ({ id:d.id, units:d.lines })),
  ...readings.readings.map(d => ({ id:d.id, units:d.paragraphs })),
];
describe('scene and reading source-to-anchor contract', () => {
  it('keeps all 49 original units and four documents represented without duplicate ids', () => {
    expect(documents).toHaveLength(4);
    expect(documents.flatMap(d=>d.units)).toHaveLength(49);
    const relevant=anchorsPack.units.filter(u=>documents.some(d=>d.id===u.parentId));
    expect(relevant).toHaveLength(49);
    expect(new Set(relevant.map(u=>u.id)).size).toBe(relevant.length);
    expect(new Set(relevant.map(u=>`${u.parentId}::${u.sourceId}`)).size).toBe(relevant.length);
  });
  for (const doc of documents) {
    it(`${doc.id}: uses exact original text, valid card ids and nonoverlapping code-point spans`, () => {
      for (const source of doc.units) {
        const matches=anchorsPack.units.filter(u=>u.parentId===doc.id && u.sourceId===source.id);
        expect(matches,source.id).toHaveLength(1);
        const unit=matches[0];
        expect(unit.textEn,source.id).toBe(source.en);
        expect(source.zh.trim().length).toBeGreaterThan(0);
        const sorted=[...unit.spans].sort((a,b)=>a.start-b.start);
        let previousEnd=0;
        for (const span of sorted) {
          expect(Number.isInteger(span.start)).toBe(true);
          expect(Number.isInteger(span.end)).toBe(true);
          expect(span.start).toBeGreaterThanOrEqual(previousEnd);
          expect(span.end).toBeGreaterThan(span.start);
          expect(span.end).toBeLessThanOrEqual(Array.from(source.en).length);
          expect(spanSurfaceMatches(source.en,span),`${source.id}: ${span.surface}`).toBe(true);
          expect(getCard(cardIndex,span.cardId),span.cardId).toBeDefined();
          previousEnd=span.end;
        }
        const segments=segmentsForUnit(unit);
        expect(segments.map(s=>s.text).join(''),source.id).toBe(source.en);
        expect(segments.filter(s=>s.type==='tap')).toHaveLength(unit.spans.length);
      }
    });
  }
  it('does not invent body anchors for deliberately absent reading expressions', () => {
    const body=anchorsPack.units.filter(u=>u.unitType==='reading-paragraph');
    const tapped=body.flatMap(u=>u.spans.map(s=>s.cardId));
    expect(tapped).not.toContain('rw2-hold-on-to');
    expect(tapped).not.toContain('rw2-manage-to');
  });
});
