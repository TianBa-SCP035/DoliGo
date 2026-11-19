import { describe, expect, it } from "vitest";
import {
  practiceItemsForCard,
  practiceItemsForDocument,
  type PracticeLookupPack,
  type PracticeLookupPathPack,
} from "../../src/ui/practice-items-lookup";

const pack: PracticeLookupPack = {
  items: [
    {
      id: "p-word",
      type: "spelling",
      after: "words",
      pathId: "path-demo",
      relatedCardIds: ["card-a"],
      promptZh: "拼出这个词",
      answer: "hello",
    },
    {
      id: "p-scene",
      type: "completion",
      after: "scene",
      pathId: "path-demo",
      relatedCardIds: ["card-a"],
      promptZh: "补全这句",
      answer: "hello there",
    },
    {
      id: "p-reading",
      type: "cloze",
      after: "reading",
      pathId: "path-demo",
      relatedCardIds: ["card-b"],
      promptZh: "补全这段",
      answers: ["one", "two"],
    },
    {
      id: "p-other-path",
      type: "multiple-choice",
      after: "scene",
      pathId: "path-other",
      relatedCardIds: ["card-c"],
      promptZh: "另一条路径",
      answer: "no",
    },
  ],
};

const paths: PracticeLookupPathPack = {
  paths: [
    {
      id: "path-demo",
      sceneIds: ["scene-parent"],
      sceneExtensionIds: ["scene-parent-extension-1"],
      readingIds: ["reading-demo"],
      practiceIds: ["p-word", "p-scene", "p-reading"],
    },
  ],
};

describe("practiceItemsForCard", () => {
  it("returns only after-words items for the current card", () => {
    expect(practiceItemsForCard("card-a", pack).map((item) => item.id)).toEqual([
      "p-word",
    ]);
    expect(practiceItemsForCard("card-b", pack)).toEqual([]);
    expect(practiceItemsForCard("missing", pack)).toEqual([]);
    expect(practiceItemsForCard("", pack)).toEqual([]);
  });
});

describe("practiceItemsForDocument", () => {
  it("attaches scene items to the parent and its official extensions", () => {
    expect(
      practiceItemsForDocument("scene", "scene-parent", pack, paths).map(
        (item) => item.id,
      ),
    ).toEqual(["p-scene"]);
    expect(
      practiceItemsForDocument(
        "scene",
        "scene-parent-extension-1",
        pack,
        paths,
      ).map((item) => item.id),
    ).toEqual(["p-scene"]);
  });

  it("attaches reading items only to listed readings", () => {
    expect(
      practiceItemsForDocument("reading", "reading-demo", pack, paths).map(
        (item) => item.id,
      ),
    ).toEqual(["p-reading"]);
    expect(
      practiceItemsForDocument("reading", "reading-lunch-later", pack, paths),
    ).toEqual([]);
  });

  it("does not leak word items onto scenes or invent a path", () => {
    const sceneItems = practiceItemsForDocument(
      "scene",
      "scene-parent",
      pack,
      paths,
    );
    expect(sceneItems.map((item) => item.id)).not.toContain("p-word");
    expect(sceneItems.map((item) => item.id)).not.toContain("p-other-path");
    expect(practiceItemsForDocument("scene", "scene-alone", pack, paths)).toEqual(
      [],
    );
  });
});

describe("official hung pack", () => {
  it("resolves warranty on its word card and travel scene practice on the bus family", () => {
    const warranty = practiceItemsForCard("depth-nov18-warranty");
    expect(warranty.map((item) => item.id)).toEqual([
      "practice-nov18-shopping-spell-warranty",
    ]);
    expect(warranty[0]?.answer).toBe("warranty");

    expect(practiceItemsForCard("depth-nov18-leak")).toEqual([]);
    expect(practiceItemsForCard("depth-nov18-checkout")).toEqual([]);

    const bus = practiceItemsForDocument("scene", "scene-next-bus-delayed");
    expect(bus.map((item) => item.id)).toEqual([
      "practice-nov18-travel-cloze-rush-hour",
      "practice-nov18-travel-zhen-priority-seat",
      "practice-nov18-travel-complete-ticket-office",
    ]);
    expect(
      practiceItemsForDocument(
        "scene",
        "scene-next-bus-delayed-extension-2",
      ).map((item) => item.id),
    ).toEqual(bus.map((item) => item.id));

    const letter = practiceItemsForDocument(
      "reading",
      "reading-writing-a-short-email-depth",
    );
    expect(letter.map((item) => item.id)).toContain(
      "practice-nov18-formal-complete-regards",
    );
    expect(practiceItemsForDocument("reading", "reading-lunch-later")).toEqual(
      [],
    );
  });
});
