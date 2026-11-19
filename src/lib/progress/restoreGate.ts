import type { ProgressWriteSource, RestoreGate } from "./types";

/**
 * Prevents scroll/visibility writes from overwriting a saved position while
 * the page is still initializing or animating scroll restoration.
 */
export function createRestoreGate(hasSavedPosition: boolean): RestoreGate & {
  completeRestore: () => void;
} {
  let isRestoring = hasSavedPosition;
  return {
    get isRestoring() {
      return isRestoring;
    },
    completeRestore() {
      isRestoring = false;
    },
  };
}

/** Scroll and visibility updates are rejected until restore completes. Manual/word-open also wait, so init effects cannot clobber. */
export function shouldAcceptProgressWrite(gate: RestoreGate, _source: ProgressWriteSource): boolean {
  return !gate.isRestoring;
}
