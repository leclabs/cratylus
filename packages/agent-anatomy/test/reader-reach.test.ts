// READER-REACH gate — `extend-reach`: the reader binding ρ enforced past the
// static corpus, over the two runtime frontiers of the READER BINDING lists
// (`src/skills/signify.ts`):
//
//   1. CONSUMER-GENERATED artifacts — what the generating skills (praxis ·
//      create-agent · dream · exemplify) emit on consumer hosts. Fixtures under
//      `test/fixtures/generated/` were produced 2026-07-01 on fresh consumer
//      projects by the skills AS CODIFIED (each cell now carries the ρ=LLM
//      discipline in its own laws) and pinned here; each must conform.
//   2. AGENT↔AGENT messages — delegation prompts + subagent returns, ρ=LLM by
//      standing rule (codified: `organs/actions/delegation.ts` definiens; the
//      dispatch/judge laws in `skills/praxis.ts`; `conform(k)` in exemplify's
//      `valid`). The codification is asserted non-regressable below.
//
// Shares ONE model with reader-density.test.ts: `reader-register.ts` (ρ · the
// deterministic register witness · conform). FALSIFIERS: a seeded long-form-
// English delegation prompt FAILS conform with named signals; the same text as
// a generated-human-output is exempt BY THE MODEL; every pinned generated
// fixture PASSES.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { delegation } from '../src/organs/actions/delegation.js';
import { exemplify } from '../src/skills/exemplify.js';
import { praxis } from '../src/skills/praxis.js';
import {
  type ArtClass,
  conform,
  humanRegisterSignals,
  registerOf,
} from './reader-register.js';

const fixturesRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'generated',
);

/** fixture file → its artifact class (ρ per the READER BINDING lists). */
const FIXTURES: Record<string, ArtClass> = {
  'task-file.md': 'task-file',
  'task-file-dep.md': 'task-file',
  'plan-mirror.md': 'plan-mirror',
  'delegation-prompt.md': 'delegation-prompt',
  'subagent-return.md': 'subagent-return',
  'agent-vector.md': 'generated-agent-artifact',
  'memory.md': 'agent-memory',
  'agents-directives.md': 'generated-agent-artifact',
  'exemplify-cell.md': 'generated-agent-artifact',
};

describe('READER-REACH gate — ρ past the static corpus', () => {
  // ── frontier 1: consumer-generated artifacts ─────────────────────────────────
  it('every pinned generated artifact conforms (one per generating skill)', () => {
    const present = readdirSync(fixturesRoot).sort();
    expect(present).toEqual(Object.keys(FIXTURES).sort()); // none missing, none unclassified
    const failures = Object.entries(FIXTURES)
      .map(([f, cls]) => ({
        f,
        cls,
        signals: humanRegisterSignals(
          readFileSync(join(fixturesRoot, f), 'utf8'),
        ),
      }))
      .filter(
        ({ cls, f }) =>
          !conform(cls, readFileSync(join(fixturesRoot, f), 'utf8')),
      )
      .map(
        ({ f, cls, signals }) =>
          `GENERATED ${f} (${cls}): ρ=LLM but register=human — ${signals.join(' · ')}`,
      );
    expect(failures, failures.join('\n')).toEqual([]);
  });

  // ── frontier 2: agent↔agent — the falsifier bites ────────────────────────────
  const humanDelegationSeed =
    'Hi! Could you please take a look at the gateway service when you get a ' +
    'chance? Basically what we need is a health endpoint, and you should make ' +
    'sure that it returns 200 when everything is fine. Note that the probe ' +
    'config also needs updating — in other words, feel free to touch the ' +
    'deployment yaml too. It is important that you keep the response fast. ' +
    'Let us know how it goes!';

  it('FAILS a seeded long-form-English delegation prompt, with named signals', () => {
    const signals = humanRegisterSignals(humanDelegationSeed);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.join(' ')).toContain('HEDGE');
    expect(conform('delegation-prompt', humanDelegationSeed)).toBe(false);
    expect(conform('subagent-return', humanDelegationSeed)).toBe(false);
  });

  it('EXEMPTS the same text as a generated-human-output — by the model, not a path', () => {
    expect(registerOf(humanDelegationSeed)).toBe('human'); // still witnessed…
    expect(conform('generated-human-output', humanDelegationSeed)).toBe(true); // …ρ exempts
  });

  it('the pinned delegation-prompt fixture PASSES the same check (the contract is satisfiable)', () => {
    const dense = readFileSync(
      join(fixturesRoot, 'delegation-prompt.md'),
      'utf8',
    );
    expect(humanRegisterSignals(dense)).toEqual([]);
  });

  // ── the codification homes are standing law, not per-turn discretion ─────────
  it('the delegation organ + fan-out cells carry the ρ=LLM contract (non-regressable)', () => {
    expect(delegation.definiens).toMatch(/ρ=LLM/);
    expect(delegation.definiens).toMatch(/register=LLM/);
    expect(praxis.formalBlock).toContain('conform(a) ⇔ register(a) = ρ(a)');
    expect(praxis.formalBlock).toContain('¬conform(r) ⇒ ¬accept(t)(r)');
    expect(exemplify.formalBlock).toContain('conform(k)');
    expect(exemplify.formalBlock).toMatch(/valid\(k\)\s+⇔.*conform\(k\)/);
  });
});
