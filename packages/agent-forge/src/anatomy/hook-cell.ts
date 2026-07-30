// `HookCell` — a scope-activated source cell (MODEL `Kind ∋ rule`,
// `activation: rule ↦ scope`). It binds the SESSION or the SUBSTRATE, not an agent:
// nothing composes it, so its scope cannot be derived from composition the way an
// `Enforcing` guardrail's is.
//
// THE HEADER HERE ONCE CITED "MODEL `Kind ∋ hook`, `activation: hook↦event`". MODEL
// says `Kind ≜ {fragment, agent, rule, skill}` and `ActivationMode ≜ {compose-only,
// identity, scope, trigger}` — the citation was false on both counts, and it was
// load-bearing for this whole type. `hook` is what a HARNESS calls its mechanism;
// it is not a Kind of thing the canon authors.
//
// The cell carries THREE separable things:
//   1. `residue` — the σ*-signified canonical identity (`body = ⟨α, residue⟩`), the
//      REFLEXIVE/`accept()` target. R=LLM; BLIND-decodes to the cell's intent.
//   2. the harness-agnostic EVENT binding (`events` + `timeout`) — WHEN it fires, in
//      vendor-neutral terms.
//   3. `workers[].content` — the VERBATIM worker payload (the byte-anchor): WHAT it
//      does. The committed file at each `worker.targetPath` is a DEPLOY-OWNED target
//      regenerated from this content and byte-locked by the consuming corpus.
//
// WHAT IT MUST NEVER CARRY IS THE INVOCATION. `command` lived here and every cell
// spelled out `sh "$HOME/.claude/hooks/<id>/<file>"` — a claude path in the generic
// design. The whole codex projection was consequently dropped rather than
// translated, so codex agents ran with no governance at all. The cell now names its
// `entry` worker and the ADAPTER derives the invocation
// (`HarnessAdapter.hookCommand`), per MODEL's `mechanism : fragment ×
// harness-adapter ⇀ harness-mechanism`.
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

import type {
  CanonicalEvent,
  Hook,
  Substrate,
  SubstrateEvent,
} from '../core/hook/index.js';

/**
 * A hook's event in HARNESS-AGNOSTIC terms. `harness`-substrate hooks bind a
 * `CanonicalEvent` (the vendor-neutral event pivot); a git-substrate event has no
 * canonical peer yet (`vcs.commit.post` — flagged for canon review), so the union
 * widens by exactly that descriptor.
 */
export type HookEvent = SubstrateEvent;

/** Which substrate a hook's event fires in — the `realize`-target family. */
export type HookSubstrate = Substrate;

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
  /**
   * WHICH worker is the entry point — a `workers[].filename`, never a path and
   * never a command. The adapter turns ⟨id, entry⟩ into the invocation its harness
   * needs; a cell that spelled that out would have chosen a face.
   */
  readonly entry: string;
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
export function hookIrOf(
  cell: HookCell,
  hookCommand: (id: string, entry: string) => string,
): Hook {
  if (cell.substrate !== 'harness') {
    throw new Error(
      `hookIrOf: '${cell.id}' is substrate=${cell.substrate}; only harness hooks serialize to settings.json`,
    );
  }
  if (!cell.workers.some((w) => w.filename === cell.entry)) {
    throw new Error(
      `hookIrOf: '${cell.id}' names entry '${cell.entry}', which is not one of its workers (${cell.workers.map((w) => w.filename).join(', ') || 'none'}). An entry naming nothing deploys a hook that invokes a missing file.`,
    );
  }
  const events = cell.events as readonly CanonicalEvent[];
  return {
    id: cell.id,
    events: [...events] as [CanonicalEvent, ...CanonicalEvent[]],
    command: hookCommand(cell.id, cell.entry),
    ...(cell.matcher !== undefined ? { matcher: cell.matcher } : {}),
    ...(cell.timeout !== undefined ? { timeout: cell.timeout } : {}),
  };
}
