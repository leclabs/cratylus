import type { Adapter } from './types.js';

/**
 * Resolve an adapter by canonical id OR any registered alias/canonicalId —
 * the alias-tolerant counterpart to `adapters.find(a => a.id === id)`.
 * E10.S5: a roster rename (`gemini`→`antigravity`, `windsurf`→`devin`) must
 * not strand a caller still using the legacy id, nor the new one.
 */
export function findAdapter(
  adapters: Adapter[],
  id: string,
): Adapter | undefined {
  return adapters.find(
    (a) =>
      a.id === id ||
      a.status.canonicalId === id ||
      (a.status.aliases ?? []).includes(id),
  );
}
