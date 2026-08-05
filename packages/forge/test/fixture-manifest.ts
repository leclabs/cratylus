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
  autonomy: { axis: 'Persona', kind: 'enum', arity: 'set' },
  role: { axis: 'Persona', kind: 'open', arity: 'scalar' },
  formality: { axis: 'Persona', kind: 'enum', arity: 'scalar' },
  'audience-adaptation': { axis: 'Persona', kind: 'enum', arity: 'scalar' },
  transparency: { axis: 'Persona', kind: 'enum', arity: 'scalar' },
  // Constitution — standing drives
  objective: { axis: 'Constitution', kind: 'open', arity: 'scalar' },
  guardrails: {
    axis: 'Constitution',
    kind: 'coined',
    arity: 'set',
    required: true,
  },
  'engineering-principles': {
    axis: 'Constitution',
    kind: 'coined',
    arity: 'set',
  },
  heuristics: { axis: 'Constitution', kind: 'coined', arity: 'set' },
  capabilities: { axis: 'Constitution', kind: 'open', arity: 'set' },
  learning: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  'situation-awareness': {
    axis: 'Constitution',
    kind: 'enum',
    arity: 'scalar',
  },
  // Constitution — apparatus
  actions: { axis: 'Constitution', kind: 'enum', arity: 'set' },
  modalities: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  model: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  memory: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  // Constitution — per-turn act
  trigger: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  framing: { axis: 'Constitution', kind: 'open', arity: 'scalar' },
  'reasoning-strategy': { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  satisficing: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  'output-format': { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  'self-evaluation': { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
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
