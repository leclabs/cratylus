import type { Scope } from './resolve.js';
import { parseScope } from './resolve.js';
import { isValidUlid } from './ulid.js';

/**
 * An EPISODIC record as written at capture time — minimal and **open**
 * (ideas/memory.md, EPISODIC schema). No `kind`/taxonomy is forced here; the
 * Dreamer applies routing later by reasoning over `body`. `body` is deliberately
 * `unknown`-shaped (any JSON value): encode cheap and truthful, structure later.
 *
 * Notably absent by design: no absolute `home`, no `fid` hash. Location is
 * derived from `(scope, path)` per host via resolveFile — storing either would
 * break portability.
 */
export interface EpisodicRecord {
  /** ULID — lexicographically time-sortable; orders events within a (scope, path) group. */
  id: string;
  /** Where this is true. Single-valued. */
  scope: Scope;
  /** Scope-relative path to the logical store file. Optional: omit for the scope's default store. */
  path?: string;
  /** The open event payload — any JSON value. */
  body: JsonValue;
}

/** Any JSON-serializable value. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** Validate that an arbitrary object is a well-formed {@link EpisodicRecord}. Throws with a precise reason. */
export function assertRecord(rec: unknown): asserts rec is EpisodicRecord {
  if (typeof rec !== 'object' || rec === null)
    throw new Error('Record must be an object');
  const r = rec as Record<string, unknown>;
  if (typeof r.id !== 'string' || !isValidUlid(r.id))
    throw new Error(`Record id must be a valid ULID: ${String(r.id)}`);
  if (typeof r.scope !== 'string')
    throw new Error('Record scope must be a string');
  parseScope(r.scope); // throws on malformed scope
  if (
    r.path !== undefined &&
    (typeof r.path !== 'string' || r.path.length === 0)
  ) {
    throw new Error('Record path, if present, must be a non-empty string');
  }
  if (!('body' in r)) throw new Error('Record must have a body');
}

/** Serialize a record to one JSONL line (no trailing newline). Keys ordered id, scope, path?, body. */
export function serializeRecord(rec: EpisodicRecord): string {
  assertRecord(rec);
  const ordered: Record<string, JsonValue> = { id: rec.id, scope: rec.scope };
  if (rec.path !== undefined) ordered.path = rec.path;
  ordered.body = rec.body;
  return JSON.stringify(ordered);
}

/** Parse one JSONL line back into a validated record. */
export function parseRecord(line: string): EpisodicRecord {
  const parsed = JSON.parse(line) as unknown;
  assertRecord(parsed);
  return parsed;
}
