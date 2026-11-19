import {
  LibraryDiscovery,
  LibraryMore,
  suggestedLevel,
  useLibraryBrowser,
} from "./LibraryBrowser";
export interface WordGroupChoice {
  id: string;
  title: string;
  description?: string;
  total: number;
  category?: string;
  levelSuggestion?: string;
  tags?: string[];
  /** Zero-based saved position; omit for a group not started yet. */
  currentIndex?: number;
}

/** Presentation only: the adapter owns sessions and all storage writes. */
export function WordGroupPicker({
  groups,
  onSelect,
  onBack,
  library,
}: {
  groups: readonly WordGroupChoice[];
  onSelect: (id: string) => void;
  onBack: () => void;
  library?: { total: number; onOpen: () => void };
}) {
  const browser = useLibraryBrowser(
    groups.map((group) => ({
      ...group,
      category:
        group.category ||
        (group.currentIndex === undefined
          ? "未开始"
          : group.currentIndex >= group.total
            ? "已看完"
            : "学习中"),
      level: suggestedLevel(group.levelSuggestion),
      searchText: [group.description, ...(group.tags || [])]
        .filter(Boolean)
        .join(" "),
    })),
    "words",
  );
  return (
    <section className="doli-library" aria-labelledby="word-groups-title">
      <button className="doli-text-button" onClick={onBack}>
        返回首页
      </button>
      <header className="doli-library-heading">
        <h1 id="word-groups-title">背单词</h1>
      </header>
      {library && library.total > 0 && (
        <button
          className="doli-text-button doli-words-link"
          onClick={library.onOpen}
        >
          找一个单词
        </button>
      )}
      <LibraryDiscovery browser={browser} placeholder="搜索全部内容" />
      <div className="doli-document-list">
        {browser.items.map((group) => {
          const started = group.currentIndex !== undefined;
          const completed = started && group.currentIndex! >= group.total;
          const position = completed
            ? "这组已看完"
            : started
              ? `上次停在第 ${group.currentIndex! + 1} 张`
              : undefined;
          return (
            <button
              key={group.id}
              className="doli-document-choice"
              disabled={group.total <= 0}
              onClick={() => onSelect(group.id)}
            >
              <span className="doli-document-info">
                <strong>{group.title}</strong>
                {group.description && <span>{group.description}</span>}
                <span className="doli-document-meta">{group.total} 张词卡</span>
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
          <p>没有找到这组，换个词试试。</p>
          <button className="doli-secondary" onClick={browser.reset}>
            返回推荐
          </button>
        </div>
      )}
    </section>
  );
}
