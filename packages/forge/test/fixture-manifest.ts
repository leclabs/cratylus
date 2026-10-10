// THE FIXTURE CORPUS'S OWN DIMENSION CATALOG.
//
// Forge ships no catalog: WHICH dimensions exist is the corpus's fact, and forge
// only ever operates on the one it is handed. Its test suite is therefore a
// corpus like any other, and this is that corpus's declaration — the same shape a
// consumer writes, exercised by the same machinery.
//
// It names 22 dimensions whose names the agent vectors and expected SOULs under
// `test/` were authored against, so the fixture corpus keeps them. That another
// corpus in this repo happens to declare the same 22 is a property of these
// fixtures, not a second home for the design: no assertion here is a function of
// any other corpus's catalog, and none may become one — a sibling corpus
// discovering a dimension must never turn this suite red.
//
// Its VALUE DIRS live beside it at `test/fixture-dimensions/<dimension>/`, one dir
// per key — the corpus half this descriptor files against, gated for drift both
// ways by `test/catalog/manifest-descriptor.test.ts`.
//
// `as const satisfies Record<string, DimensionMeta>` is load-bearing exactly as it
// is in a real corpus: without it the keys widen to `string` and `FixtureAgent`
// stops checking anything.

import type { AgentOf, DimensionMeta, Value } from '@cratylus/schema';

// Two groups, `Persona` then `Constitution`. Most dimensions take no default
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
} as const satisfies Record<string, DimensionMeta>;

/** The fixture corpus's dimension union, derived — never listed twice. */
export type FixtureDimension = keyof typeof FIXTURE_MANIFEST;

/** Its dimension names in declaration order (Persona, then Constitution). */
export const FIXTURE_DIMENSION_NAMES = Object.keys(
  FIXTURE_MANIFEST,
) as readonly FixtureDimension[];

/** A value of one of the fixture corpus's dimensions. */
export type FixtureValue<D extends FixtureDimension> = Value<D>;

/** The strict agent vector over the fixture catalog — what the fixture agent
 *  modules are authored against, so a fixture is completeness-checked by the same
 *  derivation a real corpus's agents are. */
export type FixtureAgent = AgentOf<typeof FIXTURE_MANIFEST>;
