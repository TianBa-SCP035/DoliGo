import { useState } from "react";
import {
  LibraryDiscovery,
  LibraryMore,
  suggestedLevel,
  useLibraryBrowser,
} from "./LibraryBrowser";
import { loadProgressStore } from "../lib/progress";
import type { RefactorProgressStore } from "../lib/progress";
import type { SourceAttribution } from "./SourceAttribution";

export type TextUnit = { id: string; en: string; zh: string; speaker?: string };
export type LearningDocument = {
  id: string;
  title: string;
  titleEn: string;
  units: TextUnit[];
  setting?: string;
  levelSuggestion?: string;
  wordCount?: number;
  category?: string;
  tags?: string[];
  notes: { expression: string; meaningZh: string }[];
  sourceAttribution?: SourceAttribution;
};

function readPositions(): RefactorProgressStore | undefined {
  try {
    const loaded = loadProgressStore(window.localStorage);
    return loaded.warning ? undefined : loaded.store;
  } catch {
    return undefined;
  }
}

export function TextLibraryView({
  kind,
  documents,
  onOpen,
}: {
  kind: "scene" | "reading";
  documents: LearningDocument[];
  onOpen: (id: string) => void;
  onBack: () => void;
}) {
  const [positions] = useState(readPositions);
  const browser = useLibraryBrowser(
    documents.map((doc) => ({
      ...doc,
      category:
        doc.category ||
        (doc.sourceAttribution ? "公开资料改编" : "原创学习示例"),
      level: suggestedLevel(doc.levelSuggestion),
      searchText: [
        doc.titleEn,
        doc.setting,
        ...doc.units.flatMap((unit) => [unit.en, unit.zh]),
        ...(doc.tags || []),
      ]
        .filter(Boolean)
        .join(" "),
    })),
    kind,
  );
  return (
    <section className="doli-library">
      <header className="doli-library-heading">
        <h1>{kind === "scene" ? "生活里的对话" : "安静读一会儿"}</h1>
      </header>
      <LibraryDiscovery browser={browser} placeholder="搜索全部内容" />
      <div className="doli-document-list">
        {browser.items.map((doc) => {
          const saved = (
            kind === "scene" ? positions?.scenes : positions?.readings
          )?.[doc.id];
          const lastIndex = saved
            ? doc.units.findIndex((unit) => unit.id === saved.unitId)
            : -1;
          return (
            <button
              className="doli-document-choice"
              key={doc.id}
              onClick={() => onOpen(doc.id)}
            >
              <span className="doli-document-info">
                <strong>{doc.title}</strong>
                <span lang="en">{doc.titleEn}</span>
                {lastIndex >= 0 && (
                  <span className="doli-document-position">
                    上次读到第 {lastIndex + 1} {kind === "scene" ? "句" : "段"}
                  </span>
                )}
              </span>
              <span className="doli-document-start">
                {lastIndex >= 0 ? "继续读" : "打开"} ↗
              </span>
            </button>
          );
        })}
      </div>
      <LibraryMore browser={browser} />
      {browser.items.length === 0 && (
        <div className="doli-library-empty">
          <p>没有找到这篇，换个词试试。</p>
          <button className="doli-secondary" onClick={browser.reset}>
            返回推荐
          </button>
        </div>
      )}
    </section>
  );
}
