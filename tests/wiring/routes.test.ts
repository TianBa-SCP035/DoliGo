import { describe, it, expect } from 'vitest';
import { pageFromHash, hashForEntry } from '../../src/adapters/routes';
import { textDocumentIdFromHash } from '../../src/adapters/text-resume';
describe('central route contract', () => {
  it('handles list and document routes in all four sections', () => {
    for (const entry of ['words', 'scenes', 'reading', 'review'] as const) {
      expect(pageFromHash(hashForEntry(entry))).toBe(entry);
    }
    expect(pageFromHash('#/scenes/scene-one-more-round')).toBe('scenes');
    expect(pageFromHash('#/reading/reading-lunch-later')).toBe('reading');
    expect(pageFromHash('#/scenes-other')).toBe('home');
    expect(pageFromHash('#/')).toBe('home');
  });
  it('encodes document ids and does not crash on malformed deep links', () => {
    expect(hashForEntry('scenes', 'a/b')).toBe('#/scenes/a%2Fb');
    expect(hashForEntry('words', 'ignored')).toBe('#/words');
    expect(textDocumentIdFromHash('#/scenes/%E0%A4%A', 'scenes')).toBeUndefined();
  });
});
