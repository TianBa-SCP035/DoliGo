import { describe, expect, it } from "vitest";
import { wordGroups } from "../../src/adapters/wiring-words";
import {
  RELATED_NOTED_CARD_LIMIT,
  RELATED_OPEN_CARD_LIMIT,
  RELATED_READING_LIMIT,
  RELATED_SCENE_LIMIT,
  TOPIC_IDS,
  topicLinkById,
  topicLinks,
  topicLinksForCard,
  topicLinksForReading,
  topicLinksForScene,
  topicLinksForWordGroup,
} from "../../src/adapters/topic-links";
import {
  topicVocabularyDepthNov16,
  topicVocabularyDepthNov18,
} from "../../src/lib/review";

const TIRED_ID = wordGroups[0]?.words[0]?.id;
const TRAVEL_SCENE = "scene-next-bus-delayed";

function unique(ids: readonly string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function authoredCardIds(id: (typeof TOPIC_IDS)[number]): string[] {
  return unique([
    ...(topicVocabularyDepthNov16.topicCardIds[id] ?? []),
    ...(topicVocabularyDepthNov18.topicCardIds[id] ?? []),
  ]);
}

describe("topic association helpers", () => {
  it("keeps a full topic catalog without inventing study groups", () => {
    expect([...TOPIC_IDS]).toEqual([
      "shopping",
      "dining",
      "travel",
      "home",
      "game",
      "formal",
      "spoken",
    ]);
    expect(wordGroups.map((group) => group.id)).not.toEqual(
      expect.arrayContaining([...TOPIC_IDS]),
    );
    expect(wordGroups).toHaveLength(9);
    const links = topicLinks();
    expect(links.map((topic) => topic.id)).toEqual([...TOPIC_IDS]);
    for (const topic of links) {
      expect(topic.isStudyGroup).toBe(false);
      expect(topic.suggestedOrder).toEqual(["words", "scenes", "reading"]);
      expect(topic.cards.map((card) => card.id)).toEqual(authoredCardIds(topic.id));
      for (const scene of topic.scenes) {
        expect(scene.route).toBe(`#/scenes/${scene.id}`);
        expect(scene.title).toBeTruthy();
      }
    }
    for (const id of ["shopping", "dining", "travel", "home", "game"] as const) {
      expect(topicLinkById(id)?.cards.length).toBeGreaterThanOrEqual(20);
    }
    expect(topicLinkById("game")?.cards.length).toBeGreaterThan(20);
  });

  it("opens library cards with existing routes and leaves reused cards without a single-card route", () => {
    const shopping = topicLinkById("shopping")!;
    const game = topicLinkById("game")!;
    const sweater = shopping.cards.find((card) => card.id === "depth-nov16-sweater");
    const reused = shopping.cards.find((card) => card.id === "L04-V07");
    const basicReuse = game.cards.find((card) => card.id === "L01-V07");
    expect(sweater).toMatchObject({
      openAs: "library-card",
      route: "#/words/card/depth-nov16-sweater",
    });
    expect(reused?.route).toBeUndefined();
    expect(reused?.openAs).toBe("catalog-only");
    expect(basicReuse).toMatchObject({
      id: "L01-V07",
      openAs: "group-queue-card",
      groupIds: ["basic"],
    });
    expect(basicReuse?.route).toBeUndefined();
    expect(topicLinksForCard("depth-nov16-sweater").map((topic) => topic.id)).toEqual([
      "shopping",
    ]);
    expect(topicLinksForWordGroup("basic").map((topic) => topic.id)).toEqual(["basic"]);
    expect(topicLinksForWordGroup("basic")[0]?.titleZh).toBe("日常基础");
    expect(topicLinksForWordGroup("basic")[0]?.isStudyGroup).toBe(false);
  });

  it("keeps official travel and game readings in the full catalog", () => {
    const shopping = topicLinkById("shopping")!;
    const dining = topicLinkById("dining")!;
    const home = topicLinkById("home")!;
    const travel = topicLinkById("travel")!;
    const game = topicLinkById("game")!;

    expect(shopping.readings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "reading-clothes-for-everyday-depth",
          route: "#/reading/reading-clothes-for-everyday-depth",
        }),
      ]),
    );
    expect(dining.readings.map((item) => item.id)).toEqual(
      expect.arrayContaining(["reading-choosing-restaurant-depth"]),
    );
    expect(home.readings.map((item) => item.id)).toEqual(
      expect.arrayContaining(["reading-apartment-life-depth"]),
    );
    expect(travel.readings.map((item) => item.id)).toEqual(
      expect.arrayContaining(["reading-using-public-transport-depth"]),
    );
    expect(game.readings.map((item) => item.id)).toEqual(
      expect.arrayContaining(["reading-what-a-video-game-is-depth"]),
    );
    expect(travel.scenes.map((scene) => scene.id)).toEqual(
      expect.arrayContaining(["scene-next-bus-delayed"]),
    );
    expect(
      topicLinksForScene("scene-package-at-the-door").map((topic) => topic.id),
    ).toEqual(expect.arrayContaining(["home"]));
    expect(
      topicLinksForReading("reading-apartment-life-depth").map((topic) => topic.id),
    ).toEqual(expect.arrayContaining(["home"]));
    expect(topicLinksForWordGroup("basic").every((topic) => !topic.isStudyGroup)).toBe(
      true,
    );
  });

  it("returns a short related list for the first basic card and for scene footers", () => {
    expect(TIRED_ID).toBe("L01-V01");
    const tired = wordGroups[0].words[0];
    const fullGame = topicLinkById("game")!;
    // tired is not a game-topic card; related links belong to 日常基础 itself.
    const related = topicLinksForCard(tired.id);
    expect(related.map((topic) => topic.id)).toEqual(["basic"]);
    expect(related[0]?.titleZh).toBe("日常基础");
    expect(related[0]?.isStudyGroup).toBe(false);
    expect(related[0]?.cards.some((card) => card.id === tired.id)).toBe(false);
    expect(related[0]?.cards.filter((card) => card.route).length).toBeLessThanOrEqual(
      RELATED_OPEN_CARD_LIMIT,
    );
    expect(related[0]?.cards.filter((card) => !card.route).length).toBeLessThanOrEqual(
      RELATED_NOTED_CARD_LIMIT,
    );
    expect(related[0]?.scenes).toEqual([]);
    expect(related[0]?.readings).toEqual([]);
    expect(topicLinks().map((topic) => topic.id)).not.toContain("basic");

    const groupRelated = topicLinksForWordGroup("basic")[0];
    expect(groupRelated?.id).toBe("basic");
    expect(groupRelated?.titleZh).toBe("日常基础");
    expect(groupRelated?.cards.filter((card) => card.route).length).toBeLessThanOrEqual(
      RELATED_OPEN_CARD_LIMIT,
    );
    // A reused basic-queue card may still appear in the game catalog, but tired must not inherit that theme.
    expect(fullGame.cards.some((card) => card.id === "L01-V07")).toBe(true);
    expect(topicLinksForCard(tired.id).map((topic) => topic.id)).not.toContain("game");

    const fullTravel = topicLinkById("travel")!;
    const sceneRelated = topicLinksForScene(TRAVEL_SCENE);
    expect(sceneRelated.map((topic) => topic.id)).toEqual(
      expect.arrayContaining(["travel"]),
    );
    for (const topic of sceneRelated) {
      const full = topicLinkById(topic.id)!;
      expect(topic.scenes.some((scene) => scene.id === TRAVEL_SCENE)).toBe(false);
      expect(topic.scenes.length).toBeLessThanOrEqual(RELATED_SCENE_LIMIT);
      expect(topic.readings.length).toBeLessThanOrEqual(RELATED_READING_LIMIT);
      expect(topic.cards.filter((card) => card.route).length).toBeLessThanOrEqual(
        RELATED_OPEN_CARD_LIMIT,
      );
      expect(topic.cards.filter((card) => !card.route).length).toBeLessThanOrEqual(
        RELATED_NOTED_CARD_LIMIT,
      );
      expect(topic.scenes.map((scene) => scene.id)).toEqual(
        full.scenes
          .filter((scene) => scene.id !== TRAVEL_SCENE)
          .slice(0, RELATED_SCENE_LIMIT)
          .map((scene) => scene.id),
      );
    }
    expect(fullTravel.scenes.length).toBeGreaterThan(sceneRelated.find((topic) => topic.id === "travel")!.scenes.length || 0);
  });
});
