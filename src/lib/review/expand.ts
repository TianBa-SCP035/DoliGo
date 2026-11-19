import type { CardId, CardRevealState, ReviewCardSession, ReviewExpandState, UnitId } from './types';
import { initialCardReveal } from './reveal';

export function createReviewExpandState(): ReviewExpandState {
  return null;
}

export function isCardExpandedAt(
  state: ReviewExpandState,
  unitId: UnitId,
  cardId: CardId,
): boolean {
  return state !== null && state.unitId === unitId && state.cardId === cardId;
}

export function openCardAt(
  _state: ReviewExpandState,
  unitId: UnitId,
  cardId: CardId,
): ReviewExpandState {
  return { unitId, cardId };
}

export function closeCard(_state: ReviewExpandState = null): ReviewExpandState {
  return null;
}

export function toggleCardAt(
  state: ReviewExpandState,
  unitId: UnitId,
  cardId: CardId,
): ReviewExpandState {
  if (isCardExpandedAt(state, unitId, cardId)) return null;
  return { unitId, cardId };
}

export function createReviewCardSession(): ReviewCardSession {
  return { expanded: null, reveal: initialCardReveal() };
}

export function openCardSession(
  session: ReviewCardSession,
  unitId: UnitId,
  cardId: CardId,
): ReviewCardSession {
  if (isCardExpandedAt(session.expanded, unitId, cardId)) return session;
  return { expanded: { unitId, cardId }, reveal: initialCardReveal() };
}

export function toggleCardSession(
  session: ReviewCardSession,
  unitId: UnitId,
  cardId: CardId,
): ReviewCardSession {
  if (isCardExpandedAt(session.expanded, unitId, cardId)) {
    return createReviewCardSession();
  }
  return { expanded: { unitId, cardId }, reveal: initialCardReveal() };
}

export function closeCardSession(_session: ReviewCardSession = createReviewCardSession()): ReviewCardSession {
  return createReviewCardSession();
}

export function updateReveal(
  session: ReviewCardSession,
  updater: (reveal: CardRevealState) => CardRevealState,
): ReviewCardSession {
  if (!session.expanded) return session;
  return { ...session, reveal: updater(session.reveal) };
}
