// The record checks' fixture: the frozen freeze fixture's renewal cut, recorded
// and wired so 0133's four fixes can be bound without binding 0134 (where the
// ledger is read from) either way.
//
// THE RECORD. Every Given that changes the cut's ledger is followed by a commit
// of `design/ledger/` (`record`), so the branch's recorded tip and the working
// copy hold the same ledger: what is frozen reads alike from either, and only
// the examples, checks and the files they use differ between the tip and the
// working copy where a case says so. Givens are committed with the project's
// hooks off; they are the test's own setting, not attempts.
//
// THE WIRING. The CLI README wires `cratylus freeze-gate` "as the hook" without
// saying where. The frozen fixture writes `.git/hooks/reference-transaction`
// and sets `core.hooksPath` to the relative `.git/hooks`, which git resolves
// from where a hook runs: in a linked work tree that is a file, not a folder,
// and on a push git runs the hook in the git directory, where `.git/hooks`
// does not exist, so the hook never runs in either. The record must work under
// git's own hook location instead: the same hook, in the repository's common
// hooks folder (`$(git rev-parse --git-common-dir)/hooks/reference-transaction`),
// with `core.hooksPath` unset, which every work tree of the repository and every
// push into it runs. `MEANING_RECORD_WIRING=fixture` keeps the frozen fixture's
// wiring instead; it exists only to see the work-tree cases fail.
//
// THE STAND-IN. `MEANING_RECORD_STAND_IN=refuse` puts in front of the delivered
// command, from the moment a test arms it (after its Givens), a record that
// refuses every change: its `freeze-gate` refuses every prepared transaction,
// and it refuses `concepts define|supersede|retire` and `workPackage
// submit|update`. Everything else passes to the delivered command. It exists
// only to see each admission fail; an acceptance run never sets it.

import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  watch,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { expect } from 'vitest';
import type { Fixture } from '../../agent-launch/fixture.js';
import {
  type Result,
  branch,
  checkPath,
  clause,
  command,
  examplePath,
  git,
  ok,
  query,
  setup,
  snapshot,
  working,
  write,
} from '../freeze/fixture.js';

/** The renewal cut as `workPackage frozen` reports it. */
export function frozenView(f: Fixture) {
  return query(f, 'workPackage', 'frozen').cuts.find(
    (c: { cut: string }) => c.cut === 'renewal',
  ) as { uses: string[]; unchecked: string[] };
}

/** A Given in the repository at `cwd` (the fixture's by default), made with
 *  the project's hooks off; it must succeed. */
export function given(f: Fixture, args: string[], cwd: string = f.cwd): string {
  const r = git({ ...f, cwd }, undefined, [
    '-c',
    'core.hooksPath=/dev/null',
    ...args,
  ]);
  expect(r.code, `Given: git ${args.join(' ')}: ${r.stderr}${r.stdout}`).toBe(
    0,
  );
  return r.stdout.trim();
}

/** The frozen fixture's renewal cut, its ledger recorded, wired as the record
 *  must work under (see THE WIRING). */
export function recordSetup(): Fixture {
  const f = setup();
  if (process.env.MEANING_RECORD_WIRING !== 'fixture')
    given(f, ['config', '--unset', 'core.hooksPath']);
  record(f);
  return f;
}

/** Commit `paths` and the ledger as a Given, so the branch's recorded tip holds
 *  what the working copy holds; nothing when nothing changed. */
export function record(f: Fixture, ...paths: string[]) {
  given(f, ['add', '-A', '--', 'design/ledger', ...paths]);
  if (git(f, undefined, ['diff', '--cached', '--quiet']).code !== 0)
    given(f, ['commit', '-q', '-m', 'test: record the cut']);
}

/** Arm the refusing stand-in when the run asks for it (see THE STAND-IN). */
export function arm(f: Fixture) {
  if (process.env.MEANING_RECORD_STAND_IN !== 'refuse') return;
  const path = f.env.PATH!.split(':').filter((d) => !d.includes('stand-in-'));
  const delivered = join(path[0]!, 'cratylus');
  const directory = join(f.root, 'stand-in-record-refuse');
  mkdirSync(directory, { recursive: true });
  const shim = join(directory, 'cratylus');
  writeFileSync(
    shim,
    `#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const args = process.argv.slice(2);
const refuse = (what) => {
  process.stderr.write(what + ': stand-in record refuses every change\\n');
  process.exit(1);
};
if (args[0] === 'freeze-gate') {
  try { fs.readFileSync(0); } catch {}
  if (args[1] === 'prepared') refuse('freeze-gate');
  process.exit(0);
}
if (args[0] === 'concepts' && ['define', 'supersede', 'retire'].includes(args[1])) refuse('concepts ' + args[1]);
if (args[0] === 'workPackage' && ['submit', 'update'].includes(args[1])) refuse('workPackage ' + args[1]);
process.exit(spawnSync(${JSON.stringify(delivered)}, args, { stdio: 'inherit' }).status ?? 1);
`,
  );
  chmodSync(shim, 0o755);
  f.env.PATH = [directory, ...path].join(':');
}

// ── Fix 1: read from the record ─────────────────────────────────────────────

/** The example retagged in the working copy: it names `lending`, not renewal. */
export function retag(f: Fixture, path = examplePath) {
  write(
    f,
    path,
    working(f, path)!.replace(/^(\d+)\. \([^)]*\)/gm, '$1. (lending)'),
  );
}

/** The frozen check, in the working copy, with its import of the support file
 *  dropped: read from there, the support file and what it reaches are used by
 *  no frozen check. */
export function dropImport(f: Fixture) {
  const text = working(f, checkPath)!;
  const dropped = text
    .split('\n')
    .filter((line) => !line.includes("from './support/access.ts'"))
    .join('\n')
    .replace('assert.equal(access, patron,', "assert.equal(access, 'patron',");
  expect(dropped, 'Given: the import is dropped').not.toBe(text);
  write(f, checkPath, dropped);
}

// ── Fix 2: the ledger's verbs and the journal's define ──────────────────────

/** Every file under `dir` of the working copy, by path, with its bytes. */
export function files(f: Fixture, dir: string): Record<string, string> {
  const root = join(f.cwd, dir);
  const out: Record<string, string> = {};
  if (!existsSync(root)) return out;
  for (const name of readdirSync(root).sort())
    out[name] = readFileSync(join(root, name)).toString('base64');
  return out;
}

export function workPackage(
  f: Fixture,
  agent: string,
  verb: 'submit' | 'update',
  name: string,
  outputs: string[],
) {
  return command(
    f,
    agent,
    'workPackage',
    verb,
    name,
    '--cut',
    'renewal',
    ...outputs.flatMap((o) => ['--output', o]),
    ...(verb === 'submit' ? ['--concept', 'renewal'] : []),
  );
}

/** `agent`'s widening of a package's outputs onto `frozen`, a file (or a
 *  folder holding one) a frozen check uses: refused, nothing appended to the
 *  ledger, and the file still frozen. */
export function refusedWidening(
  f: Fixture,
  agent: string,
  verb: 'submit' | 'update',
  name: string,
  outputs: string[],
  frozen: string,
  names: string[],
) {
  clause(
    'refusal',
    `${agent} ${verb} ${name} --output ${outputs.join(' ')}`,
    () => {
      const before = files(f, 'design/ledger');
      const result = workPackage(f, agent, verb, name, outputs);
      const said = result.stderr + result.stdout;
      expect(result.code, `widening onto ${frozen} admitted: ${said}`).not.toBe(
        0,
      );
      expect(files(f, 'design/ledger'), 'nothing appended').toEqual(before);
      expect(
        names.some((n) => said.includes(n)),
        `names the frozen file, one of ${names.join(', ')}: ${said}`,
      ).toBe(true);
      expect(frozenView(f).uses, `${frozen} stays frozen`).toContain(frozen);
    },
  );
}
export function admittedWidening(
  f: Fixture,
  agent: string,
  verb: 'submit' | 'update',
  name: string,
  outputs: string[],
) {
  clause(
    'admission',
    `${agent} ${verb} ${name} --output ${outputs.join(' ')}`,
    () => {
      const before = Object.keys(files(f, 'design/ledger')).length;
      ok(workPackage(f, agent, verb, name, outputs));
      expect(Object.keys(files(f, 'design/ledger')).length).toBe(before + 1);
    },
  );
}

export function defineAs(f: Fixture, agent: string, name: string) {
  return command(
    f,
    agent,
    'concepts',
    'define',
    name,
    '--context',
    'library',
    '--wording',
    `The ${name} a patron owes.`,
    '--reason',
    `The cut's examples name ${name}.`,
  );
}

/** `agent`'s definition of `name` refused before appending: the journal's
 *  folder untouched, one line saying `concepts define:`, naming `words`. */
export function refusedDefine(
  f: Fixture,
  agent: string,
  name: string,
  words: string[],
  label = '',
) {
  return clause(
    'refusal',
    `journal define library/${name} by ${agent}${label}`,
    async () => {
      const before = snapshot(f.cwd);
      const touched: string[] = [];
      const watcher = watch(join(f.cwd, 'design/journal'), (event, file) =>
        touched.push(`${event}:${file}`),
      );
      try {
        const result = defineAs(f, agent, name);
        await setTimeout(20);
        const text = (result.stderr || result.stdout).trim();
        expect(result.code, `a refusal, not an append: ${text}`).toBe(1);
        expect(text.split('\n'), 'one-line journal refusal').toHaveLength(1);
        expect(text).toMatch(/^(?:cratylus )?concepts define:/);
        for (const word of words) expect(text).toContain(word);
        expect(touched, 'refusal precedes any write').toEqual([]);
        expect(snapshot(f.cwd)).toEqual(before);
      } finally {
        watcher.close();
      }
    },
  );
}
export function admittedDefine(f: Fixture, agent: string, name: string) {
  clause('admission', `journal define library/${name} by ${agent}`, () => {
    const before = Object.keys(snapshot(f.cwd)).length;
    ok(defineAs(f, agent, name));
    expect(Object.keys(snapshot(f.cwd)).length).toBe(before + 1);
    const design = query(f, 'concepts', 'design', '--context', 'library');
    expect(
      design.contexts
        .find((c: { name: string }) => c.name === 'library')
        .concepts.map((c: { name: string }) => c.name),
    ).toContain(name);
  });
}

/** A ledger entry that cannot be read, in the working copy and the tip alike. */
export function unreadableLedger(f: Fixture) {
  write(f, `design/ledger/01${'Z'.repeat(24)}.json`, '{ not json');
  record(f);
}

// ── Fix 3: the journal is append-only in the history ────────────────────────

/** The branch's tip. */
export function tip(f: Fixture) {
  return given(f, ['rev-parse', `refs/heads/${branch}`]);
}

/** The journal entries the branch's tip holds, as `[path, entry]`. */
export function recordedEntries(f: Fixture) {
  return given(f, [
    'ls-tree',
    '-r',
    '--name-only',
    'HEAD',
    '--',
    'design/journal/',
  ])
    .split('\n')
    .filter((p) => p.endsWith('.json'))
    .map(
      (p) =>
        [p, JSON.parse(given(f, ['show', `HEAD:${p}`]))] as [
          string,
          Record<string, unknown>,
        ],
    );
}

export const deletions = [
  'commit',
  'commit --no-verify',
  'commit --amend',
] as const;
export type Deletion = (typeof deletions)[number];
/** Delete the recorded entry at `path` and bring it into the branch by `route`. */
export function deleteEntry(
  f: Fixture,
  agent: string | undefined,
  route: Deletion,
  path: string,
): Result {
  given(f, ['rm', '-q', '--', path]);
  const flags =
    route === 'commit --no-verify'
      ? ['--no-verify']
      : route === 'commit --amend'
        ? ['--amend']
        : [];
  return git(f, agent, [
    'commit',
    ...flags,
    '-q',
    '-m',
    `${route}: delete ${path}`,
  ]);
}

/** A branch update the record refused: git failed, the branch and (but for a
 *  rebase) HEAD stayed, and the output names `names`. */
export function assertRefusedUpdate(
  result: Result,
  before: { branch: string; head: string },
  after: { branch: string; head: string },
  route: string,
  names: string[],
) {
  const said = result.stderr + result.stdout;
  expect(result.code, `the record admitted ${route}: ${said}`).not.toBe(0);
  expect(after.branch, `${route} moved the branch`).toBe(before.branch);
  if (route !== 'rebase')
    expect(after.head, `${route} moved HEAD`).toBe(before.head);
  for (const name of names) expect(said, `names ${name}`).toContain(name);
}

// ── Fix 4: every work tree, and pushes ──────────────────────────────────────

/** The repository's own work tree taken off the branch, and a linked work tree
 *  of the repository holding the branch; the linked tree as a fixture. */
export function linkedTree(f: Fixture): Fixture {
  given(f, ['checkout', '-q', '--detach']);
  const linked = join(f.root, 'linked');
  given(f, ['worktree', 'add', '-q', linked, branch]);
  return { ...f, cwd: linked };
}

/** A clone of the repository, its own work tree taken off the branch so a push
 *  may move it; the clone as a fixture. */
export function cloneOf(f: Fixture): Fixture {
  given(f, ['checkout', '-q', '--detach']);
  const clone = join(f.root, 'clone');
  given(f, ['clone', '-q', '--branch', branch, f.cwd, clone], f.root);
  given(f, ['config', 'user.name', 'Freeze check'], clone);
  given(f, ['config', 'user.email', 'freeze@example.invalid'], clone);
  given(f, ['config', 'commit.gpgsign', 'false'], clone);
  return { ...f, cwd: clone };
}

/** In `clone`, a commit on the repository's branch tip changing `path` to
 *  `text`, pushed into the repository as `agent`. */
export function push(
  f: Fixture,
  clone: Fixture,
  agent: string,
  path: string,
  text: string,
): Result {
  given(f, ['fetch', '-q', 'origin'], clone.cwd);
  given(f, ['reset', '-q', '--hard', `origin/${branch}`], clone.cwd);
  write(clone, path, text);
  given(f, ['add', '--', path], clone.cwd);
  given(f, ['commit', '-q', '-m', `${agent}: ${path}`], clone.cwd);
  return git(clone, agent, ['push', 'origin', `HEAD:refs/heads/${branch}`]);
}
export function refusedPush(
  f: Fixture,
  clone: Fixture,
  agent: string,
  path: string,
  text: string,
  names: string[],
) {
  clause('refusal', `${agent} push ${path}`, () => {
    const before = tip(f);
    const result = push(f, clone, agent, path, text);
    const said = result.stderr + result.stdout;
    expect(
      result.code,
      `the record admitted ${agent}'s push: ${said}`,
    ).not.toBe(0);
    expect(tip(f), 'the push moved the branch').toBe(before);
    for (const name of names) expect(said, `names ${name}`).toContain(name);
  });
}
export function admittedPush(
  f: Fixture,
  clone: Fixture,
  agent: string,
  path: string,
  text: string,
) {
  clause('admission', `${agent} push ${path}`, () => {
    const before = tip(f);
    const result = push(f, clone, agent, path, text);
    expect(
      result.code,
      `the record refused ${agent}'s push: ${result.stderr}${result.stdout}`,
    ).toBe(0);
    expect(tip(f), 'the push entered the branch').not.toBe(before);
    expect(`${given(f, ['show', `${tip(f)}:${path}`])}\n`).toBe(text);
  });
}
