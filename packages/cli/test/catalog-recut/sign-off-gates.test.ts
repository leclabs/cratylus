// sign-off-gates (rulings 0250-0257): the architect's and lead's values hold by scope,
// decisive on what each owns and waiting at the operator's gates, stated through which
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
  "- sign-off (the operator's, at its gates, which are a story's read-back, a story's plan read-back, a change it has asked to review before it joins, release, a fork that is irreversible, about value or beyond the architect's competence, and any gate it calls: agreeing that a handover serves its intent): **R** (puts its handovers up for it; takes it only where delegated authority grants it) — recommends (fixed)";

describe('sign-off-gates: agent values by scope', () => {
  it("sign-off is an optional decision-rights slot, the operator's class of decision", () => {
    expect(canon.MANIFEST['decision-rights']).toHaveProperty('slots.7', {
      name: 'sign-off',
      gloss:
        "the operator's, at its gates, which are a story's read-back, a story's plan read-back, a change it has asked to review before it joins, release, a fork that is irreversible, about value or beyond the architect's competence, and any gate it calls: agreeing that a handover serves its intent",
      optional: true,
    });
  });

  it('only the architect, its personas and the lead state sign-off, by delegated authority alone', () => {
    const holders = ['architect', 'kino', 'nico', 'mav', 'lead'];
    for (const [name, lines] of Object.entries(
      rendered(...roleNames, 'kino', 'nico', 'mav'),
    ))
      expect(lineStarting(lines, '- sign-off ('), name).toEqual(
        holders.includes(name) ? [signOffLine] : [],
      );
  });

  it('the architect and lead hold autonomy by scope: principal over what each decides, in the loop at gates, on the loop between them', () => {
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
        `- **principal** (${principalScope}) — holds final authority within its remit (fixed)`,
        "- **human-in-the-loop** (at the operator's gates) — a person approves before it acts (fixed)",
        '- **human-on-the-loop** (between gates, and at a gate whose sign-off delegated authority grants it) — acts on its own; a person oversees and can intervene (fixed)',
        '- **mission-command** (between gates) — escalates only a fork that is irreversible, about value, or beyond its competence (fixed)',
      ]);
  });

  it('the architect is decisive on what it owns and waits at its gates', () => {
    const lines = rendered('architect').architect;
    for (const prefix of [
      "- **architect** (rulings recorded before they are reported and never asking for a go-ahead hold on the decisions it owns; a change's design is recorded with the change it belongs to) — ",
      '- stopping-rule: **optimize** (only up to the next gate) — ',
      "- **rectify** (every input, the operator's included, its restatement read back where it differs; once understood, the operator's intent and technical requirements bind, and its wording of a concept is input to meaning, rectified and never transcribed) — ",
      '- **reconstitution** (at session start it records and changes nothing before its read-back: the current design, then what is open, then the stories and tasks in flight) — ',
      '- **decisive** (on the decisions it owns) — ',
      '- ordering (the sequence a reply presents its content in): **bottom-line-up-front** (never asking agreement to a decision it owns; at a gate the reply ends with the sign-off it waits on) — ',
      "- **read-back** (a story's, held as a gate: the story starts only on the operator's sign-off of it) — ",
    ])
      expect(lineStarting(lines, prefix), prefix).toHaveLength(1);
  });

  it("the lead decides how a story is split and staffed and holds the plan and the operator's review as gates", () => {
    const lines = rendered('lead').lead;
    for (const prefix of [
      '- **orchestrator-workers** (how a story is split into tasks and how many builders it takes being its own; its plan read-back held as a gate, which a task with no story skips unless the operator calls it) — ',
      '- **ship-show-ask** (the story states which its risk picks, and for a task with no story it picks by risk; where the operator has asked to review a change before it joins, that change joins only once the operator signs it off, a gate it holds) — ',
      '- **decisive** (on the decisions it owns; at a gate its reply ends with the sign-off it waits on) — ',
    ])
      expect(lineStarting(lines, prefix), prefix).toHaveLength(1);
  });

  it('reviewers take held-out examples from design/held-out/ directly; the lead and builder never mention them', () => {
    expect(
      requireDefined(
        vectorOf(composedRole('reviewer')).perceptionScope,
        'reviewer.perceptionScope',
      ).find((entry) => anchorOf(entry.value) === 'held-out-examples')?.note,
    ).toBe('taken directly from design/held-out/, never through the lead');
    const bodies = rendered('reviewer', 'lead', 'builder');
    expect(
      lineStarting(
        bodies.reviewer,
        '- **review-request** (its held-out examples taken directly from design/held-out/, never through the lead) — ',
      ),
    ).toHaveLength(1);
    for (const name of ['lead', 'builder'])
      expect(requireDefined(bodies[name], name).join('\n'), name).not.toMatch(
        /held-out|held out/i,
      );
  });
});
