import type { TopicLink } from "../adapters/topic-links";
import { type DifficultyMark } from "./difficulty-ui";


type CardLink = TopicLink["cards"][number] & { difficulty?: DifficultyMark };
type SceneLink = TopicLink["scenes"][number] & { difficulty?: DifficultyMark };
type ReadingLink = TopicLink["readings"][number] & { difficulty?: DifficultyMark };
type TopicLinkWithDifficulty = Omit<TopicLink, "cards" | "scenes" | "readings"> & {
  cards: readonly CardLink[];
  scenes: readonly SceneLink[];
  readings: readonly ReadingLink[];
};

export type TopicRelatedLinksProps = {
  topics?: readonly TopicLinkWithDifficulty[] | null;
  onOpen?: (route: string) => void;
};

function uniqueById<T extends { id: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

export function TopicRelatedLinks({ topics, onOpen }: TopicRelatedLinksProps) {
  const source = topics ?? [];
  const cards = uniqueById(
    source.flatMap((topic) => topic.cards.filter((card) => card.route)),
  );
  const scenes = uniqueById(source.flatMap((topic) => topic.scenes));
  const readings = uniqueById(source.flatMap((topic) => topic.readings));
  if (cards.length === 0 && scenes.length === 0 && readings.length === 0) {
    return null;
  }

  return (
    <nav className="doli-topic-related" aria-label="相关内容">
      {cards.length > 0 && (
        <div className="doli-topic-related-group">
          <p className="doli-topic-related-heading">相关词</p>
          <ul className="doli-topic-related-list">
            {cards.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  className="doli-text-button"
                  onClick={() => onOpen?.(card.route!)}
                >
                  <span lang="en">{card.headword}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {scenes.length > 0 && (
        <div className="doli-topic-related-group">
          <p className="doli-topic-related-heading">相关对话</p>
          <ul className="doli-topic-related-list">
            {scenes.map((scene) => (
              <li key={scene.id}>
                <button
                  type="button"
                  className="doli-text-button"
                  onClick={() => onOpen?.(scene.route)}
                >
                  {scene.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {readings.length > 0 && (
        <div className="doli-topic-related-group">
          <p className="doli-topic-related-heading">相关文章</p>
          <ul className="doli-topic-related-list">
            {readings.map((reading) => (
              <li key={reading.id}>
                <button
                  type="button"
                  className="doli-text-button"
                  onClick={() => onOpen?.(reading.route)}
                >
                  {reading.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
