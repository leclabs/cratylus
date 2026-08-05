// Type-level acceptance for THIS CORPUS'S manifest — the types `src/manifest.ts`
// derives from `MANIFEST`. It lives here, not in the projector, because every
// property below is a property of a catalog: which dimensions exist, which are
// sets, which may be omitted. A projector that could assert them would be one
// that contained the catalog.
//
// Checked by `tsc --noEmit` (the `typecheck` gate, `include: src/**/*`); it emits
// nothing and is excluded from the build. Every `@ts-expect-error` below asserts
// that the marked construction is a COMPILE ERROR — if the error ever disappears,
// `tsc` fails on the now-unused directive, so these are live negative tests.
//
// A dimension value is a per-dimension NOMINAL-BRANDED STRING (`⟨α, residue⟩`); the
// phantom `__dimension` brand keys each string to its dimension so a cross-dimension
// assignment of a TYPED value is a compile error.

import type { Skill } from '@cratylus/schema';
import type {
  Actions,
  Agent,
  Autonomy,
  Capabilities,
  Guardrails,
  OutputFormat,
  Role,
  Value,
} from './manifest.js';

// ── Fixtures (well-typed branded dimension values) ──────────────────────────────

const autonomyV: Autonomy = 'human-on-the-loop ≜ on the loop';
const roleV: Role = 'operate ≜ run a live system';
const guardrailA: Guardrails = 'harm-avoidance ≜ refuse harm';
const guardrailB: Guardrails = 'honesty ≜ assert from evidence';
const capabilitiesA: Capabilities = 'software-engineering ≜ build software';
const actionsA: Actions = 'file-ops ≜ mutate files';
const outputFormatV: OutputFormat = 'code ≜ emit source';

// ── NEGATIVE 1: a value of the WRONG dimension assigned to the wrong field ───────
// The `__dimension` brand discriminates the dimension of a TYPED value structurally.

// @ts-expect-error — an `output-format` value cannot be a `Role` (dimension brand mismatch).
const wrongDimension: Role = outputFormatV;

// @ts-expect-error — an `actions` value is not an `output-format` value.
const fenceClash: OutputFormat = actionsA;

// ── NEGATIVE 2: a SCALAR dimension given an ARRAY ───────────────────────────────

// @ts-expect-error — `role` is scalar; an array is not assignable to `Role`.
const scalarGivenArray: Agent['role'] = [roleV];

// ── NEGATIVE 3: a SET dimension given a SCALAR ──────────────────────────────────

// @ts-expect-error — `guardrails` is a set; a single value is not a `Guardrails[]`.
const setGivenScalar: Agent['guardrails'] = guardrailA;

// ── NEGATIVE 4: the same arity faults inside a whole Agent literal ───────────

const baseFixture: Agent = {
  name: 'fixture',
  description: 'the master builder — ships systems end-to-end',
  autonomy: [autonomyV],
  archetype: 'the master-builder — ship end-to-end',
  role: roleV,
  formality: 'formal ≜ terse',
  audienceAdaptation: 'convergence ≜ converge',
  transparency: 'reasoning-trace ≜ show the derivation',
  provenance: { mark: { emoji: '✈️', hue: 'green' } },
  objective: 'delivery ≜ ship end-to-end',
  guardrails: [guardrailA, guardrailB],
  engineeringPrinciples: ['dry ≜ one home per idea'],
  heuristics: ['recognition ≜ take the best'],
  capabilities: [capabilitiesA],
  learning: 'consolidation ≜ consolidate',
  situationAwareness: 'projection ≜ hold the whole',
  actions: [actionsA],
  modalities: 'text ≜ the text modality',
  model: 'claude ≜ the model/runtime',
  memory: 'ltm ≜ the persistent store',
  trigger: 'user-message ≜ a directive from a user',
  framing: 'goal-directed ≜ frame as objective',
  reasoningStrategy: 'plan-and-solve ≜ plan then execute',
  satisficing: 'optimize ≜ maximize EV',
  outputFormat: outputFormatV,
  selfEvaluation: 'executable-test-oracle ≜ run against tests',
};

// ── The `null` sentinel (explicit omit-to-inherit) ──────────────────────────

// POSITIVE: `null`-valued keys compile — scalar and set dimensions alike.
const nullSentinel: Agent = {
  ...baseFixture,
  name: 'null-sentinel',
  autonomy: null, // set dimension, harness-inherited
  engineeringPrinciples: null, // set dimension, harness-inherited
  heuristics: null, // set dimension, harness-inherited
  role: null, // scalar dimension, harness-inherited
};
void nullSentinel;

// NEGATIVE: a vector MISSING a dimension key fails tsc (completeness law).
// @ts-expect-error — `autonomy` is required; omission is spelled `autonomy: null`, never a missing key.
const missingKey: Agent = {
  name: 'missing-key',
  archetype: baseFixture.archetype,
  role: baseFixture.role,
  formality: baseFixture.formality,
  audienceAdaptation: baseFixture.audienceAdaptation,
  transparency: baseFixture.transparency,
  provenance: baseFixture.provenance,
  objective: baseFixture.objective,
  guardrails: baseFixture.guardrails,
  engineeringPrinciples: baseFixture.engineeringPrinciples,
  heuristics: baseFixture.heuristics,
  capabilities: baseFixture.capabilities,
  learning: baseFixture.learning,
  situationAwareness: baseFixture.situationAwareness,
  actions: baseFixture.actions,
  modalities: baseFixture.modalities,
  model: baseFixture.model,
  memory: baseFixture.memory,
  trigger: baseFixture.trigger,
  framing: baseFixture.framing,
  reasoningStrategy: baseFixture.reasoningStrategy,
  satisficing: baseFixture.satisficing,
  outputFormat: baseFixture.outputFormat,
  selfEvaluation: baseFixture.selfEvaluation,
};
void missingKey;

// NEGATIVE: `undefined` is not the sentinel — only `null` spells inherit.
// @ts-expect-error — `undefined` is not assignable to a dimension key; the sentinel is `null`.
const undefinedNotSentinel: Agent = { ...baseFixture, role: undefined };
void undefinedNotSentinel;

// @ts-expect-error — `actions` is a set; a scalar value in the Agent literal is rejected.
const agentSetFault: Agent = { ...baseFixture, actions: actionsA };

const agentScalarFault: Agent = {
  ...baseFixture,
  // @ts-expect-error — `output-format` is scalar; an array in the Agent literal is rejected.
  outputFormat: [outputFormatV],
};

// ── NEGATIVE 5: Skill composition is a LAZY THUNK of sibling skills ──────────
// The graph is cyclic (conceptualize↔exemplify↔…); composition is a thunk
// `() => readonly Skill[]` so sibling refs resolve lazily (no ESM temporal-dead-
// zone at load). The payload is `formalBlock` (σ*); there is no stored `body`.

const leaf: Skill = {
  name: 'leaf',
  description: 'a leaf skill',
  formalBlock: 'leaf ≜ …',
  composition: () => [],
};

const composed: Skill = {
  name: 'composed',
  description: 'composes leaf',
  formalBlock: 'composed ≜ …',
  composition: () => [leaf], // lazy thunk of imported sibling Skills
  deployAs: 'skill-dir',
  assets: ['SKILL.md'],
};
void composed;

// @ts-expect-error — composition is a thunk `() => Skill[]`, not an eager array.
const eagerComposition: Skill = { ...leaf, composition: [leaf] };

// ── NEGATIVE 6: the CATCH-ALL — an agent composed with NO guardrail ─────────────
//
// The one dimension with no `| null`. Attachment-based governance fails open
// (Spring Security's unannotated methods; AppArmor's profileless tasks), and both
// prescribe a catch-all underneath. This is ours, and it is stronger than either
// because it is `tsc` rather than a runtime backstop: the unconfined agent cannot
// be written down. `@ts-expect-error` keeps the gate LIVE — if omitting
// `guardrails` ever stops being an error, this line fails instead of going quiet.

// BOTH LEGS. `undefined` alone is the weaker half of the gate: the two ways an
// agent actually arrives unconfined are the key being ABSENT (never written) and
// the key being `null` (written as omit-to-inherit, which every other dimension
// permits and this one must not). A catch-all that convicted only one of them
// would be a catch-most.

// @ts-expect-error — `guardrails` is required; an agent may not be composed unconfined.
const agentUnconfined: Agent = { ...baseFixture, guardrails: undefined };

// @ts-expect-error — the MISSING leg: no `guardrails` key at all.
const agentGuardrailsMissing: Agent = {
  name: 'unconfined-missing',
  description: baseFixture.description,
  archetype: baseFixture.archetype,
  autonomy: baseFixture.autonomy,
  role: baseFixture.role,
  formality: baseFixture.formality,
  audienceAdaptation: baseFixture.audienceAdaptation,
  transparency: baseFixture.transparency,
  provenance: baseFixture.provenance,
  objective: baseFixture.objective,
  engineeringPrinciples: baseFixture.engineeringPrinciples,
  heuristics: baseFixture.heuristics,
  capabilities: baseFixture.capabilities,
  learning: baseFixture.learning,
  situationAwareness: baseFixture.situationAwareness,
  actions: baseFixture.actions,
  modalities: baseFixture.modalities,
  model: baseFixture.model,
  memory: baseFixture.memory,
  trigger: baseFixture.trigger,
  framing: baseFixture.framing,
  reasoningStrategy: baseFixture.reasoningStrategy,
  satisficing: baseFixture.satisficing,
  outputFormat: baseFixture.outputFormat,
  selfEvaluation: baseFixture.selfEvaluation,
};

// @ts-expect-error — the NULL leg: `guardrails` may not be omitted-to-inherit.
const agentGuardrailsNull: Agent = { ...baseFixture, guardrails: null };
void agentGuardrailsMissing;
void agentGuardrailsNull;

// ── The catalog's OWN guarantee: a misspelled dimension does not exist ──────────
//
// This is the property forge gave up when `Fragment<O>` relaxed to
// `O extends string`, and the reason it could be given up: it lands HERE, on the
// side that owns the catalog. `Dimension` is a literal union derived from
// `MANIFEST` — if the `as const satisfies` on that const is ever weakened to a
// plain annotation, `Dimension` silently becomes `string`, this directive stops
// firing, and tsc fails on it. That is the tripwire.

// @ts-expect-error — `guardrials` is not a dimension of this corpus.
type Misspelled = Value<'guardrials'>;
type _Misspelled = Misspelled;

// POSITIVE: the correctly-spelled one resolves.
const spelled: Value<'guardrails'> = 'honesty ≜ assert from evidence';
void spelled;

// ── NEGATIVE 7: an ENFORCING value declaring `events` but no `substrate` ────────
//
// The pair is ONE FACT. The refusal law is substrate-relative — an event
// belonging to another substrate is ROUTED, not refused — so it cannot be
// evaluated from the events alone. A value that declared `events` without a
// substrate would bind nowhere decidable: a silent-allow wearing a type.
//
// Verified to fire unassisted: with the directive removed, tsc reports TS2322
// on `{ body, events }` not being assignable to `Guardrails`.

// @ts-expect-error — `substrate` is required alongside `events`; the pair is one fact.
const enforcingNoSubstrate: Guardrails = {
  body: 'stance ≜ hold the stance',
  events: ['tool.use.pre'],
};

// ── POSITIVE: the enforcing shape and the bare shape are BOTH values ────────────
// `events` is PARTIAL: opting in is a shape, opting out is the untouched string.

const enforcingValue: Guardrails = {
  body: 'stance ≜ hold the stance',
  substrate: 'harness',
  events: ['tool.use.pre'],
};
const bareValue: Guardrails = 'honesty ≜ assert from evidence';

// An agent composes either, in the same set — the union is the whole point.
const agentMixedGuardrails: Agent = {
  ...baseFixture,
  guardrails: [enforcingValue, bareValue],
};
void agentMixedGuardrails;
void enforcingNoSubstrate;

// Silence "declared but never read" for the intentional fault bindings.
void agentUnconfined;
void wrongDimension;
void fenceClash;
void scalarGivenArray;
void setGivenScalar;
void agentSetFault;
void agentScalarFault;
void eagerComposition;
