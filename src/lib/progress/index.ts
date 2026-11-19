export { REFACTOR_STORAGE_KEY, type ProgressKind, type ProgressWriteSource, type ReadingPosition, type RefactorProgressStore, type LoadStoreResult, type RestoreGate, type StorageLike } from "./types";
export { emptyProgressStore, mergePreservingUnknown, normalizeStore, loadProgressStore, saveProgressStore } from "./store";
export { getPosition, rememberPosition, pickProgressUnitFromVisible, makePosition, mapForKind } from "./position";
export { createRestoreGate, shouldAcceptProgressWrite } from "./restoreGate";
export { useReadingProgress, type UseReadingProgressOptions, type UseReadingProgressResult } from "./useReadingProgress";
