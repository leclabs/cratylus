// Type-level acceptance for the anatomy contract. This file is checked by
// `tsc --noEmit` (the `typecheck` gate, `include: src/**/*`); it emits nothing
// and is not a tsup build entry. Every `@ts-expect-error` below asserts that the
// marked construction is a COMPILE ERROR — if the error ever disappears, `tsc`
// fails on the now-unused directive, so these are live negative tests.

import type {
  Actions,
  Agent,
  Autonomy,
  Capabilities,
  Fragment,
  Guardrails,
  OutputFormat,
  Persona,
  Skill,
} from './index.js';

// ── Fixtures (well-typed fragments) ─────────────────────────────────────────

const persona: Persona = {
  organ: 'persona',
  slug: 'hero',
  definiens: 'the Hero archetype',
};
const autonomy: Autonomy = {
  organ: 'autonomy',
  slug: 'human-on-the-loop',
  definiens: 'on the loop',
};
const guardrailA: Guardrails = {
  organ: 'guardrails',
  slug: 'harm-avoidance',
  definiens: 'refuse harm',
};
const guardrailB: Guardrails = {
  organ: 'guardrails',
  slug: 'honesty',
  definiens: 'assert from evidence',
};
const capabilitiesA: Capabilities = {
  organ: 'capabilities',
  slug: 'se',
  definiens: 'software engineering',
};
const actionsA: Actions = {
  organ: 'actions',
  slug: 'file-ops',
  definiens: 'mutate files',
};
const outputFormatFrag: OutputFormat = {
  organ: 'output-format',
  slug: 'code',
  definiens: 'emit source',
};

// ── NEGATIVE 1: a fragment of the WRONG organ assigned to the wrong field ────
// `actions/emitFencedReview` ≠ `output-format/emitFencedReview` — the `organ`
// literal discriminates the (organ, value) pair structurally.

// @ts-expect-error — an `output-format` fragment cannot be a `Persona` (organ literal mismatch).
const wrongOrgan: Persona = outputFormatFrag;

// same slug, different organ: an actions fragment is not an output-format fragment.
const actionsFence: Actions = {
  organ: 'actions',
  slug: 'emitFencedReview',
  definiens: 'x',
};
// @ts-expect-error — assigning it where an `output-format` fragment is required is rejected.
const fenceClash: OutputFormat = actionsFence;

// a bare organ string that is not in the `Organ` union is rejected.
const vibes = { organ: 'vibes', slug: 'x', definiens: 'y' };
// @ts-expect-error — `'vibes'` is not a member of the `Organ` union.
const notAnOrgan: Fragment = vibes;

// ── NEGATIVE 2: a SCALAR organ given an ARRAY ───────────────────────────────

// @ts-expect-error — `persona` is scalar; an array is not assignable to `Persona`.
const scalarGivenArray: Agent['persona'] = [persona];

// ── NEGATIVE 3: a SET organ given a SCALAR ──────────────────────────────────

// @ts-expect-error — `guardrails` is a set; a single fragment is not assignable to `Guardrails[]`.
const setGivenScalar: Agent['guardrails'] = guardrailA;

// ── NEGATIVE 4: the same arity faults inside a whole Agent literal ───────────

const baseFixture: Agent = {
  name: 'fixture',
  autonomy,
  persona,
  role: {
    organ: 'role',
    slug: 'operate',
    definiens: 'run a live system',
  },
  formality: { organ: 'formality', slug: 'formal', definiens: 'terse' },
  audienceAdaptation: {
    organ: 'audience-adaptation',
    slug: 'convergence',
    definiens: 'converge',
  },
  transparency: {
    organ: 'transparency',
    slug: 'reasoning-trace',
    definiens: 'show the derivation',
  },
  provenance: {
    organ: 'provenance',
    slug: 'mav-green',
    definiens: 'the mav archetype',
    mark: { emoji: '✈️', hue: 'green' },
  },
  objective: {
    organ: 'objective',
    slug: 'delivery',
    definiens: 'ship end-to-end',
  },
  guardrails: [guardrailA, guardrailB],
  engineeringPrinciples: [
    {
      organ: 'engineering-principles',
      slug: 'dry',
      definiens: 'one home per idea',
    },
  ],
  heuristics: [
    { organ: 'heuristics', slug: 'recognition', definiens: 'take the best' },
  ],
  capabilities: [capabilitiesA],
  learning: {
    organ: 'learning',
    slug: 'consolidation',
    definiens: 'consolidate',
  },
  situationAwareness: {
    organ: 'situation-awareness',
    slug: 'projection',
    definiens: 'hold the whole',
  },
  actions: [actionsA],
  modalities: {
    organ: 'modalities',
    slug: 'text',
    definiens: 'the text modality',
  },
  model: {
    organ: 'model',
    slug: 'claude',
    definiens: 'the model/runtime',
  },
  memory: { organ: 'memory', slug: 'ltm', definiens: 'the persistent store' },
  trigger: {
    organ: 'trigger',
    slug: 'user-message',
    definiens: 'a directive from a user',
  },
  framing: {
    organ: 'framing',
    slug: 'goal-directed',
    definiens: 'frame as objective',
  },
  reasoningStrategy: {
    organ: 'reasoning-strategy',
    slug: 'plan-and-solve',
    definiens: 'plan then execute',
  },
  satisficing: {
    organ: 'satisficing',
    slug: 'optimize',
    definiens: 'maximize EV',
  },
  outputFormat: outputFormatFrag,
  selfEvaluation: {
    organ: 'self-evaluation',
    slug: 'executable-test-oracle',
    definiens: 'run against tests',
  },
};

// ── The `null` sentinel (explicit omit-to-inherit) ──────────────────────────
// An organ key holds a concrete fragment OR `null` (omit from projection;
// inherit from the harness). The key itself is REQUIRED — a missing key is a
// compile error; `null` is the only spelling of not-asserting an organ.

// POSITIVE: `null`-valued keys compile — scalar and set organs alike.
const nullSentinel: Agent = {
  ...baseFixture,
  name: 'null-sentinel',
  autonomy: null, // scalar organ, harness-inherited
  engineeringPrinciples: null, // set organ, harness-inherited
  heuristics: null, // set organ, harness-inherited
};
void nullSentinel;

// NEGATIVE: a vector MISSING an organ key fails tsc (completeness law).
// @ts-expect-error — `autonomy` is required; omission is spelled `autonomy: null`, never a missing key.
const missingKey: Agent = {
  name: 'missing-key',
  persona,
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
const undefinedNotSentinel: Agent = { ...baseFixture, autonomy: undefined };
void undefinedNotSentinel;

// @ts-expect-error — `actions` is a set; a scalar fragment in the Agent literal is rejected.
const agentSetFault: Agent = { ...baseFixture, actions: actionsA };

const agentScalarFault: Agent = {
  ...baseFixture,
  // @ts-expect-error — `output-format` is scalar; an array in the Agent literal is rejected.
  outputFormat: [outputFormatFrag],
};

// ── NEGATIVE 5: Skill composition is plain sibling skills (no [[ ]] strings) ──

const leaf: Skill = {
  name: 'leaf',
  trigger: '/leaf',
  delineation: 'a leaf skill',
  verb: 'enact',
  formalBlock: 'leaf ≜ …',
  composition: [],
};

const composed: Skill = {
  name: 'composed',
  trigger: '/composed',
  delineation: 'composes leaf',
  verb: 'compose',
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
void notAnOrgan;
void scalarGivenArray;
void setGivenScalar;
void agentSetFault;
void agentScalarFault;
void stringComposition;
