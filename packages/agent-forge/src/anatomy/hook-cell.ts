// `HookCell` — the generic `hook` source-cell shape (MODEL `Kind ∋ hook`,
// `activation: hook↦event`). A hook is HARNESS-AGNOSTIC SOURCE: the harness is
// orthogonal until `deploy(c,adapter) = inject(content(c), realize(event,adapter))`.
//
// The cell carries THREE separable things:
//   1. `residue` — the σ*-signified canonical identity (`body = ⟨α, residue⟩`), the
//      REFLEXIVE/`accept()` target. R=LLM; BLIND-decodes to the hook's intent.
//   2. the harness-agnostic EVENT binding (`events` + `command` + `timeout`) — what
//      fires it, in vendor-neutral terms.
//   3. `workers[].content` — the VERBATIM worker payload (the byte-anchor). The
//      committed worker file at each `worker.targetPath` is a DEPLOY-OWNED target
//      regenerated from this content and byte-locked by the consuming corpus.
//
// SUBSTRATE. `harness` hooks realize through a harness adapter (e.g. claude
// `settings.json` `{hooks}` merge + `hooks/<id>/` workers) — these lift into the
// `Hook` config-IR via `hookIrOf`. A `git`-substrate hook fires in git's process (a
// different substrate): its event has no `CanonicalEvent` peer, so it is carried as
// a plain descriptor and is NOT routed into `settings.json`.
//
// This is the doctrine-free TYPE KERNEL: the shared cell shapes + the generic
// config-IR lift. The concrete cell instances (the harness-substrate cells, their
// verbatim workers) live in the consuming corpus, not here.

import type { CanonicalEvent, Hook } from '../core/hook/index.js';

/**
 * A hook's event in HARNESS-AGNOSTIC terms. `harness`-substrate hooks bind a
 * `CanonicalEvent` (the vendor-neutral event pivot); a git-substrate event has no
 * canonical peer yet (`vcs.commit.post` — flagged for canon review), so the union
 * widens by exactly that descriptor.
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
  /**
   * Explicit run order within an event. A dir-scan would otherwise impose
   * ALPHABETICAL order, silently reordering hooks whose sequence is semantic — a
   * blocking gate must evaluate before a non-blocking nudge. Lower runs first;
   * unset sorts last, then by id.
   */
  readonly order?: number;
  readonly events: readonly [HookEvent, ...HookEvent[]];
  /**
   * Optional per-hook tool matcher (client-native regex, e.g.
   * `AskUserQuestion|Agent|SendMessage`). Meaningful for tool-scoped events
   * (`tool.use.pre`); a Stop/SubagentStop hook leaves it unset.
   */
  readonly matcher?: string;
  /** The fire command (references the deployed worker path). */
  readonly command: string;
  /** Timeout in seconds; adapter default when omitted. */
  readonly timeout?: number;
  /** The verbatim worker payloads (byte-anchors). */
  readonly workers: readonly HookWorker[];
  /** Anchors this cell references (for the CANONICAL orphan-ref witness). */
  readonly refs?: readonly string[];
}

/**
 * One source-of-truth entry per harness hook: the `Hook` config-IR + its verbatim
 * workers. A projector serializes `hook` into settings.json and writes each worker's
 * `content` under `hooks/<hook.id>/` (byte-anchor — no on-disk copy).
 */
export interface HookSource {
  readonly hook: Hook;
  readonly workers: readonly HookWorker[];
}

/**
 * Lift a harness-substrate hook cell into the `Hook` config-IR. A harness hook's
 * events are all `CanonicalEvent` (the vendor-neutral pivot); a `git`-substrate
 * event (`vcs.commit.post`) has no canonical peer, so it is rejected here — a git
 * hook must not reach settings.json. Doctrine-free: references no specific cell.
 */
export function hookIrOf(cell: HookCell): Hook {
  if (cell.substrate !== 'harness') {
    throw new Error(
      `hookIrOf: '${cell.id}' is substrate=${cell.substrate}; only harness hooks serialize to settings.json`,
    );
  }
  const events = cell.events as readonly CanonicalEvent[];
  return {
    id: cell.id,
    events: [...events] as [CanonicalEvent, ...CanonicalEvent[]],
    command: cell.command,
    ...(cell.matcher !== undefined ? { matcher: cell.matcher } : {}),
    ...(cell.timeout !== undefined ? { timeout: cell.timeout } : {}),
  };
}
