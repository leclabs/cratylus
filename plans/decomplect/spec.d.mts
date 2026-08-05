// Types for `spec.mjs` — the plan's sequencing data. Hand-written because the data file is
// plain ESM the gate imports directly; there is no build step over `plans/`.
export type ShardSpec = {
  readonly slice: string;
  readonly deps: readonly string[];
  readonly outputs: readonly string[];
  readonly refs: readonly string[];
  readonly static: readonly string[];
  readonly blockedBy?: string;
};
export declare const SHARDS: Readonly<Record<string, ShardSpec>>;
