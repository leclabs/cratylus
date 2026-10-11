// ─────────────────────────────────────────────────────────────────────────────
// THE FACTOR MANIFEST — canon's own, and the one home for it.
//
// `@cratylus/schema` owns the META-MODEL: that a factor HAS a `group`, a
// `repertoire`, an `arity`, a default enforcement `level`, a `projection`, its
// `slots` and `required`, and all machinery that operates on any manifest obeying
// that shape. THIS module owns the INSTANCE: WHICH factors exist, and each one's
// metadata. The manifest rides the PLUGIN (`src/index.ts` declares
// `manifest: MANIFEST`), so a consumer projecting canon gets the design without
// the projector containing it.
//
// The manifest used to live in `forge`, which meant a corpus could not
// discover a factor without editing the projector — the thesis inverted at its
// most load-bearing point. A projector that knows there are exactly 18 factors
// named these 18 things is not projecting a design; it contains one.
//
// WHERE THE TYPO-CATCHING LIVES. The schema's `Fragment<O>` is constrained
// `O extends string`, not `O extends Dimension`, and MUST NOT be re-tightened:
// the brand discriminates by the type ARGUMENT, so every value-level guarantee
// (the cross-factor refusal, the `required` catch-all) holds without the
// constraint. The one property the relaxation costs is catching a MISSPELLED
// factor name, and it is restored HERE, by `Value<D extends Dimension>` below
// — the corpus that owns the manifest is the only place that can know a name is
// not one of its own.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AgentOf,
  CapabilityName,
  DimensionMeta,
  EventName,
  GuardCell as GuardCellOf,
  HookCell as HookCellOf,
  RequiredDimensionOf,
  SetDimensionOf,
  SkillExpression,
  Skill as SkillOf,
  Value as ValueOfDimension,
} from '@cratylus/schema';

/**
 * The one runtime home for this corpus's factor metadata, in catalog order: the
 * groups (Identity, Authority, Reach, Cognition, Interface, Governance) are
 * ordered by first appearance. Every derivation below reads it, so a factor is
 * added HERE and nowhere else.
 *
 * `as const satisfies Record<string, DimensionMeta>` is LOAD-BEARING and is not
 * interchangeable with a `: Record<string, DimensionMeta>` annotation. The
 * annotation widens the keys to `string`, which collapses `Dimension` to `string`
 * and takes every alias, `Agent` field and arity check below down with it —
 * silently, while everything still compiles.
 */
export const MANIFEST = {
  // Identity
  role: {
    group: 'Identity',
    arity: 'scalar',
    repertoire: 'open',
    level: 'fixed',
    projection: 'text',
  },
  objective: {
    group: 'Identity',
    arity: 'slots',
    repertoire: 'open',
    level: 'fixed',
    projection: 'text',
    slots: [{ name: 'drive' }, { name: 'stopping-rule' }],
  },
  expertise: {
    group: 'Identity',
    arity: 'set',
    repertoire: 'open',
    level: 'firm',
    projection: 'text',
  },
  procedure: {
    group: 'Identity',
    arity: 'set',
    repertoire: 'curated',
    level: 'firm',
    projection: 'text',
  },
  stance: {
    group: 'Identity',
    arity: 'set',
    repertoire: 'curated',
    level: 'firm',
    projection: 'text',
  },
  'communication-style': {
    group: 'Identity',
    arity: 'slots',
    repertoire: 'curated',
    level: 'firm',
    projection: 'text',
    slots: [
      { name: 'register' },
      { name: 'density' },
      { name: 'rationale' },
      {
        name: 'ordering',
        gloss: 'the sequence a reply presents its content in',
        optional: true,
      },
    ],
  },
  // Authority
  'decision-rights': {
    group: 'Authority',
    arity: 'slots',
    repertoire: 'fixed',
    level: 'fixed',
    projection: 'text',
    slots: [
      { name: 'intent', gloss: 'what is wanted and why' },
      { name: 'priority', gloss: 'what comes first' },
      { name: 'meaning', gloss: 'concepts and examples' },
      { name: 'constraint', gloss: 'decisions on realization' },
      { name: 'realization', gloss: 'how the work, or the checks, are built' },
      { name: 'check-ruling', gloss: 'changing a frozen check' },
      { name: 'verdict', gloss: 'whether the work is accepted' },
      { name: 'release', gloss: 'admitting the change to the project' },
    ],
  },
  autonomy: {
    group: 'Authority',
    arity: 'set',
    repertoire: 'curated',
    level: 'fixed',
    projection: 'text',
  },
  // Reach — a ceiling, held by permission: compiled to harness settings, never text
  'perception-scope': {
    group: 'Reach',
    arity: 'set',
    repertoire: 'fixed',
    level: 'fixed',
    projection: 'binding',
  },
  'action-scope': {
    group: 'Reach',
    arity: 'set',
    repertoire: 'fixed',
    level: 'fixed',
    projection: 'binding',
  },
  handoffs: {
    group: 'Reach',
    arity: 'set',
    repertoire: 'fixed',
    level: 'fixed',
    projection: 'binding',
  },
  // Cognition
  model: {
    group: 'Cognition',
    arity: 'slots',
    repertoire: 'curated',
    level: 'firm',
    projection: 'binding',
    slots: [{ name: 'tier' }, { name: 'effort' }],
  },
  memory: {
    group: 'Cognition',
    arity: 'set',
    repertoire: 'curated',
    level: 'fixed',
    projection: 'text',
  },
  // Interface
  assignment: {
    group: 'Interface',
    arity: 'scalar',
    repertoire: 'curated',
    level: 'firm',
    projection: 'text',
  },
  deliverable: {
    group: 'Interface',
    arity: 'scalar',
    repertoire: 'curated',
    level: 'firm',
    projection: 'text',
  },
  // Governance
  // `required` — this factor may NOT be held empty. The catch-all against
  // attachment failing open: an agent composed with no bound is not a lesser
  // agent, it is an unconfined one. Stated HERE, as catalog data, because
  // "may this be empty?" is a fact about the factor exactly as `arity` is.
  guardrails: {
    group: 'Governance',
    arity: 'set',
    repertoire: 'curated',
    level: 'fixed',
    projection: 'text',
    required: true,
  },
  // An attribute on every held value, not a field of its own on an agent.
  'enforcement-level': {
    group: 'Governance',
    arity: 'attribute',
    repertoire: 'fixed',
    level: null,
    projection: 'text',
  },
  evaluation: {
    group: 'Governance',
    arity: 'set',
    repertoire: 'curated',
    level: null,
    projection: 'text',
  },
} as const satisfies Record<string, DimensionMeta>;

/**
 * Every factor of this corpus — DERIVED from `MANIFEST`, never listed twice.
 * `name`, `description`, `mark` and `key` are NOT here: they are identity details
 * of an agent, carrying data rather than a catalog value.
 */
export type Dimension = keyof typeof MANIFEST;

/** Every factor name, in catalog order. */
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
 * Every non-attribute factor is a field holding the agent's `Entry[]`, each entry
 * a catalog value with its enforcement level; an explicitly empty set is `[]`.
 */
export type Agent = AgentOf<typeof MANIFEST>;

// ── Per-factor value types (branded strings) ────────────────────────────────
// A factor value is a named module: `export const x: Objective = '<anchor> ≜ <gloss>'`.
// Each alias is a nominal-branded `string` — the phantom `__dimension` brand keys
// the string to its factor so `tsc` rejects a cross-factor assignment.

// Identity
export type Role = Value<'role'>;
export type Objective = Value<'objective'>;
export type Expertise = Value<'expertise'>;
export type Procedure = Value<'procedure'>;
export type Stance = Value<'stance'>;
export type CommunicationStyle = Value<'communication-style'>;

// Authority
export type DecisionRights = Value<'decision-rights'>;
export type Autonomy = Value<'autonomy'>;

// Reach
export type PerceptionScope = Value<'perception-scope'>;
export type ActionScope = Value<'action-scope'>;
export type Handoffs = Value<'handoffs'>;

// Cognition
export type Model = Value<'model'>;
export type Memory = Value<'memory'>;

// Interface
export type Assignment = Value<'assignment'>;
export type Deliverable = Value<'deliverable'>;

// Governance
export type Guardrails = Value<'guardrails'>;
export type Enforcement = Value<'enforcement-level'>;
export type Evaluation = Value<'evaluation'>;

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
// The qualifier is load-bearing HERE and not in schema: in an agent catalog a
// bare `Capability` reads as what an agent is able to do (the `expertise`
// factor above), which is a different concept; one root would cover two.
export const RUNTIME_CAPABILITIES = [
  'concepts',
  'workPackage',
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
// names, on a cell whose whole claim is harness-neutrality, silently dropped by an
// adapter that could not narrow it (so the hook fired on every tool call there). The
// obvious repair — a canonical TOOL vocabulary beside this one — is a category error: harnesses share a
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
// closed that divergence. `matcher` no longer exists on any cell or IR shape.
//
// `vcs.commit.post` IS AN ORDINARY MEMBER. It was `SubstrateEvent = CanonicalEvent |
// 'vcs.commit.post'` — a union that existed only because the enum was closed and a
// git-substrate moment had no literal to be. Nothing about it was ever exceptional:
// it is a name for a moment, on the `git` substrate rather than the `harness` one,
// and `substrate` is a declared axis (`Substrate = 'harness' | 'git'`) that already
// routes it. With an open `EventName` the union has nothing to widen, so it
// dissolved on its own.
//
// `worktree.create` NAMES THE MOMENT A WORKTREE IS MADE FOR AN AGENT, and a hook bound to
// it does not observe the moment, it PERFORMS it: the harness asks the hook to create the
// worktree and take the path it answers with. Claude Code fires it as WorktreeCreate,
// replacing its own creation; omp has no per-agent worktree and fires nothing here, so the
// moment is absent from its map and projection declares the loss. There is no `.pre` or
// `.post` in the name because there is no before and after: the hook IS the creation.
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
  // harness substrate — the working copy an agent is given
  'worktree.create',
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

/** This corpus's hook-cell shape, narrowed to its declared event vocabulary. */
export type HookCell = HookCellOf<CanonicalEvent>;

/** This corpus's guard-cell shape, narrowed to its declared event vocabulary. */
export type GuardCell = GuardCellOf<CanonicalEvent>;
