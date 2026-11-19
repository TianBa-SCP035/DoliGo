import type { AnchorUnit, CardId, EncounterId, TextSegment, TextSpan, UnitId } from './types';

/** Unit ids were kept from anchors v1; do not rebuild them with the v1.1 pack id. */
export const REVIEW_UNIT_ID_PREFIX = 'independent-vocab-review-pack-v1';

export function reviewSentenceUnitId(encounterId: EncounterId, sentenceIndex: number): UnitId {
  return `${REVIEW_UNIT_ID_PREFIX}::${encounterId}::s${sentenceIndex}`;
}

export function findUnitById(units: readonly AnchorUnit[], id: UnitId): AnchorUnit | undefined {
  return units.find((unit) => unit.id === id);
}

export function findReviewUnit(
  units: readonly AnchorUnit[],
  encounterId: EncounterId,
  sentenceIndex: number,
): AnchorUnit | undefined {
  const id = reviewSentenceUnitId(encounterId, sentenceIndex);
  return (
    findUnitById(units, id) ??
    units.find((unit) => unit.encounterId === encounterId && unit.sentenceIndex === sentenceIndex)
  );
}

export function codePoints(text: string): string[] {
  return Array.from(text);
}

export function sliceByCodePoints(text: string, start: number, end: number): string {
  return Array.from(text).slice(start, end).join('');
}

export function cardIdAtCodePoint(unit: AnchorUnit, index: number): CardId | undefined {
  const span = unit.spans.find((item) => index >= item.start && index < item.end);
  return span?.cardId;
}

export function spanSurfaceMatches(text: string, span: TextSpan): boolean {
  return sliceByCodePoints(text, span.start, span.end) === span.surface;
}

export function segmentsForUnit(unit: AnchorUnit): TextSegment[] {
  const points = codePoints(unit.textEn);
  const spans = [...unit.spans]
    .filter((span) => span.start >= 0 && span.end <= points.length && span.start < span.end)
    .sort((a, b) => a.start - b.start);
  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start < cursor) continue;
    if (span.start > cursor) {
      segments.push({ type: 'text', text: points.slice(cursor, span.start).join('') });
    }
    segments.push({
      type: 'tap',
      text: points.slice(span.start, span.end).join(''),
      start: span.start,
      end: span.end,
      cardId: span.cardId,
      surface: span.surface,
      form: span.form,
      priority: span.priority,
    });
    cursor = span.end;
  }
  if (cursor < points.length) {
    segments.push({ type: 'text', text: points.slice(cursor).join('') });
  }
  return segments;
}
