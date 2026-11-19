import rawAnchors from '../../content/content-text-anchors-v1.1.json';
import rawReview from '../../content/independent-vocab-review-pack-v1.2.json';
import { indexCards } from './cards';
import type { AnchorsPack, CardIndex, ReviewPack, VocabCard } from './types';

export const reviewPack = rawReview as ReviewPack;
export const anchorsPack = rawAnchors as AnchorsPack;

export type ReviewCatalog = {
  reviewPack: ReviewPack;
  anchorsPack: AnchorsPack;
  cards: VocabCard[];
  cardIndex: CardIndex;
};

export function loadReviewCatalog(): ReviewCatalog {
  const cards = reviewPack.cards;
  return {
    reviewPack,
    anchorsPack,
    cards,
    cardIndex: indexCards(cards),
  };
}
