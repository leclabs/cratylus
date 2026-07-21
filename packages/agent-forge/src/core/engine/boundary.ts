// boundary-projection ≜ {deploy, project-human} — the SOLE path from a validated
// canonical cell to any artifact (an LLM `Target` or a human-view). This module is
// the ENGINE's realization of the model law
//
//   deploy(c,adapter) = inject(content(c), realize(activation(class c), adapter))
//
// It owns the `realize` half: the activation taxonomy (`activation(class c)`) and
// the pure selector `realize : ActivationMode × harness-adapter → harness-mechanism`.
// The `project-human` half — a harness-AGNOSTIC human-view, so no adapter — lives in
// `@leclabs/agent-forge/anatomy` (`projectHumanDimension`). Both are DETERMINISTIC pure
// functions of `source(c)`: no clock, no host, no hand-edit. A `Target`/human-view
// reachable by any OTHER path than these two is the boundary-projection falsifier.

// ── activation(class c) : the five activation modes ──────────────────────────

/**
 * How a source-cell CLASS activates in a harness — the ENGINE's five modes:
 *  - `compose-only` — inlined into a composing artifact; emits NO standalone file.
 *  - `identity`     — the agent's own identity artifact (its SOUL).
 *  - `scope`        — a directive placed at a directory/path scope.
 *  - `trigger`      — a unit invoked by an explicit trigger token.
 *  - `event`        — a unit fired by a harness event.
 */
export type ActivationMode =
  | 'compose-only'
  | 'identity'
  | 'scope'
  | 'trigger'
  | 'event';

/** Every activation mode, in taxonomy order (a closed set — the `realize` domain). */
export const ACTIVATION_MODES: readonly ActivationMode[] = [
  'compose-only',
  'identity',
  'scope',
  'trigger',
  'event',
];

/** The source cell classes; each activates via exactly one `ActivationMode`. */
export type CellClass = 'fragment' | 'agent' | 'rule' | 'skill' | 'hook';

/**
 * `activation(class c)` — the total class→mode map. A dimension value `fragment`
 * only composes into the SOUL of the agent that selects it (`compose-only`, no
 * standalone artifact); an `agent` is its own `identity`; a `rule` activates by
 * `scope`; a `skill` by `trigger`; a `hook` by `event`. The `Record` over the
 * closed `CellClass` union makes a missing class a COMPILE error.
 */
const CLASS_ACTIVATION: Record<CellClass, ActivationMode> = {
  fragment: 'compose-only',
  agent: 'identity',
  rule: 'scope',
  skill: 'trigger',
  hook: 'event',
};

/** `activation(class c)`: the activation mode a source-cell class projects through. */
export function activationOf(cls: CellClass): ActivationMode {
  return CLASS_ACTIVATION[cls];
}

// ── realize : ActivationMode × harness-adapter → harness-mechanism ────────────

/**
 * How the projected content ENTERS a harness — the injection shape a mechanism uses:
 *  - `compose` — inlined into a composing artifact; NO standalone file of its own.
 *  - `file`    — written as one whole standalone file.
 *  - `dir`     — written as a directory (a lead file plus companions).
 *  - `merge`   — merged into a shared host file, never clobbering sibling keys.
 */
export type Injection = 'compose' | 'file' | 'dir' | 'merge';

/** The concrete harness placement one `ActivationMode` realizes to under one adapter. */
export interface HarnessMechanism {
  /** The activation mode this mechanism realizes. */
  readonly mode: ActivationMode;
  /** How the content enters the harness. */
  readonly injection: Injection;
  /**
   * The artifact locus (harness-root-relative), with `<name>`/`<id>`/`<dir>`
   * placeholders bound at inject time. For `compose` it names the COMPOSING host
   * artifact the content inlines into (there is no artifact of its own).
   */
  readonly artifact: string;
  /** One-line human gloss of the mechanism (documentation, never parsed). */
  readonly note: string;
}

/**
 * A TOTAL realization table: every `ActivationMode` → its `HarnessMechanism`. The
 * `Record<ActivationMode, …>` type makes a missing mode a COMPILE error, so an
 * adapter's mechanism map is exhaustive by construction — `realize` can never hit
 * an unrealized mode.
 */
export type HarnessMechanismMap = Record<ActivationMode, HarnessMechanism>;

/**
 * `realize : ActivationMode × harness-adapter → harness-mechanism`. A pure
 * selection over the adapter's (exhaustive, type-checked) mechanism map: the
 * ENGINE owns the mode taxonomy, the ADAPTER owns its harness specifics. Total
 * over `ActivationMode` because the map is a `Record` over the closed union.
 */
export function realize(
  mode: ActivationMode,
  mechanisms: HarnessMechanismMap,
): HarnessMechanism {
  return mechanisms[mode];
}
