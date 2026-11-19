import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { ArticleReader, lookupMeaning, normalizeLookup, reviewedSentences, sentenceTranslation, type ArticleUnit } from "../../src/ui/ArticleReader";
import { loadLearningCatalog } from "../../src/lib/review";
const catalog = loadLearningCatalog();
const unit: ArticleUnit = { id: "qa-article-p1", en: "We need a map. It is quiet here.", zh: "我们需要一张地图。这里很安静。", sentences: [{en:"We need a map.",zh:"我们需要一张地图。"},{en:"It is quiet here.",zh:"这里很安静。"}] };
let host: HTMLDivElement; let root: Root;
beforeEach(() => {
  (globalThis as unknown as {IS_REACT_ACT_ENVIRONMENT: boolean}).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();sessionStorage.clear();localStorage.setItem("qa-keep","learning-data");
  host=document.createElement("div");document.body.append(host);root=createRoot(host);
});
afterEach(() => { window.getSelection()?.removeAllRanges();act(() => root.unmount());host.remove(); });
function render(units=[unit]) {act(() => root.render(<ArticleReader units={units} notes={[{expression:"a map",meaningZh:"一张地图"}]} catalog={catalog} docId="qa-only"/>));}
function select(start:number,end:number) {
  const p=host.querySelector(".doli-document-english")!;
  const range=document.createRange();range.setStart(p.firstChild!,start);range.setEnd(p.firstChild!,end);
  window.getSelection()!.removeAllRanges();window.getSelection()!.addRange(range);
  act(() => p.dispatchEvent(new MouseEvent("mouseup",{bubbles:true})));
}
function click(text:string) { const button=[...host.querySelectorAll("button")].find(b=>b.textContent===text);expect(button).toBeTruthy();act(()=>button!.click()); }
it("retains authored paragraphs and progress IDs with all translations collapsed",()=>{
 render();expect(host.querySelectorAll("[data-progress-unit]")).toHaveLength(1);expect(host.querySelector("details[open]")).toBeNull();expect(host.querySelector('[role="dialog"]')).toBeNull();expect(host.querySelector("p[lang=en]")?.textContent).toBe(unit.en);
});
it("finds local expression and explicit aligned sentence without any progress write",()=>{
 render();select(8,13);expect(host.querySelector('[role="dialog"]')?.textContent).toContain("一张地图");click("整句中文");expect(host.querySelector(".doli-lookup-meaning")?.textContent).toBe("我们需要一张地图。");click("整段中文");expect(host.querySelector(".doli-lookup-meaning")?.textContent).toBe(unit.zh);expect(localStorage.getItem("qa-keep")).toBe("learning-data");expect(localStorage.length).toBe(1);expect(sessionStorage.length).toBe(0);
});
it("does not pretend paragraph translation is an independent sentence translation",()=>{
 render([{...unit,sentences:undefined}]);select(3,7);click("整句中文");expect(host.querySelector('[role="dialog"]')?.textContent).toContain("暂未整理独立译文");click("整段中文");expect(host.querySelector(".doli-lookup-meaning")?.textContent).toBe(unit.zh);
});
it("reports uncollected selections without making up a definition",()=>{
 render();select(0,13);expect(host.querySelector('[role="dialog"]')?.textContent).toContain("本地词库暂未收录");act(()=>document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true})));expect(host.querySelector('[role="dialog"]')).toBeNull();
});
it("does not invent sentence alignment from punctuation counts or mismatching metadata",()=>{
 expect(reviewedSentences({...unit,sentences:[{en:"Different sentence.",zh:"不相符。"}]})).toEqual([]);
 expect(sentenceTranslation({...unit,sentences:undefined},4,7)?.zh).toBeUndefined();
 expect(sentenceTranslation(unit,0,unit.en.length)).toBeUndefined();
 expect(sentenceTranslation(unit,17,19)?.zh).toBe("这里很安静。");
});
it("supports a true single-sentence paragraph and normalizes lookup punctuation",()=>{
 expect(sentenceTranslation({id:"x",en:"It is quiet here.",zh:"这里很安静。"},6,11)?.zh).toBe("这里很安静。");
 expect(normalizeLookup('  “A   MAP.” ')).toBe("a map");expect(lookupMeaning("a MAP",catalog,[{expression:"a map",meaningZh:"一张地图"}])?.meaning).toBe("一张地图");expect(lookupMeaning("qa-no-such-word",catalog,[])).toBeUndefined();
});
it("ignores selections crossing paragraphs",()=>{
 render([unit,{id:"p2",en:"Another paragraph.",zh:"另一段。"}]);const ps=host.querySelectorAll(".doli-document-english");const r=document.createRange();r.setStart(ps[0].firstChild!,0);r.setEnd(ps[1].firstChild!,7);window.getSelection()!.addRange(r);act(()=>ps[0].dispatchEvent(new MouseEvent("mouseup",{bubbles:true})));expect(host.querySelector('[role="dialog"]')).toBeNull();
});
