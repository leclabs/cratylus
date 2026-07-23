// ─────────────────────────────────────────────────────────────────────────────
// The agent anatomy as a TypeScript type system.
//
// THIS MODULE IS THE ANATOMY CONTRACT. A dimension value is a per-dimension **nominal-
// branded string** — the MODEL address shape: `body(c) = ⟨α(c), residue(c)⟩`, the
// anchor plus the leftover the anchor does not already fire (residue ∅ for a true
// σ*). VISION: _address, don't describe._ There is NO `{dimension,slug,definiens}`
// value object, NO per-value phantom metadata — the string carries the body; the
// module's directory (`dimensions/<dimension>/`) is its dimension home (PARTITIONED) and its
// export name is its anchor α (SIGNIFIED).
//
// agent-canon authors dimension values / agents / skills as typed modules that import
// these types. Composition is ESM `import`; an agent is a flat, explicit dimension
// vector (`null` = omit-to-inherit — see `Agent`). A wrong dimension→value or a wrong
// arity is a **compile error** — the brand keys each string to its dimension so an
// `Actions` cannot be assigned where an `Objective` is expected.
//
// Exported from `@leclabs/agent-forge/anatomy` — a sibling subpath to the config-IR
// `Agent`/`Skill` in `@leclabs/agent-forge` (those are the translation shapes; THESE
// are the dimension-selection shapes — distinct concepts, distinct homes).
// ─────────────────────────────────────────────────────────────────────────────

import type { RuntimePlugin } from '@leclabs/agent-runtime';

// ── Type-level metadata axes ────────────────────────────────────────────────

/** The MECE filing axis: how the agent comes across vs what it is inclined to do. */
export type Genus = 'Persona' | 'Constitution';

/**
 * A runtime CAPABILITY name — DISCOVERED from S1's `RuntimePlugin` port keys
 * (`memory` · `eventTap`), never coined here (cratylism): the runtime contract is
 * the sole home of the capability set, and a `Skill.runtime` declaration selects
 * one of its ports. This is the ONLY reach across the BUILD→RUNTIME seam and it is
 * type-only — the build DAG stays forge→runtime, acyclic (runtime NEVER →forge). */
export type RuntimeCapability = keyof Omit<RuntimePlugin, 'name'>;

/**
 * How a dimension's value-catalog is sourced:
 * - `enum`   — a member of the model's own native value set (blind introspection).
 * - `open`   — named per-agent; where identity lives.
 * - `coined` — a closed, corpus-authored catalog of canonical directives.
 */
export type Classification = 'enum' | 'open' | 'coined';

/** Whether a dimension field holds one value (`scalar`) or many (`set`). */
export type Arity = 'scalar' | 'set';

/**
 * The 22 FRAGMENT-dimension names — the dimensions whose value is a branded-string cell.
 * `archetype` and `provenance` are NOT here: archetype is a plain-string description on
 * the agent (D13) and provenance is the structured `{mark}` on the agent (D3); both
 * carry data, not a σ* residue, so neither is a value-fragment dimension.
 */
export type Dimension =
  // Persona
  | 'autonomy'
  | 'role'
  | 'formality'
  | 'audience-adaptation'
  | 'transparency'
  // Constitution
  | 'objective'
  | 'guardrails'
  | 'engineering-principles'
  | 'heuristics'
  | 'capabilities'
  | 'learning'
  | 'situation-awareness'
  | 'actions'
  | 'modalities'
  | 'model'
  | 'memory'
  | 'trigger'
  | 'framing'
  | 'reasoning-strategy'
  | 'satisficing'
  | 'output-format'
  | 'self-evaluation';

// ── The provenance mark ─────────────────────────────────────────────────────

/** The emoji·hue mark an agent carries (drives its color). Data, not a σ* value. */
export interface Mark {
  readonly emoji: string;
  /** Hue token (e.g. `green`), resolved to a terminal color by `markToColor`. */
  readonly hue: string;
}

// ── Per-dimension value types (branded strings) ─────────────────────────────────
// A dimension value is a bare named σ* expression: `export const x: Objective = '…'`.
// Each per-dimension type is a nominal-branded `string` — the phantom `__dimension` brand
// keys the string to its dimension so `tsc` rejects a cross-dimension assignment. The
// value's content is the body ⟨α, residue⟩ (rendered `α ≜ residue`, or just `α`
// for a true σ* whose residue is ∅).

/** A branded fragment string, keyed to dimension `O`. */
type Fragment<O extends Dimension> = string & { readonly __dimension?: O };

// Persona
export type Autonomy = Fragment<'autonomy'>;
export type Role = Fragment<'role'>;
export type Formality = Fragment<'formality'>;
export type AudienceAdaptation = Fragment<'audience-adaptation'>;
export type Transparency = Fragment<'transparency'>;

// Constitution — standing drives
export type Objective = Fragment<'objective'>;
export type Guardrails = Fragment<'guardrails'>;
export type EngineeringPrinciples = Fragment<'engineering-principles'>;
export type Heuristics = Fragment<'heuristics'>;
export type Capabilities = Fragment<'capabilities'>;
export type Learning = Fragment<'learning'>;
export type SituationAwareness = Fragment<'situation-awareness'>;

// Constitution — apparatus
export type Actions = Fragment<'actions'>;
export type Modalities = Fragment<'modalities'>;
export type Model = Fragment<'model'>;
export type Memory = Fragment<'memory'>;

// Constitution — per-turn act
export type Trigger = Fragment<'trigger'>;
export type Framing = Fragment<'framing'>;
export type ReasoningStrategy = Fragment<'reasoning-strategy'>;
export type Satisficing = Fragment<'satisficing'>;
export type OutputFormat = Fragment<'output-format'>;
export type SelfEvaluation = Fragment<'self-evaluation'>;

/**
 * The SET dimensions — the only dimensions whose `Agent` field is an array.
 * (autonomy · guardrails · capabilities · actions · heuristics · engineering-principles)
 */
export type SetDimension =
  | 'autonomy'
  | 'guardrails'
  | 'capabilities'
  | 'actions'
  | 'heuristics'
  | 'engineering-principles';

// ── The runtime dimension descriptor (axis / kind / arity) ──────────────────────
// A consumer that needs a dimension's metadata at runtime (e.g. `agent-forge catalog`)
// reads `ANATOMY` — the single home for dimension genus/classification/arity. The keyed
// object type forces every one of the fragment dimensions to be present (a missing
// dimension is a compile error; an extra key has no declared type and is rejected).

/** The runtime-readable metadata for one dimension (axis = genus). */
export interface DimensionMeta {
  /** The MECE filing axis (the `Genus` of the dimension's values). */
  readonly axis: Genus;
  /** How the value-catalog is sourced (the `Classification`). */
  readonly kind: Classification;
  /** Whether the dimension field holds one value or many (the `Arity`). */
  readonly arity: Arity;
}

/**
 * The one runtime home for dimension metadata — `agent-forge catalog` reads it, never a
 * second hand-kept copy. Keyed by dimension so a missing/extra dimension is a compile error.
 */
export const ANATOMY: { readonly [O in Dimension]: DimensionMeta } = {
  // Persona
  autonomy: { axis: 'Persona', kind: 'enum', arity: 'set' },
  role: { axis: 'Persona', kind: 'open', arity: 'scalar' },
  formality: { axis: 'Persona', kind: 'enum', arity: 'scalar' },
  'audience-adaptation': { axis: 'Persona', kind: 'enum', arity: 'scalar' },
  transparency: { axis: 'Persona', kind: 'enum', arity: 'scalar' },
  // Constitution — standing drives
  objective: { axis: 'Constitution', kind: 'open', arity: 'scalar' },
  guardrails: { axis: 'Constitution', kind: 'coined', arity: 'set' },
  'engineering-principles': {
    axis: 'Constitution',
    kind: 'coined',
    arity: 'set',
  },
  heuristics: { axis: 'Constitution', kind: 'coined', arity: 'set' },
  capabilities: { axis: 'Constitution', kind: 'open', arity: 'set' },
  learning: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  'situation-awareness': {
    axis: 'Constitution',
    kind: 'enum',
    arity: 'scalar',
  },
  // Constitution — apparatus
  actions: { axis: 'Constitution', kind: 'enum', arity: 'set' },
  modalities: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  model: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  memory: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  // Constitution — per-turn act
  trigger: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  framing: { axis: 'Constitution', kind: 'open', arity: 'scalar' },
  'reasoning-strategy': { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  satisficing: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  'output-format': { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  'self-evaluation': { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
};

/** Every fragment-dimension name, in anatomy (Persona-then-Constitution) declaration order. */
export const DIMENSION_NAMES = Object.keys(ANATOMY) as readonly Dimension[];

// ── The Agent: a typed dimension-selection vector ───────────────────────────────

/**
 * An agent as a selection over the anatomy: a FLAT, explicit dimension vector
 * (depth 1 — composition over inheritance). Scalar dimension fields hold ONE branded
 * value; the six set dimensions hold arrays. Arity is enforced by the field types.
 *
 * Every dimension key is REQUIRED (completeness law). A scalar dimension's value is a
 * concrete branded string **or `null`** (explicit omit-to-inherit — do NOT project
 * this dimension; inherit whatever the harness provides). `null` on a set dimension omits
 * the whole section. `archetype` and `provenance` are NOT fragment dimensions: archetype is
 * a plain identity description, provenance the structured `{mark}` (or null).
 */
export interface Agent {
  /** The agent's name (its module / deploy identity). */
  readonly name: string;
  /** σ_human* — the human-read one-line selection bound → SOUL frontmatter
   *  `description:` the subagent-router reads (NOT σ*). The one-level-up twin of
   *  the skill `description`. */
  readonly description: string;
  /** OPTIONAL doctrine-AGNOSTIC leading block, emitted VERBATIM above `## Archetype`
   *  by `agentBody`. The engine knows only "a leading block"; a consumer fills it
   *  (agent-canon injects its founding doctrine so the axiom rides every SOUL,
   *  intrinsic to the projected bytes rather than ambient repo context). Absent ⇒
   *  omitted. */
  readonly preamble?: string;

  // Persona
  readonly autonomy: readonly Autonomy[] | null; // SET (composed standing, D5)
  /** σ* — the model-read identity body → SOUL body. A plain string, not a branded
   *  fragment-dimension (D13), but σ* content nonetheless. */
  readonly archetype: string;
  readonly role: Role | null;
  readonly formality: Formality | null;
  readonly audienceAdaptation: AudienceAdaptation | null;
  readonly transparency: Transparency | null;
  /** The emoji·hue mark (drives color) — data, not a fragment (D3). */
  readonly provenance: { readonly mark: Mark } | null;

  // Constitution — standing drives
  readonly objective: Objective | null;
  readonly guardrails: readonly Guardrails[] | null; // SET
  readonly engineeringPrinciples: readonly EngineeringPrinciples[] | null; // SET
  readonly heuristics: readonly Heuristics[] | null; // SET
  readonly capabilities: readonly Capabilities[] | null; // SET
  readonly learning: Learning | null;
  readonly situationAwareness: SituationAwareness | null;

  // Constitution — apparatus
  readonly actions: readonly Actions[] | null; // SET
  readonly modalities: Modalities | null;
  readonly model: Model | null;
  readonly memory: Memory | null;

  // Constitution — per-turn act
  readonly trigger: Trigger | null;
  readonly framing: Framing | null;
  readonly reasoningStrategy: ReasoningStrategy | null;
  readonly satisficing: Satisficing | null;
  readonly outputFormat: OutputFormat | null;
  readonly selfEvaluation: SelfEvaluation | null;
}

// ── The Skill: a self-sufficient set-builder cell ───────────────────────────

/**
 * A skill's σ* payload string — the self-sufficient set-builder block. A nominal-
 * branded `string` with the SAME shape as `Fragment<O>` (optional phantom brand,
 * so a plain string literal still assigns): keys the notation to its role so `tsc`
 * rejects a raw string where a skill's formal block is expected.
 */
export type SkillExpression = string & { readonly __skillExpr?: true };

/** How a skill cell deploys, beyond the default agent-resident projection. */
export interface SkillDeploy {
  /** Deploy as a host `skills/<name>/` directory (the `memory`-style cell). */
  readonly deployAs?: 'skill-dir';
  /** Committed companion assets shipped byte-for-byte with the skill. */
  readonly assets?: readonly string[];
  /**
   * The RUNTIME capability this skill is a face of. When set, the projection ALSO
   * emits a THIN SHIM `scripts/<capability>.mjs` that forwards to the host-installed
   * `agent-runtime <capability>` CLI — NOT a bundle of the impl (the capability logic
   * lives host-side behind the runtime port, installed per-host by agent-runtime/S7).
   * Absent ⇒ SKILL.md only (unchanged). This REVERSES the superseded dep-free-bundle
   * design (skills-refactor T4). */
  readonly runtime?: { readonly capability: RuntimeCapability };
}

/**
 * A skill cell: its σ* formal block plus the live sibling skills it composes. The
 * name is the anchor (trigger `= /`+name; verb derivable), so neither is stored.
 * Per-FIELD reader binding: `formalBlock` is the sole **σ*** payload (model-read);
 * `description` is **σ_human*** (the human selection-line the router surfaces — NOT
 * σ*, NOT residue-gated). NO `body` field — the SKILL.md is GENERATED by the adapter
 * as `f(name, formalBlock)`; storing it would be the parse-to-recover / DRY defect
 * this de-braid kills. `composition` is plain imported sibling `Skill`s.
 */
export interface Skill extends SkillDeploy {
  /** The skill name — the anchor; carries the trigger-weight at disclosure. */
  readonly name: string;
  /** σ_human* — the human-read one-line selection bound the router surfaces (NOT σ*). */
  readonly description: string;
  /** σ* — the sole model-read payload: the self-sufficient set-builder block
   *  (declarations-above / laws-below). The SKILL.md projects FROM this. */
  readonly formalBlock: SkillExpression;
  /** The sibling skills this one composes — plain ESM imports, no `[[ ]]`.
   *  A LAZY THUNK (`() => readonly Skill[]`), not an eager array: the real skill
   *  graph is CYCLIC (conceptualize↔exemplify↔signify↔materialize, elicit↔probe),
   *  so eager sibling `const` references would TDZ-crash at ESM load. The generator
   *  CALLS it (`skill.composition()`) only when emitting "Composed from …". */
  readonly composition: () => readonly Skill[];
}

// ── Projection helpers ──────────────────────────────────────────────────────

/**
 * Resolve a provenance mark's hue to a terminal color. The hue is the source of
 * truth; this maps it to the concrete color token a harness wants. (Identity for
 * now — a richer hue→color table lands with a later projection task.)
 */
export function markToColor(mark: Mark): string {
  return mark.hue;
}

// ── project-human — the harness-agnostic human-view boundary projection ───────
export { type DimensionDoc, projectHumanDimension } from './project-human.js';

// ── Source-cell type kernel — the generic `hook`/`rule` cell shapes ───────────
// The doctrine-free cell shapes (`hook`/`rule`) + the generic config-IR lift. The
// concrete cell instances live in the consuming corpus (agent-canon).
export {
  type HookCell,
  type HookEvent,
  type HookSource,
  type HookSubstrate,
  type HookWorker,
  hookIrOf,
} from './hook-cell.js';
export type { RuleCell } from './rule-cell.js';
