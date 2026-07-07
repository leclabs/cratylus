// Type-level acceptance for the anatomy contract. This file is checked by
// `tsc --noEmit` (the `typecheck` gate, `include: src/**/*`); it emits nothing
// and is not a tsup build entry. Every `@ts-expect-error` below asserts that the
// marked construction is a COMPILE ERROR — if the error ever disappears, `tsc`
// fails on the now-unused directive, so these are live negative tests.
//
// An organ value is now a per-organ NOMINAL-BRANDED STRING (`⟨α, residue⟩`); the
// phantom `__organ` brand keys each string to its organ so a cross-organ
// assignment of a TYPED value is a compile error.

import type {
  Actions,
  Agent,
  Autonomy,
  Capabilities,
  Guardrails,
  OutputFormat,
  Role,
  Skill,
} from './index.js';

// ── Fixtures (well-typed branded organ values) ──────────────────────────────

const autonomyV: Autonomy = 'human-on-the-loop ≜ on the loop';
const roleV: Role = 'operate ≜ run a live system';
const guardrailA: Guardrails = 'harm-avoidance ≜ refuse harm';
const guardrailB: Guardrails = 'honesty ≜ assert from evidence';
const capabilitiesA: Capabilities = 'software-engineering ≜ build software';
const actionsA: Actions = 'file-ops ≜ mutate files';
const outputFormatV: OutputFormat = 'code ≜ emit source';

// ── NEGATIVE 1: a value of the WRONG organ assigned to the wrong field ───────
// The `__organ` brand discriminates the organ of a TYPED value structurally.

// @ts-expect-error — an `output-format` value cannot be a `Role` (organ brand mismatch).
const wrongOrgan: Role = outputFormatV;

// @ts-expect-error — an `actions` value is not an `output-format` value.
const fenceClash: OutputFormat = actionsA;

// ── NEGATIVE 2: a SCALAR organ given an ARRAY ───────────────────────────────

// @ts-expect-error — `role` is scalar; an array is not assignable to `Role`.
const scalarGivenArray: Agent['role'] = [roleV];

// ── NEGATIVE 3: a SET organ given a SCALAR ──────────────────────────────────

// @ts-expect-error — `guardrails` is a set; a single value is not a `Guardrails[]`.
const setGivenScalar: Agent['guardrails'] = guardrailA;

// ── NEGATIVE 4: the same arity faults inside a whole Agent literal ───────────

const baseFixture: Agent = {
  name: 'fixture',
  autonomy: [autonomyV],
  persona: 'the master-builder — ship end-to-end',
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

// POSITIVE: `null`-valued keys compile — scalar and set organs alike.
const nullSentinel: Agent = {
  ...baseFixture,
  name: 'null-sentinel',
  autonomy: null, // set organ, harness-inherited
  engineeringPrinciples: null, // set organ, harness-inherited
  heuristics: null, // set organ, harness-inherited
  role: null, // scalar organ, harness-inherited
};
void nullSentinel;

// NEGATIVE: a vector MISSING an organ key fails tsc (completeness law).
// @ts-expect-error — `autonomy` is required; omission is spelled `autonomy: null`, never a missing key.
const missingKey: Agent = {
  name: 'missing-key',
  persona: baseFixture.persona,
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
// @ts-expect-error — `undefined` is not assignable to an organ key; the sentinel is `null`.
const undefinedNotSentinel: Agent = { ...baseFixture, role: undefined };
void undefinedNotSentinel;

// @ts-expect-error — `actions` is a set; a scalar value in the Agent literal is rejected.
const agentSetFault: Agent = { ...baseFixture, actions: actionsA };

const agentScalarFault: Agent = {
  ...baseFixture,
  // @ts-expect-error — `output-format` is scalar; an array in the Agent literal is rejected.
  outputFormat: [outputFormatV],
};

// ── NEGATIVE 5: Skill composition is plain sibling skills (no [[ ]] strings) ──

const leaf: Skill = {
  name: 'leaf',
  description: 'a leaf skill',
  formalBlock: 'leaf ≜ …',
  composition: [],
};

const composed: Skill = {
  name: 'composed',
  description: 'composes leaf',
  formalBlock: 'composed ≜ …',
  composition: [leaf], // imported sibling Skill, not a "[[leaf]]" string
  deployAs: 'skill-dir',
  bundle: 'dist/episodic.mjs',
  assets: ['SKILL.md'],
};
void composed;

// @ts-expect-error — composition holds Skills, not `[[ref]]` strings.
const stringComposition: Skill = { ...leaf, composition: ['[[leaf]]'] };

// Silence "declared but never read" for the intentional fault bindings.
void wrongOrgan;
void fenceClash;
void scalarGivenArray;
void setGivenScalar;
void agentSetFault;
void agentScalarFault;
void stringComposition;
