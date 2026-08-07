// THE THIRD HOME. The memory verb set is enumerated in three places, not two:
// `cli.ts`'s per-verb flag table, `MEMORY_VERBS` (`src/verb-port.ts`), and the
// INVOCATION STRINGS inside the canon skill cells (`memory <verb> …` in
// dream · wake · handoff). `verb-roster.test.ts` pins the first two against each
// other and names the failure class in its own words — they diverge SILENTLY, which
// is how `get` and `rollover` shipped dead. The third home had no gate at all: a
// verb renamed or retired in code leaves the cell instructing an agent to invoke
// something that no longer exists, and nothing in the repo notices.
//
// THIS GATE REFUSES; IT NEVER AUTHORS. The cells are hand-authored formal blocks
// under the self-sufficiency and symbols gates, and `AGENTS.md` fixes the direction:
// source is brought UP to the grounding, never regenerated FROM it. So the gate
// checks cell → code and stops there.
//
// DIRECTION IS ASYMMETRIC ON PURPOSE. A cell naming a verb absent from
// `MEMORY_VERBS` FAILS. The converse is not an error: most of the roster is not
// cell-facing (`init`, `node`, `home`, `migrate`), and asserting set equality would
// fail on day one for no defect.
//
// NO PACKAGE EDGE. `memory` does not depend on `canon` and must not
// start to in order to carry a test. The cells are read from their SOURCE TEXT by
// path — the precedent `canon/test/event-tap-cell.test.ts` set for exactly
// this problem, reading the runtime's `TapVerb` union as text across the same kind
// of gap. Extracting the verb from the invocation string (rather than hand-listing
// it here) is also what keeps the gate from becoming a FOURTH home for the set.
//
// THE ANCHOR IS THE CAPABILITY, NOT THE PATH. The cells used to write
// `` `scripts/memory.mjs <verb> …` `` and this scanner keyed on that path. The path
// is FORGE'S to compute — it derives from `runtime: {capability:'memory'}` and is
// emitted once, under the cell's own formal block, by `renderSkillCellBody`
// (`forge/src/core/exemplify/skill-cell.ts`). A cell spelling it restated a layout
// it does not own, so the cells now write `` `memory <verb> …` `` — capability, verb,
// args — and the anchor moved with them. NOTHING about the property changed: the
// verb is still the token after the capability, still checked against
// `MEMORY_VERBS`, still cell → code only. `no-path-restatement` below pins the
// old form OUT so the anchor cannot silently regain two spellings.

import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireRepoRoot } from '@cratylus/tooling/repo-root';
import { describe, expect, it } from 'vitest';
import { MEMORY_VERBS } from '../src/verb-port.js';

const testDir = dirname(fileURLToPath(import.meta.url));

/** The canon skill cells — the third home, reached by path, not by dependency. */
const CELL_ROOT = join(
  requireRepoRoot(testDir),
  'packages',
  'canon',
  'src',
  'skills',
);

/**
 * The invocation form the cells write: `` `memory <verb> …` `` — the CAPABILITY, then
 * the verb, then its args. The leading backtick is required: it is what separates an
 * invocation from the word `memory` in prose, and it is why the declaration line
 * `` `memory <verb> <args>` `` (whose next token is `<`, not a word) is not read as one.
 * Only the HEAD token is the verb — `session begin` / `session release` are
 * `<verb> <subcommand>`, and the subcommand is the verb's own concern, not the
 * roster's.
 */
const INVOCATION = /`memory\s+([A-Za-z][\w-]*)/g;

/** The layout the projector owns and no cell may restate. */
const PROJECTOR_PATH = 'scripts/memory.mjs';

/** Every verb a cell text invokes, in source order, duplicates kept. */
function invokedVerbs(text: string): string[] {
  return [...text.matchAll(INVOCATION)].map((m) => m[1] as string);
}

interface Cell {
  readonly cell: string;
  readonly text: string;
}

/** Every `.ts` under the canon skills tree, recursively. */
function cellFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...cellFiles(path));
    else if (entry.name.endsWith('.ts')) out.push(path);
  }
  return out.sort();
}

/**
 * The live cell corpus, restricted to cells that actually invoke the memory tool.
 * THROWS when nothing at all was found: a scanner that silently extracts zero
 * invocations reports green forever, and "no violation was ever reported" would then
 * be evidence of a DARK gate rather than of a clean corpus.
 */
function scanCorpus(root: string): Cell[] {
  const cells = allCells(root).filter((c) => invokedVerbs(c.text).length > 0);
  if (cells.length === 0) {
    throw new Error(
      `cell-verb-roster: no \`memory <verb>\` invocation found anywhere under ${root} — the scanner is DARK, not the corpus clean`,
    );
  }
  return cells;
}

/** Every cell text under the root, invoking or not — the surface the
 *  path-restatement gate reads (a cell that restates the path may well have
 *  stopped invoking through the capability at all). */
function allCells(root: string): Cell[] {
  return cellFiles(root).map((path) => ({
    cell: relative(root, path),
    text: readFileSync(path, 'utf-8'),
  }));
}

interface Violation {
  readonly cell: string;
  readonly verb: string;
}

/** Cell → code: every invoked verb the runtime does not export. */
function violations(
  cells: readonly Cell[],
  roster: readonly string[],
): Violation[] {
  const known = new Set(roster);
  const found: Violation[] = [];
  for (const { cell, text } of cells)
    for (const verb of invokedVerbs(text))
      if (!known.has(verb)) found.push({ cell, verb });
  return found;
}

/** The refusal — names the cell, the offending verb, and the roster it was checked against. */
function report(
  found: readonly Violation[],
  roster: readonly string[],
): string {
  return [
    ...found.map(
      (v) =>
        `${v.cell} invokes \`memory ${v.verb}\` — no such verb in MEMORY_VERBS`,
    ),
    `roster: ${[...roster].join(' · ')}`,
  ].join('\n');
}

const corpus = scanCorpus(CELL_ROOT);
const invoked = [
  ...new Set(corpus.flatMap((c) => invokedVerbs(c.text))),
].sort();

describe('cell verb roster — no cell instructs an agent to invoke a verb the runtime lacks', () => {
  it('every verb the canon cells invoke is a member of MEMORY_VERBS', () => {
    const found = violations(corpus, MEMORY_VERBS);
    expect(found, report(found, MEMORY_VERBS)).toEqual([]);
  });

  it('the scan reaches the three known cells and parses their invocations', () => {
    expect(corpus.map((c) => c.cell)).toEqual(
      expect.arrayContaining([
        join('dream', 'skill.ts'),
        join('wake', 'skill.ts'),
        join('handoff', 'skill.ts'),
      ]),
    );
    for (const cell of corpus)
      expect(invokedVerbs(cell.text).length, cell.cell).toBeGreaterThan(0);
    expect(invoked.length).toBeGreaterThan(8);
  });

  // The anchor is a backtick + capability rather than a unique path, so PARTIAL
  // darkness is the new failure mode: a reformat that breaks the anchor on some
  // sites leaves the scan green on the rest. Per-cell floors make that loud. These
  // are COUNTS, not names — the verb set still has exactly one home in the cells.
  it('no cell goes partially dark — each carries at least the invocations it had', () => {
    const floor: Record<string, number> = {
      [join('dream', 'skill.ts')]: 9,
      [join('wake', 'skill.ts')]: 2,
      [join('handoff', 'skill.ts')]: 1,
    };
    for (const [cell, min] of Object.entries(floor)) {
      const found = corpus.find((c) => c.cell === cell);
      expect(
        found,
        `${cell} carries no invocation the scanner can see`,
      ).toBeDefined();
      expect(
        invokedVerbs((found as Cell).text).length,
        cell,
      ).toBeGreaterThanOrEqual(min);
    }
  });

  // ── The projector's path is not the cell's to spell ─────────────────────────────
  it('no-path-restatement — no cell writes `scripts/memory.mjs`', () => {
    // `runtime: {capability:'memory'}` is the cell's whole claim; forge derives the
    // path from it and emits it once under the block. A cell restating it fuses
    // meaning with projection AND gives the scanner a second spelling to miss.
    const restating = allCells(CELL_ROOT)
      .filter((c) => c.text.includes(PROJECTOR_PATH))
      .map((c) => c.cell);
    expect(
      restating,
      `${restating.join(' · ')} restate(s) \`${PROJECTOR_PATH}\` — declare \`runtime: { capability: 'memory' }\` and invoke \`memory <verb> …\`; forge emits the path`,
    ).toEqual([]);
  });

  it('a sub-verb is checked on its head token — `session begin` / `session release` pass', () => {
    expect(invokedVerbs('`memory session begin --name <agent>`')).toEqual([
      'session',
    ]);
    expect(invokedVerbs('`memory session release --name <agent>`')).toEqual([
      'session',
    ]);
    // `session` is in the roster; `session begin` is not, and must never be sought.
    expect(MEMORY_VERBS).toContain('session');
    expect(MEMORY_VERBS as readonly string[]).not.toContain('session begin');
    expect(invoked).toContain('session');
  });

  it('the converse is NOT asserted — a roster verb no cell invokes is fine', () => {
    // EXONERATING LEG: `init` and `node` exist in code and appear in no cell, and
    // the live corpus is green anyway. Set equality here would fail on day one.
    for (const verb of ['init', 'node'] as const) {
      expect(MEMORY_VERBS).toContain(verb);
      expect(invoked).not.toContain(verb);
    }
    expect(violations(corpus, MEMORY_VERBS)).toEqual([]);
  });

  // ── The gate BITES — otherwise it is green whether or not the homes agree ───────
  it('is non-vacuous — a cell invoking `consolidate` is CONVICTED, naming cell · verb · roster', () => {
    const drifted: Cell = {
      cell: 'consolidate/skill.ts',
      text: 'fold ≜ `memory consolidate --name <agent> --routes -`',
    };
    const found = violations([...corpus, drifted], MEMORY_VERBS);
    expect(found).toEqual([
      { cell: 'consolidate/skill.ts', verb: 'consolidate' },
    ]);
    const msg = report(found, MEMORY_VERBS);
    expect(msg).toContain('consolidate/skill.ts');
    expect(msg).toContain('`memory consolidate`');
    expect(msg).toContain('roster:');
    expect(msg).toContain('rollover');
  });

  it('is non-vacuous — retiring a real verb from the roster FAILS the live corpus', () => {
    // The same drift driven from the CODE side: `audit` is retired and `dream`'s
    // exit condition still tells an agent to invoke it.
    const shrunk = MEMORY_VERBS.filter((v) => v !== 'audit');
    const found = violations(corpus, shrunk);
    expect(found.length).toBeGreaterThan(0);
    expect(found.map((v) => v.verb)).toContain('audit');
    expect(found.map((v) => v.cell)).toContain(join('dream', 'skill.ts'));
  });

  it('is non-vacuous — a corpus carrying no invocation at all FAILS loudly, not empty', () => {
    const empty = mkdtempSync(join(tmpdir(), 'cell-verb-roster-'));
    expect(() => scanCorpus(empty)).toThrow(/the scanner is DARK/);
  });
});
