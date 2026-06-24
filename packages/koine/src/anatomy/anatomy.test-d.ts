// Type-level acceptance for the anatomy contract. This file is checked by
// `tsc --noEmit` (the `typecheck` gate, `include: src/**/*`); it emits nothing
// and is not a tsup build entry. Every `@ts-expect-error` below asserts that the
// marked construction is a COMPILE ERROR — if the error ever disappears, `tsc`
// fails on the now-unused directive, so these are live negative tests.

import type {
  Address,
  Agent,
  Charter,
  Competence,
  Effectors,
  Enaction,
  Fragment,
  Persona,
  Skill,
} from './index.js';

// ── Fixtures (well-typed fragments) ─────────────────────────────────────────

const persona: Persona = {
  organ: 'persona',
  slug: 'hero',
  definiens: 'the Hero archetype',
};
const address: Address = {
  organ: 'address',
  slug: 'human-on-the-loop',
  definiens: 'on the loop',
};
const charterA: Charter = {
  organ: 'charter',
  slug: 'harm-avoidance',
  definiens: 'refuse harm',
};
const charterB: Charter = {
  organ: 'charter',
  slug: 'honesty',
  definiens: 'assert from evidence',
};
const competenceA: Competence = {
  organ: 'competence',
  slug: 'se',
  definiens: 'software engineering',
};
const effectorsA: Effectors = {
  organ: 'effectors',
  slug: 'file-ops',
  definiens: 'mutate files',
};
const enactionFrag: Enaction = {
  organ: 'enaction',
  slug: 'code',
  definiens: 'emit source',
};

// ── NEGATIVE 1: a fragment of the WRONG organ assigned to the wrong field ────
// `effectors/emitFencedReview` ≠ `enaction/emitFencedReview` — the `organ`
// literal discriminates the (organ, value) pair structurally.

// @ts-expect-error — an `enaction` fragment cannot be a `Persona` (organ literal mismatch).
const wrongOrgan: Persona = enactionFrag;

// same slug, different organ: an effectors fragment is not an enaction fragment.
const effectorsFence: Effectors = {
  organ: 'effectors',
  slug: 'emitFencedReview',
  definiens: 'x',
};
// @ts-expect-error — assigning it where an `enaction` fragment is required is rejected.
const fenceClash: Enaction = effectorsFence;

// a bare organ string that is not in the `Organ` union is rejected.
const vibes = { organ: 'vibes', slug: 'x', definiens: 'y' };
// @ts-expect-error — `'vibes'` is not a member of the `Organ` union.
const notAnOrgan: Fragment = vibes;

// ── NEGATIVE 2: a SCALAR organ given an ARRAY ───────────────────────────────

// @ts-expect-error — `persona` is scalar; an array is not assignable to `Persona`.
const scalarGivenArray: Agent['persona'] = [persona];

// ── NEGATIVE 3: a SET organ given a SCALAR ──────────────────────────────────

// @ts-expect-error — `charter` is a set; a single fragment is not assignable to `Charter[]`.
const setGivenScalar: Agent['charter'] = charterA;

// ── NEGATIVE 4: the same arity faults inside a whole Agent literal ───────────

const baseFixture: Agent = {
  name: 'fixture',
  address,
  persona,
  mandate: {
    organ: 'mandate',
    slug: 'operate',
    definiens: 'run a live system',
  },
  comportment: { organ: 'comportment', slug: 'formal', definiens: 'terse' },
  registerFit: {
    organ: 'register-fit',
    slug: 'convergence',
    definiens: 'converge',
  },
  disclosure: {
    organ: 'disclosure',
    slug: 'reasoning-trace',
    definiens: 'show the derivation',
  },
  provenance: {
    organ: 'provenance',
    slug: 'mav-green',
    definiens: 'the mav archetype',
    mark: { emoji: '✈️', hue: 'green' },
  },
  telos: { organ: 'telos', slug: 'delivery', definiens: 'ship end-to-end' },
  charter: [charterA, charterB],
  instructions: [
    { organ: 'instructions', slug: 'dry', definiens: 'one home per idea' },
  ],
  heuristics: [
    { organ: 'heuristics', slug: 'recognition', definiens: 'take the best' },
  ],
  competence: [competenceA],
  dispositionMemory: {
    organ: 'disposition-memory',
    slug: 'consolidation',
    definiens: 'consolidate',
  },
  gestalt: {
    organ: 'gestalt',
    slug: 'projection',
    definiens: 'hold the whole',
  },
  effectors: [effectorsA],
  sensors: { organ: 'sensors', slug: 'text', definiens: 'the text modality' },
  substrate: {
    organ: 'substrate',
    slug: 'claude',
    definiens: 'the model/runtime',
  },
  ledger: { organ: 'ledger', slug: 'ltm', definiens: 'the persistent store' },
  percept: {
    organ: 'percept',
    slug: 'user-message',
    definiens: 'a directive from a user',
  },
  construal: {
    organ: 'construal',
    slug: 'goal-directed',
    definiens: 'frame as objective',
  },
  deliberation: {
    organ: 'deliberation',
    slug: 'plan-and-solve',
    definiens: 'plan then execute',
  },
  resolve: { organ: 'resolve', slug: 'optimize', definiens: 'maximize EV' },
  enaction: enactionFrag,
  appraisal: {
    organ: 'appraisal',
    slug: 'executable-test-oracle',
    definiens: 'run against tests',
  },
};

// A valid delta-over-base: spread the base, override scalars, spread additive sets.
const delta: Agent = {
  ...baseFixture,
  name: 'delta',
  base: baseFixture,
  persona: { organ: 'persona', slug: 'sage', definiens: 'the Sage archetype' }, // scalar override
  charter: [...baseFixture.charter, charterB], // additive set
};
void delta;

// @ts-expect-error — `effectors` is a set; a scalar fragment in the Agent literal is rejected.
const agentSetFault: Agent = { ...baseFixture, effectors: effectorsA };

// @ts-expect-error — `enaction` is scalar; an array in the Agent literal is rejected.
const agentScalarFault: Agent = { ...baseFixture, enaction: [enactionFrag] };

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
