// THE FIXTURE CANON'S OWN FACTOR CATALOG.
//
// Forge ships no catalog: WHICH factors exist is the canon's fact, and forge
// only ever operates on the one it is handed. Its test suite therefore declares a
// canon like any other, and this is that canon's declaration — the same shape a
// consumer writes, exercised by the same machinery.
//
// It names 22 factors whose names the agent vectors and expected SOULs under
// `test/` were authored against, so the fixture canon keeps them. That the
// canon in this repo happens to declare the same 22 is a property of these
// fixtures, not a second home for the design: no assertion here is a function of
// any other canon's catalog, and none may become one — the canon
// discovering a factor must never turn this suite red.
//
// Its VALUE DIRS live beside it at `test/fixture-factors/<factor>/`, one dir
// per key — the canon half this descriptor files against, gated for drift both
// ways by `test/catalog/manifest-descriptor.test.ts`.
//
// `as const satisfies Record<string, FactorMeta>` is load-bearing exactly as it
// is in a real canon: without it the keys widen to `string` and `FixtureAgent`
// stops checking anything.

import type { AgentOf, FactorMeta, Value } from '@cratylus/schema';

// Two groups, `Persona` then `Constitution`. Most factors take no default
// enforcement level; `role` and `guardrails` are `fixed`, so a projected body shows
// the marker; `model` is a two-slot `binding`, so it is never text.
const text = { projection: 'text', level: null } as const;

export const FIXTURE_MANIFEST = {
  autonomy: { group: 'Persona', repertoire: 'latent', arity: 'set', ...text },
  role: {
    group: 'Persona',
    repertoire: 'open',
    arity: 'scalar',
    projection: 'text',
    level: 'fixed',
  },
  formality: {
    group: 'Persona',
    repertoire: 'latent',
    arity: 'scalar',
    ...text,
  },
  'audience-adaptation': {
    group: 'Persona',
    repertoire: 'latent',
    arity: 'scalar',
    ...text,
  },
  transparency: {
    group: 'Persona',
    repertoire: 'latent',
    arity: 'scalar',
    ...text,
  },
  objective: {
    group: 'Constitution',
    repertoire: 'open',
    arity: 'scalar',
    ...text,
  },
  guardrails: {
    group: 'Constitution',
    repertoire: 'curated',
    arity: 'set',
    projection: 'text',
    level: 'fixed',
    required: true,
  },
  'engineering-principles': {
    group: 'Constitution',
    repertoire: 'curated',
    arity: 'set',
    ...text,
  },
  heuristics: {
    group: 'Constitution',
    repertoire: 'curated',
    arity: 'set',
    ...text,
  },
  capabilities: {
    group: 'Constitution',
    repertoire: 'open',
    arity: 'set',
    ...text,
  },
  learning: {
    group: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
    ...text,
  },
  'situation-awareness': {
    group: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
    ...text,
  },
  actions: {
    group: 'Constitution',
    repertoire: 'latent',
    arity: 'set',
    ...text,
  },
  modalities: {
    group: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
    ...text,
  },
  model: {
    group: 'Constitution',
    repertoire: 'curated',
    arity: 'slots',
    projection: 'binding',
    level: 'firm',
    slots: [{ name: 'tier' }, { name: 'effort' }],
  },
  memory: {
    group: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
    ...text,
  },
  trigger: {
    group: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
    ...text,
  },
  framing: {
    group: 'Constitution',
    repertoire: 'open',
    arity: 'scalar',
    ...text,
  },
  'reasoning-strategy': {
    group: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
    ...text,
  },
  satisficing: {
    group: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
    ...text,
  },
  'output-format': {
    group: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
    ...text,
  },
  'self-evaluation': {
    group: 'Constitution',
    repertoire: 'latent',
    arity: 'scalar',
    ...text,
  },
} as const satisfies Record<string, FactorMeta>;

/** The fixture canon's factor union, derived — never listed twice. */
export type FixtureFactor = keyof typeof FIXTURE_MANIFEST;

/** Its factor names in declaration order (Persona, then Constitution). */
export const FIXTURE_FACTOR_NAMES = Object.keys(
  FIXTURE_MANIFEST,
) as readonly FixtureFactor[];

/** A value of one of the fixture canon's factors. */
export type FixtureValue<D extends FixtureFactor> = Value<D>;

/** The strict agent vector over the fixture catalog — what the fixture agent
 *  modules are authored against, so a fixture is completeness-checked by the same
 *  derivation the canon's agents are. */
export type FixtureAgent = AgentOf<typeof FIXTURE_MANIFEST>;
