/**
 * E6.S4 — ambiguous dimension value ⇒ `ELICIT:` marker, never an invented answer.
 *
 * GRADUATED: the elevation frame ships in `src/core/exemplify/`. The fixture
 * is silent on `autonomy`, `satisficing`, and `memory`; the SPEC (the LLM
 * pass's output) marks exactly those dimensions as elicitations — ≥ 2 candidates
 * + the one bisecting question (/elicit's information-gain law) — and the
 * frame renders machine-greppable `ELICIT:` markers plus the sidecar script,
 * with ZERO enum values at the silent dimensions. The negative leg shows the
 * never-invent law biting: a concrete value whose evidence does not trace to
 * the source (an invented answer) refuses.
 */

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';

import {
  type DimensionPlan,
  type ElevationSpec,
  ExemplifyRefusal,
  elevateAgent,
} from '../../../src/core/exemplify/index.js';
import {
  FIXTURE_DIMENSION_NAMES,
  FIXTURE_MANIFEST,
  type FixtureDimension,
} from '../../fixture-manifest.js';
import { makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

/** Silent on autonomy, satisficing, memory — says nothing about supervision
 * levels, stopping rules, or persistence. */
const SILENT_DESCRIPTION = `A code-review agent. Formal in tone, always
explains its reasoning step by step, works on TypeScript codebases, and
reports findings as fenced review blocks.`;

const SILENT_DIMENSIONS = ['autonomy', 'satisficing', 'memory'] as const;

const inheritAll = (): Record<FixtureDimension, DimensionPlan> =>
  Object.fromEntries(
    FIXTURE_DIMENSION_NAMES.map((o) => [
      o,
      { kind: 'inherit' } satisfies DimensionPlan,
    ]),
  ) as Record<FixtureDimension, DimensionPlan>;

/** The stated dimensions, evidence-quoted; the silent three as elicitations.
 *  `archetype` is a plain identity field now (D13), not an `Dimension` fragment —
 *  the frame would refuse it as an unknown dimension key — so the raw NL
 *  (replacement no-loss, REC ≽) is instead carried verbatim on `objective`
 *  (an `open` scalar dimension). */
const SPEC: ElevationSpec = {
  name: 'reviewer',
  dimensions: {
    ...inheritAll(),
    objective: {
      kind: 'value',
      fragments: [{ slug: 'code-reviewer', definiens: SILENT_DESCRIPTION }],
      evidence: { type: 'quote', note: SILENT_DESCRIPTION },
    },
    formality: {
      kind: 'value',
      fragments: [{ slug: 'formal', definiens: 'the formal register' }],
      evidence: { type: 'quote', note: 'Formal in tone' },
    },
    transparency: {
      kind: 'value',
      fragments: [
        {
          slug: 'reasoning-trace',
          definiens: 'expose the step-by-step derivation',
        },
      ],
      evidence: { type: 'quote', note: 'explains its reasoning step by step' },
    },
    'output-format': {
      kind: 'value',
      fragments: [
        {
          slug: 'fenced-review',
          definiens: 'findings emitted as fenced review blocks',
        },
      ],
      evidence: { type: 'quote', note: 'reports findings as fenced review' },
    },
    autonomy: {
      kind: 'elicit',
      candidates: ['human-on-the-loop', 'human-in-the-loop'],
      question:
        'may the agent act on standing intent without pre-approval of each step?',
    },
    satisficing: {
      kind: 'elicit',
      candidates: ['optimize', 'satisfice'],
      question: 'pick the highest-value option, or the first sufficient one?',
    },
    memory: {
      kind: 'elicit',
      candidates: ['long-term-memory', 'session-only'],
      question: 'should what it learns persist across sessions?',
    },
  },
};

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
  writeFileSync(join(cwd, 'agent-description.md'), SILENT_DESCRIPTION, 'utf8');
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E6.S4',
  'the emitted vector carries greppable ELICIT: markers at exactly the silent dimensions, each with a bisecting elicitation script',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    elevateAgent({
      sourcePath: join(cwd, 'agent-description.md'),
      outDir: cwd,
      spec: SPEC,
      manifest: FIXTURE_MANIFEST,
    });
    const vectorFile = join(cwd, 'agents', 'reviewer.ts');
    expect(existsSync(vectorFile)).toBe(true);
    const src = readFileSync(vectorFile, 'utf8');
    // The literal marker, machine-greppable, at exactly the silent dimensions.
    for (const dimension of SILENT_DIMENSIONS) {
      expect(src).toMatch(new RegExp(`${dimension}[\\s\\S]{0,120}ELICIT:`));
    }
    expect(src.match(/ELICIT:/g) ?? []).toHaveLength(SILENT_DIMENSIONS.length);
    // A companion elicitation script per marker: ≥2 candidates + 1 question.
    const scriptFile = join(cwd, 'agents', 'reviewer.elicit.json');
    expect(existsSync(scriptFile)).toBe(true);
    const script = JSON.parse(readFileSync(scriptFile, 'utf8')) as Record<
      string,
      { candidates?: string[]; question?: string }
    >;
    for (const dimension of SILENT_DIMENSIONS) {
      const entry = script[dimension];
      expect(
        entry,
        `no elicitation entry for silent dimension '${dimension}'`,
      ).toBeDefined();
      expect(entry?.candidates?.length ?? 0).toBeGreaterThanOrEqual(2);
      expect(typeof entry?.question).toBe('string');
    }
  },
);

story(
  'E6.S4',
  'negative: a pipeline run that invents a concrete enum value for a silent dimension fails',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    // Silence becomes a question, never a guess: a concrete value at a
    // silent dimension cannot trace to the source — the frame refuses it (an
    // unfounded quote is an invented value) and leaves the source intact.
    const invented: ElevationSpec = {
      name: 'reviewer',
      dimensions: {
        ...SPEC.dimensions,
        autonomy: {
          kind: 'value',
          fragments: [
            {
              slug: 'human-on-the-loop',
              definiens: 'acts autonomously on the operator’s behalf',
            },
          ],
          evidence: { type: 'quote', note: 'acts autonomously' },
        },
      },
    };
    expect(() =>
      elevateAgent({
        sourcePath: join(cwd, 'agent-description.md'),
        outDir: cwd,
        spec: invented,
        manifest: FIXTURE_MANIFEST,
      }),
    ).toThrow(ExemplifyRefusal);
    expect(existsSync(join(cwd, 'agent-description.md'))).toBe(true);
    // The accepted vector holds NO concrete enum value at any silent dimension:
    // the only admissible forms are null-with-marker or the sidecar list.
    elevateAgent({
      sourcePath: join(cwd, 'agent-description.md'),
      outDir: cwd,
      spec: SPEC,
      manifest: FIXTURE_MANIFEST,
    });
    const vectorFile = join(cwd, 'agents', 'reviewer.ts');
    expect(existsSync(vectorFile)).toBe(true);
    const src = readFileSync(vectorFile, 'utf8');
    for (const dimension of SILENT_DIMENSIONS) {
      expect(src).not.toMatch(
        new RegExp(`dimension:\\s*'${dimension}'[\\s\\S]{0,80}slug:`),
      );
    }
  },
);
