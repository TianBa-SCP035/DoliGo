import { useCallback, useMemo, useRef, useState } from "react";
import { getPosition, makePosition, rememberPosition } from "./position";
import { createRestoreGate, shouldAcceptProgressWrite } from "./restoreGate";
import { emptyProgressStore, loadProgressStore, saveProgressStore } from "./store";
import {
  REFACTOR_STORAGE_KEY,
  type ProgressKind,
  type ProgressWriteSource,
  type ReadingPosition,
  type RefactorProgressStore,
  type StorageLike,
} from "./types";

export type UseReadingProgressOptions = {
  kind: ProgressKind;
  id: string;
  storage?: StorageLike;
  storageKey?: string;
  now?: () => number;
};

export type UseReadingProgressResult = {
  store: RefactorProgressStore;
  saved: ReadingPosition | undefined;
  isRestoring: boolean;
  /** Persist a unit as the current reading position. No-op while restoring. */
  remember: (unitId: string, source?: ProgressWriteSource) => boolean;
  /**
   * Call once after scrolling the saved unit into view (or immediately if there
   * is nothing to restore). Until then, remember() will not write.
   */
  completeRestore: () => void;
  warning?: string;
};

function defaultStorage(): StorageLike | undefined {
  try {
    if (typeof localStorage === "undefined") return undefined;
    return localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Hook for scene/reading pages. It does not attach scroll listeners; the page
 * should call remember() from visibility or scroll after completeRestore().
 */
export function useReadingProgress(options: UseReadingProgressOptions): UseReadingProgressResult {
  const storage = options.storage ?? defaultStorage();
  const key = options.storageKey ?? REFACTOR_STORAGE_KEY;
  const now = options.now ?? Date.now;
  const loaded = useMemo(
    () => (storage ? loadProgressStore(storage, key) : { store: emptyProgressStore(), empty: true }),
    // storage/key are assumed stable for a page session
    [storage, key],
  );
  const [store, setStore] = useState(loaded.store);
  const saved = getPosition(store, options.kind, options.id);
  const gateRef = useRef(createRestoreGate(Boolean(getPosition(loaded.store, options.kind, options.id))));
  const [isRestoring, setIsRestoring] = useState(gateRef.current.isRestoring);

  const remember = useCallback(
    (unitId: string, source: ProgressWriteSource = "visibility") => {
      if (!shouldAcceptProgressWrite(gateRef.current, source)) return false;
      if (!storage || loaded.unreadable) return false;
      setStore((prev) => {
        const position = makePosition(options.kind, options.id, unitId, source, now());
        const next = rememberPosition(prev, position, now());
        return saveProgressStore(storage, next, key, now());
      });
      return true;
    },
    [key, loaded.unreadable, now, options.id, options.kind, storage],
  );

  const completeRestore = useCallback(() => {
    gateRef.current.completeRestore();
    setIsRestoring(false);
  }, []);

  return { store, saved, isRestoring, remember, completeRestore, warning: loaded.warning };
}
