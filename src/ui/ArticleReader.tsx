import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getCard,
  segmentsForUnit,
  type LearningCatalog,
  type VocabCard,
} from "../lib/review";
import type { TextUnit } from "./TextLibraryView";

export type ArticleUnit = TextUnit & {
  /** Author-reviewed alignment. Never infer this from equal punctuation counts. */
  sentences?: { en: string; zh: string }[];
};
type SentenceSpan = { en: string; start: number; end: number };
export function normalizeLookup(text: string) {
  return text.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').trim()
    .replace(/^[\s.,!?;:"()]+|[\s.,!?;:"()]+$/g, "").replace(/\s+/g, " ").toLowerCase();
}
export function sentenceSpans(text: string): SentenceSpan[] {
  type SegmenterType = new (locale: string, options: { granularity: "sentence" }) => {
    segment: (text: string) => Iterable<{ segment: string; index: number }>;
  };
  const Segmenter = (Intl as typeof Intl & { Segmenter?: SegmenterType }).Segmenter;
  if (Segmenter) return Array.from(new Segmenter("en", { granularity: "sentence" }).segment(text), s => ({
    en: s.segment.trim(), start: s.index, end: s.index + s.segment.length,
  })).filter(s => s.en);
  // Conservative fallback: do not invent sentence-level translations in old browsers.
  return [];
}
function compact(text: string) { return text.replace(/\s+/g, " ").trim(); }
export function reviewedSentences(unit: ArticleUnit) {
  const rows = unit.sentences;
  if (!Array.isArray(rows) || !rows.length || rows.some(s => !s || typeof s.en !== "string" || !s.en.trim() || typeof s.zh !== "string" || !s.zh.trim())) return [];
  return compact(rows.map(s => s.en).join(" ")) === compact(unit.en) ? rows : [];
}
export function sentenceTranslation(unit: ArticleUnit, start: number, end: number) {
  const reviewed = reviewedSentences(unit);
  if (reviewed.length) {
    let cursor = 0;
    for (const sentence of reviewed) {
      const index = unit.en.indexOf(sentence.en, cursor);
      if (index < 0) return undefined;
      const last = index + sentence.en.length;
      if (start >= index && end <= last) return { en: sentence.en, zh: sentence.zh };
      cursor = last;
    }
    return undefined;
  }
  const spans = sentenceSpans(unit.en);
  const found = spans.find(s => start >= s.start && end <= s.end);
  // Whole-unit translation is a sentence translation only for a real single sentence.
  if (found && spans.length === 1 && /[.!?][”"')\]]?\s*$/.test(unit.en.trim())) return { en: unit.en, zh: unit.zh };
  return found ? { en: found.en, zh: undefined } : undefined;
}
export function lookupMeaning(text: string, catalog: LearningCatalog, notes: { expression: string; meaningZh: string }[]) {
  const key = normalizeLookup(text);
  if (!key) return undefined;
  const note = notes.find(n => normalizeLookup(n.expression) === key);
  if (note) return { meaning: note.meaningZh, source: "本文表达说明" };
  const card = [...catalog.cardIndex.byId.values()].find(c => normalizeLookup(c.headword) === key);
  return card ? { meaning: card.senseZh, source: "词库释义，需结合本句语境" } : undefined;
}
export function lookupCardPos(card: Pick<VocabCard, "pos" | "posZh">) {
  const parts: string[] = [];
  for (const part of [card.pos, card.posZh]) {
    const value = part?.trim();
    if (!value) continue;
    if (parts.some(existing => existing.toLowerCase() === value.toLowerCase())) continue;
    parts.push(value);
  }
  return parts.join(" · ");
}
type Lookup = { unit: ArticleUnit; text: string; start: number; end: number; mode: "word" | "sentence" | "paragraph"; cardId?: string };
export function ArticleReader({ units, notes, catalog, docId }: {
  units: ArticleUnit[];
  notes: { expression: string; meaningZh: string }[];
  catalog: LearningCatalog;
  docId: string;
}) {
  const body = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout>>();
  const returnFocus = useRef<HTMLElement>();
  const [lookup, setLookup] = useState<Lookup>();
  const anchors = useMemo(() => new Map(catalog.anchorsPack.units.filter(u => u.parentId === docId).map(u => [u.sourceId, u])), [catalog, docId]);
  const localMeaning = lookup ? lookupMeaning(lookup.text, catalog, notes) : undefined;
  const card = lookup?.cardId ? getCard(catalog.cardIndex, lookup.cardId) : undefined;
  const cardPos = card ? lookupCardPos(card) : "";
  const sentence = lookup ? sentenceTranslation(lookup.unit, lookup.start, lookup.end) : undefined;
  function close() {
    const shouldReturn = Boolean(panel.current?.contains(document.activeElement));
    setLookup(undefined);
    if (shouldReturn) returnFocus.current?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (!lookup) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); close(); } };
    const outside = (event: PointerEvent) => { if (panel.current && event.target instanceof Node && !panel.current.contains(event.target)) setLookup(undefined); };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("pointerdown", outside); };
  }, [Boolean(lookup)]);
  useEffect(() => () => clearTimeout(touchTimer.current), []);
  function selectedText() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const element = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer as Element : range.startContainer.parentElement;
    const paragraph = element?.closest<HTMLElement>(".doli-document-english");
    if (!paragraph || !body.current?.contains(paragraph) || !paragraph.contains(range.endContainer)) return;
    const unitId = paragraph.closest<HTMLElement>("[data-progress-unit]")?.dataset.progressUnit;
    const unit = units.find(u => u.id === unitId);
    const text = selection.toString().trim();
    if (!unit || !text || text.length > 1500) return;
    const prefix = range.cloneRange();
    prefix.selectNodeContents(paragraph);
    prefix.setEnd(range.startContainer, range.startOffset);
    const leading = selection.toString().length - selection.toString().trimStart().length;
    const start = prefix.toString().length + leading;
    returnFocus.current = paragraph.closest<HTMLElement>(".doli-document-unit")?.querySelector<HTMLElement>("summary") || undefined;
    setLookup({ unit, text, start, end: start + text.length, mode: "word" });
  }
  function openCard(unit: ArticleUnit, id: string, text: string, start: number, end: number, trigger: HTMLElement) {
    // A real text selection takes precedence over the click fired after mouseup.
    if (window.getSelection()?.toString().trim()) return;
    returnFocus.current = trigger;
    setLookup({ unit, text, start, end, cardId: id, mode: "word" });
  }
  return <>
    <div ref={body} className="doli-document-body doli-article-body" onMouseUp={selectedText} onTouchEnd={() => {
      clearTimeout(touchTimer.current);
      touchTimer.current = setTimeout(selectedText, 350);
    }}>
      {units.map((unit, index) => {
        const anchor = anchors.get(unit.id);
        const segments = anchor ? segmentsForUnit(anchor) : [{ type: "text" as const, text: unit.en }];
        return <section className="doli-document-unit" key={unit.id} data-progress-unit={unit.id}>
          <p lang="en" className="doli-document-english">
            {segments.map((segment, i) => {
              if (segment.type !== "tap") return <React.Fragment key={i}>{segment.text}</React.Fragment>;
              const open = (trigger: HTMLElement) => {
                const codePoints = Array.from(unit.en);
                const start = codePoints.slice(0, segment.start).join("").length;
                const end = codePoints.slice(0, segment.end).join("").length;
                openCard(unit, segment.cardId, segment.text, start, end, trigger);
              };
              // The visible word must not have tabindex. A mouse-focusable text span
              // makes Chromium/Edge treat a drag that starts at the first character
              // as a click: the native selection stays empty and the card opens.
              // Keyboard access stays on a visually hidden sibling that is not in the text flow.
              return <span key={i} className="doli-tap-wrap">
                <span className="doli-tap" onClick={event => open(event.currentTarget)}>{segment.text}</span>
                <span role="button" tabIndex={0} className="doli-tap-key" aria-label={segment.text} aria-expanded={lookup?.cardId === segment.cardId && lookup.unit.id === unit.id} onClick={event => open(event.currentTarget)} onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.click(); }
                }} />
              </span>;
            })}
          </p>
          <details className="doli-translation doli-paragraph-translation">
            <summary aria-label={`第${index + 1}段中文`}>中文</summary>
            <p lang="zh-CN">{unit.zh}</p>
          </details>
        </section>;
      })}
    </div>
    {lookup && <aside ref={panel} role="dialog" aria-label="阅读查译" aria-modal="false" className="doli-lookup-panel">
      <div className="doli-lookup-heading"><span>阅读查译</span><button className="doli-text-button" onClick={close} aria-label="关闭查译">关闭</button></div>
      <p lang={lookup.mode === "paragraph" ? "zh-CN" : "en"} className="doli-lookup-selection">{lookup.mode === "paragraph" ? "所选文字所在段落" : lookup.mode === "sentence" ? sentence?.en || lookup.text : lookup.text}</p>
      <div className="doli-lookup-tabs">
        <button aria-pressed={lookup.mode === "word"} onClick={() => setLookup({ ...lookup, mode: "word" })}>词语释义</button>
        <button aria-pressed={lookup.mode === "sentence"} onClick={() => setLookup({ ...lookup, mode: "sentence" })}>整句中文</button>
        <button aria-pressed={lookup.mode === "paragraph"} onClick={() => setLookup({ ...lookup, mode: "paragraph" })}>整段中文</button>
      </div>
      {lookup.mode === "word" && (card ? <>{cardPos ? <p className="doli-muted">{cardPos}</p> : null}<p className="doli-lookup-meaning">{card.senseZh}{card.collocation ? `  ${card.collocation}` : ""}</p></> : localMeaning ? <><p className="doli-lookup-meaning">{localMeaning.meaning}</p><small>{localMeaning.source}</small></> : <p className="doli-muted">本地词库暂未收录这个选词的释义，可查看整句或整段中文。</p>)}
      {lookup.mode === "sentence" && (sentence?.zh ? <p className="doli-lookup-meaning">{sentence.zh}</p> : <p className="doli-muted">{sentence ? "本句暂未整理独立译文，请查看整段中文。" : "选区跨越句子，请查看整段中文。"}</p>)}
      {lookup.mode === "paragraph" && <><p className="doli-lookup-meaning">{lookup.unit.zh}</p><details className="doli-lookup-original"><summary>查看对应英文</summary><p lang="en">{lookup.unit.en}</p></details></>}
      <details className="doli-lookup-scope"><summary>查译范围</summary><p>当前查询本地已整理的释义和译文，未接入任意文本在线翻译。查词和看译文不会自动标记掌握。</p></details>
    </aside>}
  </>;
}

import "./article-reader.css";
