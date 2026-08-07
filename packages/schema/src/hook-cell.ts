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
//   3. `workers[].content` — the worker payload TEMPLATE (the byte-anchor): WHAT it
//      does. The committed file at each `worker.targetPath` is a DEPLOY-OWNED target
//      regenerated from `resolveWorker(worker, facts, speech).content` and
//      byte-locked by the consuming corpus. The anchor is NOT weakened by the
//      template: its subject is the RESOLVED bytes, which are still a pure function
//      of the cell plus a closed, projector-owned fact set.
//   4. `speech` — the strings the hook SPEAKS to an agent, hoisted out of the shell
//      into a declared field so a reader-density gate can enumerate them. `>&2`
//      operator diagnostics and jq plumbing are NOT speech.
//
// WHY THE TEMPLATE EXISTS (property 1, ARCHITECTURE.md). A worker sometimes needs a
// value only PROJECTION knows — the runtime bin's name. A cell that imported it
// named an implementation, which is exactly the edge `meaning and mechanism never
// reference each other` forbids; the shell string hid the edge from the compiler but
// not from the import graph. The cell now names WHICH FACT it needs
// (`{{fact:runtime-bin}}`) and the projector substitutes. `ProjectionFact` is the
// closed set of fact NAMES — this module never holds a fact's VALUE, because a value
// here would restore the `schema → runtime` edge that was deliberately repaired.
//
// NOR THE SELECTOR. `matcher` lived here too, documented with
// `AskUserQuestion|Agent|SendMessage` as its example — a doc comment shipping the
// defect it invited, on a shape whose whole claim is harness-neutrality. It is gone,
// and NOTHING replaced it on the cell: a cell that wants to fire only when the agent
// is about to consult the operator names that ACT (`operator.consult.pre`) among its
// `events`, and the adapter computes the native ⟨event, selector⟩ pair
// (`NativeBinding`). No tool VOCABULARY was minted to make that possible and none
// could be: tool sets are open-world, so a closed enum over them is permanently
// incomplete. The vocabulary was already the corpus's event vocabulary.
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
// different substrate), so it is NOT routed into `settings.json`.
//
// WHY `HookCell` IS GENERIC. Its `events` are `EventName`s, and this package states
// only that an event HAS a name (`MODEL.md:22`: `shape ⊥ vocabulary`). The type
// parameter is where the CORPUS puts its own vocabulary back in: canon declares
// `CANONICAL_EVENTS` and aliases `HookCell = HookCellOf<CanonicalEvent>`, so a cell
// naming an undeclared event is a compile error at the only site that can know.
// The exact `Skill<C extends CapabilityName>` treatment, one axis over.
//
// This is the doctrine-free TYPE KERNEL: the shared cell shapes + the generic
// config-IR lift. The concrete cell instances (the harness-substrate cells, their
// verbatim workers) live in the consuming corpus, not here.

import type { EventName, Hook, Substrate } from './hook/index.js';

/** Which substrate a hook's event fires in — the `realize`-target family. */
export type HookSubstrate = Substrate;

/**
 * A value only PROJECTION knows, named by a worker template as `{{fact:<name>}}`.
 *
 * A CLOSED SET OF NAMES, never of values. The projector owns every value (see
 * `projectionFacts()` in the projector); this union states only WHICH facts a cell
 * may ask for, so a typo is a compile error and an unknown name is a resolve-time
 * throw.
 *
 * "ADDING A MEMBER COSTS THE PROJECTOR ONE ENTRY AND NOTHING ELSE" is what this
 * doc said, and it was true of `runtime-bin` only because that value already had
 * a home to bind. Three of the four members below had none, and minting one is a
 * SIGNIFICATION act, not a table edit: `deploy-bin` needed the forge CLI's name
 * to acquire an authored home at all (it had exactly one spelling, in a manifest
 * key no module could import), and `deploy-check-drift-code` needed an exit
 * contract to exist before a code could be named. The estimate stands for the
 * PROJECTOR'S side of the seam and nowhere else.
 *
 * TWO OF THEM ARE ADAPTER-RELATIVE, which is the property that makes this seam
 * more than a constant table: `projectionFacts` is a function OF the harness
 * adapter, so the SAME cell resolves to different bytes per harness. A worker
 * that must look at a deployed tree cannot otherwise know which harness's tree
 * is its own — it ran in a session, it was never told whose.
 */
export type ProjectionFact =
  /** The runtime executable's name on PATH (`CLI_BIN`). */
  | 'runtime-bin'
  /** The build-time CLI's name on PATH, derived from forge's `bin` key. */
  | 'deploy-bin'
  /** WHICH harness this projection is for — the adapter's canonical name. */
  | 'harness-name'
  /** This harness's hook-config artifact (`settings.json` / `hooks.json`). */
  | 'harness-hooks-file'
  /** The exit status `deploy --check` returns when it FOUND drift. */
  | 'deploy-check-drift-code';

/** The projector's fact table — every `ProjectionFact` bound to its value. */
export type ProjectionFacts = Readonly<Record<ProjectionFact, string>>;

/**
 * One string a hook SPEAKS to an agent — bytes that land in a reader's context,
 * addressed from the worker template as `{{speech:<id>}}`.
 *
 * It has a declared home because it is the only cell content scored at R=LLM that
 * had none: it lived as `printf` bodies inside shell workers, reachable only by
 * parsing shell, which is a proxy for the property rather than the property.
 * OPERATOR diagnostics (`>&2`) are not speech; neither is shell plumbing.
 */
export interface HookMessage {
  /** Stable id — the `{{speech:<id>}}` address. */
  readonly id: string;
  /** The bytes the agent reads. Scored at R=LLM like any other reader surface. */
  readonly text: string;
}

/** One worker payload a hook ships — the template behind a deploy target's bytes. */
export interface HookWorker {
  /** Basename under `hooks/<id>/` in the render/deploy tree. */
  readonly filename: string;
  /** Repo-relative committed target regenerated from RESOLVED `content` (byte-locked). */
  readonly targetPath: string;
  /**
   * The worker TEMPLATE — verbatim bytes except for a closed placeholder set:
   * `{{fact:<ProjectionFact>}}` and `{{speech:<id>}}`. Everything else, `{`
   * and `}` included, is carried through untouched. `resolveWorker` turns this
   * into the bytes that deploy; nothing consumes it raw.
   */
  readonly content: string;
  /** Whether the regenerated target carries the executable bit. */
  readonly executable: boolean;
}

/**
 * A `hook` source cell (source grain), carrying its verbatim worker payloads.
 *
 * `E` is the CORPUS'S event vocabulary. Left at its default this cell accepts any
 * `EventName`, which is all this package can say; a corpus aliases it against its
 * own declared tuple and gets the compile error back.
 */
export interface HookCell<E extends EventName = EventName> {
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
  readonly events: readonly [E, ...E[]];
  /**
   * WHICH worker is the entry point — a `workers[].filename`, never a path and
   * never a command. The adapter turns ⟨id, entry⟩ into the invocation its harness
   * needs; a cell that spelled that out would have chosen a face.
   */
  readonly entry: string;
  /** Timeout in seconds; adapter default when omitted. */
  readonly timeout?: number;
  /** The worker payload templates (byte-anchors, once resolved). */
  readonly workers: readonly HookWorker[];
  /**
   * What this hook SPEAKS to an agent, addressed as `{{speech:<id>}}` from a
   * worker template. Absent on a hook that says nothing to a reader.
   */
  readonly speech?: readonly HookMessage[];
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
 * Every `{{…}}` occurrence. The BODY may not itself contain a brace, so a shell
 * `${VAR}` — one brace — never matches, and `${X:-{{fact:y}}}` matches exactly the
 * inner placeholder and leaves the closing shell brace alone.
 */
const PLACEHOLDER = /\{\{([^{}]*)\}\}/g;

/**
 * Resolve one worker TEMPLATE into the bytes that deploy.
 *
 * PURE: a function of the worker, the projector's fact table, and the cell's
 * speech — no clock, no host, no file. That is what keeps the byte-anchor an anchor
 * when its subject moved from the cell's literal to the resolved bytes.
 *
 * IT THROWS ON AN UNKNOWN PLACEHOLDER, and that is the load-bearing half. A silent
 * pass-through would ship a literal `{{fact:runtime-bin}}` into a deployed `.sh`,
 * where it fails on a host at run time rather than here — the exact class of defect
 * (`ARCHITECTURE.md`: "the emitted-artifact sites are exactly where a missed rename
 * fails on a host rather than at build") this whole seam exists to close.
 */
export function resolveWorker(
  worker: HookWorker,
  facts: ProjectionFacts,
  speech: readonly HookMessage[] = [],
): HookWorker {
  const said = new Map(speech.map((m) => [m.id, m.text]));
  const said_ids = [...said.keys()].join(', ') || 'none';
  const content = worker.content.replace(
    PLACEHOLDER,
    (whole: string, body: string): string => {
      const at = body.indexOf(':');
      const kind = at < 0 ? body : body.slice(0, at);
      const id = at < 0 ? '' : body.slice(at + 1);
      const where = `resolveWorker: '${worker.filename}' names ${whole}`;
      if (kind === 'fact') {
        const value = (facts as Readonly<Record<string, string | undefined>>)[
          id
        ];
        if (value === undefined) {
          throw new Error(
            `${where}, which is not a projection fact (known: ${Object.keys(facts).join(', ') || 'none'}).`,
          );
        }
        return value;
      }
      if (kind === 'speech') {
        const text = said.get(id);
        if (text === undefined) {
          throw new Error(
            `${where}, which is not one of the cell's speech ids (${said_ids}).`,
          );
        }
        return text;
      }
      throw new Error(
        `${where}; the grammar is {{fact:<name>}} | {{speech:<id>}} and nothing else.`,
      );
    },
  );
  return { ...worker, content };
}

/**
 * Lift a harness-substrate hook cell into the `Hook` config-IR. A `git`-substrate
 * hook fires in git's process and is rejected here — it must not reach
 * settings.json. Doctrine-free: references no specific cell, and no specific event.
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
  return {
    id: cell.id,
    events: [...cell.events] as [EventName, ...EventName[]],
    command: hookCommand(cell.id, cell.entry),
    ...(cell.timeout !== undefined ? { timeout: cell.timeout } : {}),
  };
}
