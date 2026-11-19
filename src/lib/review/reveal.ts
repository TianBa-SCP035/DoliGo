import type { CardRevealState } from './types';

export const VIEWING_IS_NOT_MASTERY = true;

export const SELF_MARK_LABELS = {
  vocabAgain: '还要再看',
  vocabHold: '这张先这样',
  reviewKnown: '这句里的意思，我还认得',
  reviewUnsure: '这一义还不太熟',
} as const;

export function initialCardReveal(): CardRevealState {
  return { senseOpen: false, examplesOpen: false, notesOpen: false };
}

export function revealSense(state: CardRevealState): CardRevealState {
  if (state.senseOpen) return state;
  return { ...state, senseOpen: true };
}

export function hideSense(_state: CardRevealState = initialCardReveal()): CardRevealState {
  return initialCardReveal();
}

export function canRevealDetails(state: CardRevealState): boolean {
  return state.senseOpen;
}

export function toggleExamples(state: CardRevealState): CardRevealState {
  if (!state.senseOpen) return state;
  return { ...state, examplesOpen: !state.examplesOpen };
}

export function toggleNotes(state: CardRevealState): CardRevealState {
  if (!state.senseOpen) return state;
  return { ...state, notesOpen: !state.notesOpen };
}
