import { useId, type ReactNode } from "react";

export type SourceLink = { label: string; href: string };

export type SourceAttribution = {
  attributionEn: string;
  attributionZh: string;
  links: SourceLink[];
  changeEn?: string;
  changeZh?: string;
  translationEn?: string;
  translationZh?: string;
  noEndorsementEn?: string;
  noEndorsementZh?: string;
};

const URL_RE = /https:\/\/[^\s]+/g;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isSourceAttribution(value: unknown): value is SourceAttribution {
  if (!isRecord(value)) return false;
  return Boolean(
    text(value.attributionEn) &&
    text(value.attributionZh) &&
    Array.isArray(value.links),
  );
}

function link(label: string, href: unknown): SourceLink | undefined {
  if (typeof href !== "string" || !/^https:\/\//.test(href)) return undefined;
  return { label, href };
}

function collectLinks(entry: Record<string, unknown>): SourceLink[] {
  const source = isRecord(entry.source) ? entry.source : entry;
  const licenses = isRecord(entry.licenses) ? entry.licenses : entry;
  const found = [
    link("条目", source.sourceArticleUrl ?? source.articleUrl ?? source.url),
    link("固定版本", source.permanentRevisionUrl ?? source.revisionUrl),
    link("修订历史", source.historyUrl),
    link(
      "CC BY-SA 4.0",
      licenses.sourceLicenseDeedUrl ??
        licenses.sourceLicenseUrl ??
        licenses.adaptedLicenseUrl ??
        source.sourceLicenseUrl ??
        entry.sourceLicenseUrl,
    ),
  ].filter((item): item is SourceLink => Boolean(item));
  const seen = new Set<string>();
  return found.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

/** Read attribution from a wired reading, or from 六号's manuscript metadata shape. */
export function pickSourceAttribution(
  entry: unknown,
): SourceAttribution | undefined {
  if (!isRecord(entry)) return undefined;
  if (isSourceAttribution(entry.sourceAttribution))
    return entry.sourceAttribution;
  const attribution = isRecord(entry.endOfReadingAttribution)
    ? entry.endOfReadingAttribution
    : undefined;
  const notices = isRecord(entry.notices) ? entry.notices : {};
  const attributionEn = text(attribution?.en);
  const attributionZh = text(attribution?.zh);
  if (!attributionEn || !attributionZh) return undefined;
  return {
    attributionEn,
    attributionZh,
    links: collectLinks(entry),
    changeEn: text(notices.changeEn) ?? text(entry.changeNotice),
    changeZh: text(notices.changeZh) ?? text(entry.changeNoticeZh),
    translationEn: text(notices.translationEn),
    translationZh: text(notices.translationZh),
    noEndorsementEn: text(notices.noEndorsementEn),
    noEndorsementZh: text(notices.noEndorsementZh),
  };
}

function linkify(value: string): ReactNode {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of value.matchAll(URL_RE)) {
    const href = match[0];
    const start = match.index ?? 0;
    if (start > last) nodes.push(value.slice(last, start));
    nodes.push(
      <a
        key={`${href}-${start}`}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {href}
      </a>,
    );
    last = start + href.length;
  }
  if (last < value.length) nodes.push(value.slice(last));
  return nodes;
}

export function SourceAttributionBlock({ data }: { data: SourceAttribution }) {
  const headingId = useId();
  return (
    <aside className="doli-source-attribution" aria-labelledby={headingId}>
      <h2 id={headingId}>来源与许可</h2>
      <p lang="en">{linkify(data.attributionEn)}</p>
      {data.links.length > 0 && (
        <p className="doli-source-links">
          {data.links.map((item, index) => (
            <span key={item.href}>
              {index > 0 ? " · " : null}
              <a href={item.href} rel="noopener noreferrer" target="_blank">
                {item.label}
              </a>
            </span>
          ))}
        </p>
      )}
      {data.noEndorsementEn && <p lang="en">{data.noEndorsementEn}</p>}
      <details className="doli-translation">
        <summary>中文</summary>
        <p>{linkify(data.attributionZh)}</p>
        {data.translationZh && <p>{data.translationZh}</p>}
        {data.noEndorsementZh && <p>{data.noEndorsementZh}</p>}
      </details>
      {(data.changeEn ||
        data.changeZh ||
        data.translationEn ||
        data.translationZh) && (
        <details>
          <summary>改编与翻译说明</summary>
          {data.changeEn && <p lang="en">{data.changeEn}</p>}
          {data.translationEn && <p lang="en">{data.translationEn}</p>}
          {(data.changeZh || data.translationZh) && (
            <details className="doli-translation">
              <summary>中文</summary>
              {data.changeZh && <p>{data.changeZh}</p>}
              {data.translationZh && <p>{data.translationZh}</p>}
            </details>
          )}
        </details>
      )}
    </aside>
  );
}
