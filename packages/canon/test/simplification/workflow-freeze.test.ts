// workflow · freeze (decision 0143): the freeze is a rule held by review and by the
// record, never a gate. A change to what an opened cut freezes is never refused, by a
// hook or by the journal; the journal records who appended each entry and warns, naming
// the cut, when someone other than its architect changes a frozen concept; and what is
// frozen is the cut's examples, checks and concepts, with no files its checks use.
//
// Driven through cratylus's own command, as built, over scratch repositories these
// checks build themselves, and read off this repository's tracked files.

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  LANTERN,
  allTextUnder,
  cleanScratch,
  cratylus,
  git,
  journalOf,
  lanternRepository,
} from './support/cli.js';
import {
  type Hit,
  hitsIn,
  inScope,
  listed,
  textOf,
  tracked,
} from './support/repo.js';

afterAll(cleanScratch);

const L = LANTERN;
const OTHER = 'stranger';

/** A change to the frozen concept, made by `agent`: the new journal entries, and what
 *  the command said. */
function supersedeAs(repo: string, agent: string) {
  // Whichever the command names an entry's maker by, the acting agent or git's own
  // user, it is this agent.
  git(repo, 'config', 'user.name', agent);
  const before = journalOf(repo);
  const r = cratylus(
    repo,
    [
      'concepts',
      'supersede',
      L.concept,
      '--context',
      L.context,
      '--wording',
      // The wording names no one, so a name in the entry is the record of its maker.
      'A berth held for one boat.',
      '--reason',
      'Sharper.',
    ],
    { agent },
  );
  const after = journalOf(repo);
  const added = Object.keys(after)
    .filter((f) => !(f in before))
    .map((f) => after[f] as string);
  return { ...r, said: `${r.stdout}\n${r.stderr}`, added };
}

/** The warnings an answer carries as JSON, when it carries any. */
function warningsIn(stdout: string): unknown[] {
  try {
    const answer: unknown = JSON.parse(stdout);
    if (answer !== null && typeof answer === 'object' && 'warnings' in answer)
      return Array.isArray(answer.warnings)
        ? answer.warnings
        : [answer.warnings];
  } catch {
    // not JSON: nothing carried
  }
  return [];
}

describe('workflow/4 — a non-architect changing a frozen concept is recorded by name and warned, never refused', () => {
  it("workflow/4: the append is recorded, with its maker's name, and a warning naming the cut is shown", () => {
    const repo = lanternRepository();
    const r = supersedeAs(repo, OTHER);
    expect(r.status, `the append was refused: ${r.stderr}`).toBe(0);
    expect(r.added, 'no journal entry was recorded').toHaveLength(1);
    expect(r.added[0], 'the entry does not name who made it').toContain(OTHER);
    expect(r.said, 'no warning naming the cut was shown').toContain(L.cut);
  });
});

describe('workflow/6 — the architect changing a frozen concept is recorded by name, unwarned', () => {
  it("workflow/6: the architect's append is recorded with the architect's name and no warning", () => {
    const repo = lanternRepository();
    const r = supersedeAs(repo, L.architect);
    expect(r.status, `the append was refused: ${r.stderr}`).toBe(0);
    expect(r.added, 'no journal entry was recorded').toHaveLength(1);
    expect(
      r.added[0],
      'the entry does not name the architect who made it',
    ).toContain(L.architect);
    expect(r.said, 'the architect was warned about the cut').not.toContain(
      L.cut,
    );
    expect(warningsIn(r.stdout), 'the architect was given warnings').toEqual(
      [],
    );
    expect(r.stderr.trim(), 'the architect was told something on stderr').toBe(
      '',
    );
  });
});

describe('workflow/5 — what a cut freezes is its examples, checks and concepts, and no files its checks use', () => {
  it('workflow/5: the frozen view lists the examples, checks and concepts, and nothing a check uses', () => {
    const repo = lanternRepository({ frozenCheck: true });
    const r = cratylus(repo, ['workPackage', 'frozen']);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain(L.examples);
    expect(r.stdout).toContain(L.check);
    expect(r.stdout).toContain(L.concept);
    expect(
      r.stdout,
      'the frozen view lists a file the frozen check uses',
    ).not.toContain('berth-helper');
    expect(
      r.stdout,
      'the frozen view keeps a list of what checks use',
    ).not.toMatch(/"uses"\s*:/);
  });

  it('workflow/5: nothing records or tracks the files a frozen check uses', () => {
    const repo = lanternRepository({ frozenCheck: true });
    expect(
      allTextUnder(repo, 'design/ledger'),
      'the ledger records a file the check uses',
    ).not.toContain('berth-helper');
    // What the work package capability says of itself: no verb tracks what a check uses.
    const explained = cratylus(repo, ['workPackage', '--explain']);
    expect(explained.status, explained.stderr).toBe(0);
    expect(
      explained.stdout,
      'the capability says it tracks the files its checks use',
    ).not.toMatch(
      /files? (its|the|a) (frozen )?checks? uses?|relative imports/i,
    );
  });
});

/** Anything that installs, runs or describes a reference-transaction hook. */
const REFERENCE_TRANSACTION = /reference[-_ ]transaction/i;

/** Every in-scope tracked file naming a reference-transaction hook. */
const referenceTransactionHits = (paths: readonly string[]): Hit[] =>
  paths.flatMap((path) => {
    const text = textOf(path) ?? '';
    return [
      ...(/(^|\/)reference-transaction$/.test(path)
        ? [{ path, line: 0, match: 'a reference-transaction hook file' }]
        : []),
      ...hitsIn(path, text, REFERENCE_TRANSACTION),
    ];
  });

describe('workflow/3 — a commit changing what a cut freezes is moved by any route, and no hook refuses it', () => {
  it('workflow/3: no reference-transaction hook is installed, shipped or described, in the delivered project or this repository', () => {
    const hits = referenceTransactionHits(tracked().filter(inScope));
    expect(hits, `reference-transaction hooks:\n${listed(hits)}`).toEqual([]);
  });

  it('FLAGS a tracked hook file and an install script naming one, so the scan above is not dark', () => {
    expect(
      referenceTransactionHits(['.husky/reference-transaction']),
    ).not.toEqual([]);
    expect(
      hitsIn(
        'package.json',
        'cp pre-commit .husky/_/reference-transaction',
        REFERENCE_TRANSACTION,
      ),
    ).not.toEqual([]);
  });

  it('workflow/3: no hook this repository tracks judges a change against the freeze', () => {
    const hooks = tracked().filter(
      (p) => p.startsWith('.husky/') || p.startsWith('.githooks/'),
    );
    const judging = hooks.flatMap((path) =>
      hitsIn(path, textOf(path) ?? '', /\bfreeze|\bfrozen/i),
    );
    expect(judging, `hooks judging the freeze:\n${listed(judging)}`).toEqual(
      [],
    );
  });

  it("workflow/3: a non-architect's commit changing a frozen example and check moves onto the cut's branch, the delivered command refusing none of it", () => {
    const repo = lanternRepository({ frozenCheck: true });
    const tip = git(repo, 'rev-parse', 'HEAD');
    git(repo, 'checkout', '-qb', 'side');
    writeFileSync(
      join(repo, L.examples),
      '1. (mooring) **Given** anything, **then** it passes.\n',
    );
    writeFileSync(join(repo, L.check), "it('harbour/1', () => {});\n");
    git(repo, 'add', '-A');
    execFileSync(
      'git',
      ['commit', '-qm', 'loosen the frozen example and check'],
      {
        cwd: repo,
        env: { ...process.env, CRATYLUS_AGENT: OTHER },
      },
    );
    const changed = git(repo, 'rev-parse', 'HEAD');
    // As git runs a reference-transaction hook, with the update on its stdin: the
    // delivered command no longer offers it, or lets it through.
    const asHook = cratylus(repo, ['freeze-gate', 'prepared'], {
      agent: OTHER,
      input: `${tip} ${changed} refs/heads/${L.branch}\n`,
    });
    expect(
      asHook.status === 0 || /unknown command/i.test(asHook.stderr),
      `the delivered command refused the update: ${asHook.stderr}`,
    ).toBe(true);
    git(repo, 'update-ref', `refs/heads/${L.branch}`, changed);
    expect(git(repo, 'rev-parse', L.branch)).toBe(changed);
  });
});
