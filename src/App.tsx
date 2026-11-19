import { useEffect, useState } from "react";
import { LearningShell, HomeView, WordStudyView } from "./ui/LearningViews";
import type { LearningEntry } from "./ui/LearningViews";
import { WordCompletionView } from "./ui/WordCompletionView";
import { WordGroupPicker } from "./ui/WordGroupPicker";
import { WordLibraryView } from "./ui/WordLibraryView";
import { TextLearningView } from "./ui/TextLearningView";
import {
  studyWordById,
  wordGroups,
  isWordGroupId,
  isLibraryWordId,
  libraryWordEntries,
  libraryWords,
  WIRING_VERSION,
} from "./adapters/wiring-words";
import {
  advanceLibraryWord,
  advanceWord,
  initialLibraryWordSession,
  initialWordSession,
  queueWordForReview,
  readLibraryWordSession,
  readWordSession,
  saveLibraryWordSession,
  saveWordSession,
} from "./adapters/word-session";
import type { LibraryWordSession, WordSession } from "./adapters/word-session";
import type { WordGroupId } from "./adapters/wiring-words";
import { pickHomeResume, textDocumentIdFromHash } from "./adapters/text-resume";
import { loadProgressStore } from "./lib/progress";
import {
  AVAILABLE_ENTRIES as AVAILABLE,
  pageFromHash,
  hashForEntry,
  wordGroupFromHash,
  isWordsLibraryList,
  isLibraryWordHash,
  libraryWordFromHash,
  studyWordIdFromHash,
} from "./adapters/routes";
import { nextWordGroup } from "./adapters/word-group-flow";
import {
  topicLinksForCard,
  topicLinksForWordGroup,
} from "./adapters/topic-links";
import type { NextGroupLink } from "./ui/WordCompletionView";
import {
  loadRecallStore,
  recordRecall,
} from "./adapters/memory-spacing";
import type { RecallRating } from "./ui/RecallJudgement";
import { ReviewDueList, type DueReviewItem } from "./ui/ReviewDueList";


/** Digest a topic-link hash with existing route helpers. Does not write location.hash. */
export function relatedRouteTarget(
  route: string,
):
  | { entry: "home" }
  | { entry: LearningEntry; documentId?: string }
  | undefined {
  const hash = route.startsWith("#")
    ? route
    : `#${route.startsWith("/") ? route : `/${route}`}`;
  const page = pageFromHash(hash);
  if (page === "home") {
    if (hash === "#" || hash === "#/" || hash === "") return { entry: "home" };
    return undefined;
  }
  if (page === "review") return { entry: "review" };
  if (page === "scenes") {
    if (/^#\/scenes\/?$/.test(hash)) return { entry: "scenes" };
    const documentId = textDocumentIdFromHash(hash, "scenes");
    return documentId ? { entry: "scenes", documentId } : undefined;
  }
  if (page === "reading") {
    if (/^#\/reading\/?$/.test(hash)) return { entry: "reading" };
    const documentId = textDocumentIdFromHash(hash, "reading");
    return documentId ? { entry: "reading", documentId } : undefined;
  }
  if (page !== "words") return undefined;
  if (/^#\/words\/?$/.test(hash)) return { entry: "words" };
  if (isWordsLibraryList(hash)) return { entry: "words", documentId: "library" };
  const cardId = studyWordIdFromHash(hash);
  if (cardId) return { entry: "words", documentId: cardId };
  if (isLibraryWordHash(hash)) return undefined;
  let groupId: string;
  try {
    groupId = decodeURIComponent(hash.slice("#/words/".length)).replace(/\/$/, "");
  } catch {
    return undefined;
  }
  return isWordGroupId(groupId) ? { entry: "words", documentId: groupId } : undefined;
}

function asNextGroupLink(
  group: ReturnType<typeof nextWordGroup>,
): NextGroupLink | undefined {
  if (!group) return undefined;
  return {
    id: group.id,
    title: group.title,
    route: group.route,
    status: group.status === "in-progress" ? "in-progress" : "not-started",
  };
}

function dueRecallItems(): DueReviewItem[] {
  const loaded = loadRecallStore(localStorage);
  if (!loaded.ok) return [];
  return Object.entries(loaded.store.targets).flatMap(([id, record]) => {
    const word = studyWordById(id);
    if (!word) return [];
    return [
      {
        id,
        title: word.word,
        kind: "word" as const,
        dueAt: record.nextDueAt,
        difficulty: word.difficulty,
      },
    ];
  });
}

function recallProps(
  cardId: string,
  advance: () => void,
  onError: (message: string) => void,
): {
  onRate: (rating: RecallRating) => void;
  onSkip: () => void;
  unitLabel: string;
} {
  return {
    onRate: (rating) => {
      const result = recordRecall(localStorage, cardId, rating);
      if (!result.ok) {
        onError(result.error);
        return;
      }
      advance();
    },
    onSkip: () => advance(),
    unitLabel: "下一张",
  };
}

function textRecallProps(
  documentId: string,
  onError: (message: string) => void,
): {
  onRate: (rating: RecallRating, unitId?: string) => void;
  onSkip: (unitId?: string) => void;
  unitLabel: string;
} {
  return {
    onRate: (rating, unitId) => {
      const result = recordRecall(localStorage, unitId || documentId, rating);
      if (!result.ok) {
        onError(result.error);
      }
    },
    onSkip: () => undefined,
    unitLabel: "下一句",
  };
}

export default function App() {
  const [routeHash, setRouteHash] = useState(() => location.hash);
  const page = pageFromHash(routeHash);
  const [error, setError] = useState("");
  const [wordState, setWordState] = useState(() => {
    const sessions = {} as Record<WordGroupId, WordSession>;
    const errors: Partial<Record<WordGroupId, string>> = {};
    for (const { id: group } of wordGroups) {
      try {
        sessions[group] = readWordSession(localStorage, group);
      } catch (e) {
        sessions[group] = initialWordSession(group);
        errors[group] = `无法恢复背词记录：${(e as Error).message}`;
      }
    }
    return { sessions, errors };
  });
  const [queuedCardView, setQueuedCardView] = useState({
    meaningVisible: false,
    exampleVisible: false,
    notesVisible: false,
    cardId: "",
  });
  const [libraryState, setLibraryState] = useState(() => {
    const sessions = {} as Record<string, LibraryWordSession>;
    const errors: Record<string, string> = {};
    for (const word of libraryWords) {
      try {
        sessions[word.id] = readLibraryWordSession(localStorage, word.id);
      } catch (e) {
        sessions[word.id] = initialLibraryWordSession(word.id);
        errors[word.id] = `无法恢复背词记录：${(e as Error).message}`;
      }
    }
    return { sessions, errors };
  });
  const showGroupPicker = page === "words" && /^#\/words\/?$/.test(routeHash);
  const showWordLibrary = isWordsLibraryList(routeHash);
  const libraryCardId = libraryWordFromHash(routeHash);
  const studyCardId = studyWordIdFromHash(routeHash);
  const queuedCardId =
    studyCardId && !libraryCardId ? studyCardId : undefined;
  const invalidLibraryCard = isLibraryWordHash(routeHash) && !studyCardId;
  const studyingLibrary = Boolean(libraryCardId);
  const queuedCard = queuedCardId ? studyWordById(queuedCardId) : undefined;
  const studyingQueuedCard = Boolean(queuedCard);
  const studyingGroup =
    page === "words" &&
    !showGroupPicker &&
    !showWordLibrary &&
    !invalidLibraryCard &&
    !studyingLibrary &&
    !studyingQueuedCard;
  const groupId = wordGroupFromHash(routeHash);
  const session = wordState.sessions[groupId];
  const librarySession = libraryCardId
    ? libraryState.sessions[libraryCardId]
    : undefined;
  const groupError = studyingGroup
    ? wordState.errors[groupId]
    : studyingLibrary && libraryCardId
      ? libraryState.errors[libraryCardId]
      : undefined;

  useEffect(() => {
    const sync = () => setRouteHash(location.hash);
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (!queuedCardId || queuedCardView.cardId === queuedCardId) return;
    setQueuedCardView({
      meaningVisible: false,
      exampleVisible: false,
      notesVisible: false,
      cardId: queuedCardId,
    });
  }, [queuedCardId, queuedCardView.cardId]);

  function navigate(entry: LearningEntry, documentId?: string) {
    if (!AVAILABLE.includes(entry)) return;
    location.hash = hashForEntry(entry, documentId);
    setRouteHash(location.hash);
  }

  function home() {
    location.hash = "/";
    setRouteHash(location.hash);
  }

  function openRelated(route: string) {
    const target = relatedRouteTarget(route);
    if (!target) return;
    if (target.entry === "home") home();
    else navigate(target.entry, target.documentId);
  }

  function commit(next: WordSession) {
    try {
      const targetGroup = next.groupId ?? "basic";
      if (wordState.errors[targetGroup])
        throw new Error(wordState.errors[targetGroup]);
      const stamped = { ...next, updatedAt: Date.now() };
      saveWordSession(localStorage, stamped);
      setWordState((previous) => ({
        ...previous,
        sessions: { ...previous.sessions, [targetGroup]: stamped },
      }));
      setError("");
      return true;
    } catch (e) {
      setError(
        `保存失败：${(e as Error).message} 当前记录未被替换，请勿关闭页面。`,
      );
      return false;
    }
  }

  function commitLibrary(next: LibraryWordSession) {
    try {
      if (libraryState.errors[next.cardId])
        throw new Error(libraryState.errors[next.cardId]);
      const stamped = { ...next, updatedAt: Date.now() };
      saveLibraryWordSession(localStorage, stamped);
      setLibraryState((previous) => ({
        ...previous,
        sessions: { ...previous.sessions, [next.cardId]: stamped },
      }));
      setError("");
      return true;
    } catch (e) {
      setError(
        `保存失败：${(e as Error).message} 当前记录未被替换，请勿关闭页面。`,
      );
      return false;
    }
  }

  const card = studyWordById(session.ids[session.index])!;
  const completed = session.index >= session.ids.length;
  const libraryCard = libraryCardId ? studyWordById(libraryCardId) : undefined;
  const libraryCompleted = Boolean(
    librarySession && librarySession.index >= librarySession.ids.length,
  );
  const progress = loadProgressStore(localStorage).store;
  const resume = pickHomeResume(
    wordState.sessions.basic,
    progress,
    wordGroups
      .filter((group) => group.id !== "basic" && !wordState.errors[group.id])
      .map((group) => wordState.sessions[group.id]),
    libraryWords
      .filter((word) => !libraryState.errors[word.id])
      .map((word) => libraryState.sessions[word.id]),
  );
  const startId = textDocumentIdFromHash(routeHash, page);
  const libraryTopicLinks = libraryCardId
    ? topicLinksForCard(libraryCardId)
    : [];
  const groupCardTopicLinks = card ? topicLinksForCard(card.id) : [];
  const groupStudyTopicLinks = groupCardTopicLinks.length
    ? groupCardTopicLinks
    : topicLinksForWordGroup(groupId);
  const groupCompletionTopicLinks = topicLinksForWordGroup(groupId);

  return (
    <div data-wiring-version={WIRING_VERSION}>
      <LearningShell
        available={AVAILABLE}
        active={page === "home" ? undefined : page}
        onNavigate={navigate}
        onHome={home}
      >
        {(error || groupError) && <p role="alert">{error || groupError}</p>}
        {page === "home" ? (
          <HomeView
            available={AVAILABLE}
            onNavigate={navigate}
            resume={resume}
          />
        ) : page === "review" ? (
          <ReviewDueList
            items={dueRecallItems()}
            onOpen={(item) => {
              if (isLibraryWordId(item.id) || studyWordById(item.id)) {
                navigate("words", item.id);
              }
            }}
          />
        ) : page === "scenes" ? (
          <TextLearningView
            key={`scenes:${startId ?? ""}`}
            kind="scene"
            startId={startId}
            onBack={home}
            onOpenRelated={openRelated}
            onOpenDocument={(id) => navigate("scenes", id)}
            {...(startId
              ? { recall: textRecallProps(startId, setError) }
              : {})}
          />
        ) : page === "reading" ? (
          <TextLearningView
            key={`reading:${startId ?? ""}`}
            kind="reading"
            startId={startId}
            onBack={home}
            onOpenRelated={openRelated}
            onOpenDocument={(id) => navigate("reading", id)}
            {...(startId
              ? { recall: textRecallProps(startId, setError) }
              : {})}
          />
        ) : showGroupPicker ? (
          <WordGroupPicker
            groups={wordGroups.map((group) => {
              const saved = wordState.sessions[group.id];
              return {
                id: group.id,
                title: group.title,
                total: group.words.length,
                currentIndex:
                  saved.updatedAt || saved.index > 0 || saved.meaningVisible
                    ? saved.index
                    : undefined,
              };
            })}
            library={{
              total: libraryWordEntries.length,
              onOpen: () => navigate("words", "library"),
            }}
            onSelect={(id) => {
              if (isWordGroupId(id)) navigate("words", id);
            }}
            onBack={home}
          />
        ) : showWordLibrary ? (
          <WordLibraryView
            words={libraryWordEntries.map((word) => {
              const saved = libraryState.sessions[word.id];
              const started = Boolean(
                saved &&
                (saved.updatedAt || saved.index > 0 || saved.meaningVisible),
              );
              return {
                ...word,
                currentIndex: started ? saved.index : undefined,
              };
            })}
            onSelect={(id) => {
              if (isLibraryWordId(id)) navigate("words", id);
            }}
            onBack={() => navigate("words")}
          />
        ) : studyingQueuedCard && queuedCard ? (
          <WordStudyView
            card={queuedCard}
            current={1}
            total={1}
            meaningVisible={queuedCardView.meaningVisible}
            exampleVisible={queuedCardView.exampleVisible}
            notesVisible={queuedCardView.notesVisible}
            onMeaning={() =>
              setQueuedCardView((current) => ({ ...current, meaningVisible: true }))
            }
            onExample={() =>
              setQueuedCardView((current) => ({
                ...current,
                exampleVisible: current.meaningVisible,
              }))
            }
            onNotes={() =>
              setQueuedCardView((current) => ({ ...current, notesVisible: true }))
            }
            onNext={() => undefined}
            onBack={() => navigate("review")}
            onReview={() => undefined}
            recall={recallProps(queuedCard.id, () => undefined, setError)}
            {...(topicLinksForCard(queuedCard.id).length
              ? {
                  relatedTopicLinks: topicLinksForCard(queuedCard.id),
                  onOpenRelated: openRelated,
                }
              : {})}
          />
        ) : invalidLibraryCard ? (
          <section className="doli-empty">
            <h1>没有这张词卡</h1>
            <p className="doli-muted">返回词条列表看看其他词。</p>
            <button
              className="doli-secondary"
              onClick={() => navigate("words", "library")}
            >
              返回词条
            </button>
          </section>
        ) : studyingLibrary && groupError ? null : studyingLibrary &&
          librarySession &&
          libraryCompleted ? (
          <WordCompletionView
            total={librarySession.ids.length}
            eyebrow="这张已浏览完"
            title="这个词，先到这里。"
            homeLabel="返回词条"
            restartLabel="再看这个词"
            onRestart={() => {
              commitLibrary({
                ...librarySession,
                index: 0,
                meaningVisible: false,
                exampleVisible: false,
                notesVisible: false,
              });
            }}
            onHome={() => navigate("words", "library")}
            {...(libraryTopicLinks.length
              ? {
                  relatedTopicLinks: libraryTopicLinks,
                  onOpenRelated: openRelated,
                }
              : {})}
          />
        ) : studyingLibrary && librarySession && libraryCard ? (
          <WordStudyView
            card={libraryCard}
            current={librarySession.index + 1}
            total={librarySession.ids.length}
            meaningVisible={librarySession.meaningVisible}
            exampleVisible={librarySession.exampleVisible}
            notesVisible={librarySession.notesVisible}
            onMeaning={() =>
              commitLibrary({ ...librarySession, meaningVisible: true })
            }
            onExample={() =>
              commitLibrary({
                ...librarySession,
                exampleVisible: librarySession.meaningVisible,
              })
            }
            onNotes={() =>
              commitLibrary({ ...librarySession, notesVisible: true })
            }
            onNext={() => {
              commitLibrary(advanceLibraryWord(librarySession));
            }}
            onBack={() => navigate("words", "library")}
            onReview={() => {
              const marked = queueWordForReview(librarySession);
              commitLibrary(
                advanceLibraryWord({
                  ...librarySession,
                  reviewIds: marked.reviewIds,
                }),
              );
            }}
            recall={recallProps(
              libraryCard.id,
              () => {
                commitLibrary(advanceLibraryWord(librarySession));
              },
              setError,
            )}
            {...(libraryTopicLinks.length
              ? {
                  relatedTopicLinks: libraryTopicLinks,
                  onOpenRelated: openRelated,
                }
              : {})}
          />
        ) : groupError ? null : completed ? (
          <WordCompletionView
            total={session.ids.length}
            onRestart={() => {
              commit({
                ...session,
                index: 0,
                meaningVisible: false,
                exampleVisible: false,
                transferExampleVisible: false,
              });
            }}
            onHome={home}
            nextGroup={asNextGroupLink(
              nextWordGroup(groupId, wordState.sessions),
            )}
            onNextGroup={() => {
              const next = nextWordGroup(groupId, wordState.sessions);
              if (next) navigate("words", next.id);
            }}
            onChooseGroup={() => navigate("words")}
            {...(groupCompletionTopicLinks.length
              ? {
                  relatedTopicLinks: groupCompletionTopicLinks,
                  onOpenRelated: openRelated,
                }
              : {})}
          />
        ) : (
          <WordStudyView
            card={card}
            current={session.index + 1}
            total={session.ids.length}
            meaningVisible={session.meaningVisible}
            exampleVisible={session.exampleVisible}
            onMeaning={() => commit({ ...session, meaningVisible: true })}
            onExample={() =>
              commit({ ...session, exampleVisible: session.meaningVisible })
            }
            onNext={() => {
              commit(advanceWord(session));
            }}
            onBack={home}
            onReview={() => {
              commit(advanceWord(queueWordForReview(session)));
            }}
            recall={recallProps(
              card.id,
              () => {
                commit(advanceWord(session));
              },
              setError,
            )}
            {...(groupStudyTopicLinks.length
              ? {
                  relatedTopicLinks: groupStudyTopicLinks,
                  onOpenRelated: openRelated,
                }
              : {})}
          />
        )}
      </LearningShell>
    </div>
  );
}
