import { type NodeConfig, resolveNode } from './node.js';
import type { EpisodicRecord } from './record.js';

/**
 * Dream pass 1 (plans/scoped-memory-v2 SPEC D4): the deterministic fold from
 * the live log to the routing manifest, `record ↦ node(cwd)`. The fold is the
 * ONLY scope authority — a record's `scope`/`tags` fields never participate.
 * Total: a record without `cwd` (v1 / migrated) lands in the explicit `legacy`
 * bucket; the fold never throws on any parseable record.
 *
 * Byte-deterministic: the same log against the same filesystem/config state
 * yields a byte-identical manifest (fixed key order, log order preserved).
 */

/** The `node` value marking a cwd-less record's bucket. */
export const LEGACY_NODE = 'legacy';

/** One manifest entry: `id ↦ node | legacy`, plus the marker basis. */
export interface FoldEntry {
  id: string;
  /** Absolute node path, or the literal `legacy` for a cwd-less record. */
  node: string;
  /** Marker basis (see NodeResolution.basis), or `no-cwd` for the legacy bucket. */
  basis: string;
}

/** Fold records (log order) into manifest entries. Total — never throws. */
export function foldRecords(
  records: readonly EpisodicRecord[],
  cfg: NodeConfig,
): FoldEntry[] {
  return records.map((r) => {
    if (r.cwd === undefined)
      return { id: r.id, node: LEGACY_NODE, basis: 'no-cwd' };
    const { node, basis } = resolveNode(r.cwd, r.host, cfg);
    return { id: r.id, node, basis };
  });
}

/** Serialize a manifest to JSONL — one `{id, node, basis}` line per record. */
export function manifestToJsonl(entries: readonly FoldEntry[]): string {
  if (entries.length === 0) return '';
  return `${entries
    .map((e) => JSON.stringify({ id: e.id, node: e.node, basis: e.basis }))
    .join('\n')}\n`;
}
