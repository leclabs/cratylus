/**
 * E6.S3 — agent elevation: step-1 persona form → full 24-organ vector, which
 * REPLACES the config-IR agent (two-step agent law, Operator ruling).
 *
 * Documented truth: exemplify+elicit elevates a step-1 agent (raw NL held
 * verbatim on the `persona` organ, E1.S8) to a typed organ-selection vector
 * (anatomy `Agent`): tsc-compiling, all 24 organ keys present, every value a
 * `Fragment` of the correct organ literal or `null`, every non-null value
 * carrying a provenance trace to input evidence; on accept the vector is the
 * agent's single source of truth (a lingering config-IR twin = FAIL) and the
 * step-1 persona content is fully recoverable (REC ≽).
 *
 * Fate split:
 * - the elevation TARGET contract (24-organ vector, arities, axes) is
 *   runtime-introspectable in src/anatomy today: GREEN;
 * - the elevation act and the replacement semantics need the pipeline:
 *   TRACKED via the concrete entrypoint probe.
 */

import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import {
  ANATOMY,
  ORGAN_NAMES,
  type Organ,
  personaToDescription,
} from '../../../src/anatomy/index.js';
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

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
  writeFileSync(join(cwd, 'step1-agent.md'), STEP1_PERSONA, 'utf8');
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story.tracked(
  'E6.S3',
  'exemplify+elicit elevates the step-1 persona to a compiling 24-organ vector with a provenance trace per non-null organ',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    // Documented output, once the pipeline lands: a TS module exporting an
    // anatomy `Agent` — all 24 keys, each a Fragment of the right organ
    // literal or null, plus a sidecar provenance map (quoted span or an
    // explicit inference tag per non-null organ; an untraced value = FAIL).
    const vectorModule = join(cwd, 'agents', 'reviewer.ts');
    expect(existsSync(vectorModule)).toBe(true);
  },
);

story.tracked(
  'E6.S3',
  'replacement semantics: on accept the vector replaces the config-IR agent — no lingering twin, step-1 content recoverable (REC ≽)',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    // Documented: post-elevation repo state holds exactly ONE source form
    // per agent. The step-1 config-IR form must be gone…
    expect(existsSync(join(cwd, 'step1-agent.md'))).toBe(false);
    // …and the vector present, additive/no-loss (the persona NL recoverable
    // from the vector, checked by the exemplify accept gate).
    expect(existsSync(join(cwd, 'agents', 'reviewer.ts'))).toBe(true);
  },
);
