// ─────────────────────────────────────────────────────────────────────────────
// THE DIMENSION MANIFEST — canon's own, and the one home for it.
//
// `@cratylus/schema` owns the META-MODEL: that a dimension HAS an `axis`, a
// `repertoire`, an `arity`, a `required`, and all machinery that operates on any
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
  EventName,
  HookCell as HookCellOf,
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
  autonomy: { axis: 'Persona', repertoire: 'latent', arity: 'set' },
  role: { axis: 'Persona', repertoire: 'open', arity: 'scalar' },
  formality: { axis: 'Persona', repertoire: 'latent', arity: 'scalar' },
  'audience-adaptation': {
    axis: 'Persona',
    repertoire: 'latent',
    arity: 'scalar',
  },
  transparency: { axis: 'Persona', repertoire: 'latent', arity: 'scalar' },
  // Constitution — standing drives
  objective: { axis: 'Constitution', repertoire: 'open', arity: 'scalar' },
  // `required` — this dimension may NOT be omitted. The catch-all against
  // attachment failing open: an agent composed with no bound is not a lesser
  // agent, it is an unconfined one. Stated HERE, as catalog data, because
  // "may this be omitted?" is a fact about the dimension exactly as `arity` is —
  // and because it is a CANON doctrine, which is why it could never be at home
  // as a hand-written exception inside the projector's `Agent` interface.
  guardrails: {
    axis: 'Constitution',
    repertoire: 'curated',
    arity: 'set',
    required: true,
  },
  'engineering-principles': {
    axis: 'Constitution',
    repertoire: 'curated',
    arity: 'set',
  },
  heuristics: { axis: 'Constitution', repertoire: 'curated', arity: 'set' },
  capabilities: { axis: 'Constitution', repertoire: 'open', arity: 'set' },
  learning: { axis: 'Constitution', repertoire: 'latent', arity: 'scalar' },
  'situation-awareness': {
    axis: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
  },
  // Constitution — apparatus
  actions: { axis: 'Constitution', repertoire: 'latent', arity: 'set' },
  modalities: { axis: 'Constitution', repertoire: 'latent', arity: 'scalar' },
  model: { axis: 'Constitution', repertoire: 'latent', arity: 'scalar' },
  memory: { axis: 'Constitution', repertoire: 'latent', arity: 'scalar' },
  // Constitution — per-turn act
  trigger: { axis: 'Constitution', repertoire: 'latent', arity: 'scalar' },
  framing: { axis: 'Constitution', repertoire: 'open', arity: 'scalar' },
  'reasoning-strategy': {
    axis: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
  },
  satisficing: {
    axis: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
  },
  'output-format': {
    axis: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
  },
  'self-evaluation': {
    axis: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
  },
} as const satisfies Record<string, DimensionMeta>;

/**
 * Every fragment dimension of this corpus — DERIVED from `MANIFEST`, never listed
 * twice. `archetype` and `provenance` are NOT here: archetype is a plain-string
 * description on the agent and provenance the structured `{mark}`;
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
  'carryOn',
  'heartbeat',
] as const satisfies readonly CapabilityName[];

/** A runtime capability this corpus ships a face for. */
export type RuntimeCapability = (typeof RUNTIME_CAPABILITIES)[number];

/** This corpus's `Skill`: schema's shape, narrowed to the capabilities above. */
export type Skill = SkillOf<RuntimeCapability>;
export type { SkillExpression };

// ── The lifecycle-event vocabulary ──────────────────────────────────────────
//
// `MODEL.md:22`, verbatim:
//
//   Event ≜ the harness-agnostic lifecycle vocabulary ⟨corpus-owned ⟨a name for a
//   moment ∴ signification⟩ ; shape ⊥ vocabulary : shape @ schema · names @ corpus ;
//   the PIVOT every adapter maps from⟩
//
// A NAME FOR A MOMENT IS A SIGNIFICATION, and signification is what this corpus is.
// That single clause decides the home: not schema (which held 28 of these, emitted
// from a JSON file by a generator), not runtime (which held the same 28,
// hand-authored, identical as sets AND in order), but here — beside
// `RUNTIME_CAPABILITIES`, which is the same ruling one axis over, already landed.
// The two declarations agreed by coincidence for as long as they coexisted, and
// nothing enforced it because their consumer sets were disjoint.
//
// EVERY OTHER SITE DERIVES OR RECEIVES:
//   · schema  states only that an event HAS a name (`EventName`) and narrows
//     `HookCell` from this tuple by type argument — an undeclared event is a
//     compile error at the cell;
//   · forge   receives it as DATA on the plugin (`AgentPlugin.events`, ARCHITECTURE
//     property 3) and keys its own harness maps over it;
//   · runtime receives it as CONFIGURATION THE PROJECTION EMITTED (property 4,
//     verbatim) — `deploy` writes the host config, `dispatch` validates against it.
// Only the first is a compiler-enforced derivation; the other two cross package
// boundaries the type system cannot, which is what `test/event-vocabulary.test.ts`
// is for.
//
// TWO MEMBERS NAME AN ACT RATHER THAN A HARNESS CALLBACK, and they are the reason
// there is no tool vocabulary. `stance-guardrail-pre` bound `tool.use.pre` and then
// narrowed it with `matcher: 'AskUserQuestion|Agent|SendMessage'` — three claude tool
// names, on a cell whose whole claim is harness-neutrality, silently dropped by the
// codex adapter (so the hook fired on every tool call there). The obvious repair — a
// canonical TOOL vocabulary beside this one — is a category error: harnesses share a
// LIFECYCLE, which is closed, but their TOOL SETS are open-world (MCP servers add
// tools at run time, users add their own), so a closed enum over them is permanently
// incomplete and every adapter map would be near-empty.
//
// The vocabulary was already written in the cell's own σ*: its residue reads
// `permission-menu ⟨AskUserQuestion⟩ · dispatch-echo ⟨Agent · SendMessage⟩` — three
// tool names already factored into TWO ACTS, four lines above the field that
// flattened them back. The residue was the argmin and the matcher its lossy
// projection, so the two acts are signified here and the projection is computed:
//
//   · `operator.consult.pre`   — about to put a question or a menu to the operator.
//     `principal.consult.pre` was the runner-up; `user.ask.pre` is rejected (`user`
//     collides with deploy's install-scope `user`, and it is the VENDOR word while
//     this pivot is vendor-neutral); `elicit.pre` is rejected (occupied by the
//     concept-recovery skill); `decision.request.pre` is rejected (collides with
//     `permission.request` INSIDE this tuple).
//   · `subagent.dispatch.pre`  — about to hand work to an agent. Covers spawn AND
//     message, and pairs as the pre-phase of `subagent.start`/`subagent.end`.
//
// TWO, and no third: a third act has no site in this corpus. An adapter maps each to
// its native ⟨event, selector⟩ pair (`NativeBinding`); a harness that can fire the
// act but not narrow it DECLARES that loss and the projection warns, which is what
// closed the codex divergence. `matcher` no longer exists on any cell or IR shape.
//
// `vcs.commit.post` IS AN ORDINARY MEMBER. It was `SubstrateEvent = CanonicalEvent |
// 'vcs.commit.post'` — a union that existed only because the enum was closed and a
// git-substrate moment had no literal to be. Nothing about it was ever exceptional:
// it is a name for a moment, on the `git` substrate rather than the `harness` one,
// and `substrate` is a declared axis (`Substrate = 'harness' | 'git'`) that already
// routes it. With an open `EventName` the union has nothing to widen, so it
// dissolved on its own.
export const CANONICAL_EVENTS = [
  // harness substrate — a session's shape
  'session.start',
  'session.resume',
  'session.end',
  'prompt.submit',
  'turn.end',
  'turn.fail',
  'agent.idle',
  // harness substrate — the model exchange
  'model.request.pre',
  'model.response.post',
  // harness substrate — tool use
  'tool.use.pre',
  'tool.use.post',
  'tool.use.fail',
  // harness substrate — the file the agent works on
  'file.edit.post',
  'file.read.pre',
  'file.change.external',
  // harness substrate — execution the agent delegates
  'shell.exec.pre',
  'shell.exec.post',
  'mcp.exec.pre',
  'mcp.exec.post',
  'subagent.dispatch.pre',
  'subagent.start',
  'subagent.end',
  // harness substrate — what the operator is asked and told
  'operator.consult.pre',
  'permission.request',
  'permission.deny',
  'notification',
  // harness substrate — the context itself
  'context.compact.pre',
  'context.compact.post',
  'config.changed',
  'instructions.loaded',
  // git substrate
  'vcs.commit.post',
] as const satisfies readonly EventName[];

/** One moment this corpus has a name for — the pivot every adapter maps FROM. */
export type CanonicalEvent = (typeof CANONICAL_EVENTS)[number];

/** This corpus's `HookCell`: schema's shape, narrowed to the events above. */
export type HookCell = HookCellOf<CanonicalEvent>;
