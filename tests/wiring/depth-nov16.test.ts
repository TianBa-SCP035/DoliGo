import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CONTENT_CARD_GROUPS,
  DEPTH_NOV16_READING_IDS,
  DEPTH_NOV16_SCENE_IDS,
  DEPTH_NOV16_VOCAB_CARD_IDS,
  LIBRARY_VOCAB_CARD_IDS,
  getCard,
  loadLearningCatalog,
  loadReviewCatalog,
  loadVocabCatalog,
  topicVocabularyDepthNov16,
} from '../../src/lib/review';
import { CONTENT_PACKS } from '../../src/content/manifest';
import { wordGroups } from '../../src/adapters/wiring-words';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sha256 = (file: string) => CONTENT_PACKS.find((pack) => pack.file === file)?.sha256 ?? '';

describe('nov16 theme-depth wiring', () => {
  it('registers four official packs without creating a study group', () => {
    expect(CONTENT_PACKS.map((pack) => pack.id)).toEqual(expect.arrayContaining([
      'bulk-vocab-depth-nov16',
      'sourced-reading-pack-depth-v1',
      'everyday-scenes-depth-nov16',
      'topic-vocabulary-depth-nov16',
    ]));
    for (const file of ['bulk-vocab-depth-nov16.json', 'sourced-reading-pack-depth-v1.json', 'everyday-scenes-depth-nov16.json', 'topic-vocabulary-depth-nov16.json']) {
      expect(existsSync(join(root, 'src/content', file))).toBe(true);
      expect(sha256(file)).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(Object.keys(CONTENT_CARD_GROUPS)).toEqual([
      'reviewIndex', 'scenesV3', 'scenesV4', 'readingV3', 'scenesV5', 'readingV4', 'scenesV6', 'readingV5', 'scenesV7', 'readingV6',
    ]);
  });

  it('adds 91 library words and keeps the reviewed 30 plus frozen review catalog', () => {
    const learning = loadLearningCatalog();
    const vocab = loadVocabCatalog();
    const review = loadReviewCatalog();
    expect(DEPTH_NOV16_VOCAB_CARD_IDS).toHaveLength(91);
    expect(LIBRARY_VOCAB_CARD_IDS).toHaveLength(222);
    expect(vocab.libraryCards).toHaveLength(222);
    expect(vocab.libraryCards.slice(0, 30).map((card) => card.id).every((id) => id.startsWith('ready-nov16-'))).toBe(true);
    expect(vocab.libraryCards.slice(30, 121).map((card) => card.id)).toEqual([...DEPTH_NOV16_VOCAB_CARD_IDS]);
    expect(new Set(vocab.libraryCards.map((card) => card.id)).size).toBe(222);
    expect(vocab.extensionCards.some((card) => (DEPTH_NOV16_VOCAB_CARD_IDS as readonly string[]).includes(card.id))).toBe(false);
    expect(vocab.defaultQueueCards.some((card) => (LIBRARY_VOCAB_CARD_IDS as readonly string[]).includes(card.id))).toBe(false);
    expect(review.cards).toHaveLength(273);
    expect(learning.cards).toHaveLength(540);
    expect(vocab.libraryCards[30]?.lemmaFrequencySource?.name).toContain('wordfreq');
    expect(wordGroups.map((group) => [group.id, group.words.length])).toEqual([
      ['basic', 8],
      ['daily-scenes-v3', 8],
      ['game-work-reading-v1', 10],
      ['daily-scenes-v5', 5],
      ['daily-reading-v4', 4],
      ['daily-scenes-v6', 7],
      ['daily-reading-v5', 2],
      ['daily-scenes-v7', 6],
      ['daily-reading-v6', 3],
    ]);
  });

  it('adds three continuation scenes without changing parent lines', () => {
    const learning = loadLearningCatalog();
    expect(learning.scenes).toHaveLength(22);
    expect(learning.wiredScenePackIds).toContain('everyday-scenes-depth-nov16');
    expect(DEPTH_NOV16_SCENE_IDS).toEqual([
      'scene-have-the-receipt-extension-1',
      'scene-change-dinner-time-extension-1',
      'scene-voice-keeps-cutting-extension-1',
    ]);
    const parents = {
      'scene-have-the-receipt-extension-1': { parent: 'scene-have-the-receipt', lines: 16 },
      'scene-change-dinner-time-extension-1': { parent: 'scene-change-dinner-time', lines: 13 },
      'scene-voice-keeps-cutting-extension-1': { parent: 'scene-voice-keeps-cutting', lines: 16 },
    };
    for (const id of DEPTH_NOV16_SCENE_IDS) {
      const scene = learning.scenes.find((item) => item.id === id);
      const parent = learning.scenes.find((item) => item.id === parents[id].parent);
      expect(scene?.parentSceneId).toBe(parents[id].parent);
      expect(parent?.lines).toHaveLength(parents[id].lines);
      expect(scene?.lines.length).toBeGreaterThan(0);
    }
    expect(learning.scenes.find((item) => item.id === 'scene-have-the-receipt-extension-1')?.lines).toHaveLength(20);
    expect(learning.scenes.find((item) => item.id === 'scene-change-dinner-time-extension-1')?.lines).toHaveLength(24);
    expect(learning.scenes.find((item) => item.id === 'scene-voice-keeps-cutting-extension-1')?.lines).toHaveLength(23);
  });

  it('keeps 18 paragraph ids and 72 sentence alignments on the three depth readings', () => {
    const learning = loadLearningCatalog();
    expect(learning.readings).toHaveLength(21);
    expect([...DEPTH_NOV16_READING_IDS]).toEqual([
      'reading-apartment-life-depth',
      'reading-clothes-for-everyday-depth',
      'reading-choosing-restaurant-depth',
    ]);
    const readings = DEPTH_NOV16_READING_IDS.map((id) => learning.readings.find((item) => item.id === id));
    expect(readings.every(Boolean)).toBe(true);
    expect(readings.flatMap((item) => item?.paragraphs ?? [])).toHaveLength(18);
    expect(readings.flatMap((item) => item?.paragraphs.flatMap((paragraph) => paragraph.sentences ?? []) ?? [])).toHaveLength(72);
    for (const reading of readings) {
      expect(reading?.source?.sourceLicense).toBe('CC BY-SA 4.0');
      expect(reading?.sourceAttribution?.attributionEn).toContain('CC BY-SA 4.0');
      expect(reading?.source?.sourceOldid).toBeGreaterThan(0);
      expect(reading?.endOfReadingAttribution?.en).toContain('CC BY-SA 4.0');
      expect((reading?.changeNotice ?? '').length).toBeGreaterThan(40);
      expect((reading?.changeNoticeZh ?? '').length).toBeGreaterThan(20);
      for (const paragraph of reading?.paragraphs ?? []) {
        expect(paragraph.sentences?.length).toBeGreaterThan(0);
        const joined = (paragraph.sentences ?? []).map((sentence) => sentence.en).join(' ');
        expect(joined).toBe(paragraph.en);
        for (const sentence of paragraph.sentences ?? []) {
          expect(typeof sentence.start).toBe('number');
          expect(typeof sentence.end).toBe('number');
          expect(paragraph.en.slice(sentence.start, sentence.end)).toBe(sentence.en);
        }
      }
    }
  });

  it('resolves five existing topics of 20 references including nine reused cards', () => {
    const learning = loadLearningCatalog();
    expect(Object.keys(topicVocabularyDepthNov16.topicCardIds).sort()).toEqual(['dining', 'game', 'home', 'shopping', 'travel']);
    expect(topicVocabularyDepthNov16.reuseCardIds).toHaveLength(9);
    expect(topicVocabularyDepthNov16.newCardIds).toHaveLength(91);
    let total = 0;
    for (const [topic, ids] of Object.entries(topicVocabularyDepthNov16.topicCardIds)) {
      expect(ids).toHaveLength(20);
      total += ids.length;
      for (const id of ids) {
        expect(getCard(learning.cardIndex, id), `${topic}:${id}`).toBeTruthy();
      }
    }
    expect(total).toBe(100);
    for (const id of topicVocabularyDepthNov16.reuseCardIds) {
      expect((DEPTH_NOV16_VOCAB_CARD_IDS as readonly string[]).includes(id)).toBe(false);
      expect(getCard(learning.cardIndex, id)).toBeTruthy();
    }
  });

  it('does not treat official staging as a catalog pack', () => {
    const staged = JSON.parse(readFileSync(join(root, 'runtime/staging-nov16-depth/staged.json'), 'utf8')) as { ready?: unknown[] };
    expect(staged.ready).toHaveLength(94);
    expect(CONTENT_PACKS.some((pack) => pack.file.includes('staging-nov16-depth'))).toBe(false);
  });
});
