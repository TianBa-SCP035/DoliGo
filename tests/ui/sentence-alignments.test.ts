import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import {
  reviewedSentences,
  sentenceTranslation,
  type ArticleUnit,
} from "../../src/ui/ArticleReader";

type Pack = {
  readings: {
    id: string;
    paragraphs: ArticleUnit[];
  }[];
};

function load(name: string): Pack {
  return JSON.parse(
    readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "fixtures", name), "utf8"),
  );
}

function everySentence(pack: Pack, fn: (unit: ArticleUnit, index: number) => void) {
  for (const reading of pack.readings) {
    for (const unit of reading.paragraphs) fn(unit, unit.en.indexOf(unit.sentences![0]!.en));
  }
}

it("accepts reviewed alignments when English reconstructs the official paragraph", () => {
  const existing = load("existing-sentence-alignments.json");
  const fresh = load("new-readings-sentence-alignments.json");
  expect(existing.readings).toHaveLength(3);
  expect(fresh.readings).toHaveLength(3);
  let pairs = 0;
  for (const pack of [existing, fresh]) {
    for (const reading of pack.readings) {
      for (const unit of reading.paragraphs) {
        const rows = reviewedSentences(unit);
        expect(rows, unit.id).toHaveLength(unit.sentences!.length);
        expect(rows.map((s) => s.zh).join("")).toBe(unit.zh);
        let cursor = 0;
        for (const sentence of rows) {
          const start = unit.en.indexOf(sentence.en, cursor);
          expect(start, sentence.en).toBeGreaterThanOrEqual(0);
          const inside = start + Math.min(6, Math.max(1, sentence.en.length - 1));
          expect(sentenceTranslation(unit, inside, inside + 1)?.zh).toBe(sentence.zh);
          cursor = start + sentence.en.length;
          pairs += 1;
        }
        expect(sentenceTranslation(unit, 0, unit.en.length)).toBeUndefined();
      }
    }
  }
  expect(pairs).toBe(54 + 72);
});

it("keeps a combined Chinese unit for weather paragraph two", () => {
  const weather = load("existing-sentence-alignments.json").readings.find(
    (reading) => reading.id === "reading-weather-everyday",
  );
  const unit = weather?.paragraphs.find((p) => p.id === "reading-weather-everyday-p2");
  expect(unit?.sentences).toHaveLength(4);
  const combined = unit!.sentences!.find((s) => s.en.includes("People wear different clothes"));
  expect(combined?.en).toContain("They may also choose different food");
  expect(combined?.zh).toBe(
    "人们在不同的天气里会穿不同的衣服、做不同的事，在不同的季节也可能选择不同的食物。",
  );
  const start = unit!.en.indexOf("People wear");
  expect(sentenceTranslation(unit!, start, start + 11)?.zh).toBe(combined?.zh);
});
