import { describe, expect, it } from 'vitest';
import {
  closeCardSession,
  createReviewCardSession,
  isCardExpandedAt,
  openCardSession,
  revealSense,
  toggleCardSession,
  toggleExamples,
  updateReveal,
} from '../../src/lib/review';

const waitS0 = 'independent-vocab-review-pack-v1::rv-cross-L06-V03::s0';
const waitS1 = 'independent-vocab-review-pack-v1::rv-cross-L06-V03::s1';
const waitCard = 'L06-V03';

describe('review card expand state', () => {
  it('expands only under the clicked sentence, even when the card id is the same', () => {
    let session = createReviewCardSession();
    session = openCardSession(session, waitS1, waitCard);
    expect(isCardExpandedAt(session.expanded, waitS1, waitCard)).toBe(true);
    expect(isCardExpandedAt(session.expanded, waitS0, waitCard)).toBe(false);
  });

  it('moves the open card when another unit is clicked', () => {
    let session = openCardSession(createReviewCardSession(), waitS0, waitCard);
    session = updateReveal(session, revealSense);
    session = openCardSession(session, waitS1, waitCard);
    expect(isCardExpandedAt(session.expanded, waitS0, waitCard)).toBe(false);
    expect(isCardExpandedAt(session.expanded, waitS1, waitCard)).toBe(true);
    expect(session.reveal.senseOpen).toBe(false);
  });

  it('toggles the same unit closed and resets reveal', () => {
    let session = openCardSession(createReviewCardSession(), waitS0, waitCard);
    session = updateReveal(session, revealSense);
    session = toggleCardSession(session, waitS0, waitCard);
    expect(session.expanded).toBeNull();
    expect(session.reveal.senseOpen).toBe(false);
  });

  it('ignores reveal updates when nothing is expanded', () => {
    const session = updateReveal(createReviewCardSession(), revealSense);
    expect(session.expanded).toBeNull();
    expect(session.reveal.senseOpen).toBe(false);
  });

  it('closes the session completely', () => {
    let session = openCardSession(createReviewCardSession(), waitS0, waitCard);
    session = updateReveal(session, (reveal) => toggleExamples(revealSense(reveal)));
    session = closeCardSession(session);
    expect(session.expanded).toBeNull();
    expect(session.reveal).toEqual({ senseOpen: false, examplesOpen: false, notesOpen: false });
  });
});
