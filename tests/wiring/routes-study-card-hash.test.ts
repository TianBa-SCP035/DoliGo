import { describe, expect, it } from 'vitest';
import {
  hashForEntry,
  libraryWordFromHash,
  studyWordIdFromHash,
  wordGroupFromHash,
} from '../../src/adapters/routes';

describe('study word card hashes', () => {
  it('opens a group queue card by its own card route, not the group resume route', () => {
    expect(hashForEntry('words', 'L01-V01')).toBe('#/words/card/L01-V01');
    expect(hashForEntry('words', 'basic')).toBe('#/words/basic');
    expect(studyWordIdFromHash('#/words/card/L01-V01')).toBe('L01-V01');
    expect(libraryWordFromHash('#/words/card/L01-V01')).toBeUndefined();
    expect(wordGroupFromHash('#/words/card/L01-V01')).toBe('basic');
    expect(wordGroupFromHash('#/words/basic')).toBe('basic');
  });
});
