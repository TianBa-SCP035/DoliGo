import { useEffect, useId, useState } from "react";

export const LIBRARY_PAGE_SIZE = 8;
export const RECOMMENDATION_COUNT = 3;
export type LibraryItem = {
  id: string;
  title: string;
  searchText?: string;
  category?: string;
  level?: string;
};
export type LibraryFilters = {
  query: string;
  category: string;
  level: string;
  page: number;
};

function matchesQuery(item: LibraryItem, query: string) {
  const text = [item.title, item.searchText, item.category, item.level]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
  return query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => text.includes(term));
}
/** Legacy pure selector; no live view renders numbered pages. */
export function selectLibraryPage<T extends LibraryItem>(
  items: readonly T[],
  filters: LibraryFilters,
) {
  const matches = items.filter(
    (item) =>
      matchesQuery(item, filters.query) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.level || item.level === filters.level),
  );
  const pages = Math.max(1, Math.ceil(matches.length / LIBRARY_PAGE_SIZE));
  const page = Math.min(
    pages,
    Math.max(1, Number.isFinite(filters.page) ? Math.floor(filters.page) : 1),
  );
  return {
    total: matches.length,
    pages,
    page,
    items: matches.slice(
      (page - 1) * LIBRARY_PAGE_SIZE,
      page * LIBRARY_PAGE_SIZE,
    ),
  };
}
export function suggestedLevel(value?: string): string | undefined {
  return value?.match(
    /\b(?:Pre-A1|A1|A2|B1|B2|C1|C2)\+?(?:\s*(?:到|至|–|—|-)\s*(?:A1|A2|B1|B2|C1|C2)\+?)?/i,
  )?.[0];
}
export function randomRecommendationIds(
  items: readonly LibraryItem[],
  previous: readonly string[] = [],
): string[] {
  const previousSet = new Set(previous);
  const shuffle = (ids: string[]) => {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  };
  const unique = [...new Set(items.map((item) => item.id))];
  return [
    ...shuffle(unique.filter((id) => !previousSet.has(id))),
    ...shuffle(unique.filter((id) => previousSet.has(id))),
  ].slice(0, RECOMMENDATION_COUNT);
}
type BrowseState = { query: string; ids: string[]; limit: number };
function readState(key: string, items: readonly LibraryItem[]): BrowseState {
  try {
    const raw = JSON.parse(sessionStorage.getItem(key) || "null");
    if (raw && typeof raw.query === "string" && Array.isArray(raw.ids)) {
      const known = new Set(items.map((item) => item.id));
      const ids = [
        ...new Set<string>(
          raw.ids.filter(
            (id: unknown): id is string =>
              typeof id === "string" && known.has(id),
          ),
        ),
      ].slice(0, RECOMMENDATION_COUNT);
      return {
        query: raw.query,
        ids: ids.length ? ids : randomRecommendationIds(items),
        limit:
          typeof raw.limit === "number" && Number.isFinite(raw.limit)
            ? Math.max(
                LIBRARY_PAGE_SIZE,
                Math.min(items.length || LIBRARY_PAGE_SIZE, raw.limit),
              )
            : LIBRARY_PAGE_SIZE,
      };
    }
  } catch {
    /* Browsing works without session storage. */
  }
  return {
    query: "",
    ids: randomRecommendationIds(items),
    limit: LIBRARY_PAGE_SIZE,
  };
}
/** Only UI state is persisted. Recommendations never reorder study queues. */
export function useLibraryBrowser<T extends LibraryItem>(
  items: readonly T[],
  name: string,
) {
  const key = `doliguo.ui.discovery.v2:${name}`;
  const [state, setState] = useState(() => readState(key, items));
  const searching = Boolean(state.query.trim());
  const matches = searching
    ? items.filter((item) => matchesQuery(item, state.query))
    : [];
  const map = new Map(items.map((item) => [item.id, item]));
  const shown = searching
    ? matches.slice(0, state.limit)
    : state.ids
        .map((id) => map.get(id))
        .filter((item): item is T => Boolean(item));
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* UI only */
    }
  }, [key, state]);
  return {
    items: shown,
    query: state.query,
    searching,
    total: matches.length,
    hasMore: searching && matches.length > shown.length,
    setQuery: (query: string) =>
      setState((cur) => ({ ...cur, query, limit: LIBRARY_PAGE_SIZE })),
    shuffle: () =>
      setState((cur) => ({
        ...cur,
        ids: randomRecommendationIds(items, cur.ids),
      })),
    reset: () =>
      setState((cur) => ({ ...cur, query: "", limit: LIBRARY_PAGE_SIZE })),
    showMore: () =>
      setState((cur) => ({ ...cur, limit: cur.limit + LIBRARY_PAGE_SIZE })),
  };
}
export function LibraryDiscovery({
  browser,
  placeholder,
}: {
  browser: {
    query: string;
    searching: boolean;
    total: number;
    setQuery: (query: string) => void;
    reset: () => void;
    shuffle: () => void;
  };
  placeholder: string;
}) {
  const id = useId();
  return (
    <>
      <div className="doli-discovery-search">
        <label className="doli-sr-only" htmlFor={id}>
          搜索全部内容
        </label>
        <input
          id={id}
          type="search"
          value={browser.query}
          onChange={(event) => browser.setQuery(event.target.value)}
          placeholder={placeholder}
        />
        {browser.query && (
          <button
            type="button"
            className="doli-text-button"
            onClick={browser.reset}
          >
            清除搜索
          </button>
        )}
      </div>
      <div className="doli-discovery-heading">
        <p role="status">
          {browser.searching ? `找到 ${browser.total} 项` : "随便看看"}
        </p>
        {!browser.searching && (
          <button
            type="button"
            className="doli-text-button"
            onClick={browser.shuffle}
          >
            换一批
          </button>
        )}
      </div>
    </>
  );
}
export function LibraryMore({
  browser,
}: {
  browser: { hasMore: boolean; showMore: () => void };
}) {
  return browser.hasMore ? (
    <button
      type="button"
      className="doli-text-button doli-search-more"
      onClick={browser.showMore}
    >
      显示更多结果
    </button>
  ) : null;
}
