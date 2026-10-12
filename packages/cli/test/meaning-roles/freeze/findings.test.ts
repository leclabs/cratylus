import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import type { Fixture } from '../../agent-launch/fixture.js';
import {
  admittedCommit,
  allowedChange,
  architect,
  attempt,
  clause,
  covers,
  define,
  examplePath,
  fileRoutes,
  freezeChecks,
  frozenCut,
  heldOutCheck,
  heldOutText,
  journalEntry,
  judgmentFolder,
  notesPath,
  outsiders,
  refs,
  refusedCommit,
  routes,
  settleRefused,
  setup,
  unreadableRefused,
  working,
  write,
} from './fixture.js';

let f: Fixture;
afterEach(() => f?.dispose());

// 0125: a held-out check freezes like a visible one, only by the freeze act
// that names it once it has been seen to fail; the judgment folder is never
// frozen by implication; held-out example text is frozen from the cut's opening.
it('workflow/31 — 0125: held-out text is frozen from opening; a held-out check only once the freeze act names it', () => {
  f = setup();
  const revised = (who: string) =>
    `${working(f, heldOutCheck)}// revised by ${who}\n`;
  refusedCommit(f, 'check-writer', 'commit', heldOutText);
  // Opened, no check frozen: the held-out check is the check-writer's to write.
  clause('view', 'held-out check unfrozen at opening', () =>
    expect(covers(frozenCut(f)!.checks, heldOutCheck)).toBe(false),
  );
  admittedCommit(
    f,
    'check-writer',
    'commit',
    heldOutCheck,
    revised('check-writer'),
  );
  // The visible checks frozen: still not the held-out check, nor its folder.
  freezeChecks(f);
  clause('view', 'held-out check unfrozen by the visible freeze', () => {
    const frozen = frozenCut(f)!;
    expect(covers(frozen.checks, heldOutCheck), 'never by implication').toBe(
      false,
    );
    expect(covers(frozen.checks, `${judgmentFolder}second.test.ts`)).toBe(
      false,
    );
  });
  admittedCommit(
    f,
    'check-writer',
    'commit',
    heldOutCheck,
    revised('check-writer again'),
  );
  admittedCommit(
    f,
    'check-writer',
    'commit',
    `${judgmentFolder}second.test.ts`,
    working(f, heldOutCheck),
  );
  refusedCommit(f, 'check-writer', 'commit', heldOutText);
  // Seen to fail, named by the freeze act: now frozen to all but the architect.
  freezeChecks(f, [heldOutCheck]);
  clause('view', 'held-out check frozen once named', () =>
    expect(covers(frozenCut(f)!.checks, heldOutCheck)).toBe(true),
  );
  for (const route of routes)
    refusedCommit(f, 'check-writer', route, heldOutCheck);
  for (const agent of outsiders)
    refusedCommit(f, agent, 'commit', heldOutCheck);
  admittedCommit(f, architect, 'commit', heldOutCheck, revised(architect));
});

// A journal entry written straight into the journal's folder meets the record
// at the commit, as the journal's own append meets it before appending.
it('workflow/24, workflow/25 — a supersession or retirement of frozen renewal written into the journal is refused at the commit', () => {
  f = setup();
  freezeChecks(f);
  const supersede = journalEntry(f, 'supersede');
  for (const agent of outsiders)
    for (const route of fileRoutes)
      refusedCommit(f, agent, route, supersede.path, supersede.text, [
        supersede.path,
      ]);
  const retire = journalEntry(f, 'retire');
  for (const agent of outsiders)
    refusedCommit(f, agent, 'commit', retire.path, retire.text, [retire.path]);
  // Not frozen: another concept's entry, and the architect's own.
  define(f, 'library', 'opening-hours', 'The times patrons may enter.');
  const hours = journalEntry(f, 'supersede', 'opening-hours');
  admittedCommit(f, 'lead', 'commit', hours.path, hours.text);
  admittedCommit(f, architect, 'commit', supersede.path, supersede.text);
});

// A freeze that cannot be read refuses rather than lets through: an unreadable
// ledger entry, or a not-integrated cut's examples file missing.
const unreadable = [
  [
    'an unreadable ledger entry',
    (g: Fixture) =>
      write(g, `design/ledger/01${'Z'.repeat(24)}.json`, '{ not json'),
  ],
  [
    "the cut's examples file missing",
    (g: Fixture) => rmSync(join(g.cwd, examplePath), { force: true }),
  ],
] as const;
for (const [what, spoil] of unreadable) {
  it(`workflow/31, workflow/32, workflow/33, workflow/36 — ${what}: every branch update is refused`, () => {
    f = setup();
    freezeChecks(f);
    // Readable, nothing frozen is touched: admitted.
    admittedCommit(f, 'lead', 'commit', notesPath);
    for (const agent of ['lead', architect]) {
      // Settling a refused attempt restores tracked files; spoil it afresh.
      spoil(f);
      const before = refs(f);
      try {
        clause('refusal', `${agent} commit ${notesPath}, freeze unread`, () => {
          const result = attempt(
            f,
            agent,
            'commit',
            notesPath,
            `Notes by ${agent}, freeze unread.\n`,
          );
          expect(
            result.code,
            `${agent}: an unread freeze refuses: ${result.stderr}${result.stdout}`,
          ).not.toBe(0);
          expect(refs(f)).toEqual(before);
        });
      } finally {
        settleRefused(f);
      }
    }
  });
  it(`workflow/24, workflow/25 — ${what}: every journal supersede and retire is refused before appending`, async () => {
    f = setup();
    define(f, 'library', 'opening-hours', 'The times patrons may enter.');
    // Readable: a concept no cut freezes is the lead's to change.
    allowedChange(f, 'lead', 'supersede', 'library', 'opening-hours');
    spoil(f);
    await unreadableRefused(f, 'lead', 'supersede', 'opening-hours');
    await unreadableRefused(f, 'lead', 'retire', 'opening-hours');
    await unreadableRefused(f, architect, 'supersede', 'renewal');
    await unreadableRefused(f, architect, 'retire', 'renewal');
  });
}
