import { isValidUlid } from './ulid.js';

/**
 * An EPISODIC record as written at capture time — minimal and **open**
 * (plans/scoped-memory-v2 SPEC D2). Encode derives `{session?, host, cwd}` from
 * the process environment — the caller supplies only `body` (and optional
 * `tags`). No `kind`/taxonomy is forced here; the Dreamer routes later by
 * reasoning over `body`. Scope is NOT stored: it is `node(cwd, host)`, computed
 * at fold time by the resolver (src/node.ts) — never reasoned, never captured.
 *
 * v1 legacy fields (`scope`, `path`, `routes`) remain parseable as **inert
 * data** — they never route. A record without `cwd` folds to the explicit
 * `legacy` bucket (SPEC D3).
 */
export interface EpisodicRecord {
  /** ULID — lexicographically time-sortable; orders events in the log. */
  id: string;
  /** Harness session id, when the environment carries one. Derived. */
  session?: string;
  /** Short hostname at capture. Derived. Absent only on v1 records. */
  host?: string;
  /** Absolute working directory at capture. Derived. Absent only on v1 records. */
  cwd?: string;
  /** The open event payload — any JSON value. */
  body: JsonValue;
  /** Free refinement labels. Refine, never route (SPEC D2/D4). */
  tags?: string[];
  /** v1 legacy routing tag — INERT data; the fold never consults it. */
  scope?: string;
  /** v1 legacy store-file selector — INERT data. */
  path?: string;
  /**
   * The homes this record landed in after a dream pass processed it. **Never
   * written at capture** — only the dream pass stamps this, and only on records
   * it *retains*. `"drop"` marks a record kept despite landing nowhere durable.
   */
  routes?: string[];
}

/** Any JSON-serializable value. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function assertOptionalNonEmptyString(
  value: unknown,
  field: string,
): asserts value is string | undefined {
  if (value !== undefined && (typeof value !== 'string' || value.length === 0))
    throw new Error(`Record ${field}, if present, must be a non-empty string`);
}

function assertOptionalStringArray(
  value: unknown,
  field: string,
): asserts value is string[] | undefined {
  if (
    value !== undefined &&
    (!Array.isArray(value) ||
      !value.every((x): x is string => typeof x === 'string'))
  ) {
    throw new Error(`Record ${field}, if present, must be an array of strings`);
  }
}

/** Validate that an arbitrary object is a well-formed {@link EpisodicRecord}. Throws with a precise reason. */
export function assertRecord(rec: unknown): asserts rec is EpisodicRecord {
  if (typeof rec !== 'object' || rec === null)
    throw new Error('Record must be an object');
  const r = rec as Record<string, unknown>;
  if (typeof r.id !== 'string' || !isValidUlid(r.id))
    throw new Error(`Record id must be a valid ULID: ${String(r.id)}`);
  if (!('body' in r)) throw new Error('Record must have a body');
  assertOptionalNonEmptyString(r.session, 'session');
  assertOptionalNonEmptyString(r.host, 'host');
  assertOptionalNonEmptyString(r.cwd, 'cwd');
  // v1 fields validate by TYPE only — the tag grammar retired with v2; a v1
  // scope of any string shape is readable, inert data.
  assertOptionalNonEmptyString(r.scope, 'scope');
  assertOptionalNonEmptyString(r.path, 'path');
  assertOptionalStringArray(r.tags, 'tags');
  assertOptionalStringArray(r.routes, 'routes');
}

/**
 * Serialize a record to one JSONL line (no trailing newline). Fixed key order
 * (id, session?, host?, cwd?, scope?, path?, body, tags?, routes?) so identical
 * records serialize byte-identically — the fold manifest's determinism rests on
 * this kind of stability.
 */
export function serializeRecord(rec: EpisodicRecord): string {
  assertRecord(rec);
  const ordered: Record<string, JsonValue> = { id: rec.id };
  if (rec.session !== undefined) ordered.session = rec.session;
  if (rec.host !== undefined) ordered.host = rec.host;
  if (rec.cwd !== undefined) ordered.cwd = rec.cwd;
  if (rec.scope !== undefined) ordered.scope = rec.scope;
  if (rec.path !== undefined) ordered.path = rec.path;
  ordered.body = rec.body;
  if (rec.tags !== undefined) ordered.tags = rec.tags;
  if (rec.routes !== undefined) ordered.routes = rec.routes;
  return JSON.stringify(ordered);
}

/** Parse one JSONL line back into a validated record. */
export function parseRecord(line: string): EpisodicRecord {
  const parsed = JSON.parse(line) as unknown;
  assertRecord(parsed);
  return parsed;
}
