import { describe, expect, it } from 'vitest';
import {
  canRevealDetails,
  hideSense,
  initialCardReveal,
  revealSense,
  toggleExamples,
  toggleNotes,
  VIEWING_IS_NOT_MASTERY,
} from '../../src/lib/review';

describe('card reveal steps', () => {
  it('starts with only the headword side hidden meaning', () => {
    const state = initialCardReveal();
    expect(state).toEqual({ senseOpen: false, examplesOpen: false, notesOpen: false });
    expect(canRevealDetails(state)).toBe(false);
  });

  it('shows sense first and keeps examples and notes closed', () => {
    const state = revealSense(initialCardReveal());
    expect(state.senseOpen).toBe(true);
    expect(state.examplesOpen).toBe(false);
    expect(state.notesOpen).toBe(false);
    expect(canRevealDetails(state)).toBe(true);
  });

  it('does not open examples or notes before the sense is revealed', () => {
    const closed = initialCardReveal();
    expect(toggleExamples(closed)).toEqual(closed);
    expect(toggleNotes(closed)).toEqual(closed);
  });

  it('toggles examples and notes independently after the sense is open', () => {
    let state = revealSense(initialCardReveal());
    state = toggleExamples(state);
    expect(state.examplesOpen).toBe(true);
    expect(state.notesOpen).toBe(false);
    state = toggleNotes(state);
    expect(state.examplesOpen).toBe(true);
    expect(state.notesOpen).toBe(true);
    state = toggleExamples(state);
    expect(state.examplesOpen).toBe(false);
    expect(state.notesOpen).toBe(true);
  });

  it('hides sense and collapses the later steps', () => {
    const open = toggleNotes(toggleExamples(revealSense(initialCardReveal())));
    expect(hideSense(open)).toEqual(initialCardReveal());
  });

  it('treats viewing as not mastery', () => {
    expect(VIEWING_IS_NOT_MASTERY).toBe(true);
  });
});
