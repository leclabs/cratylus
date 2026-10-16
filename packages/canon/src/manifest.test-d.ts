// Type-level acceptance for THIS CORPUS'S manifest — the types `src/manifest.ts`
// derives from `MANIFEST`. It lives here, not in the projector, because every
// property below is a property of a catalog: which factors exist and which of
// them an agent carries as a field. A projector that could assert them would be
// one that contained the catalog.
//
// Checked by `tsc --noEmit` (the `typecheck` gate, `include: src/**/*`); it emits
// nothing and is excluded from the build. Every `@ts-expect-error` below asserts
// that the marked construction is a COMPILE ERROR — if the error ever disappears,
// `tsc` fails on the now-unused directive, so these are live negative tests.
//
// A factor value is a per-factor NOMINAL-BRANDED STRING (`'<anchor> ≜ <gloss>'`);
// the phantom `__dimension` brand keys each string to its factor so a
// cross-factor assignment of a TYPED value is a compile error. An agent holds
// every non-attribute factor as a list of entries, each a value with its
// enforcement level. Arity, slots and `required` are catalog DATA that
// composition checks; they are not type-level here.

import type { Skill } from '@cratylus/schema';
import type {
  ActionScope,
  Agent,
  Deliverable,
  Expertise,
  Guardrails,
  Stance,
  Value,
} from './manifest.js';

// ── Fixtures (well-typed branded factor values) ─────────────────────────────

const guardrailA: Guardrails = 'honesty ≜ never fabricates';
const guardrailB: Guardrails = 'privacy ≜ does not expose private information';
const expertiseA: Expertise = 'software-engineering ≜ building software well';
const stanceA: Stance = 'dry ≜ states each fact once';
const actionScopeA: ActionScope = 'run-checks ≜ run checks and builds';
const deliverableV: Deliverable =
  'change ≜ the change, its tests and what was verified';

const baseFixture: Agent = {
  name: 'fixture',
  description: 'a builder fixture',
  mark: { emoji: '✈️', hue: 'green' },
  key: null,
  role: [{ value: 'builder ≜ receives one task', level: 'fixed' }],
  objective: [
    {
      value: 'correctness ≜ does what its task says',
      level: 'fixed',
      slot: 'drive',
    },
    {
      value: 'satisfice ≜ stop at the first',
      level: 'fixed',
      slot: 'stopping-rule',
    },
  ],
  expertise: [{ value: expertiseA, level: 'firm' }],
  procedure: [{ value: 'test-first ≜ checks before the build', level: 'firm' }],
  stance: [{ value: stanceA, level: 'firm' }],
  communicationStyle: [
    { value: 'plain ≜ ordinary words', level: 'firm', slot: 'register' },
    { value: 'maintenance ≜ a peer density', level: 'firm', slot: 'density' },
    { value: 'answer-only ≜ the answer', level: 'firm', slot: 'rationale' },
  ],
  decisionRights: [
    { value: 'P ≜ performs', level: 'fixed', slot: 'realization' },
  ],
  autonomy: [
    {
      value: 'human-in-the-loop ≜ a person approves',
      level: 'fixed',
      note: 'of the lead',
    },
  ],
  perceptionScope: [{ value: 'work ≜ the realization itself', level: 'fixed' }],
  actionScope: [{ value: actionScopeA, level: 'fixed' }],
  model: [
    { value: 'frontier ≜ the strongest model', level: 'firm', slot: 'tier' },
    {
      value: 'medium ≜ moderate thinking effort',
      level: 'firm',
      slot: 'effort',
    },
  ],
  memory: [{ value: 'working ≜ the session context', level: 'fixed' }],
  assignment: [{ value: 'task ≜ one change', level: 'firm' }],
  deliverable: [{ value: deliverableV, level: 'firm' }],
  guardrails: [
    { value: guardrailA, level: 'fixed' },
    { value: guardrailB, level: 'fixed' },
  ],
  evaluation: [],
};

// ── NEGATIVE 1: a value of one factor cannot fill another ───────────────────

// @ts-expect-error — an `action-scope` value is not a `deliverable` value.
const fenceClash: Deliverable = actionScopeA;

const entryClash: Agent = {
  ...baseFixture,
  // @ts-expect-error — a `stance` value cannot be held under `expertise`.
  expertise: [{ value: stanceA, level: 'firm' }],
};

// ── NEGATIVE 2: a field holds ENTRIES, never a bare value ───────────────────

// @ts-expect-error — `guardrails` holds `Entry[]`; a bare value is not one.
const bareField: Agent['guardrails'] = guardrailA;

// @ts-expect-error — an entry carries its enforcement level; a bare value in the list is not one.
const bareInList: Agent = { ...baseFixture, guardrails: [guardrailA] };

const badLevel: Agent = {
  ...baseFixture,
  // @ts-expect-error — `strict` is not an enforcement level (advisory · firm · fixed, or null).
  stance: [{ value: stanceA, level: 'strict' }],
};

// ── NEGATIVE 3: no `null` sentinel — an empty factor is `[]` ────────────────

// @ts-expect-error — an explicitly empty factor is spelled `[]`, never `null`.
const nullField: Agent = { ...baseFixture, evaluation: null };

// POSITIVE: the explicitly empty set compiles.
const emptySet: Agent = { ...baseFixture, evaluation: [] };
void emptySet;

// ── NEGATIVE 4: completeness — every factor field is present ────────────────

// @ts-expect-error — `evaluation` is a factor field; omission is spelled `evaluation: []`.
const missingKey: Agent = {
  name: baseFixture.name,
  description: baseFixture.description,
  mark: baseFixture.mark,
  key: null,
  role: baseFixture.role,
  objective: baseFixture.objective,
  expertise: baseFixture.expertise,
  procedure: baseFixture.procedure,
  stance: baseFixture.stance,
  communicationStyle: baseFixture.communicationStyle,
  decisionRights: baseFixture.decisionRights,
  autonomy: baseFixture.autonomy,
  perceptionScope: baseFixture.perceptionScope,
  actionScope: baseFixture.actionScope,
  model: baseFixture.model,
  memory: baseFixture.memory,
  assignment: baseFixture.assignment,
  deliverable: baseFixture.deliverable,
  guardrails: baseFixture.guardrails,
};

// ── NEGATIVE 5: the attribute and identity details are not factor fields ────

// @ts-expect-error — enforcement level is an attribute on entries, never a field.
const levelField: Agent = { ...baseFixture, enforcementLevel: [] };

// @ts-expect-error — the key slot is reserved for ipseic agents and always empty.
const keyHeld: Agent = { ...baseFixture, key: 'kino' };

// ── NEGATIVE 6: Skill composition is a LAZY THUNK of sibling skills ─────────
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
  assets: ['SKILL.md'],
};
void composed;

// @ts-expect-error — composition is a thunk `() => Skill[]`, not an eager array.
const eagerComposition: Skill = { ...leaf, composition: [leaf] };

// ── The catalog's OWN guarantee: a misspelled factor does not exist ─────────
//
// This is the property forge gave up when `Fragment<O>` relaxed to
// `O extends string`, and the reason it could be given up: it lands HERE, on the
// side that owns the catalog. `Dimension` is a literal union derived from
// `MANIFEST` — if the `as const satisfies` on that const is ever weakened to a
// plain annotation, `Dimension` silently becomes `string`, this directive stops
// firing, and tsc fails on it. That is the tripwire.

// @ts-expect-error — `guardrials` is not a factor of this corpus.
type Misspelled = Value<'guardrials'>;
type _Misspelled = Misspelled;

// POSITIVE: the correctly-spelled one resolves.
const spelled: Value<'guardrails'> = 'honesty ≜ never fabricates';
void spelled;

// ── NEGATIVE 7: an ENFORCING value declaring `events` but no `substrate` ────
//
// The pair is ONE FACT. The refusal law is substrate-relative — an event
// belonging to another substrate is ROUTED, not refused — so it cannot be
// evaluated from the events alone. A value that declared `events` without a
// substrate would bind nowhere decidable: a silent-allow wearing a type.

// @ts-expect-error — `substrate` is required alongside `events`; the pair is one fact.
const enforcingNoSubstrate: Guardrails = {
  body: 'honesty ≜ never fabricates',
  events: ['tool.use.pre'],
};

// ── POSITIVE: the enforcing shape and the bare shape are BOTH values ────────
// `events` is PARTIAL: opting in is a shape, opting out is the untouched string.

const enforcingValue: Guardrails = {
  body: 'honesty ≜ never fabricates',
  substrate: 'harness',
  events: ['tool.use.pre'],
};

// An agent holds either, in the same set — the union is the whole point.
const agentMixedGuardrails: Agent = {
  ...baseFixture,
  guardrails: [
    { value: enforcingValue, level: 'fixed' },
    { value: guardrailB, level: 'fixed' },
  ],
};
void agentMixedGuardrails;
void enforcingNoSubstrate;

// Silence "declared but never read" for the intentional fault bindings.
void fenceClash;
void entryClash;
void bareField;
void bareInList;
void badLevel;
void nullField;
void missingKey;
void levelField;
void keyHeld;
void eagerComposition;
