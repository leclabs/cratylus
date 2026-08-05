// ─────────────────────────────────────────────────────────────────────────────
// THE DIMENSION MANIFEST — canon's own, and the one home for it.
//
// `@cratylus/schema` owns the META-MODEL: that a dimension HAS an `axis`, a
// `kind`, an `arity`, a `required`, and all machinery that operates on any
// manifest obeying that shape. THIS module owns the INSTANCE: WHICH dimensions
// exist, and each one's metadata. The manifest rides the PLUGIN (`src/index.ts`
// declares `manifest: MANIFEST`), exactly as `preamble` does — "the axiom rides
// the PLUGIN, so it survives projection by any consumer."
//
// The manifest used to live in `forge`, which meant a corpus could not
// discover a dimension without editing the projector — the thesis inverted at its
// most load-bearing point. A projector that knows there are exactly 22 dimensions
// named these 22 things is not projecting a design; it contains one.
//
// WHERE THE TYPO-CATCHING LIVES. The schema's `Fragment<O>` is constrained
// `O extends string`, not `O extends Dimension`, and MUST NOT be re-tightened:
// the brand discriminates by the type ARGUMENT, so every value-level guarantee
// (the cross-dimension refusal, the `required` catch-all) holds without the
// constraint. The one property the relaxation costs is catching a MISSPELLED
// dimension name, and it is restored HERE, by `Value<D extends Dimension>` below
// — the corpus that owns the manifest is the only place that can know a name is
// not one of its own.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AgentOf,
  CapabilityName,
  DimensionMeta,
  RequiredDimensionOf,
  SetDimensionOf,
  SkillExpression,
  Skill as SkillOf,
  Value as ValueOfDimension,
} from '@cratylus/schema';

/**
 * The one runtime home for this corpus's dimension metadata. Every derivation
 * below reads it, so a dimension is added HERE and nowhere else.
 *
 * `as const satisfies Record<string, DimensionMeta>` is LOAD-BEARING and is not
 * interchangeable with a `: Record<string, DimensionMeta>` annotation. The
 * annotation widens the keys to `string`, which collapses `Dimension` to `string`
 * and takes every alias, `Agent` field and arity check below down with it —
 * silently, while everything still compiles.
 */
export const MANIFEST = {
  // Persona
  autonomy: { axis: 'Persona', kind: 'enum', arity: 'set' },
  role: { axis: 'Persona', kind: 'open', arity: 'scalar' },
  formality: { axis: 'Persona', kind: 'enum', arity: 'scalar' },
  'audience-adaptation': { axis: 'Persona', kind: 'enum', arity: 'scalar' },
  transparency: { axis: 'Persona', kind: 'enum', arity: 'scalar' },
  // Constitution — standing drives
  objective: { axis: 'Constitution', kind: 'open', arity: 'scalar' },
  // `required` — this dimension may NOT be omitted. The catch-all against
  // attachment failing open: an agent composed with no bound is not a lesser
  // agent, it is an unconfined one. Stated HERE, as catalog data, because
  // "may this be omitted?" is a fact about the dimension exactly as `arity` is —
  // and because it is a CANON doctrine, which is why it could never be at home
  // as a hand-written exception inside the projector's `Agent` interface.
  guardrails: {
    axis: 'Constitution',
    kind: 'coined',
    arity: 'set',
    required: true,
  },
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
} as const satisfies Record<string, DimensionMeta>;

/**
 * Every fragment dimension of this corpus — DERIVED from `MANIFEST`, never listed
 * twice. `archetype` and `provenance` are NOT here: archetype is a plain-string
 * description on the agent (D13) and provenance the structured `{mark}` (D3);
 * both carry data, not a σ* residue, so neither is a value-fragment dimension.
 */
export type Dimension = keyof typeof MANIFEST;

/** Every fragment-dimension name, in manifest (Persona-then-Constitution) declaration order. */
export const DIMENSION_NAMES = Object.keys(MANIFEST) as readonly Dimension[];

/**
 * A dimension VALUE of THIS corpus: a bare branded declaration, or one that
 * enforces itself.
 *
 * `D extends Dimension`, and that constraint is the whole reason this alias
 * exists rather than forge's `Value` being imported directly: a misspelled
 * dimension (`Value<'guardrials'>`) is a compile error here, and cannot be one
 * inside a projector that does not know which dimensions exist.
 */
export type Value<D extends Dimension> = ValueOfDimension<D>;

/** The dimensions holding MANY values — derived from `MANIFEST`'s `arity`. */
export type SetDimension = SetDimensionOf<typeof MANIFEST>;

/** The dimensions an agent may NOT omit — derived from `MANIFEST`'s `required`. */
export type RequiredDimension = RequiredDimensionOf<typeof MANIFEST>;

/**
 * An agent of this corpus: a FLAT, explicit selection over `MANIFEST` (depth 1 —
 * composition over inheritance), plus the identity fields forge reads.
 *
 * Every dimension key is REQUIRED (completeness law). A scalar dimension holds
 * ONE branded value or `null` (explicit omit-to-inherit — do NOT project this
 * dimension; inherit whatever the harness provides); a set dimension holds an
 * array, or `null` to omit the whole section. `guardrails` has no `| null`: it is
 * `required: true` in the catalog, so the unconfined agent cannot be written down.
 */
export type Agent = AgentOf<typeof MANIFEST>;

// ── Per-dimension value types (branded strings) ─────────────────────────────
// A dimension value is a bare named σ* expression: `export const x: Objective = '…'`.
// Each alias is a nominal-branded `string` — the phantom `__dimension` brand keys
// the string to its dimension so `tsc` rejects a cross-dimension assignment. The
// value's content is the body ⟨α, residue⟩ (rendered `α ≜ residue`, or just `α`
// for a true σ* whose residue is ∅).

// Persona
export type Autonomy = Value<'autonomy'>;
export type Role = Value<'role'>;
export type Formality = Value<'formality'>;
export type AudienceAdaptation = Value<'audience-adaptation'>;
export type Transparency = Value<'transparency'>;

// Constitution — standing drives
export type Objective = Value<'objective'>;
export type Guardrails = Value<'guardrails'>;
export type EngineeringPrinciples = Value<'engineering-principles'>;
export type Heuristics = Value<'heuristics'>;
export type Capabilities = Value<'capabilities'>;
export type Learning = Value<'learning'>;
export type SituationAwareness = Value<'situation-awareness'>;

// Constitution — apparatus
export type Actions = Value<'actions'>;
export type Modalities = Value<'modalities'>;
export type Model = Value<'model'>;
export type Memory = Value<'memory'>;

// Constitution — per-turn act
export type Trigger = Value<'trigger'>;
export type Framing = Value<'framing'>;
export type ReasoningStrategy = Value<'reasoning-strategy'>;
export type Satisficing = Value<'satisficing'>;
export type OutputFormat = Value<'output-format'>;
export type SelfEvaluation = Value<'self-evaluation'>;

// ── The runtime-capability vocabulary ───────────────────────────────────────
//
// WHICH runtime capabilities exist is this corpus's to say, exactly as WHICH
// dimensions exist is. `@cratylus/schema` states only that a capability HAS a
// name (`CapabilityName`); the members live here, and `Skill` below is narrowed
// against them so a cell naming a capability this corpus does not ship is a
// COMPILE error rather than a shim that forwards to a bin verb nobody serves.
//
// This retires the `schema → runtime` edge. `CapabilityName` used to read
// `keyof Omit<RuntimePlugin, 'name'>` — schema reaching into the runtime's
// IMPLEMENTATION INTERFACE to borrow a set of NAMES. `shape ⊥ vocabulary`
// (`MODEL.md:22`): the ports stay in the runtime where ARCHITECTURE puts them,
// and the names come from the corpus. Nothing moved except where the members
// are declared.
//
// THE SIGN IS `RuntimeCapability`, WHICH IS WHAT SCHEMA ALREADY CALLED IT — and
// that is the finding. The name was never the defect; the derivation source was.
// The qualifier is load-bearing HERE and not in schema: this package also
// declares a DIMENSION named `capabilities` (`Capabilities` above), an
// agent-design axis, which is a different concept. Bare `Capability` beside it
// would be one root over two concepts.
export const RUNTIME_CAPABILITIES = [
  'memory',
  'eventTap',
] as const satisfies readonly CapabilityName[];

/** A runtime capability this corpus ships a face for. */
export type RuntimeCapability = (typeof RUNTIME_CAPABILITIES)[number];

/** This corpus's `Skill`: schema's shape, narrowed to the capabilities above. */
export type Skill = SkillOf<RuntimeCapability>;
export type { SkillExpression };
