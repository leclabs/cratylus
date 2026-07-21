// Namespace import so the atomic-publish call (`fs.renameSync`) is a live
// binding a test can intercept to simulate a mid-compact crash (the load-bearing
// correctness property: a crash at rename must lose no unconsumed record).
import * as fs from 'node:fs';
import { dirname, join } from 'node:path';
import type { EpisodicRecord } from './record.js';
import { serializeRecord } from './record.js';
import type { Classifier, RouteDecision, RouteTarget } from './route.js';
import { V2_STORES, isRetained } from './route.js';
import { type EpisodicStore, parseLines } from './store.js';

/**
 * What one dream pass over a single `(scope, path)` EPISODIC store did. Returned
 * for inspection/auditing; the engine itself is the source of truth on disk.
 */
export interface DreamResult {
  /** ids of records consumed (landed elsewhere and removed from the log). */
  consumed: string[];
  /** ids retained in EPISODIC (next-steps, or the store was a no-op). */
  retained: string[];
  /** Absolute home files appended to, in append order (incl. duplicates suppressed). */
  landed: string[];
}

/**
 * Append `content` to a store home, creating parent dirs as needed. Plain
 * append — the prose store files (SEMANTIC.md, PROCEDURAL.md) are not JSONL.
 * A single trailing newline separates entries; the
 * caller's `content` carries its own internal shape.
 */
function appendToHome(file: string, content: string): void {
  fs.mkdirSync(dirname(file), { recursive: true });
  // Open for append; fsync so a crash after landing but before compaction still
  // has the durable content (landing-before-compaction is the safe ordering).
  const fd = fs.openSync(file, 'a');
  try {
    const body = content.endsWith('\n') ? content : `${content}\n`;
    fs.writeSync(fd, body, null, 'utf8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * Resolve a route target's destination file (SPEC D4). v2 addressing only:
 *
 *  - `SEMANTIC` / `PROCEDURAL` → `<home>/{SEMANTIC,PROCEDURAL}.md`.
 *  - `EPISODIC` → null (the record stays in the raw log).
 *
 * A target addressed to a RETIRED v1 dimension name (`SELF`, `MEMORY`, …) — or any
 * unknown store — is rejected loudly: the classifier is untyped at runtime, so
 * the engine is the enforcement site.
 */
export function resolveTarget(
  home: string,
  target: RouteTarget,
): string | null {
  const store = target.store as string;
  if (!V2_STORES.has(store)) {
    throw new Error(
      `Route target store "${store}" is not a store (SEMANTIC | PROCEDURAL | EPISODIC); the v1 dimension names (SELF, MEMORY, ...) and the extracted vault/AGENTS targets are retired — address by store name`,
    );
  }
  switch (target.store) {
    case 'EPISODIC':
      return null;
    case 'SEMANTIC':
      return join(home, 'SEMANTIC.md');
    case 'PROCEDURAL':
      return join(home, 'PROCEDURAL.md');
  }
}

/**
 * Atomically rewrite an EPISODIC store, keeping only records whose id is NOT in
 * `consumedIds`. The load-bearing correctness property (ideas/dream.md §3;
 * ideas/memory.md DREAM): **never truncate-in-place** — write a sibling tmp
 * file, fsync it, then `rename` over the original. `rename(2)` is atomic on a
 * POSIX filesystem, so a crash at any point leaves either the full original or
 * the fully-rewritten file — never a partial log, never a lost unconsumed
 * record.
 *
 * Idempotent: consuming an id already absent is a no-op; running twice yields the
 * same surviving set. Returns the ids actually removed (present ∩ consumed).
 *
 * `opts.stamp` writes `routes` back onto *kept* records (id → routes) in the same
 * atomic rewrite — the schema's "after dream, add routes" write-back, folded into
 * compaction so there is exactly one atomic publish per pass. `opts.rename` is the
 * atomic-publish seam (defaults to `fs.renameSync`); it is THE correctness
 * boundary, exposed so a test can simulate a crash exactly there.
 */
export interface CompactOptions {
  /** id → routes to stamp onto kept records in the same atomic rewrite. */
  stamp?: ReadonlyMap<string, readonly string[]>;
  /** The atomic publish (tmp → file). Defaults to `fs.renameSync`. */
  rename?: (from: string, to: string) => void;
}

export function compact(
  store: EpisodicStore,
  path: string | undefined,
  consumedIds: Iterable<string>,
  opts: CompactOptions = {},
): { removed: string[]; kept: EpisodicRecord[] } {
  const { stamp, rename = fs.renameSync } = opts;
  // Compaction always rewrites the home-anchored RAW LOG, never a scope-resolved
  // target file. The record's scope is a routing tag, not a store selector.
  const file = store.rawFile(path);
  const consumed = new Set(consumedIds);
  if (!fs.existsSync(file)) return { removed: [], kept: [] };

  const all = parseLines(fs.readFileSync(file, 'utf8'));
  const kept: EpisodicRecord[] = [];
  const removed: string[] = [];
  let stamped = false;
  for (const rec of all) {
    if (consumed.has(rec.id)) {
      removed.push(rec.id);
      continue;
    }
    const routes = stamp?.get(rec.id);
    if (routes !== undefined) {
      kept.push({ ...rec, routes: [...routes] });
      stamped = true;
    } else {
      kept.push(rec);
    }
  }

  // Nothing to do — leave the original byte-for-byte untouched.
  if (removed.length === 0 && !stamped) return { removed, kept };

  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  const blob = kept.map((r) => `${serializeRecord(r)}\n`).join('');
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeSync(fd, blob, null, 'utf8');
    fs.fsyncSync(fd); // durable before the rename publishes it
  } finally {
    fs.closeSync(fd);
  }
  try {
    rename(tmp, file); // atomic publish: original or rewrite, never partial
  } catch (err) {
    // Rename failed: the original is still intact (we never touched it). Clean
    // up the orphan tmp so a retry starts clean, then surface the failure.
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* best effort */
    }
    throw err;
  }
  return { removed, kept };
}

/**
 * The audit label for one routed home: the bare store name (all stores are
 * home-anchored — SEMANTIC · PROCEDURAL · EPISODIC).
 */
function routeLabel(target: RouteTarget): string {
  return target.store;
}

/**
 * The dream pass over one `(scope, path)` EPISODIC store: classify each record,
 * land its distilled content in every routed home, then **atomically compact**
 * the log to drop every consumed record. Records routed (also) to EPISODIC are
 * retained; records that land nowhere (`drop`) are consumed without landing.
 *
 * Ordering is land-then-compact: content is durably written to its homes BEFORE
 * the source record is removed, so a crash between the two re-runs the (now
 * idempotent at the compaction step) pass without losing a record — at worst a
 * record is re-landed, never lost.
 *
 * The `classifier` is injected — the engine owns none of the voice/scope
 * reasoning. Returns a {@link DreamResult} describing what moved.
 */
export function applyRoutes(
  store: EpisodicStore,
  path: string | undefined,
  classifier: Classifier,
): DreamResult {
  const records = store.read(path);
  const consumed: string[] = [];
  const retained: string[] = [];
  const landed: string[] = [];
  const landedSet = new Set<string>();
  // routes to stamp back onto retained records (schema write-back).
  const stamp = new Map<string, string[]>();

  for (const record of records) {
    const decision: RouteDecision = classifier(record);

    for (const target of decision.targets) {
      const file = resolveTarget(store.home, target);
      if (file === null) continue; // EPISODIC target — nothing to land
      if (target.content === undefined || target.content.length === 0) {
        throw new Error(
          `Route target for store ${target.store} (${file}) carries no content`,
        );
      }
      appendToHome(file, target.content);
      if (!landedSet.has(file)) {
        landedSet.add(file);
        landed.push(file);
      }
    }

    if (isRetained(decision)) {
      retained.push(record.id);
      // Stamp every home the record took (incl. drop for "dreamt, kept nowhere").
      stamp.set(
        record.id,
        decision.targets.length > 0
          ? decision.targets.map(routeLabel)
          : ['drop'],
      );
    } else {
      consumed.push(record.id);
    }
  }

  // One atomic rewrite: drop consumed records, stamp routes on retained ones.
  compact(store, path, consumed, { stamp });
  return { consumed, retained, landed };
}
