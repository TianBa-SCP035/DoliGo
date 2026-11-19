import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { lookupMeaning, normalizeLookup } from "../../src/ui/ArticleReader";
import { loadLearningCatalog } from "../../src/lib/review";

const catalog = loadLearningCatalog();
const css = readFileSync("src/ui/article-reader.css", "utf8");
const reader = readFileSync("src/ui/ArticleReader.tsx", "utf8");

it("lets article tap words stay selectable so drag lookup can cross an anchor", () => {
  expect(css).toMatch(/\.doli-prose \.doli-tap[^{]*\{[^}]*user-select:\s*text/);
  expect(css).toMatch(/-webkit-user-select:\s*text/);
});

it("keeps the four reading-lookup sources distinct", () => {
  const notes = [{ expression: "I had chopped the vegetables", meaningZh: "表示十二点时菜已经切好。" }];
  expect(lookupMeaning("I had chopped the vegetables", catalog, notes)).toEqual({
    meaning: "表示十二点时菜已经切好。",
    source: "本文表达说明",
  });
  const movie = lookupMeaning("movie", catalog, notes);
  expect(movie?.meaning).toBe("电影");
  expect(movie?.source).toBe("词库释义，需结合本句语境");
  expect(lookupMeaning("pasta", catalog, notes)).toBeUndefined();
  expect(lookupMeaning("broken down", catalog, notes)).toBeUndefined();
  expect(normalizeLookup("  I had chopped the vegetables. ")).toBe("i had chopped the vegetables");
  expect(reader).toMatch(/未接入任意文本在线翻译/);
  expect(reader).toMatch(/本地词库暂未收录这个选词的释义/);
  expect(reader).not.toMatch(/fetch\(|https?:\/\/.*translat/i);
});

it("renders reading anchors as selectable spans rather than native buttons", () => {
  expect(reader).toMatch(/role="button"/);
  expect(reader).toMatch(/className="doli-tap-wrap"/);
  expect(reader).toMatch(/className="doli-tap-key"/);
  expect(reader).not.toMatch(/segment\.type === "tap" \? <button /);
  expect(reader).not.toMatch(/className="doli-tap"[^>]*tabIndex/);
  expect(reader).toMatch(/tabIndex=\{0\} className="doli-tap-key"/);
});

it("keeps keyboard access on a sibling that is not the visible word", () => {
  expect(css).toMatch(/\.doli-prose \.doli-tap-key[^{]*\{[^}]*pointer-events:\s*none/);
  expect(css).toMatch(/\.doli-prose \.doli-tap-wrap:focus-within \.doli-tap/);
  expect(reader).toMatch(/onKeyDown=\{event =>/);
  expect(reader).toMatch(/event\.key === "Enter" \|\| event\.key === " "/);
});
