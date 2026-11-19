import type { CardId, CardIndex, VocabCard } from './types';

export function indexCards(cards: readonly VocabCard[]): CardIndex {
  const byId = new Map<CardId, VocabCard>();
  const aliasToCanonical = new Map<CardId, CardId>();
  for (const card of cards) {
    byId.set(card.id, card);
    for (const alias of card.aliasIds ?? []) {
      aliasToCanonical.set(alias, card.id);
    }
  }
  return { byId, aliasToCanonical };
}

export function resolveCardId(index: CardIndex, id: CardId): CardId | undefined {
  if (index.byId.has(id)) return id;
  return index.aliasToCanonical.get(id);
}

export function getCard(index: CardIndex, id: CardId): VocabCard | undefined {
  const canonical = resolveCardId(index, id);
  return canonical ? index.byId.get(canonical) : undefined;
}
