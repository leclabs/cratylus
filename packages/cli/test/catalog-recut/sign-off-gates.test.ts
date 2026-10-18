// sign-off-gates (rulings 0250-0257): the architect's and lead's values hold by scope,
// decisive on what each owns and waiting at the operator's hold points, stated through which
// values each takes and their notes, never by a new cell; reviewers take held-out
// examples directly from where the architect keeps them.
import { afterEach, describe, expect, it } from 'vitest';
import { canon, composedRole, consumer, vectorOf } from './fixture.js';
import { anchorOf, requireDefined, roleNames } from './master.js';

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});
function rendered(...names: string[]): Record<string, string[]> {
  const fixture = consumer();
  cleanups.push(() => fixture.dispose());
  fixture.projectCanon();
  return Object.fromEntries(
    names.map((name) => [
      name,
      fixture
        .declaration(name)
        .body.split(/\r?\n/)
        .map((line) => line.trim()),
    ]),
  );
}
const lineStarting = (lines: readonly string[] | undefined, prefix: string) =>
  requireDefined(lines, 'rendered body').filter((line) =>
    line.startsWith(prefix),
  );

const signOffLine =
  "- sign-off (the operator's, at its hold points, which are a user story's read-back, a story's plan read-back, a change it has asked to review before it joins, release, a fork that is irreversible, about value or beyond the architect's competence, and any hold point it calls: agreeing that a handoff serves its intent): **R** (puts its handoffs up for it; takes it only where delegation of authority grants it) — recommends";

describe('sign-off-gates: agent values by scope', () => {
  it("sign-off is an optional decision-rights slot, the operator's class of decision", () => {
    expect(canon.MANIFEST['decision-rights']).toHaveProperty('slots.7', {
      name: 'sign-off',
      gloss:
        "the operator's, at its hold points, which are a user story's read-back, a story's plan read-back, a change it has asked to review before it joins, release, a fork that is irreversible, about value or beyond the architect's competence, and any hold point it calls: agreeing that a handoff serves its intent",
      optional: true,
    });
  });

  it('only the architect, its personas and the lead state sign-off, by delegation of authority alone', () => {
    const holders = ['architect', 'kino', 'nico', 'mav', 'lead'];
    for (const [name, lines] of Object.entries(
      rendered(...roleNames, 'kino', 'nico', 'mav'),
    ))
      expect(lineStarting(lines, '- sign-off ('), name).toEqual(
        holders.includes(name) ? [signOffLine] : [],
      );
  });

  it('the architect and lead hold autonomy by scope: principal over what each decides, in the loop at hold points, on the loop between them', () => {
    const bodies = rendered('architect', 'lead');
    for (const [name, principalScope] of [
      ['architect', 'in meaning'],
      ['lead', 'in realization'],
    ] as const)
      expect(
        requireDefined(bodies[name], name).filter((line) =>
          /^- \*\*(principal|human-in-the-loop|human-on-the-loop|mission-command)\*\*/.test(
            line,
          ),
        ),
        name,
      ).toEqual([
        `- **principal** (${principalScope}) — holds final authority within its remit`,
        "- **human-in-the-loop** (at the operator's hold points) — a person approves before it acts",
        '- **human-on-the-loop** (between hold points, and at one whose sign-off delegation of authority grants it) — acts on its own; a person oversees and can intervene',
        '- **mission-command** (between hold points) — escalates only a fork that is irreversible, about value, or beyond its competence',
      ]);
  });

  it('the architect is decisive on what it owns and waits at its hold points', () => {
    const lines = rendered('architect').architect;
    for (const prefix of [
      '- **architect** — ',
      '- stopping-rule: **optimize** (only up to the next hold point) — ',
      "- **rectify** (maps the operator's wording of a concept to its most precise established name, and asks the operator when a request's scope is unclear) — ",
      "- **reconstitution** — at every start, reads the concept journal's design",
      '- **decisive** — ',
      '- ordering (the sequence a reply presents its content in): **bottom-line-up-front** — ',
      "- **read-back** (a user story's is a hold point: the story starts on the operator's sign-off of it) — ",
    ])
      expect(lineStarting(lines, prefix), prefix).toHaveLength(1);
  });

  it("the lead decides how a user story is split and staffed and holds the plan and the operator's review as hold points", () => {
    const lines = rendered('lead').lead;
    for (const prefix of [
      '- **orchestrator-workers** (how a user story is split into tasks and how many builders it takes being its own; its plan read-back a hold point, which a task with no story skips unless the operator calls it) — ',
      "- **ship-show-ask** (the user story states which its risk picks, and for a task with no story it picks by risk; where the operator has asked to review a change before it joins, the operator's review is that change's code review, and the change joins on the operator's sign-off, a hold point it holds) — ",
      '- **decisive** — ',
    ])
      expect(lineStarting(lines, prefix), prefix).toHaveLength(1);
  });

  it("where the operator has asked to review a change, the operator's review is its code review (0292)", () => {
    const [reviewerLine] = lineStarting(
      rendered('reviewer').reviewer,
      '- **reviewer** — ',
    );
    expect(reviewerLine).toContain(
      "a change the operator has asked to review is the operator's to review",
    );
  });

  it('reviewers take held-out examples from design/held-out/ directly; the lead and builder never mention them', () => {
    expect(
      requireDefined(
        vectorOf(composedRole('reviewer')).perceptionScope,
        'reviewer.perceptionScope',
      ).find((entry) => anchorOf(entry.value) === 'held-out-examples')?.note,
    ).toBe('taken directly from design/held-out/');
    const bodies = rendered('reviewer', 'lead', 'builder');
    expect(
      lineStarting(
        bodies.reviewer,
        '- **review-request** (its held-out examples taken directly from design/held-out/) — ',
      ),
    ).toHaveLength(1);
    for (const name of ['lead', 'builder'])
      expect(requireDefined(bodies[name], name).join('\n'), name).not.toMatch(
        /held-out|held out/i,
      );
  });
});
