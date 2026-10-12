// agents · drift (decision 0142(1)): every delivered agent's profile states that its
// behaviour is evaluated in real use, and none names a live suite or a recorded-run
// proof. Read from the profiles as projected for the harness.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanScratch } from './support/cli.js';
import { type Projection, projection } from './support/projection.js';

let p: Projection;
beforeAll(() => {
  p = projection();
}, 120_000);
afterAll(cleanScratch);

/** A statement that behaviour is evaluated in real use. */
const IN_REAL_USE =
  /\b(real|actual|everyday)[- ]use\b|\b(evaluat|judg|assess)\w*\b[^.\n]{0,120}\bin use\b/i;

/** A live suite or recorded-run proof, by any of the names the repository has used. */
const LIVE_OR_RECORDED =
  /\blive[- ](agent[- ])?(suites?|runs?|sessions? suites?|batch(es)?|tests?|evaluations?)\b|\brecorded[- ]runs?\b|\brun[- ]recordings?\b|\brecordings?\b|\boffline[- ]proofs?\b|\bfixed scenarios\b|\bbehaviou?ral[- ]examples\b|\bnever[- ]assertions\b/i;

describe('agents/8 — each delivered profile states it is evaluated in real use, naming no live suite or recorded run', () => {
  it('agents/8: every delivered profile states its behaviour is evaluated in real use', () => {
    const silent = p.agents
      .filter((d) => !IN_REAL_USE.test(d.body))
      .map((d) => d.name);
    expect(silent, 'profiles that never state evaluation in real use').toEqual(
      [],
    );
  });

  it('agents/8: no delivered profile names a live suite or a recorded-run proof', () => {
    const naming = p.agents.flatMap((d) => {
      const m = LIVE_OR_RECORDED.exec(d.text);
      return m === null ? [] : [`${d.name}: ${m[0]}`];
    });
    expect(
      naming,
      'profiles naming a live suite or recorded-run proof',
    ).toEqual([]);
  });

  it('FLAGS a profile that names a live suite, or never states evaluation in use, so the readings above are not dark', () => {
    expect(
      '- **behavioral-examples** — its decisions are run in fixed scenarios several times and checked',
    ).toMatch(LIVE_OR_RECORDED);
    expect('proved offline against recordings of real runs').toMatch(
      LIVE_OR_RECORDED,
    );
    expect(
      '- **rubric** — its output is scored against a fixed rubric',
    ).not.toMatch(IN_REAL_USE);
    expect(
      '- **in-use** — its behaviour is evaluated in real use, by the operator working with it',
    ).toMatch(IN_REAL_USE);
  });
});
