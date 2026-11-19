import { describe, expect, it } from 'vitest';
import {
  findReading,
  loadLearningCatalog,
  loadVocabCatalog,
  WIRED_READING_PACK_ID,
  WIRED_READING_PACK_IDS,
} from '../../src/lib/review';
import { wordGroups } from '../../src/adapters/wiring-words';

const TRAVEL_ID = 'reading-arriving-new-city';

describe('sourced Wikivoyage travel reading wiring', () => {
  it('appends the adapted reading without a new word group or card queue', () => {
    const learning = loadLearningCatalog();
    const reading = findReading(learning, TRAVEL_ID);
    expect(learning.wiredReadingPackId).toBe(WIRED_READING_PACK_ID);
    expect(learning.readingPack.readings).toHaveLength(2);
    expect(WIRED_READING_PACK_IDS).toContain('sourced-reading-pack-wikivoyage-v1');
    expect(learning.readings.some(reading => reading.id === TRAVEL_ID)).toBe(true);
    expect(reading?.title).toBe('到达一座新城市');
    expect(reading?.titleEn).toBe('Arriving in a New City');
    expect(reading?.wordCount).toBe(400);
    expect(reading?.paragraphs).toHaveLength(8);
    expect(reading?.notes).toHaveLength(5);
    expect(reading?.source?.sourceType).toBe('external-adaptation');
    expect(reading?.source?.sourceSite).toBe('English Wikivoyage');
    expect(reading?.source?.sourceOldid).toBe(5414939);
    expect(reading?.source?.permanentRevisionUrl).toBe(
      'https://en.wikivoyage.org/w/index.php?title=Arriving_in_a_new_city&oldid=5414939',
    );
    expect(reading?.source?.sourceLicense).toBe('CC BY-SA 4.0');
    expect(reading?.source?.adaptedLicense).toBe('CC BY-SA 4.0');
    expect(reading?.sourceAttribution?.attributionZh).toContain('CC BY-SA 4.0');
    expect(reading?.sourceAttribution?.noEndorsementZh).toContain('并不表示他们认可');
    expect(wordGroups.map((group) => group.id)).not.toContain(TRAVEL_ID);
    expect(wordGroups.some((group) => group.words.some((word) => word.id.startsWith('reading-arriving')))).toBe(false);
    const vocab = loadVocabCatalog();
    expect(vocab.extensionSourcePackIds).not.toContain('sourced-reading-pack-wikivoyage-v1');
    expect(learning.cards).toHaveLength(vocab.cards.length);
  });
});
