/**
 * E6.S3 — agent elevation: step-1 archetype form → full 22-dimension vector, which
 * REPLACES the config-IR agent (two-step agent law, Operator ruling).
 *
 * GRADUATED: the elevation frame ships in `src/core/exemplify/` (`elevateAgent`).
 * The SPEC below is the LLM exemplify+elicit pass's output over the step-1
 * text (the test plays the operating agent); the frame enforces the
 * mechanical laws: 22-key completeness, never-invent (every concrete value
 * carries a provenance trace — a quote is verified against the source),
 * replacement no-loss (REC ≽: the step-1 NL recoverable from the vector),
 * and single-source replacement (the step-1 file is removed on accept).
 *
 * `archetype` and `provenance` are NOT `Dimension` fragment members (D13/D3) — the
 * `ElevationSpec.dimensions` record is keyed by the 22 fragment dimensions only, so
 * this SPEC carries the step-1 raw NL on `objective` (an `open` scalar dimension)
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
  ANATOMY,
  DIMENSION_NAMES,
  type Dimension,
} from '../../../src/anatomy/index.js';
import {
  DIMENSION_FIELD,
  type DimensionPlan,
  type ElevationSpec,
  ExemplifyRefusal,
  canonicalText,
  elevateAgent,
  renderAgentVector,
} from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

/** The 22 fragment-dimension literals the vector must cover (anatomy order). */
const THE_22_DIMENSIONS: readonly Dimension[] = [
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
    expect(DIMENSION_NAMES).toHaveLength(22);
    expect([...DIMENSION_NAMES].sort()).toEqual([...THE_22_DIMENSIONS].sort());
    expect(Object.keys(ANATOMY).sort()).toEqual([...THE_22_DIMENSIONS].sort());
    // Axis split: 5 Persona / 17 Constitution (archetype + provenance no longer
    // Persona fragment dimensions — D13/D3).
    const persona = DIMENSION_NAMES.filter(
      (o) => ANATOMY[o].axis === 'Persona',
    );
    expect(persona).toHaveLength(5);
    // Arity: exactly the six documented set dimensions take arrays (autonomy is
    // now a SET dimension — composed standing, D5).
    const setDimensions = DIMENSION_NAMES.filter(
      (o) => ANATOMY[o].arity === 'set',
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

/** A step-1 agent: the foreign NL verbatim on the archetype dimension (E1.S8). */
const STEP1_PERSONA =
  'A meticulous reviewer agent: reads every migration, flags destructive ' +
  'DDL, prefers small reversible steps, and always explains its reasoning.';

/** Every dimension deliberately harness-inherited unless the spec overrides. */
const inheritAll = (): Record<Dimension, DimensionPlan> =>
  Object.fromEntries(
    DIMENSION_NAMES.map((o) => [
      o,
      { kind: 'inherit' } satisfies DimensionPlan,
    ]),
  ) as Record<Dimension, DimensionPlan>;

/** The LLM exemplify+elicit pass's output: evidence-traced dimension selections.
 *  Quotes are verbatim spans of STEP1_PERSONA (the frame verifies). */
const SPEC: ElevationSpec = {
  name: 'reviewer',
  dimensions: {
    ...inheritAll(),
    // No `archetype` key: archetype is a plain identity field now (D13), not an
    // `Dimension` fragment — the frame refuses an unrecognized dimension key. The
    // step-1 raw NL is instead carried verbatim on `objective` (an `open`
    // scalar dimension), which satisfies replacement no-loss (REC ≽).
    objective: {
      kind: 'value',
      fragments: [{ slug: 'migration-reviewer', definiens: STEP1_PERSONA }],
      evidence: { type: 'quote', note: STEP1_PERSONA },
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
  writeFileSync(join(cwd, 'step1-agent.md'), STEP1_PERSONA, 'utf8');
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E6.S3',
  'exemplify+elicit elevates the step-1 archetype to a compiling 22-dimension vector with a provenance trace per non-null dimension',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    elevateAgent({
      sourcePath: join(cwd, 'step1-agent.md'),
      outDir: cwd,
      spec: SPEC,
    });
    const vectorModule = join(cwd, 'agents', 'reviewer.ts');
    expect(existsSync(vectorModule)).toBe(true);
    const src = readFileSync(vectorModule, 'utf8');
    // Typed against the anatomy contract (compiles by construction).
    expect(src).toContain(
      "import type { Agent } from '@leclabs/agent-forge/anatomy'",
    );
    expect(src).toContain('export const reviewer: Agent = {');
    // All 22 dimension fields present — a value fragment or the explicit null.
    for (const dimension of THE_22_DIMENSIONS) {
      expect(src, `dimension field for '${dimension}' missing`).toMatch(
        new RegExp(`\\b${DIMENSION_FIELD[dimension]}: `),
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
        { sourceText: STEP1_PERSONA },
      ),
    ).toThrow(ExemplifyRefusal);
  },
);

story(
  'E6.S3',
  'replacement semantics: on accept the vector replaces the config-IR agent — no lingering twin, step-1 content recoverable (REC ≽)',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    elevateAgent({
      sourcePath: join(cwd, 'step1-agent.md'),
      outDir: cwd,
      spec: SPEC,
    });
    // Post-elevation repo state holds exactly ONE source form per agent:
    // the step-1 config-IR form is gone…
    expect(existsSync(join(cwd, 'step1-agent.md'))).toBe(false);
    // …and the vector present, additive/no-loss: the archetype NL recoverable
    // from the vector (REC ≽, checked by the exemplify accept gate).
    const vectorModule = join(cwd, 'agents', 'reviewer.ts');
    expect(existsSync(vectorModule)).toBe(true);
    expect(canonicalText(readFileSync(vectorModule, 'utf8'))).toContain(
      canonicalText(STEP1_PERSONA),
    );
    // A spec that would LOSE the step-1 content refuses — and the source
    // survives (replacement never precedes recoverability).
    writeFileSync(join(cwd, 'step1b.md'), STEP1_PERSONA, 'utf8');
    expect(() =>
      elevateAgent({
        sourcePath: join(cwd, 'step1b.md'),
        outDir: cwd,
        spec: { name: 'reviewer2', dimensions: inheritAll() },
      }),
    ).toThrow(/REC/);
    expect(existsSync(join(cwd, 'step1b.md'))).toBe(true);
  },
);
