/** A saved session is a frozen queue, not a request to migrate to the latest catalog. */
export function resolveWordQueueSnapshot(
  saved: unknown,
  current: readonly string[],
  history: readonly (readonly string[])[] = [],
): string[] {
  const valid = (ids: unknown): ids is string[] => Array.isArray(ids) && ids.length > 0
    && ids.every(id => typeof id === 'string' && id.length > 0)
    && new Set(ids).size === ids.length;
  const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id, i) => id === b[i]);
  if (!valid(current) || !valid(saved)) throw new Error('背词记录队列不兼容，未覆盖原记录。');
  if (same(saved, current)) return [...saved];
  // Only explicitly published historical queues are accepted, and only for append-only expansion.
  const published = history.some(ids => same(saved, ids));
  const prefix = saved.length < current.length && saved.every((id, i) => id === current[i]);
  if (!published || !prefix) throw new Error('背词记录队列不兼容，未覆盖原记录。');
  return [...saved];
}
