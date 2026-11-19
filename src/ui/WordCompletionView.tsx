import React from "react";
import "./learning-ui.css";
import type { TopicLink } from "../adapters/topic-links";
import { TopicRelatedLinks } from "./TopicRelatedLinks";
import {
  OptionalPractice,
  type OptionalPracticeItem,
  type PracticeEvent,
} from "./OptionalPractice";
import {
  SceneDifficultyLinks,
  type SceneDifficultyItem,
} from "./SceneDifficultyLinks";

export type NextGroupStatus = "not-started" | "in-progress";

export type NextGroupLink = {
  id: string;
  title: string;
  route: string;
  status: NextGroupStatus;
};

export function defaultNextGroupLabel(status: NextGroupStatus) {
  return status === "in-progress" ? "继续下一组" : "开始下一组";
}

export function WordCompletionView({
  total,
  onRestart,
  onHome,
  eyebrow = "本组已浏览完",
  title = "这组先看到这里",
  homeLabel = "回首页",
  restartLabel = "再看这组",
  nextGroup,
  onNextGroup,
  nextGroupLabel,
  onChooseGroup,
  chooseGroupLabel = "选另一组",
  relatedTopicLinks,
  onOpenRelated,
  sceneDifficultyItems,
  practiceItems,
  onPracticeEvent,
}: {
  total: number;
  onRestart: () => void;
  onHome: () => void;
  eyebrow?: string;
  title?: string;
  homeLabel?: string;
  restartLabel?: string;
  nextGroup?: NextGroupLink;
  onNextGroup?: () => void;
  nextGroupLabel?: string;
  onChooseGroup?: () => void;
  chooseGroupLabel?: string;
  relatedTopicLinks?: readonly TopicLink[] | null;
  onOpenRelated?: (route: string) => void;
  sceneDifficultyItems?: readonly SceneDifficultyItem[] | null;
  practiceItems?: readonly OptionalPracticeItem[] | null;
  onPracticeEvent?: (event: PracticeEvent) => void;
}) {
  const showNextGroup = Boolean(nextGroup);
  const label =
    nextGroupLabel ??
    (nextGroup ? defaultNextGroupLabel(nextGroup.status) : undefined);

  return (
    <section className="doli-completion" aria-labelledby="completion-title">
      <p className="doli-eyebrow">{eyebrow}</p>
      <h1 id="completion-title">{title}</h1>
      <p className="doli-muted">浏览了 {total} 张词卡。下次可以回来再看。</p>
      <div className="doli-completion-actions">
        {showNextGroup && nextGroup && (
          <button
            type="button"
            className="doli-primary"
            onClick={onNextGroup}
          >
            <span>{label}</span>
            <span className="doli-completion-next-title">{nextGroup.title}</span>
          </button>
        )}
        <button
          type="button"
          className={showNextGroup ? "doli-secondary" : "doli-primary"}
          onClick={onHome}
        >
          {homeLabel}
        </button>
        <button type="button" className="doli-secondary" onClick={onRestart}>
          {restartLabel}
        </button>
        {onChooseGroup && (
          <button
            type="button"
            className="doli-text-button"
            onClick={onChooseGroup}
          >
            {chooseGroupLabel}
          </button>
        )}
      </div>
      <TopicRelatedLinks topics={relatedTopicLinks} onOpen={onOpenRelated} />
      <SceneDifficultyLinks
        items={sceneDifficultyItems}
        onOpen={onOpenRelated}
      />
      <OptionalPractice items={practiceItems} onEvent={onPracticeEvent} />
    </section>
  );
}
