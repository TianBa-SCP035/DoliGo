import React, { useMemo, useState } from "react";
import {
  SELF_MARK_LABELS,
  buildReviewEncounterView,
  commitReviewAdvance,
  commitReviewRestart,
  createReviewCardSession,
  currentReviewEncounterId,
  getCard,
  getReviewEncounter,
  isCardExpandedAt,
  loadReviewCatalog,
  loadReviewSession,
  revealSense,
  toggleCardSession,
  toggleExamples,
  toggleNotes,
  updateReveal,
  type ReviewCardSession,
  type ReviewSelfMark,
  type ReviewSession,
  type ReviewSessionResult,
  type TextSegment,
  type VocabCard,
} from "../lib/review";
import "./learning-ui.css";

export function SenseCard({
  card,
  session,
  onSession,
}: {
  card: VocabCard;
  session: ReviewCardSession;
  onSession: (next: ReviewCardSession) => void;
}) {
  const reveal = session.reveal;
  const hasExample = Boolean(
    card.exampleEn ||
      card.transferEn ||
      (card.extraExamples && card.extraExamples.length),
  );
  return (
    <article className="doli-inline-card" aria-label={card.headword}>
      <h3>{card.headword}</h3>
      <p className="doli-pronunciation">
        {[card.pos, card.posZh].filter(Boolean).join(" · ")}
      </p>
      <div className="doli-reveal">
        {reveal.senseOpen ? (
          <p className="doli-meaning">
            {card.senseZh}
            {card.collocation ? `  ${card.collocation}` : ""}
          </p>
        ) : (
          <button
            className="doli-secondary"
            onClick={() => onSession(updateReveal(session, revealSense))}
          >
            查看意思
          </button>
        )}
        {reveal.senseOpen &&
          hasExample &&
          (reveal.examplesOpen ? (
            <blockquote className="doli-example">
              {card.exampleEn && <p lang="en">{card.exampleEn}</p>}
              {card.exampleZh && <p className="doli-muted">{card.exampleZh}</p>}
              {card.transferEn && <p lang="en">{card.transferEn}</p>}
              {card.transferZh && (
                <p className="doli-muted">{card.transferZh}</p>
              )}
              {card.extraExamples?.map((ex, i) => (
                <React.Fragment key={i}>
                  <p lang="en">{ex.en}</p>
                  {ex.zh && <p className="doli-muted">{ex.zh}</p>}
                </React.Fragment>
              ))}
            </blockquote>
          ) : (
            <button
              className="doli-text-button"
              onClick={() => onSession(updateReveal(session, toggleExamples))}
            >
              查看例句
            </button>
          ))}
        {reveal.senseOpen &&
          card.notesZh &&
          (reveal.notesOpen ? (
            <p className="doli-notes">{card.notesZh}</p>
          ) : (
            <button
              className="doli-text-button"
              onClick={() => onSession(updateReveal(session, toggleNotes))}
            >
              说明
            </button>
          ))}
      </div>
    </article>
  );
}

function SentenceText({
  segments,
  onTap,
}: {
  segments: TextSegment[];
  onTap: (cardId: string) => void;
}) {
  return (
    <p lang="en" className="doli-line">
      {segments.map((seg, i) =>
        seg.type === "tap" ? (
          <button
            key={i}
            type="button"
            className="doli-tap"
            onClick={() => onTap(seg.cardId)}
          >
            {seg.text}
          </button>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </p>
  );
}

export function ReviewView({ onBack }: { onBack: () => void }) {
  const catalog = useMemo(() => loadReviewCatalog(), []);
  const ids = useMemo(
    () => catalog.reviewPack.reviewEncounters.map((item) => item.id),
    [catalog],
  );
  const boot = useMemo(
    () => loadReviewSession(window.localStorage, ids),
    [ids],
  );
  const [progress, setProgress] = useState<ReviewSession | null>(
    boot.ok ? boot.session : null,
  );
  const [error, setError] = useState(boot.ok ? "" : boot.error);
  const [cardSession, setCardSession] = useState(() =>
    createReviewCardSession(),
  );
  const [chineseOpen, setChineseOpen] = useState(false);
  const encounterId = progress ? currentReviewEncounterId(progress) : undefined;
  const encounter = encounterId
    ? getReviewEncounter(catalog.reviewPack.reviewEncounters, encounterId)
    : undefined;
  const view = useMemo(
    () =>
      encounter
        ? buildReviewEncounterView(encounter, catalog.anchorsPack.units)
        : null,
    [encounter, catalog],
  );

  function apply(result: ReviewSessionResult) {
    if (result.ok) {
      setProgress(result.session);
      setCardSession(createReviewCardSession());
      setChineseOpen(false);
      setError("");
      return;
    }
    setError(result.error);
  }
  function advance(mark?: ReviewSelfMark) {
    if (!progress) return;
    apply(commitReviewAdvance(window.localStorage, progress, mark));
  }

  if (!progress) {
    return (
      <section className="doli-study">
        <div className="doli-empty">
          <h1>复习记录无法读取</h1>
          <p className="doli-muted" role="alert">
            {error || "原记录已保留，没有覆盖。"}
          </p>
          <button className="doli-secondary" onClick={onBack}>
            返回首页
          </button>
        </div>
      </section>
    );
  }
  if (progress.completed) {
    return (
      <section className="doli-completion" aria-labelledby="review-done-title">
        <h1 id="review-done-title">今天这组，先到这里。</h1>
        <p className="doli-muted">
          浏览了 {progress.encounterIds.length} 段短复习。下次可以接着再看。
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="doli-completion-actions">
          <button className="doli-primary" onClick={onBack}>
            回首页
          </button>
          <button
            className="doli-secondary"
            onClick={() =>
              apply(commitReviewRestart(window.localStorage, progress))
            }
          >
            再看这组
          </button>
        </div>
      </section>
    );
  }
  if (!view) {
    return (
      <section className="doli-study">
        <div className="doli-empty">
          <h1>复习还没有内容</h1>
          <button className="doli-secondary" onClick={onBack}>
            返回首页
          </button>
        </div>
      </section>
    );
  }

  const expandedCard = cardSession.expanded
    ? getCard(catalog.cardIndex, cardSession.expanded.cardId)
    : undefined;
  return (
    <section className="doli-review" aria-label="复习">
      <div className="doli-study-top">
        <button className="doli-text-button" onClick={onBack}>
          返回首页
        </button>
        <span className="doli-muted" role="status">
          {progress.position + 1} / {progress.encounterIds.length}
        </span>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="doli-review-body">
        {view.sentences.map((sentence) => (
          <div
            key={sentence.unitId}
            className="doli-sentence"
            data-progress-unit={sentence.unitId}
          >
            <SentenceText
              segments={sentence.segments}
              onTap={(cardId) =>
                setCardSession((cur) =>
                  toggleCardSession(cur, sentence.unitId, cardId),
                )
              }
            />
            {cardSession.expanded &&
              isCardExpandedAt(
                cardSession.expanded,
                sentence.unitId,
                cardSession.expanded.cardId,
              ) &&
              expandedCard && (
                <SenseCard
                  card={expandedCard}
                  session={cardSession}
                  onSession={setCardSession}
                />
              )}
          </div>
        ))}
      </div>
      <div className="doli-review-tools">
        {chineseOpen ? (
          <div className="doli-zh">
            {view.sentences.map((sentence) => (
              <p key={sentence.unitId}>{sentence.zh}</p>
            ))}
          </div>
        ) : (
          <button
            className="doli-text-button"
            onClick={() => setChineseOpen(true)}
          >
            查看中文
          </button>
        )}
      </div>
      <footer className="doli-review-actions">
        <div className="doli-review-marks">
          <button
            type="button"
            className="doli-text-button"
            onClick={() => advance("again")}
          >
            {SELF_MARK_LABELS.reviewUnsure}
          </button>
          <button
            type="button"
            className="doli-text-button"
            onClick={() => advance("recognized")}
          >
            {SELF_MARK_LABELS.reviewKnown}
          </button>
        </div>
        <button
          type="button"
          className="doli-primary"
          onClick={() => advance()}
        >
          下一条<span aria-hidden="true"> →</span>
        </button>
      </footer>
    </section>
  );
}
