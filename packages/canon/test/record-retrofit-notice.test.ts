// record-retrofit-notice — a rewritten RECORD must say so, in the directory that holds it.
//
// `61b85db7` (`refactor(names)!`) swept the retired brand out of the whole tree, content AND
// paths, and 99 of the files it rewrote were CLOSED RECORDS. A record edited to match today is
// no longer a record — what the sweep took was not the text (git holds every original byte) but
// the reader's knowledge that a substitution happened. `NAMES-RETROFITTED.md` is that knowledge,
// put back.
//
// THE ROSTER SHRANK 17 → 1, and by DELETION, not by repair. `plans/.retired/` — 18 plans, 127
// files, 86 of them retro-fitted — was deleted wholesale to cut the reading surface. The same
// argument that chose marking over restoring applies harder to deletion: git holds every byte,
// so what is gone from the working tree is the reading cost, not the record. What survives here
// is `plans/decomplect/completed/`, which belongs to a LIVE plan and is still read.
//
// Falsifiers:
//
//   (1) CONVICTING — every directory the sweep rewrote carries the notice.
//   (2) EXONERATING — a historical directory the sweep did NOT touch carries NO notice.
//       A notice there would be a false claim, and a checker that can only convict
//       convicts the corpus of its own defects.
//   (3) The notice's own citations RESOLVE: its relative link to the shard that argues it,
//       and the `git show <sha>^:<path>` a reader is told to run. The second needs history,
//       so it reports NOT-CHECKABLE on a shallow clone rather than passing silently —
//       "found nothing" and "could not look" are different answers.
//
// SCOPE, stated because the gate's silence would otherwise read as a coverage claim: this
// pins ONE sweep's roster as data. The general property — no sweep may rewrite a record
// without marking it — is NOT enforced here and has no owner; it needs the sweep itself to
// be a mechanism before a gate can watch it. See
// `plans/decomplect/completed/the-brand-sweep-rewrote-the-record-not-only-the-source.md`.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const NOTICE = 'NAMES-RETROFITTED.md';

/** The sweep whose rewrite this notice records. */
const SWEEP = '61b85db7';

/**
 * The roster, as DATA. Pinned rather than derived, because deriving it needs
 * `git show <SWEEP>` and CI checks out shallow — a git-derived roster would come back
 * EMPTY there and the gate would pass by looking at nothing.
 */
const REWRITTEN: readonly string[] = ['plans/decomplect/completed'];

/** Every closed-record directory under `root`: `plans/.retired/<plan>` ∪ `plans/<plan>/completed`. */
function historicalDirs(root = REPO): string[] {
  const out: string[] = [];
  const retired = join(root, 'plans/.retired');
  if (existsSync(retired)) {
    for (const e of readdirSync(retired, { withFileTypes: true })) {
      if (e.isDirectory()) out.push(`plans/.retired/${e.name}`);
    }
  }
  for (const e of readdirSync(join(root, 'plans'), { withFileTypes: true })) {
    if (!e.isDirectory() || e.name === '.retired') continue;
    if (existsSync(join(root, 'plans', e.name, 'completed'))) {
      out.push(`plans/${e.name}/completed`);
    }
  }
  return out.sort();
}

function notice(dir: string, root = REPO): string {
  return readFileSync(join(root, dir, NOTICE), 'utf8');
}

/**
 * The three checks as PURE FUNCTIONS over a root, so the convicting fixture can feed
 * them a synthetic corpus. A control that exercised a different code path than the live
 * legs would be a demonstration, not a control — these are the same functions.
 */
function unmarked(root: string, roster: readonly string[]): string[] {
  return roster.filter((d) => !existsSync(join(root, d, NOTICE)));
}
function falselyMarked(root: string, roster: readonly string[]): string[] {
  return historicalDirs(root)
    .filter((d) => !roster.includes(d))
    .filter((d) => existsSync(join(root, d, NOTICE)));
}
function danglingLinks(root: string, roster: readonly string[]): string[] {
  return roster.filter((d) => {
    const link = notice(d, root).match(/\]\((\.\.[^)]+)\)/)?.[1];
    return !link || !existsSync(resolve(root, d, link));
  });
}

describe('record-retrofit-notice', () => {
  it('the roster is not empty and every entry is a real directory — the gate can see', () => {
    expect(REWRITTEN.length).toBe(1);
    for (const d of REWRITTEN) {
      expect(
        existsSync(join(REPO, d)),
        `${d} is on the roster and does not exist`,
      ).toBe(true);
    }
  });

  it('(1) every directory the sweep rewrote carries the notice', () => {
    expect(
      unmarked(REPO, REWRITTEN),
      `rewritten records with no ${NOTICE}`,
    ).toEqual([]);
  });

  // Leg (2) — a directory the sweep never touched must carry NO notice — has NO LIVE
  // SUBJECT since the deletion: `plans/decomplect/completed` is the only historical
  // directory left and it IS the roster, so an on-corpus leg would assert over an empty
  // set and read green for having nothing to look at. The property is real and is
  // exercised in the convicting fixture below, over a synthetic corpus that can always
  // supply an untouched directory. Asserting it here would be coverage dressed as
  // conformance.
  it('the exonerating property has no live subject — it is checked in the fixture', () => {
    const untouched = historicalDirs().filter((d) => !REWRITTEN.includes(d));
    expect(
      untouched,
      'a historical dir reappeared — give leg 2 its live subject back',
    ).toEqual([]);
  });

  it('(3a) each notice names the sweep and links to the shard that argues it', () => {
    for (const d of REWRITTEN) {
      expect(notice(d), `${d}/${NOTICE} does not name the sweep`).toContain(
        SWEEP,
      );
    }
    expect(
      danglingLinks(REPO, REWRITTEN),
      `${NOTICE} links to a shard that does not resolve`,
    ).toEqual([]);
  });

  it('(3b) the `git show` a reader is told to run resolves — or reports it cannot look', () => {
    const shallow =
      execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
        cwd: REPO,
        encoding: 'utf8',
      }).trim() === 'true';
    const reachable =
      !shallow &&
      (() => {
        try {
          execFileSync('git', ['cat-file', '-e', `${SWEEP}^{commit}`], {
            cwd: REPO,
          });
          return true;
        } catch {
          return false;
        }
      })();

    const cited = REWRITTEN.map((d) => {
      const m = notice(d).match(/git show (\S+)\^:(\S+)/);
      expect(
        m,
        `${d}/${NOTICE} tells the reader no command to run`,
      ).toBeTruthy();
      return {
        d,
        ref: (m as RegExpMatchArray)[1],
        path: (m as RegExpMatchArray)[2],
      };
    });
    // Shape is checkable with no history at all, so it is checked unconditionally.
    for (const c of cited) expect(c.ref).toBe(SWEEP);

    if (!reachable) {
      // NOT a pass. The leg says out loud that it could not look, so a green run is
      // never mistaken for a verified one.
      console.warn(
        `record-retrofit-notice (3b): NOT CHECKABLE — ${SWEEP} unreachable (shallow=${shallow}). ` +
          `${cited.length} cited paths went unverified.`,
      );
      return;
    }
    const broken = cited.filter((c) => {
      try {
        execFileSync('git', ['cat-file', '-e', `${c.ref}^:${c.path}`], {
          cwd: REPO,
        });
        return false;
      } catch {
        return true;
      }
    });
    expect(
      broken.map((b) => `${b.d} → ${b.path}`),
      'cited object does not exist',
    ).toEqual([]);
  });

  // ── the convicting fixture ───────────────────────────────────────────
  // Without this, legs 1–3a are green whether the corpus is marked or the gate is
  // dark. The synthetic corpus travels the SAME functions the live legs do.
  it('FAILS on an unmarked record, a falsely-marked one, and a dangling link', () => {
    const root = mkdtempSync(join(tmpdir(), 'retrofit-'));
    try {
      const mk = (d: string): string => {
        mkdirSync(join(root, d), { recursive: true });
        return d;
      };
      const swept = mk('plans/.retired/swept');
      const untouched = mk('plans/.retired/untouched');
      mk('plans/live/completed');
      const shard = 'plans/live/completed/argument.md';
      writeFileSync(join(root, shard), '# the argument\n');
      const roster = [swept];

      // 1 — a rewritten record with no notice at all.
      expect(unmarked(root, roster)).toEqual([swept]);

      // Give it a notice whose link resolves; leg 1 and leg 3a both clear.
      const good = `see [argument](../../live/completed/argument.md) — ${SWEEP}\n`;
      writeFileSync(join(root, swept, NOTICE), good);
      expect(unmarked(root, roster)).toEqual([]);
      expect(danglingLinks(root, roster)).toEqual([]);

      // 3a — the link goes stale (exactly what a shard moving state does).
      writeFileSync(
        join(root, swept, NOTICE),
        good.replace('completed', 'pending'),
      );
      expect(danglingLinks(root, roster)).toEqual([swept]);
      writeFileSync(join(root, swept, NOTICE), good);

      // 2 — a notice claiming a rewrite that never happened.
      expect(falselyMarked(root, roster)).toEqual([]);
      writeFileSync(join(root, untouched, NOTICE), good);
      expect(falselyMarked(root, roster)).toEqual([untouched]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
