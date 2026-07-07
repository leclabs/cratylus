// `HookCell` — the first-class `hook` source-cell shape (MODEL `Kind ∋ hook`,
// `activation: hook↦event`). A hook is HARNESS-AGNOSTIC SOURCE: the harness is
// orthogonal until `deploy(c,adapter) = inject(content(c), realize(event,adapter))`.
//
// The cell carries THREE separable things:
//   1. `definiens` — the σ*-signified canonical identity. This is what `accept()`
//      / REFLEXIVE gates (CANONICAL·SIGNIFIED·COLD-BLIND·PARSIMONIOUS·PARTITIONED);
//      it is R=LLM and BLIND-decodes to the hook's intent.
//   2. the harness-agnostic EVENT binding (`events` + `command` + `timeout`) — what
//      fires it, in vendor-neutral terms.
//   3. `workers[].content` — the VERBATIM worker payload (the byte-anchor). The
//      committed worker files at each `worker.targetPath` are DEPLOY-OWNED targets
//      regenerated from this content (`pnpm anatomy:project:targets`) and byte-locked
//      by `test/hook-rule-boundary.test.ts` (REGENERABLE — a hand-edit diverges from
//      re-projection and fails the gate). Mirrors E2's `project-human` README byte-lock.
//
// SUBSTRATE. `harness` hooks realize through the claude adapter (`settings.json`
// `{hooks}` merge + `hooks/<id>/` workers). `git` hooks fire in git's process (a
// different substrate): their event has no `CanonicalEvent` peer, so it is carried
// as a plain descriptor and the cell is NOT routed into `settings.json` — the
// `.husky/*` dispatcher runs the byte-locked worker directly.

import type { CanonicalEvent } from '@leclabs/agent-forge';

/**
 * A hook's event in HARNESS-AGNOSTIC terms. `harness`-substrate hooks bind a
 * `CanonicalEvent` (agent-forge's 28-event vendor-neutral pivot); the one
 * git-substrate event has no canonical peer yet (`vcs.commit.post` — flagged for
 * canon review), so the union widens by exactly that descriptor.
 */
export type HookEvent = CanonicalEvent | 'vcs.commit.post';

/** Which substrate a hook's event fires in — the `realize`-target family. */
export type HookSubstrate = 'harness' | 'git';

/** One worker payload a hook ships — the verbatim byte-anchor of a deploy target. */
export interface HookWorker {
  /** Basename under `hooks/<id>/` in the render/deploy tree. */
  readonly filename: string;
  /** Repo-relative committed target regenerated from `content` (byte-locked). */
  readonly targetPath: string;
  /** Verbatim worker bytes — the source of truth for `targetPath`. */
  readonly content: string;
  /** Whether the regenerated target carries the executable bit. */
  readonly executable: boolean;
}

/** A `hook` source cell (source grain), carrying its verbatim worker payloads. */
export interface HookCell {
  /** Stable id → `hooks/<id>/`; the anchor α(c) (== the filename). */
  readonly id: string;
  /** σ*-signified canonical identity (`body = ⟨α, residue⟩`) — the `accept()` target. */
  readonly residue: string;
  /** Which substrate the event fires in. */
  readonly substrate: HookSubstrate;
  /** The harness-agnostic events that trigger the hook (≥1). */
  readonly events: readonly [HookEvent, ...HookEvent[]];
  /** The fire command (references the deployed worker path). */
  readonly command: string;
  /** Timeout in seconds; adapter default when omitted. */
  readonly timeout?: number;
  /** The verbatim worker payloads (byte-anchors). */
  readonly workers: readonly HookWorker[];
  /** Anchors this cell references (for the CANONICAL orphan-ref witness). */
  readonly refs?: readonly string[];
}
