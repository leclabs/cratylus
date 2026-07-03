/**
 * E6.S3 — agent elevation: step-1 persona form → full 24-organ vector, which
 * REPLACES the config-IR agent (two-step agent law, Operator ruling).
 *
 * GRADUATED: the elevation frame ships in `src/core/exemplify/` (`elevateAgent`).
 * The SPEC below is the LLM exemplify+elicit pass's output over the step-1
 * text (the test plays the operating agent); the frame enforces the
 * mechanical laws: 24-key completeness, never-invent (every concrete value
 * carries a provenance trace — a quote is verified against the source),
 * replacement no-loss (REC ≽: the step-1 NL recoverable from the vector),
 * and single-source replacement (the step-1 file is removed on accept).
 *
 * The elevation TARGET contract (24 organs, arities, axes) stays GREEN via
 * the runtime-introspection companion below.
 */

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import {
  ANATOMY,
  ORGAN_NAMES,
  type Organ,
  personaToDescription,
} from '../../../src/anatomy/index.js';
import {
  type ElevationSpec,
  ExemplifyRefusal,
  ORGAN_FIELD,
  type OrganPlan,
  canonicalText,
  elevateAgent,
  renderAgentVector,
} from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

/** The 24 organ literals the vector must cover (anatomy declaration order). */
const THE_24_ORGANS: readonly Organ[] = [
  'autonomy',
  'persona',
  'role',
  'formality',
  'audience-adaptation',
  'transparency',
  'provenance',
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
  'the elevation target contract is runtime-introspectable: exactly 24 organs, 7 STANCE, 5 set organs',
  () => {
    // The keyset is exactly the 24 organ literals — the completeness law the
    // elevated vector compiles against.
    expect(ORGAN_NAMES).toHaveLength(24);
    expect([...ORGAN_NAMES].sort()).toEqual([...THE_24_ORGANS].sort());
    expect(Object.keys(ANATOMY).sort()).toEqual([...THE_24_ORGANS].sort());
    // Axis split: 7 STANCE / 17 CONATUS.
    const stance = ORGAN_NAMES.filter((o) => ANATOMY[o].axis === 'STANCE');
    expect(stance).toHaveLength(7);
    // Arity: exactly the five documented set organs take arrays.
    const setOrgans = ORGAN_NAMES.filter((o) => ANATOMY[o].arity === 'set');
    expect([...setOrgans].sort()).toEqual([
      'actions',
      'capabilities',
      'engineering-principles',
      'guardrails',
      'heuristics',
    ]);
    // The step-1 → description projection is live (persona carries the raw NL).
    expect(
      personaToDescription({
        organ: 'persona',
        slug: 'raw-import',
        definiens: 'a meticulous reviewer of database migrations',
      }),
    ).toBe('a meticulous reviewer of database migrations');
  },
);

/** A step-1 agent: the foreign NL verbatim on the persona organ (E1.S8). */
const STEP1_PERSONA =
  'A meticulous reviewer agent: reads every migration, flags destructive ' +
  'DDL, prefers small reversible steps, and always explains its reasoning.';

/** Every organ deliberately harness-inherited unless the spec overrides. */
const inheritAll = (): Record<Organ, OrganPlan> =>
  Object.fromEntries(
    ORGAN_NAMES.map((o) => [o, { kind: 'inherit' } satisfies OrganPlan]),
  ) as Record<Organ, OrganPlan>;

/** The LLM exemplify+elicit pass's output: evidence-traced organ selections.
 *  Quotes are verbatim spans of STEP1_PERSONA (the frame verifies). */
const SPEC: ElevationSpec = {
  name: 'reviewer',
  organs: {
    ...inheritAll(),
    persona: {
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
  'exemplify+elicit elevates the step-1 persona to a compiling 24-organ vector with a provenance trace per non-null organ',
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
    // All 24 organ fields present — a value fragment or the explicit null.
    for (const organ of THE_24_ORGANS) {
      expect(src, `organ field for '${organ}' missing`).toMatch(
        new RegExp(`\\b${ORGAN_FIELD[organ]}: `),
      );
    }
    // A provenance trace per non-null organ — exactly the selected set.
    const provenance = JSON.parse(
      readFileSync(join(cwd, 'agents', 'reviewer.provenance.json'), 'utf8'),
    ) as Record<string, { type: string; note: string }>;
    expect(Object.keys(provenance).sort()).toEqual([
      'heuristics',
      'persona',
      'role',
      'transparency',
    ]);
    for (const trace of Object.values(provenance)) {
      expect(['quote', 'inference']).toContain(trace.type);
      expect(trace.note.length).toBeGreaterThan(0);
    }
    // An organ value with no trace to input evidence = FAIL (never-invent).
    expect(() =>
      renderAgentVector(
        {
          name: 'reviewer',
          organs: {
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
    // …and the vector present, additive/no-loss: the persona NL recoverable
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
        spec: { name: 'reviewer2', organs: inheritAll() },
      }),
    ).toThrow(/REC/);
    expect(existsSync(join(cwd, 'step1b.md'))).toBe(true);
  },
);
