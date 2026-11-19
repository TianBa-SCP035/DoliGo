import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReadingProgress } from "../lib/progress";
import {
  createReviewCardSession,
  getCard,
  isCardExpandedAt,
  loadLearningCatalog,
  segmentsForUnit,
  toggleCardSession,
} from "../lib/review";
import { SenseCard } from "./ReviewView";
import { ArticleReader } from "./ArticleReader";
import "./learning-ui.css";
import {
  TextLibraryView,
  type LearningDocument as Document,
} from "./TextLibraryView";
import {
  pickSourceAttribution,
  SourceAttributionBlock,
} from "./SourceAttribution";
import { TopicRelatedLinks } from "./TopicRelatedLinks";
import { RecallJudgement, type RecallRating } from "./RecallJudgement";
import {
  OptionalPractice,
  type OptionalPracticeItem,
  type PracticeEvent,
} from "./OptionalPractice";
import {
  SceneDifficultyLinks,
  type SceneDifficultyItem,
} from "./SceneDifficultyLinks";
import { difficultyLinksForDocument } from "./difficulty-links-lookup";
import { practiceItemsForDocument } from "./practice-items-lookup";
import {
  nextDocumentForDocument,
  type NextDocumentLink,
} from "./next-document-lookup";
import {
  clearReviewOpenUnit,
  initialUnitCursor,
  peekReviewOpenUnit,
} from "./due-text-recall-lookup";
import {
  topicLinksForReading,
  topicLinksForScene,
} from "../adapters/topic-links";

export type TextRecallHandlers = {
  onRate: (rating: RecallRating, unitId?: string) => void;
  onSkip?: (unitId?: string) => void;
  unitLabel?: string;
};

function judgementUnitLabel(
  kind: "scene" | "reading",
  provided?: string,
): string {
  if (kind === "reading") return "下一段";
  return provided ?? "下一句";
}

function judgementEndCopy(kind: "scene" | "reading"): string {
  return kind === "reading"
    ? "已经到最后一段了，可以返回列表。"
    : "已经到最后一句了，可以返回列表。";
}

function libraryMetadata(entry: unknown): {
  category?: string;
  tags?: string[];
} {
  if (!entry || typeof entry !== "object") return {};
  const raw = entry as { category?: unknown; tags?: unknown };
  return {
    category: typeof raw.category === "string" ? raw.category : undefined,
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
  };
}

export function TextLearningView({
  kind,
  onBack,
  startId,
  onOpenRelated,
  onOpenDocument,
  recall,
  practiceItems,
  onPracticeEvent,
  difficultyLinks,
  nextDocument,
}: {
  kind: "scene" | "reading";
  onBack: () => void;
  startId?: string;
  onOpenRelated?: (route: string) => void;
  /** App writes the document route. This view does not assign the address itself. */
  onOpenDocument?: (id: string | undefined) => void;
  recall?: TextRecallHandlers;
  practiceItems?: readonly OptionalPracticeItem[] | null;
  onPracticeEvent?: (event: PracticeEvent) => void;
  difficultyLinks?: readonly SceneDifficultyItem[] | null;
  nextDocument?: NextDocumentLink | null;
}) {
  const catalog = useMemo(() => loadLearningCatalog(), []);
  const documents: Document[] = useMemo(
    () =>
      kind === "scene"
        ? catalog.scenes.map((s) => ({
            id: s.id,
            title: s.title,
            titleEn: s.titleEn,
            levelSuggestion: s.levelSuggestionZh,
            units: s.lines,
            setting: s.settingZh,
            notes: s.notes ?? [],
            ...libraryMetadata(s),
            sourceAttribution: pickSourceAttribution(s),
          }))
        : catalog.readings.map((s) => ({
            id: s.id,
            title: s.title,
            titleEn: s.titleEn,
            levelSuggestion: s.levelSuggestionZh,
            units: s.paragraphs,
            wordCount: s.wordCount,
            notes: s.notes ?? [],
            ...libraryMetadata(s),
            sourceAttribution: pickSourceAttribution(s),
          })),
    [kind, catalog],
  );
  const [selected, setSelected] = useState<string | undefined>(startId);
  const doc = documents.find((d) => d.id === selected);
  if (doc)
    return (
      <DocumentView
        key={kind + doc.id}
        kind={kind}
        doc={doc}
        onBack={() => {
          if (typeof sessionStorage !== "undefined") {
            clearReviewOpenUnit(sessionStorage, doc.id);
          }
          if (onOpenDocument) onOpenDocument(undefined);
          else setSelected(undefined);
          window.scrollTo(0, 0);
        }}
        onOpenRelated={onOpenRelated}
        recall={recall}
        practiceItems={practiceItems}
        onPracticeEvent={onPracticeEvent}
        difficultyLinks={difficultyLinks}
        nextDocument={nextDocument}
      />
    );
  return (
    <TextLibraryView
      kind={kind}
      documents={documents}
      onBack={onBack}
      onOpen={(id) => {
        if (onOpenDocument) onOpenDocument(id);
        else setSelected(id);
        window.scrollTo(0, 0);
      }}
    />
  );
}
function DocumentView({
  kind,
  doc,
  onBack,
  onOpenRelated,
  recall,
  practiceItems,
  onPracticeEvent,
  difficultyLinks,
  nextDocument,
}: {
  kind: "scene" | "reading";
  doc: Document;
  onBack: () => void;
  onOpenRelated?: (route: string) => void;
  recall?: TextRecallHandlers;
  practiceItems?: readonly OptionalPracticeItem[] | null;
  onPracticeEvent?: (event: PracticeEvent) => void;
  difficultyLinks?: readonly SceneDifficultyItem[] | null;
  nextDocument?: NextDocumentLink | null;
}) {
  const root = useRef<HTMLElement>(null);
  const { saved, isRestoring, remember, completeRestore, warning } =
    useReadingProgress({ kind, id: doc.id });
  const originalSaved = useRef(saved?.unitId);
  const lastWritten = useRef<string>();
  const catalog = useMemo(() => loadLearningCatalog(), []);
  const [session, setSession] = useState(createReviewCardSession);
  const anchors = useMemo(
    () =>
      new Map(
        catalog.anchorsPack.units
          .filter((u) => u.parentId === doc.id)
          .map((u) => [u.sourceId, u]),
      ),
    [catalog, doc.id],
  );
  const relatedTopics = useMemo(
    () =>
      kind === "scene"
        ? topicLinksForScene(doc.id)
        : topicLinksForReading(doc.id),
    [kind, doc.id],
  );
  const resolvedDifficulty = useMemo(() => {
    if (difficultyLinks !== undefined) {
      return { items: difficultyLinks ?? [], sceneTitle: undefined };
    }
    return difficultyLinksForDocument(catalog, kind, doc.id);
  }, [catalog, difficultyLinks, doc.id, kind]);
  const resolvedPractice = useMemo(() => {
    if (practiceItems !== undefined) return practiceItems ?? [];
    return practiceItemsForDocument(kind, doc.id);
  }, [kind, doc.id, practiceItems]);
  const resolvedNext = useMemo(() => {
    if (nextDocument !== undefined) return nextDocument ?? undefined;
    return nextDocumentForDocument(catalog, kind, doc.id);
  }, [catalog, doc.id, kind, nextDocument]);
  const unitIds = useMemo(() => doc.units.map((unit) => unit.id), [doc.units]);
  const reviewOpen = useRef(
    typeof sessionStorage === "undefined"
      ? undefined
      : peekReviewOpenUnit(sessionStorage, doc.id),
  );
  const reviewOpenUnitId =
    reviewOpen.current && unitIds.includes(reviewOpen.current.unitId)
      ? reviewOpen.current.unitId
      : undefined;
  const freezeProgress = Boolean(reviewOpenUnitId);
  const [cursor, setCursor] = useState(() =>
    initialUnitCursor(unitIds, reviewOpenUnitId, saved?.unitId ?? originalSaved.current),
  );
  const [reachedEnd, setReachedEnd] = useState(false);
  const currentUnitId = unitIds[cursor] ?? unitIds[0];

  function advanceUnit() {
    if (cursor < unitIds.length - 1) {
      setReachedEnd(false);
      setCursor(cursor + 1);
      return;
    }
    setReachedEnd(true);
  }

  useLayoutEffect(() => {
    if (!root.current || !currentUnitId) return;
    const nodes = root.current.querySelectorAll<HTMLElement>("[data-progress-unit]");
    nodes.forEach((node) => {
      const on = node.dataset.progressUnit === currentUnitId;
      node.toggleAttribute("data-current-unit", on);
      if (on) node.setAttribute("aria-current", "true");
      else node.removeAttribute("aria-current");
    });
    const current = Array.from(nodes).find((node) => node.dataset.progressUnit === currentUnitId);
    current?.scrollIntoView({ block: "start", behavior: "instant" });
    if (!isRestoring && !freezeProgress) remember(currentUnitId, "manual");
  }, [currentUnitId, freezeProgress, isRestoring, remember]);

  useLayoutEffect(() => {
    if (freezeProgress) {
      completeRestore();
      return;
    }
    let second = 0;
    const first = requestAnimationFrame(() => {
      const unit = [
        ...root.current!.querySelectorAll<HTMLElement>("[data-progress-unit]"),
      ].find((e) => e.dataset.progressUnit === originalSaved.current);
      try {
        if (unit) unit.scrollIntoView({ block: "start", behavior: "instant" });
      } finally {
        second = requestAnimationFrame(() => completeRestore());
      }
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [completeRestore]);
  useEffect(() => {
    if (isRestoring || freezeProgress) return;
    let pending = 0;
    function collect() {
      const nodes = [
        ...root.current!.querySelectorAll<HTMLElement>("[data-progress-unit]"),
      ];
      const visible = nodes.filter((n) => {
        const r = n.getBoundingClientRect();
        return r.bottom > 90 && r.top < innerHeight * 0.75;
      });
      return { nodes, lastVisible: visible.at(-1)?.dataset.progressUnit };
    }
    function write(unitId: string | undefined) {
      if (!unitId || unitId === lastWritten.current) return;
      if (remember(unitId, "visibility")) lastWritten.current = unitId;
    }
    function saveFromScroll() {
      pending = 0;
      if (!root.current) return;
      write(collect().lastVisible);
    }
    function saveInitialVisibility() {
      if (!root.current) return;
      const { nodes, lastVisible } = collect();
      const saved = originalSaved.current;
      // After the restore gate opens, record a continue-reading position once
      // without waiting for a scroll. Keep a restored unit: do not roll back or
      // silently advance. With no saved unit, use the last visible one.
      if (saved && nodes.some((node) => node.dataset.progressUnit === saved)) {
        write(saved);
        return;
      }
      write(lastVisible);
    }
    const initial = requestAnimationFrame(saveInitialVisibility);
    const scroll = () => {
      if (!pending) pending = requestAnimationFrame(saveFromScroll);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", scroll);
      cancelAnimationFrame(pending);
      cancelAnimationFrame(initial);
    };
  }, [isRestoring, remember]);
  const expanded = session.expanded
    ? getCard(catalog.cardIndex, session.expanded.cardId)
    : undefined;
  return (
    <article
      ref={root}
      className={
        "doli-document " + (kind === "scene" ? "doli-dialogue" : "doli-prose")
      }
    >
      <button className="doli-text-button" onClick={onBack}>
        返回{kind === "scene" ? "场景" : "阅读"}列表
      </button>
      <header className="doli-document-heading">
        <h1 lang="en">{doc.titleEn}</h1>
        <p className="doli-muted">{doc.title}</p>
        {doc.setting && <p className="doli-setting">{doc.setting}</p>}
      </header>
      {warning && <p role="alert">{warning}</p>}
      {kind === "reading" ? (
        <ArticleReader units={doc.units} notes={doc.notes ?? []} catalog={catalog} docId={doc.id} />
      ) : <div className="doli-document-body">
        {doc.units.map((unit) => {
          const anchor = anchors.get(unit.id);
          const segments = anchor
            ? segmentsForUnit(anchor)
            : [{ type: "text" as const, text: unit.en }];
          const isOpen =
            session.expanded &&
            isCardExpandedAt(
              session.expanded,
              unit.id,
              session.expanded.cardId,
            );
          return (
            <section
              className="doli-document-unit"
              key={unit.id}
              data-progress-unit={unit.id}
            >
              {unit.speaker && (
                <span
                  className="doli-speaker"
                  aria-label={"说话人 " + unit.speaker}
                >
                  {unit.speaker}
                </span>
              )}
              <p lang="en" className="doli-document-english">
                {segments.map((s, i) =>
                  s.type === "tap" ? (
                    <button
                      key={i}
                      className="doli-tap"
                      aria-expanded={Boolean(
                        session.expanded &&
                        isCardExpandedAt(session.expanded, unit.id, s.cardId),
                      )}
                      onClick={() =>
                        setSession((cur) =>
                          toggleCardSession(cur, unit.id, s.cardId),
                        )
                      }
                    >
                      {s.text}
                    </button>
                  ) : (
                    <React.Fragment key={i}>{s.text}</React.Fragment>
                  ),
                )}
              </p>
              {isOpen && expanded && (
                <SenseCard
                  card={expanded}
                  session={session}
                  onSession={setSession}
                />
              )}
              <details className="doli-translation">
                <summary>中文</summary>
                <p>{unit.zh}</p>
              </details>
            </section>
          );
        })}
      </div>}
      <footer className="doli-document-footer">
        <details>
          <summary>表达说明</summary>
          {(doc.notes ?? []).map((n, i) => (
            <div className="doli-note-row" key={i}>
              <strong lang="en">{n.expression}</strong>
              <p>{n.meaningZh}</p>
            </div>
          ))}
        </details>
        {doc.sourceAttribution ? (
          <SourceAttributionBlock data={doc.sourceAttribution} />
        ) : (
          <details>
            <summary>关于本文</summary>
            <p>
              原创虚构学习{kind === "scene" ? "情景" : "故事"}
              ，并非真实聊天或经历。难度仅为教学建议。
            </p>
          </details>
        )}
        {recall && !reachedEnd ? (
          <RecallJudgement
            onRate={(rating) => {
              recall.onRate(rating, currentUnitId);
              advanceUnit();
            }}
            onSkip={() => {
              recall.onSkip?.(currentUnitId);
              advanceUnit();
            }}
            unitLabel={judgementUnitLabel(kind, recall.unitLabel)}
          />
        ) : recall && reachedEnd ? (
          <p className="doli-muted" data-recall-complete="">
            {judgementEndCopy(kind)}
          </p>
        ) : null}
        {resolvedNext && onOpenRelated ? (
          <div
            className={kind === "scene" ? "doli-completion-actions" : undefined}
            data-next-document=""
          >
            <button
              type="button"
              className={kind === "scene" ? "doli-primary" : "doli-secondary"}
              onClick={() => onOpenRelated(resolvedNext.route)}
            >
              <span>开始下一篇</span>
              <span className="doli-completion-next-title">
                {resolvedNext.title}
              </span>
            </button>
          </div>
        ) : null}
        <OptionalPractice items={resolvedPractice} onEvent={onPracticeEvent} />
        <SceneDifficultyLinks
          sceneTitle={resolvedDifficulty.sceneTitle}
          items={resolvedDifficulty.items}
          onOpen={onOpenRelated}
        />
        <TopicRelatedLinks topics={relatedTopics} onOpen={onOpenRelated} />
        <button className="doli-secondary" onClick={onBack}>
          返回{kind === "scene" ? "场景" : "阅读"}列表
        </button>
      </footer>
    </article>
  );
}
