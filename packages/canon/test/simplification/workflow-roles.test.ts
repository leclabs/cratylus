// workflow · roles (decisions 0145, 0243): the roles concept states what each party
// receives and hands over, no limit on whom a party may dispatch and no test of how its
// behaviour is judged; each delivered role still names its sight, change and decision;
// and nothing delivered refuses the architect an act on the ground of how it behaves or
// replies.
//
// The roles as delivered are the role cells canon ships, each projected as the
// declaration of the agent holding it; the concept itself as cratylus's own journal
// command reads it from this repository's design.

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as canon from '../../src/index.js';
import { refusedActs } from './support/acts.js';
import { cleanScratch, cratylus, git, scratchDir } from './support/cli.js';
import type { StandIn } from './support/omp-stand-in.js';
import {
  type Projection,
  projection,
  sectionOf,
} from './support/projection.js';
import { ROOT } from './support/repo.js';

let p: Projection;
let cwd: string;
beforeAll(() => {
  p = projection();
  cwd = scratchDir('simplification-roles-');
  git(cwd, 'init', '-q', '-b', 'feature/lantern');
  git(
    cwd,
    '-c',
    'user.name=f',
    '-c',
    'user.email=f@e',
    'commit',
    '-q',
    '--allow-empty',
    '-m',
    'start',
  );
}, 120_000);
const open: StandIn[] = [];
afterEach(() => {
  for (const s of open.splice(0)) s.close();
});
afterAll(cleanScratch);

/** The role cells canon delivers: every export that states a role's values. */
const roleCells = Object.values(canon).filter(
  (v): v is canon.RoleCell =>
    v !== null &&
    typeof v === 'object' &&
    'name' in v &&
    'values' in v &&
    typeof v.values === 'object' &&
    v.values !== null &&
    'decisionRights' in v.values,
);

/** A test of behaviour named in an evaluation: a scenario, rubric, score, assertion,
 *  held-out case, suite, recording, a check or a test. */
const BEHAVIOUR_TEST =
  /\bscenarios?\b|\brubrics?\b|\bscored?\b|\bassertions?\b|\bheld[- ]out\b|\bsuites?\b|\brecord(ed|ings?)\s+runs?\b|\brecordings?\b|\bchecked\b|\btest(s|ed)?\b/i;

describe('workflow/7 — the roles concept names sight, change and decision, and no dispatch limit or behaviour test', () => {
  it('workflow/7: canon delivers the six roles', () => {
    expect(roleCells.map((r) => r.name).sort()).toEqual([
      'architect',
      'builder',
      'check-writer',
      'illustrator',
      'lead',
      'reviewer',
    ]);
  });

  it("workflow/7: each delivered role names its party's sight, change and decision", () => {
    for (const r of roleCells) {
      expect(
        r.values.perceptionScope.length,
        `${r.name} names no sight`,
      ).toBeGreaterThan(0);
      expect(
        r.values.actionScope.length,
        `${r.name} names no change`,
      ).toBeGreaterThan(0);
      expect(
        r.values.decisionRights.length,
        `${r.name} names no decision`,
      ).toBeGreaterThan(0);
    }
  });

  it('workflow/7: no delivered role is limited in whom it may dispatch', () => {
    const limited = p.agents.flatMap((d) => {
      const spawns = d.front.spawns;
      if (spawns === undefined || spawns === null) return [];
      const said = (
        Array.isArray(spawns) ? spawns.join(',') : String(spawns)
      ).trim();
      return said === '*'
        ? []
        : [`${d.name}: may dispatch only ${JSON.stringify(said)}`];
    });
    expect(limited, 'roles limited in whom they dispatch').toEqual([]);
  });

  it('workflow/7: no delivered role states a test of how its behaviour is judged', () => {
    const tested = p.agents.flatMap((d) => {
      const evaluation = sectionOf(d.body, 'evaluation');
      const m = BEHAVIOUR_TEST.exec(evaluation);
      return m === null
        ? []
        : [`${d.name}: "${m[0]}" in ${JSON.stringify(evaluation.trim())}`];
    });
    expect(tested, 'roles whose evaluation names a test of behaviour').toEqual(
      [],
    );
  });

  it('workflow/7: the roles concept, read from the design, names what each party receives and hands over, and no dispatch limit or behaviour test', () => {
    const r = cratylus(ROOT, ['concepts', 'design', '--context', 'workflow']);
    expect(r.status, r.stderr).toBe(0);
    const found =
      /"name":\s*"roles"[^}]*?"(?:wording|meaning)":\s*"([^"]*)"/.exec(
        r.stdout,
      );
    const meaning = found?.[1] ?? '';
    expect(meaning, 'the workflow context has no live roles concept').not.toBe(
      '',
    );
    expect(meaning).toMatch(/\breceives?\b/i);
    expect(meaning).toMatch(/\bhands? over\b/i);
    expect(meaning).not.toMatch(
      /\bdispatch|\bhandoffs? (are|is) held|\bspawn/i,
    );
    expect(meaning).not.toMatch(BEHAVIOUR_TEST);
  });

  it('FLAGS an evaluation naming a test of behaviour, so the reading above is not dark', () => {
    for (const named of [
      'its decisions are run in fixed scenarios several times and checked',
      'its output is scored against a fixed rubric',
      'it is judged also against examples it never saw (held-out)',
      'some things it must never do, checked in every run',
    ])
      expect(named).toMatch(BEHAVIOUR_TEST);
    expect(
      'its behaviour is evaluated in real use, by the operator working with it',
    ).not.toMatch(BEHAVIOUR_TEST);
  });
});

describe('workflow/8 — nothing delivered refuses the architect an act for how it behaves or replies', () => {
  it('workflow/8: no act of an agent holding the architect role is refused, whatever a judge of its behaviour or replies finds', async () => {
    const architects = p.agents.filter(
      (d) =>
        d.name === 'architect' ||
        /\*\*architect\*\*/.test(sectionOf(d.body, 'role')),
    );
    expect(architects.map((d) => d.name)).toContain('architect');
    const refused: string[] = [];
    for (const d of architects)
      refused.push(...(await refusedActs(p, d, cwd, open, ['main'])).refused);
    expect(refused, `architect acts refused:\n${refused.join('\n')}`).toEqual(
      [],
    );
  }, 240_000);
});
