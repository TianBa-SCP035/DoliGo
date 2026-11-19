/** Refactor sandbox progress types. Not a claim of compatibility with any previous product store. */

export const REFACTOR_STORAGE_KEY = "doliguo.refactor.sandbox.v1";

export type ProgressKind = "scene" | "reading";

/** How a position write was produced. Scroll/visibility must be ignored while restoring. */
export type ProgressWriteSource = "visibility" | "scroll" | "manual" | "word-open";

export type ReadingPosition = {
  kind: ProgressKind;
  id: string;
  /** Line or paragraph (or other unit) id in reading order. */
  unitId: string;
  updatedAt: number;
  source?: ProgressWriteSource;
};

export type RefactorProgressStore = {
  schemaVersion: 1;
  kind: "doliguo-refactor-sandbox";
  updatedAt: number;
  scenes: Record<string, ReadingPosition>;
  readings: Record<string, ReadingPosition>;
  lastSceneId?: string;
  lastReadingId?: string;
};

export type LoadStoreResult = {
  store: RefactorProgressStore;
  warning?: string;
  /** True when nothing was stored under the refactor sandbox key. */
  empty: boolean;
  /**
   * True when the sandbox key exists but cannot be parsed as a store record.
   * Later writers must not replace that payload.
   */
  unreadable?: boolean;
};

export type RestoreGate = {
  /** True from construction (if a saved position exists) until completeRestore(). */
  isRestoring: boolean;
};

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
