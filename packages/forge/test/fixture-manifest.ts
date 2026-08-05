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

export const FIXTURE_MANIFEST = {
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

/** The fixture corpus's dimension union, derived — never listed twice. */
export type FixtureDimension = keyof typeof FIXTURE_MANIFEST;

/** Its dimension names in declaration order (Persona, then Constitution). */
export const FIXTURE_DIMENSION_NAMES = Object.keys(
  FIXTURE_MANIFEST,
) as readonly FixtureDimension[];

/** A value of one of the fixture corpus's dimensions. */
export type FixtureValue<D extends FixtureDimension> = Value<D>;

/** The strict agent vector over the fixture catalog — what the fixture agent
 *  modules are authored against, so a fixture is arity- and completeness-checked
 *  by the same derivation a real corpus's agents are. */
export type FixtureAgent = AgentOf<typeof FIXTURE_MANIFEST>;
