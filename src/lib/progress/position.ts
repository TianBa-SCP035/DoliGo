import type { ProgressKind, ProgressWriteSource, ReadingPosition, RefactorProgressStore } from "./types";

export function mapForKind(
  store: RefactorProgressStore,
  kind: ProgressKind,
): Record<string, ReadingPosition> {
  return kind === "scene" ? store.scenes : store.readings;
}

export function getPosition(
  store: RefactorProgressStore,
  kind: ProgressKind,
  id: string,
): ReadingPosition | undefined {
  return mapForKind(store, kind)[id];
}

export function rememberPosition(
  store: RefactorProgressStore,
  position: ReadingPosition,
  now = Date.now(),
): RefactorProgressStore {
  const nextPos: ReadingPosition = { ...position, updatedAt: now };
  if (position.kind === "scene") {
    return {
      ...store,
      updatedAt: now,
      lastSceneId: position.id,
      scenes: { ...store.scenes, [position.id]: nextPos },
    };
  }
  return {
    ...store,
    updatedAt: now,
    lastReadingId: position.id,
    readings: { ...store.readings, [position.id]: nextPos },
  };
}

/**
 * Choose a unit to remember during ordinary downward reading (no word click).
 * `unitIdsInOrder` is document order; `visibleIds` are units currently in view.
 * Uses the furthest visible unit so scrolling down advances the saved position.
 */
export function pickProgressUnitFromVisible(
  unitIdsInOrder: string[],
  visibleIds: Iterable<string>,
): string | undefined {
  const visible = new Set(visibleIds);
  let found: string | undefined;
  for (const id of unitIdsInOrder) {
    if (visible.has(id)) found = id;
  }
  return found;
}

export function makePosition(
  kind: ProgressKind,
  id: string,
  unitId: string,
  source: ProgressWriteSource,
  now = Date.now(),
): ReadingPosition {
  return { kind, id, unitId, source, updatedAt: now };
}
