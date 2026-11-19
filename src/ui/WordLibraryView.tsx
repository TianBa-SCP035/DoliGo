import {
  LibraryDiscovery,
  LibraryMore,
  useLibraryBrowser,
} from "./LibraryBrowser";

export interface WordLibraryChoice {
  id: string;
  title: string;
  meaning?: string;
  partOfSpeech?: string;
  category?: string;
  tags?: string[];
  /** Zero-based saved position; omit for a word not started yet. */
  currentIndex?: number;
}

/** Presentation only: the adapter owns sessions and all storage writes. */
export function WordLibraryView({
  words,
  onSelect,
  onBack,
}: {
  words: readonly WordLibraryChoice[];
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const browser = useLibraryBrowser(
    words.map((word) => ({
      ...word,
      category: word.category || "常用词",
      searchText: [word.meaning, word.partOfSpeech, ...(word.tags || [])]
        .filter(Boolean)
        .join(" "),
    })),
    "word-cards",
  );
  return (
    <section
      className="doli-library doli-word-library"
      aria-labelledby="word-entries-title"
    >
      <button className="doli-text-button" onClick={onBack}>
        返回词组
      </button>
      <header className="doli-library-heading">
        <h1 id="word-entries-title">常用词条</h1>
      </header>
      <LibraryDiscovery browser={browser} placeholder="搜索全部内容" />
      <div className="doli-document-list">
        {browser.items.map((word) => {
          const started = word.currentIndex !== undefined;
          const completed = started && word.currentIndex! >= 1;
          const position = completed
            ? "这张已看完"
            : started
              ? "上次学到这里"
              : undefined;
          return (
            <button
              key={word.id}
              className="doli-document-choice"
              onClick={() => onSelect(word.id)}
            >
              <span className="doli-document-info">
                <strong>{word.title}</strong>
                {word.partOfSpeech && word.partOfSpeech !== "语块" && (
                  <span>{word.partOfSpeech}</span>
                )}
                {position && (
                  <span className="doli-document-position">{position}</span>
                )}
              </span>
              <span className="doli-document-start">
                {completed ? "查看" : started ? "继续学习" : "开始学习"} ↗
              </span>
            </button>
          );
        })}
      </div>
      <LibraryMore browser={browser} />
      {browser.items.length === 0 && (
        <div className="doli-library-empty">
          <p>没有找到这个词，换个词试试。</p>
          <button className="doli-secondary" onClick={browser.reset}>
            返回推荐
          </button>
        </div>
      )}
    </section>
  );
}
