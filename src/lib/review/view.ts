import { findReviewUnit, reviewSentenceUnitId, segmentsForUnit } from './anchors';
import { sentenceTargetCardIds } from './targets';
import type { AnchorUnit, ReviewEncounter, ReviewEncounterView, ReviewSentenceView } from './types';

export function buildReviewEncounterView(
  encounter: ReviewEncounter,
  units: readonly AnchorUnit[],
): ReviewEncounterView {
  const sentences: ReviewSentenceView[] = encounter.sentences.map((sentence, sentenceIndex) => {
    const unit = findReviewUnit(units, encounter.id, sentenceIndex);
    const unitId = unit?.id ?? reviewSentenceUnitId(encounter.id, sentenceIndex);
    return {
      encounterId: encounter.id,
      sentenceIndex,
      unitId,
      en: unit?.textEn ?? sentence.en,
      zh: sentence.zh,
      setting: sentence.setting,
      targetCardIds: sentenceTargetCardIds(encounter, sentenceIndex),
      spans: unit?.spans ?? [],
      segments: unit ? segmentsForUnit(unit) : sentence.en ? [{ type: 'text', text: sentence.en }] : [],
    };
  });

  return {
    id: encounter.id,
    kind: encounter.kind,
    expression: encounter.expression,
    noteZh: encounter.noteZh,
    optionalCheck: Boolean(encounter.optionalCheck),
    targetBinding: encounter.targetBinding,
    unionTargetCardIds: [...(encounter.targetCardIds ?? [])],
    sentences,
  };
}

export function getReviewEncounter(
  encounters: readonly ReviewEncounter[],
  id: string,
): ReviewEncounter | undefined {
  return encounters.find((encounter) => encounter.id === id);
}
