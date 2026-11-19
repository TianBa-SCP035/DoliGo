import rawPronunciationSourcesNov18 from "../content/pronunciation-sources-nov18.json";
import type { PronunciationSource } from "./PronunciationControl";

type RecordingFile = {
  cardId?: string;
  headword?: string;
  audioUrl?: string;
  licenseName?: string;
  licenseUrl?: string;
  author?: string;
  sourcePageUrl?: string;
  kind?: string;
};

type PronunciationPack = {
  files?: Record<string, RecordingFile>;
};

const pack = rawPronunciationSourcesNov18 as PronunciationPack;

function publicAssetUrl(url: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  const base = import.meta.env.BASE_URL || "/";
  if (url.startsWith("/")) {
    return (base.endsWith("/") ? base.slice(0, -1) : base) + url;
  }
  return (base.endsWith("/") ? base : `${base}/`) + url;
}

/**
 * Resolve a licensed public recording for a study card.
 * Only returns sources already listed with a file and license.
 * Does not invent a URL, a nearby word, or a system-voice fallback.
 */
export function pronunciationSourceForCard(
  cardId?: string | null,
): PronunciationSource | undefined {
  if (!cardId) return undefined;
  const files = pack.files ?? {};
  const entry =
    files[cardId] ??
    Object.values(files).find((file) => file.cardId === cardId);
  if (!entry || entry.kind !== "recording") return undefined;
  const audioUrl = entry.audioUrl?.trim();
  const licenseName = entry.licenseName?.trim();
  if (!audioUrl || !licenseName) return undefined;
  return {
    kind: "recording",
    audioUrl: publicAssetUrl(audioUrl),
    attribution: {
      author: entry.author?.trim() || undefined,
      licenseName,
      licenseUrl: entry.licenseUrl?.trim() || undefined,
      sourcePageUrl: entry.sourcePageUrl?.trim() || undefined,
    },
  };
}
