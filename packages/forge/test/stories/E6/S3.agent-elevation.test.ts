/**
 * E6.S3 — agent elevation: a free-text source form → full 22-dimension vector,
 * which becomes the agent's one source of truth.
 *
 * depalimpsest-ir-intake S6: the "step-1" of the two-step agent law was `import`
 * mapping foreign agent NL onto a dimension — that lineage is excised, so the
 * source form below is simply a free-text persona file. `elevateAgent`'s
 * behavior is unchanged and every assertion here is unchanged.
 *
 * GRADUATED: the elevation frame ships in `src/core/exemplify/` (`elevateAgent`).
 * The SPEC below is the LLM exemplify+elicit pass's output over the source text
 * (the test plays the operating agent); the frame enforces the
 * mechanical laws: 22-key completeness, never-invent (every concrete value
 * carries a provenance trace — a quote is verified against the source),
 * replacement no-loss (REC ≽: the source NL recoverable from the vector),
 * and single-source replacement (the source file is removed on accept).
 *
 * `archetype` and `provenance` are NOT `Dimension` fragment members (D13/D3) — the
 * `ElevationSpec.dimensions` record is keyed by the 22 fragment dimensions only, so
 * this SPEC carries the source raw NL on `objective` (an `open` scalar dimension)
 * rather than on a `archetype` dimension key (which the frame would now refuse as
 * unknown).
 *
 * The elevation TARGET contract (22 dimensions, arities, axes) stays GREEN via
 * the runtime-introspection companion below.
 */

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import {
  type DimensionPlan,
  type ElevationSpec,
  ExemplifyRefusal,
  canonicalText,
  dimensionFieldsOf,
  elevateAgent,
  renderAgentVector,
} from '../../../src/core/exemplify/index.js';
import {
  FIXTURE_DIMENSION_NAMES,
  FIXTURE_MANIFEST,
  type FixtureDimension,
} from '../../fixture-manifest.js';
import { makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

/** dimension → its `Agent` field, derived from the fixture corpus's catalog. */
const DIMENSION_FIELD = dimensionFieldsOf(FIXTURE_MANIFEST);

/** The 22 fragment-dimension literals the vector must cover (manifest order). */
const THE_22_DIMENSIONS: readonly FixtureDimension[] = [
  'autonomy',
  'role',
  'formality',
  'audience-adaptation',
  'transparency',
  'objective',
  'guardrails',
  'engineering-principles',
  'heuristics',
  'capabilities',
  'learning',
  'situation-awareness',
  'actions',
  'modalities',
  'model',
  'memory',
  'trigger',
  'framing',
  'reasoning-strategy',
  'satisficing',
  'output-format',
  'self-evaluation',
];

story(
  'E6.S3',
  'the elevation target contract is runtime-introspectable: exactly 22 dimensions, 5 Persona, 6 set dimensions',
  () => {
    // The keyset is exactly the 22 fragment-dimension literals — the completeness
    // law the elevated vector compiles against.
    expect(FIXTURE_DIMENSION_NAMES).toHaveLength(22);
    expect([...FIXTURE_DIMENSION_NAMES].sort()).toEqual(
      [...THE_22_DIMENSIONS].sort(),
    );
    expect(Object.keys(FIXTURE_MANIFEST).sort()).toEqual(
      [...THE_22_DIMENSIONS].sort(),
    );
    // Axis split: 5 Persona / 17 Constitution (archetype + provenance no longer
    // Persona fragment dimensions — D13/D3).
    const persona = FIXTURE_DIMENSION_NAMES.filter(
      (o: FixtureDimension) => FIXTURE_MANIFEST[o].axis === 'Persona',
    );
    expect(persona).toHaveLength(5);
    // Arity: exactly the six documented set dimensions take arrays (autonomy is
    // now a SET dimension — composed standing, D5).
    const setDimensions = FIXTURE_DIMENSION_NAMES.filter(
      (o: FixtureDimension) => FIXTURE_MANIFEST[o].arity === 'set',
    );
    expect([...setDimensions].sort()).toEqual([
      'actions',
      'autonomy',
      'capabilities',
      'engineering-principles',
      'guardrails',
      'heuristics',
    ]);
  },
);

/** The free-text source form: a persona paragraph, no structure. */
const SOURCE_PERSONA =
  'A meticulous reviewer agent: reads every migration, flags destructive ' +
  'DDL, prefers small reversible steps, and always explains its reasoning.';

/** Every dimension deliberately harness-inherited unless the spec overrides. */
const inheritAll = (): Record<FixtureDimension, DimensionPlan> =>
  Object.fromEntries(
    FIXTURE_DIMENSION_NAMES.map((o: FixtureDimension) => [
      o,
      { kind: 'inherit' } satisfies DimensionPlan,
    ]),
  ) as Record<FixtureDimension, DimensionPlan>;

/** The LLM exemplify+elicit pass's output: evidence-traced dimension selections.
 *  Quotes are verbatim spans of SOURCE_PERSONA (the frame verifies). */
const SPEC: ElevationSpec = {
  name: 'reviewer',
  dimensions: {
    ...inheritAll(),
    // No `archetype` key: archetype is a plain identity field now (D13), not an
    // `Dimension` fragment — the frame refuses an unrecognized dimension key. The
    // source raw NL is instead carried verbatim on `objective` (an `open`
    // scalar dimension), which satisfies replacement no-loss (REC ≽).
    objective: {
      kind: 'value',
      fragments: [{ slug: 'migration-reviewer', definiens: SOURCE_PERSONA }],
      evidence: { type: 'quote', note: SOURCE_PERSONA },
    },
    role: {
      kind: 'value',
      fragments: [
        {
          slug: 'review',
          definiens: 'review changes end-to-end before they land',
        },
      ],
      evidence: { type: 'quote', note: 'reviewer agent' },
    },
    transparency: {
      kind: 'value',
      fragments: [
        {
          slug: 'reasoning-trace',
          definiens: 'expose the full step-by-step derivation',
        },
      ],
      evidence: { type: 'quote', note: 'always explains its reasoning' },
    },
    heuristics: {
      kind: 'value',
      fragments: [
        {
          slug: 'small-reversible-steps',
          definiens: 'prefer small reversible steps',
        },
        {
          slug: 'flag-destructive-ddl',
          definiens: 'flag destructive DDL on sight',
        },
      ],
      evidence: {
        type: 'quote',
        note: 'flags destructive DDL, prefers small reversible steps',
      },
    },
  },
};

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
  writeFileSync(join(cwd, 'source-agent.md'), SOURCE_PERSONA, 'utf8');
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E6.S3',
  'exemplify+elicit elevates a free-text source form to a compiling 22-dimension vector with a provenance trace per non-null dimension',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    elevateAgent({
      sourcePath: join(cwd, 'source-agent.md'),
      outDir: cwd,
      spec: SPEC,
      manifest: FIXTURE_MANIFEST,
    });
    const vectorModule = join(cwd, 'agents', 'reviewer.ts');
    expect(existsSync(vectorModule)).toBe(true);
    const src = readFileSync(vectorModule, 'utf8');
    // Typed against the schema contract (compiles by construction).
    expect(src).toContain("import type { Agent } from '@cratylus/schema'");
    expect(src).toContain('export const reviewer: Agent = {');
    // All 22 dimension fields present — a value fragment or the explicit null.
    for (const dimension of THE_22_DIMENSIONS) {
      expect(src, `dimension field for '${dimension}' missing`).toMatch(
        new RegExp(`\\b${DIMENSION_FIELD[dimension] as string}: `),
      );
    }
    // A provenance trace per non-null dimension — exactly the selected set.
    const provenance = JSON.parse(
      readFileSync(join(cwd, 'agents', 'reviewer.provenance.json'), 'utf8'),
    ) as Record<string, { type: string; note: string }>;
    expect(Object.keys(provenance).sort()).toEqual([
      'heuristics',
      'objective',
      'role',
      'transparency',
    ]);
    for (const trace of Object.values(provenance)) {
      expect(['quote', 'inference']).toContain(trace.type);
      expect(trace.note.length).toBeGreaterThan(0);
    }
    // A dimension value with no trace to input evidence = FAIL (never-invent).
    expect(() =>
      renderAgentVector(
        {
          name: 'reviewer',
          dimensions: {
            ...inheritAll(),
            formality: {
              kind: 'value',
              fragments: [{ slug: 'formal', definiens: 'the formal register' }],
              evidence: { type: 'quote', note: 'formal in tone' },
            },
          },
        },
        { manifest: FIXTURE_MANIFEST, sourceText: SOURCE_PERSONA },
      ),
    ).toThrow(ExemplifyRefusal);
  },
);

story(
  'E6.S3',
  'replacement semantics: on accept the vector is the one source form — no lingering twin, source content recoverable (REC ≽)',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    elevateAgent({
      sourcePath: join(cwd, 'source-agent.md'),
      outDir: cwd,
      spec: SPEC,
      manifest: FIXTURE_MANIFEST,
    });
    // Post-elevation repo state holds exactly ONE source form per agent:
    // the free-text source form is gone…
    expect(existsSync(join(cwd, 'source-agent.md'))).toBe(false);
    // …and the vector present, additive/no-loss: the source NL recoverable
    // from the vector (REC ≽, checked by the exemplify accept gate).
    const vectorModule = join(cwd, 'agents', 'reviewer.ts');
    expect(existsSync(vectorModule)).toBe(true);
    expect(canonicalText(readFileSync(vectorModule, 'utf8'))).toContain(
      canonicalText(SOURCE_PERSONA),
    );
    // A spec that would LOSE the source content refuses — and the source
    // survives (replacement never precedes recoverability).
    writeFileSync(join(cwd, 'source-b.md'), SOURCE_PERSONA, 'utf8');
    expect(() =>
      elevateAgent({
        sourcePath: join(cwd, 'source-b.md'),
        outDir: cwd,
        spec: { name: 'reviewer2', dimensions: inheritAll() },
        manifest: FIXTURE_MANIFEST,
      }),
    ).toThrow(/REC/);
    expect(existsSync(join(cwd, 'source-b.md'))).toBe(true);
  },
);
