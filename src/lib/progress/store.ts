import {
  REFACTOR_STORAGE_KEY,
  type LoadStoreResult,
  type RefactorProgressStore,
  type StorageLike,
} from "./types";

export function emptyProgressStore(now = Date.now()): RefactorProgressStore {
  return {
    schemaVersion: 1,
    kind: "doliguo-refactor-sandbox",
    updatedAt: now,
    scenes: {},
    readings: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unreadableLoadWarning(detail: string): string {
  return `重构沙盒进度无法读取（${detail}），已使用空记录。未写入其他存储键。`;
}

function unreadableWriteError(detail: string): Error {
  return new Error(`重构沙盒进度无法读取（${detail}），未覆盖原记录。`);
}

function readExistingEnvelope(
  storage: StorageLike,
  key: string,
): { missing: true } | { missing: false; raw: Record<string, unknown> } | { missing: false; unreadable: string } {
  const existing = storage.getItem(key);
  if (!existing) return { missing: true };
  try {
    const parsed: unknown = JSON.parse(existing);
    if (!isRecord(parsed)) return { missing: false, unreadable: "记录格式无效" };
    return { missing: false, raw: parsed };
  } catch (err) {
    return { missing: false, unreadable: (err as Error).message };
  }
}

/**
 * Keep unknown fields from a previous sandbox payload so later writers do not
 * drop data they do not understand. This is tested with fictional fields only;
 * it does not mean the store can read or migrate a prior product format.
 */
export function mergePreservingUnknown(
  raw: Record<string, unknown>,
  known: RefactorProgressStore,
): RefactorProgressStore & Record<string, unknown> {
  const scenesRaw = isRecord(raw.scenes) ? raw.scenes : {};
  const readingsRaw = isRecord(raw.readings) ? raw.readings : {};
  const scenes: Record<string, unknown> = { ...scenesRaw };
  for (const [id, pos] of Object.entries(known.scenes)) {
    const prev = isRecord(scenesRaw[id]) ? scenesRaw[id] : {};
    scenes[id] = { ...prev, ...pos };
  }
  const readings: Record<string, unknown> = { ...readingsRaw };
  for (const [id, pos] of Object.entries(known.readings)) {
    const prev = isRecord(readingsRaw[id]) ? readingsRaw[id] : {};
    readings[id] = { ...prev, ...pos };
  }
  return {
    ...raw,
    ...known,
    scenes: scenes as RefactorProgressStore["scenes"],
    readings: readings as RefactorProgressStore["readings"],
  };
}

export function normalizeStore(raw: unknown, now = Date.now()): RefactorProgressStore {
  const base = emptyProgressStore(now);
  if (!isRecord(raw)) return base;
  const scenes = isRecord(raw.scenes) ? extractPositions(raw.scenes, "scene") : {};
  const readings = isRecord(raw.readings) ? extractPositions(raw.readings, "reading") : {};
  const known: RefactorProgressStore = {
    schemaVersion: 1,
    kind: "doliguo-refactor-sandbox",
    updatedAt: typeof raw.updatedAt === "number" && Number.isFinite(raw.updatedAt) ? raw.updatedAt : now,
    scenes,
    readings,
    lastSceneId: typeof raw.lastSceneId === "string" ? raw.lastSceneId : undefined,
    lastReadingId: typeof raw.lastReadingId === "string" ? raw.lastReadingId : undefined,
  };
  return mergePreservingUnknown(raw, known) as RefactorProgressStore;
}

function extractPositions(
  map: Record<string, unknown>,
  kind: "scene" | "reading",
): RefactorProgressStore["scenes"] {
  const out: RefactorProgressStore["scenes"] = {};
  for (const [id, value] of Object.entries(map)) {
    if (!isRecord(value) || typeof value.unitId !== "string" || value.unitId.length === 0) continue;
    const updatedAt = typeof value.updatedAt === "number" && Number.isFinite(value.updatedAt) ? value.updatedAt : 0;
    out[id] = {
      ...(value as object),
      kind: value.kind === "scene" || value.kind === "reading" ? value.kind : kind,
      id: typeof value.id === "string" ? value.id : id,
      unitId: value.unitId,
      updatedAt,
    };
  }
  return out;
}

export function loadProgressStore(storage: StorageLike, key = REFACTOR_STORAGE_KEY): LoadStoreResult {
  const existing = readExistingEnvelope(storage, key);
  if ("missing" in existing && existing.missing) return { store: emptyProgressStore(), empty: true };
  if ("unreadable" in existing) {
    return {
      store: emptyProgressStore(),
      empty: true,
      unreadable: true,
      warning: unreadableLoadWarning(existing.unreadable),
    };
  }
  return { store: normalizeStore(existing.raw), empty: false };
}

export function saveProgressStore(
  storage: StorageLike,
  store: RefactorProgressStore,
  key = REFACTOR_STORAGE_KEY,
  now = Date.now(),
): RefactorProgressStore {
  const existing = readExistingEnvelope(storage, key);
  if ("unreadable" in existing) throw unreadableWriteError(existing.unreadable);
  const known: RefactorProgressStore = {
    ...store,
    updatedAt: now,
    schemaVersion: 1,
    kind: "doliguo-refactor-sandbox",
  };
  const next = "raw" in existing
    ? mergePreservingUnknown(existing.raw, known)
    : known;
  storage.setItem(key, JSON.stringify(next));
  return next;
}
