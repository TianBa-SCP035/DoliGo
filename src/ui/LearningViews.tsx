import React from "react";
import "./learning-ui.css";
import type { TopicLink } from "../adapters/topic-links";
import { TopicRelatedLinks } from "./TopicRelatedLinks";
import { type DifficultyMark } from "./difficulty-ui";
import {
  OptionalPractice,
  type OptionalPracticeItem,
  type PracticeEvent,
} from "./OptionalPractice";
import {
  PronunciationControl,
  type PronunciationSource,
} from "./PronunciationControl";
import { pronunciationSourceForCard } from "./pronunciation-lookup";
import { practiceItemsForCard } from "./practice-items-lookup";
import { RecallJudgement, type RecallRating } from "./RecallJudgement";

export type LearningEntry = "words" | "scenes" | "reading" | "review";
export interface ContinueLearning {
  title: string;
  detail: string;
  entry: LearningEntry;
  documentId?: string;
}
const entries: {
  id: LearningEntry;
  label: string;
  en: string;
  detail: string;
}[] = [
  { id: "words", label: "背单词", en: "WORDS", detail: "一个词，一点积累。" },
  {
    id: "scenes",
    label: "场景对话",
    en: "CONVERSATIONS",
    detail: "看看日常里怎么说。",
  },
  {
    id: "reading",
    label: "读点英语",
    en: "READING",
    detail: "按自己的节奏，读完整篇。",
  },
  { id: "review", label: "复习", en: "REVIEW", detail: "回来看看学过的内容。" },
];
export function isEntryAvailable(
  id: LearningEntry,
  available?: readonly LearningEntry[],
) {
  return !available || available.includes(id);
}
export function LearningShell({
  active,
  onNavigate,
  onHome,
  children,
  available,
}: {
  active?: LearningEntry;
  onNavigate: (entry: LearningEntry, documentId?: string) => void;
  onHome: () => void;
  children: React.ReactNode;
  available?: readonly LearningEntry[];
}) {
  return (
    <div className="doli-app">
      <header className="doli-header">
        <button className="doli-brand" onClick={onHome} aria-label="多莉国首页">
          <span aria-hidden="true" className="doli-mark">
            D
          </span>
          多莉国
        </button>
        <nav aria-label="学习导航">
          {entries.map((e) => {
            const open = isEntryAvailable(e.id, available);
            return (
              <button
                key={e.id}
                className={active === e.id ? "is-active" : ""}
                aria-current={active === e.id ? "page" : undefined}
                disabled={!open}
                aria-disabled={!open}
                title={open ? undefined : "待接入"}
                onClick={() => {
                  if (open) onNavigate(e.id);
                }}
              >
                {e.label}
              </button>
            );
          })}
        </nav>
      </header>
      <main id="main-content" className="doli-main">
        {children}
      </main>
    </div>
  );
}
export function HomeView({
  onNavigate,
  resume,
  available,
}: {
  onNavigate: (entry: LearningEntry, documentId?: string) => void;
  resume?: ContinueLearning;
  available?: readonly LearningEntry[];
}) {
  const canResume = Boolean(
    resume && isEntryAvailable(resume.entry, available),
  );
  return (
    <div className="doli-home">
      <div className="doli-intro">
        <h1>今天，想从哪里开始？</h1>
      </div>
      {canResume && resume && (
        <section className="doli-resume" aria-label="继续上次学习">
          <div>
            <p className="doli-eyebrow">继续上次</p>
            <h2>{resume.title}</h2>
            <p className="doli-muted">{resume.detail}</p>
          </div>
          <button
            className="doli-primary"
            onClick={() => onNavigate(resume.entry, resume.documentId)}
          >
            继续学习<span aria-hidden="true"> ↗</span>
          </button>
        </section>
      )}
      <section className="doli-entry-grid" aria-label="选择学习方式">
        {entries.map((e) => {
          const open = isEntryAvailable(e.id, available);
          return (
            <button
              key={e.id}
              className={open ? "doli-entry" : "doli-entry is-disabled"}
              disabled={!open}
              aria-disabled={!open}
              title={open ? undefined : "待接入"}
              onClick={() => {
                if (open) onNavigate(e.id);
              }}
            >
              <h2>{e.label}</h2>
              <p>{e.detail}</p>
              <span className="doli-entry-action">
                {open ? "开始" : "待接入"}
                {open && <span aria-hidden="true"> ↗</span>}
              </span>
            </button>
          );
        })}
      </section>
    </div>
  );
}
export interface StudyWord {
  id: string;
  word: string;
  difficulty?: DifficultyMark;
  pronunciation?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: { english: string; chinese?: string };
  transferExample?: { english: string; chinese?: string };
  notes?: string;
}
function surfacePartOfSpeech(pos?: string) {
  const value = pos?.trim();
  if (!value || value === "语块") return undefined;
  return value;
}
export function WordStudyView({
  card,
  current,
  total,
  meaningVisible,
  exampleVisible,
  notesVisible,
  onMeaning,
  onExample,
  onNotes,
  onNext,
  onBack,
  onReview,
  relatedTopicLinks,
  onOpenRelated,
  pronunciationSource,
  recall,
  practiceItems,
  onPracticeEvent,
}: {
  card?: StudyWord;
  current: number;
  total: number;
  meaningVisible: boolean;
  exampleVisible: boolean;
  notesVisible?: boolean;
  onMeaning: () => void;
  onExample: () => void;
  onNotes?: () => void;
  onNext: () => void;
  onBack: () => void;
  onReview: () => void;
  relatedTopicLinks?: readonly TopicLink[] | null;
  onOpenRelated?: (route: string) => void;
  pronunciationSource?: PronunciationSource | null;
  recall?: {
    onRate: (rating: RecallRating) => void;
    onSkip?: () => void;
    unitLabel?: string;
  };
  practiceItems?: readonly OptionalPracticeItem[] | null;
  onPracticeEvent?: (event: PracticeEvent) => void;
}) {
  const resolvedPronunciation =
    pronunciationSource !== undefined
      ? pronunciationSource
      : pronunciationSourceForCard(card?.id);
  const resolvedPractice =
    practiceItems !== undefined
      ? practiceItems ?? []
      : practiceItemsForCard(card?.id);
  return (
    <section className="doli-study" aria-labelledby="word-study-title">
      <div className="doli-study-top">
        <button className="doli-text-button" onClick={onBack}>
          退出背词
        </button>
        <span className="doli-muted" role="status">
          {total > 0 ? `${current} / ${total}` : "暂无词卡"}
        </span>
      </div>
      {card ? (
        <>
          <div className="doli-word-panel">
            <h1 id="word-study-title" tabIndex={-1} key={card.id}>
              {card.word}
            </h1>
            {resolvedPronunciation && (
              <div className="doli-word-meta">
                <PronunciationControl source={resolvedPronunciation} />
              </div>
            )}
            {(card.pronunciation || surfacePartOfSpeech(card.partOfSpeech)) && (
              <p className="doli-pronunciation">
                {[card.pronunciation, surfacePartOfSpeech(card.partOfSpeech)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <div className="doli-reveal">
              {meaningVisible ? (
                <p className="doli-meaning">{card.meaning}</p>
              ) : (
                <button className="doli-secondary" onClick={onMeaning}>
                  查看意思
                </button>
              )}
              {meaningVisible &&
                card.example &&
                (exampleVisible ? (
                  <blockquote className="doli-example">
                    <p lang="en">{card.example.english}</p>
                    {card.example.chinese && (
                      <p className="doli-muted">{card.example.chinese}</p>
                    )}
                  </blockquote>
                ) : (
                  <button className="doli-text-button" onClick={onExample}>
                    查看例句
                  </button>
                ))}
              {meaningVisible && exampleVisible && card.transferExample && (
                <details
                  className="doli-example doli-transfer-example"
                  key={card.id}
                >
                  <summary>换个场景用</summary>
                  <p lang="en">{card.transferExample.english}</p>
                  {card.transferExample.chinese && (
                    <p className="doli-muted">{card.transferExample.chinese}</p>
                  )}
                </details>
              )}
              {meaningVisible &&
                card.notes &&
                onNotes &&
                (notesVisible ? (
                  <p className="doli-notes">{card.notes}</p>
                ) : (
                  <button className="doli-text-button" onClick={onNotes}>
                    说明
                  </button>
                ))}
            </div>
          </div>
          <footer className={recall ? "doli-study-actions doli-study-actions-recall" : "doli-study-actions"}>
            {recall ? (
              <RecallJudgement
                onRate={recall.onRate}
                onSkip={recall.onSkip}
                unitLabel={recall.unitLabel ?? "下一张"}
              />
            ) : (
              <>
                <button className="doli-secondary" onClick={onReview}>
                  还要再看
                </button>
                <button className="doli-primary" onClick={onNext}>
                  这张先这样<span aria-hidden="true"> →</span>
                </button>
              </>
            )}
          </footer>
          <OptionalPractice items={resolvedPractice} onEvent={onPracticeEvent} />
          <TopicRelatedLinks topics={relatedTopicLinks} onOpen={onOpenRelated} />
        </>
      ) : (
        <div className="doli-empty">
          <h1 id="word-study-title">这里还没有词卡</h1>
          <p className="doli-muted">选择其他词汇组继续学习。</p>
          <button className="doli-secondary" onClick={onBack}>
            返回首页
          </button>
        </div>
      )}
    </section>
  );
}
