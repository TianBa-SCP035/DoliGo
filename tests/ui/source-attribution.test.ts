import { expect, it } from "vitest";
import { pickSourceAttribution } from "../../src/ui/SourceAttribution";

const manuscript = {
  endOfReadingAttribution: {
    en: "Adapted text. Article: https://en.wikivoyage.org/wiki/Arriving_in_a_new_city Permanent revision: https://en.wikivoyage.org/w/index.php?title=Arriving_in_a_new_city&oldid=5414939",
    zh: "改编文本。条目：https://en.wikivoyage.org/wiki/Arriving_in_a_new_city",
  },
  notices: {
    changeEn: "Simplified and shortened.",
    changeZh: "已简化并压缩。",
    translationEn: "Chinese is our translation.",
    translationZh: "中文是我们的译文。",
    noEndorsementEn: "No endorsement.",
    noEndorsementZh: "不表示认可。",
  },
  source: {
    sourceArticleUrl: "https://en.wikivoyage.org/wiki/Arriving_in_a_new_city",
    permanentRevisionUrl:
      "https://en.wikivoyage.org/w/index.php?title=Arriving_in_a_new_city&oldid=5414939",
    historyUrl:
      "https://en.wikivoyage.org/w/index.php?title=Arriving_in_a_new_city&action=history",
  },
  licenses: {
    sourceLicenseDeedUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
};

it("reads manuscript metadata into a visible attribution block", () => {
  const data = pickSourceAttribution(manuscript);
  expect(data?.attributionZh).toContain("改编文本");
  expect(data?.links.map((item) => item.label)).toEqual([
    "条目",
    "固定版本",
    "修订历史",
    "CC BY-SA 4.0",
  ]);
});

it("does not invent attribution for original lessons", () => {
  expect(
    pickSourceAttribution({ id: "reading-lunch-later", notes: [] }),
  ).toBeUndefined();
});

it("accepts the Nov 16 reviewed reading shape without a notices object", () => {
  const data = pickSourceAttribution({
    id: "reading-library-basics",
    endOfReadingAttribution: {
      en: "Adapted from Library. Article: https://simple.wikipedia.org/wiki/Library",
      zh: "改编自《Library》。条目：https://simple.wikipedia.org/wiki/Library",
    },
    changeNotice: "Adapted and abridged from the lead.",
    changeNoticeZh: "改编、删节自条目开头。",
    source: {
      articleUrl: "https://simple.wikipedia.org/wiki/Library",
      permanentRevisionUrl:
        "https://simple.wikipedia.org/w/index.php?title=Library&oldid=10901378",
      historyUrl:
        "https://simple.wikipedia.org/w/index.php?title=Library&action=history",
      sourceLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
  });
  expect(data?.changeZh).toBe("改编、删节自条目开头。");
  expect(data?.links.map((item) => item.label)).toEqual([
    "条目",
    "固定版本",
    "修订历史",
    "CC BY-SA 4.0",
  ]);
});
