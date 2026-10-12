import '../../reconstitution/binding/omp-mocks.js';
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  watch,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { expect } from 'vitest';
import { type Fixture, fixture } from '../../agent-launch/fixture.js';
import {
  type History,
  snapshot,
  unchangedFiles,
} from '../../concept-journal/fixture.js';
import {
  type LoadedExtension,
  load,
  task,
  write,
} from '../../reconstitution/binding/fixture.js';

export { snapshot, write };
export const architect = 'architect';
export const outsiders = [
  'lead',
  'builder',
  'check-writer',
  'illustrator',
  'assayer',
];
export const original = 'A patron extends a loan without staff intervention.';
export const corrected =
  'A patron extends an eligible loan without staff intervention.';
export const reason = 'Clarify eligibility, not who may renew.';
export const branch = 'feature/renewal';

// The cut's record: what it freezes, and what a frozen check uses.
export const examplePath = 'design/examples/library/renewal.md';
export const heldOutText = 'design/judgment/library/renewal.md';
export const judgmentFolder = 'design/judgment/library/renewal/';
export const heldOutCheck = `${judgmentFolder}edge.test.ts`;
export const checkPath = 'checks/renewal.test.ts';
export const checkFolder = 'checks/renewal/';
export const checkFolderFile = `${checkFolder}unaided.test.ts`;
/** Reached from the frozen check by a relative import. */
export const supportPath = 'checks/support/access.ts';
/** Reached from `supportPath`: transitively used by the frozen check. */
export const usedPath = 'lib/patron.ts';
/** Reached by a type-only import written with the `.js` specifier TypeScript uses. */
export const typesPath = 'checks/support/types.ts';
/** The work package's output, imported by the check and never frozen by it. */
export const workPath = 'src/renewal.ts';
export const notesPath = 'notes.md';

/** What each of 31 to 33 and 36 names, each tried by every route. */
export const targets = [examplePath, checkPath, usedPath, heldOutText];
/** Frozen too, each tried by a plain commit. */
export const alsoFrozen = [checkFolderFile, supportPath, typesPath];

const predicate = (message: string) =>
  `import { strict as assert } from 'node:assert';\nassert.equal(process.env.RENEWAL_ACCESS, 'patron', '${message}');\n`;
const files: Record<string, string> = {
  [checkPath]: [
    "import { strict as assert } from 'node:assert';",
    "import type { Access } from './support/types.js';",
    "import { renewal } from '../src/renewal.ts';",
    "import { patron } from './support/access.ts';",
    'const access = process.env.RENEWAL_ACCESS as Access;',
    "assert.equal(access, patron, 'library/1: patrons renew without staff intervention');",
    'void renewal;',
    '',
  ].join('\n'),
  [checkFolderFile]: predicate('library/1: patrons renew unaided'),
  [supportPath]: "export { patron } from '../../lib/patron.ts';\n",
  [usedPath]: "export const patron = 'patron';\n",
  [typesPath]: "export type Access = 'patron' | 'staff';\n",
  [heldOutText]: '1. (renewal) A patron renews unaided at the kiosk.\n',
  [heldOutCheck]: predicate('held-out library/1: the kiosk renews unaided'),
};

export type Result = { code: number | null; stdout: string; stderr: string };
export type Verb = 'supersede' | 'retire';

// STAND-INS. `MEANING_FREEZE_STAND_IN=admit` puts a record that admits every change
// in front of the delivered command: its freeze-gate exits 0 and its journal
// supersede/retire run with the ledger moved aside, so nothing is frozen.
// `MEANING_FREEZE_STAND_IN=refuse` puts one that refuses every change: its
// freeze-gate refuses every prepared transaction and its journal refuses every
// supersede and retire. Everything else passes to the delivered command. They exist
// only to see each check fail; an acceptance run never sets the variable.
export type StandIn = 'admit' | 'refuse';
export function standIn(f: Fixture, mode: StandIn) {
  // One stand-in at a time, always in front of the delivered command.
  const path = f.env.PATH!.split(':').filter((d) => !d.includes('stand-in-'));
  const delivered = join(path[0]!, 'cratylus');
  const directory = join(f.root, `stand-in-${mode}`);
  mkdirSync(directory, { recursive: true });
  const shim = join(directory, 'cratylus');
  writeFileSync(
    shim,
    `#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const mode = ${JSON.stringify(mode)};
const args = process.argv.slice(2);
const run = () => spawnSync(${JSON.stringify(delivered)}, args, { stdio: 'inherit' }).status ?? 1;
if (args[0] === 'freeze-gate') {
  try { fs.readFileSync(0); } catch {}
  if (mode === 'refuse' && args[1] === 'prepared') {
    process.stderr.write('stand-in record: every change refused\\n');
    process.exit(1);
  }
  process.exit(0);
}
if (args[0] === 'concepts' && (args[1] === 'supersede' || args[1] === 'retire')) {
  if (mode === 'refuse') {
    process.stderr.write('concepts ' + args[1] + ': stand-in record refuses every change\\n');
    process.exit(1);
  }
  const top = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).stdout.trim() || process.cwd();
  const ledger = path.join(top, 'design/ledger');
  const aside = path.join(top, 'design/.ledger-stand-in');
  const hidden = fs.existsSync(ledger);
  if (hidden) fs.renameSync(ledger, aside);
  let code = 1;
  try { code = run(); } finally { if (hidden) fs.renameSync(aside, ledger); }
  process.exit(code);
}
process.exit(run());
`,
  );
  chmodSync(shim, 0o755);
  f.env.PATH = [directory, ...path].join(':');
}

export function command(
  f: Fixture,
  agent: string | undefined,
  ...args: string[]
): Result {
  const env = { ...f.env };
  if (agent !== undefined) env.CRATYLUS_AGENT = agent;
  const r = spawnSync('cratylus', args, {
    cwd: f.cwd,
    env,
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (r.error) throw r.error;
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}
export function ok(r: Result) {
  expect(r.code, r.stderr + r.stdout).toBe(0);
  return JSON.parse(r.stdout);
}
export function query(f: Fixture, ...args: string[]) {
  return ok(command(f, architect, ...args));
}

/** git in the fixture repository, as `agent` (the process's `CRATYLUS_AGENT`). */
export function git(
  f: Fixture,
  agent: string | undefined,
  args: string[],
  options: { input?: string; env?: Record<string, string> } = {},
): Result {
  const env: NodeJS.ProcessEnv = { ...f.env, ...options.env };
  if (agent !== undefined) env.CRATYLUS_AGENT = agent;
  const r = spawnSync('git', args, {
    cwd: f.cwd,
    env,
    encoding: 'utf8',
    input: options.input,
    timeout: 60_000,
  });
  if (r.error) throw r.error;
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}
function must(r: Result, what: string) {
  expect(r.code, `${what}: ${r.stderr}${r.stdout}`).toBe(0);
  return r.stdout.trim();
}

// CLAUSES. Each refusal and admission the checks assert is one clause. A run
// with `MEANING_FREEZE_CLAUSES=<file>` records every clause's outcome there, one
// JSON line each, and carries on past a failed one, so a seen-red run against a
// stand-in observes every clause, not only each test's first failure. Without
// it, a failed clause fails its test at once.
export type Clause = 'refusal' | 'admission' | 'view' | 'binding';
export function clause<T>(kind: Clause, label: string, body: () => T) {
  const file = process.env.MEANING_FREEZE_CLAUSES;
  if (file === undefined) return body();
  const record = (held: boolean, why?: unknown) =>
    appendFileSync(
      file,
      `${JSON.stringify({
        test: expect.getState().currentTestName,
        kind,
        label,
        held,
        ...(why === undefined ? {} : { why: String(why).split('\n')[0] }),
      })}\n`,
    );
  try {
    const result = body();
    if (result instanceof Promise)
      return result.then(
        () => record(true),
        (error: unknown) => record(false, error),
      );
    record(true);
  } catch (error) {
    record(false, error);
  }
}

export function define(
  f: Fixture,
  context: string,
  name: string,
  wording = original,
) {
  query(
    f,
    'concepts',
    'define',
    name,
    '--context',
    context,
    '--wording',
    wording,
    '--reason',
    'Patrons need self-service.',
  );
}
export function context(f: Fixture, name: string) {
  query(f, 'concepts', 'context', name, '--subject', `The ${name} subject.`);
}
export function open(
  f: Fixture,
  cut = 'renewal',
  context = 'library',
  concept = 'renewal',
) {
  write(
    f,
    `design/examples/${context}/${cut}.md`,
    `1. (${concept}) **Given** a patron's eligible loan, **when** they renew, **then** no staff intervention is needed.\n`,
  );
  query(
    f,
    'workPackage',
    'open',
    '--cut',
    cut,
    '--branch',
    branch,
    '--architect',
    `${context}=${architect}`,
  );
}

/** The project's wiring of the record, exactly as the contract states it. */
export function wire(f: Fixture) {
  const hook = join(f.cwd, '.git/hooks/reference-transaction');
  mkdirSync(dirname(hook), { recursive: true });
  writeFileSync(hook, '#!/bin/sh\nexec cratylus freeze-gate "$@"\n');
  chmodSync(hook, 0o755);
  must(git(f, undefined, ['config', 'core.hooksPath', '.git/hooks']), 'wire');
}

/** A repository whose renewal cut is opened, its record committed in two
 *  commits (the cut's design and checks, then the work), and the record wired.
 *  The ledger is left where cratylus keeps it, never committed. */
export function setup() {
  const f = fixture();
  const mode = process.env.MEANING_FREEZE_STAND_IN;
  if (mode === 'admit' || mode === 'refuse') standIn(f, mode);
  for (const args of [
    ['init', '-q', `--initial-branch=${branch}`],
    ['config', 'user.name', 'Freeze check'],
    ['config', 'user.email', 'freeze@example.invalid'],
    ['config', 'commit.gpgsign', 'false'],
  ])
    must(git(f, undefined, args), 'Given');
  context(f, 'library');
  define(f, 'library', 'renewal');
  for (const [path, text] of Object.entries(files)) write(f, path, text);
  write(f, workPath, "export const renewal = 'pending';\n");
  open(f);
  must(
    git(f, undefined, [
      'add',
      '--',
      'design/examples',
      'design/judgment',
      'design/journal',
      'checks',
      'lib',
    ]),
    'Given',
  );
  must(git(f, undefined, ['commit', '-qm', 'test: the renewal cut']), 'Given');
  must(git(f, undefined, ['add', '--', workPath]), 'Given');
  must(git(f, undefined, ['commit', '-qm', 'test: renewal work']), 'Given');
  wire(f);
  return f;
}

/** Run a check file as the work it judges: it must reject staff-only work and
 *  accept unaided renewal, so it is seen to fail before it is frozen. */
export function seenRed(f: Fixture, path: string) {
  for (const access of ['staff', 'patron']) {
    const result = spawnSync(process.execPath, [path], {
      cwd: f.cwd,
      env: { ...f.env, RENEWAL_ACCESS: access },
      encoding: 'utf8',
    });
    expect(
      result.status,
      `Given: ${path} rejects staff-only work and accepts unaided renewal\n${result.stderr}`,
    ).toBe(access === 'staff' ? 1 : 0);
  }
}
export function freezeChecks(f: Fixture, checks = [checkPath, checkFolder]) {
  for (const check of checks)
    seenRed(f, check === checkFolder ? checkFolderFile : check);
  query(
    f,
    'workPackage',
    'freeze',
    '--cut',
    'renewal',
    ...checks.flatMap((c) => ['--check', c]),
  );
}
export function frozenCut(f: Fixture, cut = 'renewal') {
  return query(f, 'workPackage', 'frozen').cuts.find(
    (c: { cut: string }) => c.cut === cut,
  ) as { examples: string[]; checks: string[] } | undefined;
}
export function covers(entries: string[], path: string) {
  return entries.some(
    (e) => e === path || (e.endsWith('/') && path.startsWith(e)),
  );
}
export function integrate(f: Fixture, cut = 'renewal', agent = architect) {
  return command(f, agent, 'workPackage', 'integrate', '--cut', cut);
}

// ── The journal ─────────────────────────────────────────────────────────────

export function change(
  f: Fixture,
  agent: string | undefined,
  verb: Verb,
  context = 'library',
  concept = 'renewal',
  wording = corrected,
) {
  return command(
    f,
    agent,
    'concepts',
    verb,
    concept,
    '--context',
    context,
    ...(verb === 'supersede' ? ['--wording', wording] : []),
    '--reason',
    reason,
  );
}
export function assertRefused(
  result: Result,
  verb: Verb,
  concept: string,
  cuts: string[],
) {
  expect(result.code, 'a warning or a successful append is not refusal').toBe(
    1,
  );
  const text = (result.stderr || result.stdout).trim();
  expect(text.split('\n'), 'one-line journal refusal').toHaveLength(1);
  expect(text).toMatch(new RegExp(`^(?:cratylus )?concepts ${verb}:`));
  for (const word of [concept, architect, ...cuts])
    expect(text).toContain(word);
}
export function refusedChange(
  f: Fixture,
  agent: string | undefined,
  verb: Verb,
  context = 'library',
  concept = 'renewal',
  cuts = ['renewal'],
) {
  return clause(
    'refusal',
    `journal ${verb} ${context}/${concept} by ${agent}`,
    () => journalRefusal(f, agent, verb, context, concept, cuts),
  );
}
async function journalRefusal(
  f: Fixture,
  agent: string | undefined,
  verb: Verb,
  context: string,
  concept: string,
  cuts: string[],
) {
  const before = snapshot(f.cwd);
  const history = query(
    f,
    'concepts',
    'history',
    concept,
    '--context',
    context,
  );
  const design = query(f, 'concepts', 'design', '--context', context);
  const touched: string[] = [];
  const watcher = watch(join(f.cwd, 'design/journal'), (event, file) =>
    touched.push(`${event}:${file}`),
  );
  try {
    const result = change(
      f,
      agent,
      verb,
      context,
      concept,
      'Staff-only renewal is sufficient.',
    );
    await setTimeout(20); // Drain the OS events from the completed child, including append-then-delete.
    assertRefused(result, verb, concept, cuts);
    expect(
      touched,
      'refusal precedes any write; compensation is not refusal',
    ).toEqual([]);
    expect(snapshot(f.cwd)).toEqual(before);
    expect(
      query(f, 'concepts', 'history', concept, '--context', context),
    ).toEqual(history);
    expect(query(f, 'concepts', 'design', '--context', context)).toEqual(
      design,
    );
  } finally {
    watcher.close();
  }
}
export function allowedChange(
  f: Fixture,
  agent: string,
  verb: Verb,
  context = 'library',
  concept = 'renewal',
) {
  clause('admission', `journal ${verb} ${context}/${concept} by ${agent}`, () =>
    journalAdmission(f, agent, verb, context, concept),
  );
}
function journalAdmission(
  f: Fixture,
  agent: string,
  verb: Verb,
  context: string,
  concept: string,
) {
  const before = snapshot(f.cwd);
  const history = query(
    f,
    'concepts',
    'history',
    concept,
    '--context',
    context,
  ) as History;
  ok(change(f, agent, verb, context, concept));
  const after = snapshot(f.cwd);
  unchangedFiles(before, after);
  expect(Object.keys(after).length - Object.keys(before).length).toBe(1);
  const now = query(
    f,
    'concepts',
    'history',
    concept,
    '--context',
    context,
  ) as History;
  expect(now.versions.slice(0, -1)).toEqual(history.versions);
  expect(now.versions.at(-1)).toMatchObject({
    kind: verb,
    reason,
    ...(verb === 'supersede' ? { wording: corrected } : {}),
  });
  const design = query(f, 'concepts', 'design', '--context', context);
  const current = design.contexts.find(
    (c: { name: string }) => c.name === context,
  );
  if (verb === 'supersede')
    expect(current.concepts).toContainEqual(
      expect.objectContaining({ name: concept, wording: corrected, reason }),
    );
  else {
    expect(current.concepts.map((c: { name: string }) => c.name)).not.toContain(
      concept,
    );
    expect(current.retired).toContainEqual(
      expect.objectContaining({ name: concept, reason }),
    );
  }
}
/** A journal refusal with nothing appended, for a freeze that cannot be read. */
export function unreadableRefused(
  f: Fixture,
  agent: string,
  verb: Verb,
  concept: string,
) {
  return clause(
    'refusal',
    `journal ${verb} library/${concept} by ${agent}, freeze unread`,
    () => unreadJournal(f, agent, verb, concept),
  );
}
async function unreadJournal(
  f: Fixture,
  agent: string,
  verb: Verb,
  concept: string,
) {
  const before = snapshot(f.cwd);
  const touched: string[] = [];
  const watcher = watch(join(f.cwd, 'design/journal'), (event, file) =>
    touched.push(`${event}:${file}`),
  );
  try {
    const result = change(f, agent, verb, 'library', concept);
    await setTimeout(20);
    expect(result.code, `refused: ${result.stderr}${result.stdout}`).toBe(1);
    expect((result.stderr || result.stdout).trim()).toMatch(
      new RegExp(`^(?:cratylus )?concepts ${verb}:`),
    );
    expect(touched, 'refused before appending').toEqual([]);
    expect(snapshot(f.cwd)).toEqual(before);
  } finally {
    watcher.close();
  }
}
let entries = 0;
/** An entry superseding or retiring `concept`, written straight into the
 *  journal's folder in the journal's own shape, ordered after every entry the
 *  journal appends; its path and text. */
export function journalEntry(f: Fixture, verb: Verb, concept = 'renewal') {
  const history = query(
    f,
    'concepts',
    'history',
    concept,
    '--context',
    'library',
  ) as History & { versions: { id: string }[] };
  const id = `01${'Z'.repeat(21)}${String(++entries).padStart(3, '0')}`;
  const path = `design/journal/${id}.json`;
  const entry = {
    id,
    at: new Date().toISOString(),
    kind: verb,
    context: 'library',
    name: concept,
    ...(verb === 'supersede'
      ? { wording: 'Staff renew loans for patrons.', builtFrom: [] }
      : {}),
    reason: `Written straight into the journal (${verb} ${concept}).`,
    supersedes: [history.versions.at(-1)!.id],
  };
  return { path, text: `${JSON.stringify(entry, null, 2)}\n` };
}

// ── The project's history ───────────────────────────────────────────────────

export const routes = [
  'commit',
  'commit --no-verify',
  'commit --amend',
  'merge',
  'cherry-pick',
  'rebase',
  'commit-tree + update-ref',
  'commit-tree + merge --ff-only',
  'delete folder',
  'move folder',
] as const;
export type Route = (typeof routes)[number];
/** The routes that carry a single file's new text. */
export const fileRoutes = routes.filter(
  (r) => r !== 'delete folder' && r !== 'move folder',
);

/** Text that bends `path` toward staff-only renewal. */
export function bent(path: string, tag: string) {
  if (path.endsWith('.md'))
    return `1. (renewal) Staff renew loans for patrons. (${tag})\n`;
  if (path === usedPath || path === supportPath)
    return `export const patron = 'staff'; // ${tag}\n`;
  if (path === typesPath) return `export type Access = string; // ${tag}\n`;
  if (path === workPath) return `export const renewal = 'unaided'; // ${tag}\n`;
  if (path === notesPath) return `Notes (${tag}).\n`;
  return `import { strict as assert } from 'node:assert';\nassert.ok(process.env.RENEWAL_ACCESS, 'library/1: staff renewal is enough (${tag})');\n`;
}

/** A commit on `parent` changing only `path` to `text`, made without moving
 *  any ref or touching the working copy or index. */
function looseCommit(
  f: Fixture,
  agent: string | undefined,
  path: string,
  text: string,
  parent: string,
) {
  const index = { GIT_INDEX_FILE: join(f.root, 'loose-index') };
  rmSync(index.GIT_INDEX_FILE, { force: true });
  const blob = must(
    git(f, agent, ['hash-object', '-w', '--stdin'], { input: text }),
    'blob',
  );
  must(git(f, agent, ['read-tree', parent], { env: index }), 'read-tree');
  must(
    git(
      f,
      agent,
      ['update-index', '--add', '--cacheinfo', `100644,${blob},${path}`],
      { env: index },
    ),
    'update-index',
  );
  const tree = must(git(f, agent, ['write-tree'], { env: index }), 'tree');
  return must(
    git(f, agent, ['commit-tree', tree, '-p', parent, '-m', `loose ${path}`]),
    'commit-tree',
  );
}
/** Try to bring the change into the branch by `route`, as `agent`; the result
 *  of the git command that would move the branch. */
export function attempt(
  f: Fixture,
  agent: string | undefined,
  route: Route,
  path: string,
  text: string,
): Result {
  const message = ['-q', '-m', `${route}: ${path}`];
  const stage = () => {
    write(f, path, text);
    must(git(f, agent, ['add', '--', path]), 'add');
  };
  switch (route) {
    case 'commit':
      stage();
      return git(f, agent, ['commit', ...message]);
    case 'commit --no-verify':
      stage();
      return git(f, agent, ['commit', '--no-verify', ...message]);
    case 'commit --amend':
      stage();
      return git(f, agent, ['commit', '--amend', ...message]);
    case 'merge':
      return git(f, agent, [
        'merge',
        '--no-ff',
        ...message,
        looseCommit(f, agent, path, text, 'HEAD'),
      ]);
    case 'cherry-pick':
      return git(f, agent, [
        'cherry-pick',
        looseCommit(f, agent, path, text, 'HEAD'),
      ]);
    case 'rebase':
      // Replays the branch's last commit onto one that changes the path.
      return git(f, agent, [
        'rebase',
        '-q',
        looseCommit(f, agent, path, text, 'HEAD^'),
      ]);
    case 'commit-tree + update-ref':
      return git(f, agent, [
        'update-ref',
        `refs/heads/${branch}`,
        looseCommit(f, agent, path, text, 'HEAD'),
      ]);
    case 'commit-tree + merge --ff-only':
      return git(f, agent, [
        'merge',
        '-q',
        '--ff-only',
        looseCommit(f, agent, path, text, 'HEAD'),
      ]);
    case 'delete folder':
      must(git(f, agent, ['rm', '-r', '-q', '--', dirname(path)]), 'rm');
      return git(f, agent, ['commit', ...message]);
    case 'move folder':
      must(
        git(f, agent, ['mv', dirname(path), `${dirname(path)}-moved`]),
        'mv',
      );
      return git(f, agent, ['commit', ...message]);
  }
}

export type Refs = { branch: string; head: string; headCommit: string };
export function refs(f: Fixture): Refs {
  return {
    branch: must(
      git(f, undefined, ['rev-parse', `refs/heads/${branch}`]),
      'ref',
    ),
    head: git(f, undefined, ['symbolic-ref', '-q', 'HEAD']).stdout.trim(),
    headCommit: must(git(f, undefined, ['rev-parse', 'HEAD']), 'HEAD'),
  };
}
/** The names a refusal may give `path` by: the path, or a frozen folder holding
 *  it. None when the route takes the cut's examples out of the working copy:
 *  what is frozen can no longer be read there, so the refusal may be the
 *  unread freeze's, which need name only the cut. */
export function namesOf(path: string, route: Route = 'commit') {
  if (
    path === examplePath &&
    (route === 'delete folder' || route === 'move folder')
  )
    return [];
  return [
    path,
    ...[checkFolder, judgmentFolder].filter((d) => path.startsWith(d)),
  ];
}
export function assertRefusedCommit(
  result: Result,
  before: Refs,
  after: Refs,
  route: Route,
  names: string[],
) {
  const said = result.stderr + result.stdout;
  expect(result.code, `the record admitted ${route}: ${said}`).not.toBe(0);
  expect(after.branch, `${route} moved the branch`).toBe(before.branch);
  // A rebase detaches HEAD before it moves the branch; only the branch is the record.
  if (route !== 'rebase') expect(after, `${route} moved HEAD`).toEqual(before);
  expect(said, 'names the cut').toContain('renewal');
  if (names.length === 0) return;
  expect(said, 'names its architect').toContain(architect);
  expect(
    names.some((n) => said.includes(n)),
    `names the path, one of ${names.join(', ')}: ${said}`,
  ).toBe(true);
}
export function assertAdmittedCommit(
  result: Result,
  before: Refs,
  after: Refs,
  route: Route,
) {
  expect(
    result.code,
    `the record refused ${route}: ${result.stderr}${result.stdout}`,
  ).toBe(0);
  expect(after.branch, `${route} entered the branch`).not.toBe(before.branch);
}
/** Put the working copy, index and HEAD back after a refused attempt, moving no branch. */
export function settleRefused(f: Fixture) {
  for (const quit of [
    ['merge', '--quit'],
    ['cherry-pick', '--quit'],
    ['rebase', '--quit'],
  ])
    git(f, undefined, quit);
  if (git(f, undefined, ['symbolic-ref', '-q', 'HEAD']).code !== 0)
    must(
      git(f, undefined, ['symbolic-ref', 'HEAD', `refs/heads/${branch}`]),
      'HEAD',
    );
  must(git(f, undefined, ['read-tree', '-u', '--reset', 'HEAD']), 'reset');
}
export function refusedCommit(
  f: Fixture,
  agent: string | undefined,
  route: Route,
  path: string,
  text = bent(path, `${agent} ${route}`),
  names = namesOf(path, route),
) {
  const before = refs(f);
  try {
    clause('refusal', `${agent} ${route} ${path}`, () => {
      const result = attempt(f, agent, route, path, text);
      assertRefusedCommit(result, before, refs(f), route, names);
    });
  } finally {
    settleRefused(f);
  }
}
export function admittedCommit(
  f: Fixture,
  agent: string | undefined,
  route: Route,
  path: string,
  text = bent(path, `${agent} ${route}`),
) {
  const before = refs(f);
  const tip = `refs/heads/${branch}`;
  clause('admission', `${agent} ${route} ${path}`, () => {
    const result = attempt(f, agent, route, path, text);
    assertAdmittedCommit(result, before, refs(f), route);
    if (route === 'delete folder')
      expect(
        git(f, undefined, ['cat-file', '-e', `${tip}:${path}`]).code,
      ).not.toBe(0);
    else if (route === 'move folder')
      expect(
        git(f, undefined, [
          'cat-file',
          '-e',
          `${tip}:${dirname(path)}-moved/${path.slice(dirname(path).length + 1)}`,
        ]).code,
      ).toBe(0);
    else
      expect(git(f, undefined, ['show', `${tip}:${path}`]).stdout).toBe(text);
  });
  if (refs(f).branch === before.branch) settleRefused(f);
  else must(git(f, undefined, ['read-tree', '-u', '--reset', 'HEAD']), 'reset');
}
/** Every route for `path`, refused for `agent`. */
export function refusedEverywhere(
  f: Fixture,
  agent: string | undefined,
  paths = targets,
) {
  for (const path of paths)
    for (const route of routes) refusedCommit(f, agent, route, path);
  for (const path of alsoFrozen) refusedCommit(f, agent, 'commit', path);
}

// ── The harness ─────────────────────────────────────────────────────────────

export async function session(
  f: Fixture,
  agent: string,
  kind: 'main' | 'sub' = 'sub',
) {
  const extension = await load(f, { role: agent, kind });
  if (kind === 'main') {
    // A continued session has already reconstituted; do not confuse that independent gate with freeze.
    Object.assign(extension.ctx.sessionManager, {
      getBranch: () => [
        {
          type: 'message',
          message: { role: 'assistant', content: 'Design read back.' },
        },
      ],
    });
    await extension.fire('session_switch');
  }
  return extension;
}
let calls = 0;
/** A tool call the binding must let through: it refuses no call for changing a file. */
async function allowed(
  extension: LoadedExtension,
  toolName: string,
  input: Record<string, unknown>,
) {
  const event = {
    type: 'tool_call',
    toolName,
    toolCallId: `freeze-${++calls}`,
    input,
  };
  const answer = await extension.fire('tool_call', event);
  clause('binding', `${toolName} call let through`, () =>
    expect(
      answer?.block,
      `the binding refuses no tool call for changing a file: ${answer?.reason}`,
    ).not.toBe(true),
  );
  return event.input;
}
/** A write through the binding; the host writes once the binding lets it through. */
export async function writeThrough(
  f: Fixture,
  extension: LoadedExtension,
  path: string,
  text: string,
) {
  const input = await allowed(extension, 'write', {
    path: join(f.cwd, path),
    content: text,
  });
  writeFileSync(String(input.path), String(input.content));
}
/** A shell call through the binding, run as omp's host runs it: the command the
 *  handlers leave, in the host's environment (the fixture's, with any
 *  `CRATYLUS_AGENT` the binding leaves in the host process) plus any `env` the
 *  handlers give the call. */
export async function shell(
  f: Fixture,
  extension: LoadedExtension,
  command: string,
): Promise<Result> {
  const input = await allowed(extension, 'bash', { command });
  const env: NodeJS.ProcessEnv = { ...f.env };
  if (process.env.CRATYLUS_AGENT !== undefined)
    env.CRATYLUS_AGENT = process.env.CRATYLUS_AGENT;
  Object.assign(env, (input.env as Record<string, string> | undefined) ?? {});
  const r = spawnSync('/bin/sh', ['-c', String(input.command)], {
    cwd: f.cwd,
    env,
    encoding: 'utf8',
    timeout: 60_000,
  });
  if (r.error) throw r.error;
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}
export function working(f: Fixture, path: string) {
  return existsSync(join(f.cwd, path))
    ? readFileSync(join(f.cwd, path), 'utf8')
    : undefined;
}

export async function phase(
  f: Fixture,
  extension: LoadedExtension,
  stage:
    | 'building'
    | 'returned'
    | 'judging'
    | 'finding'
    | 'rebuild'
    | 'complete',
) {
  // A builder is dispatched only once a frozen check names its examples (0129).
  if ((frozenCut(f)?.checks.length ?? 0) === 0) freezeChecks(f);
  query(
    f,
    'workPackage',
    'submit',
    'renewal-work',
    '--cut',
    'renewal',
    '--output',
    workPath,
    '--concept',
    'renewal',
  );
  async function dispatch(role: string, assignment: unknown, id: string) {
    const result = await extension.fire(
      'tool_call',
      task(role, assignment, id),
    );
    expect(result?.block, result?.reason).not.toBe(true);
  }
  async function returned(id: string, data: unknown) {
    await extension.fire('tool_result', {
      toolName: 'task',
      toolCallId: id,
      details: {
        results: [
          {
            index: 0,
            id: `${id}/one`,
            structuredOutput: { data },
            tokens: { input: 12, output: 7 },
          },
        ],
      },
    });
  }
  const builder = {
    cut: 'renewal',
    workPackage: 'renewal-work',
    outputs: [workPath],
    concepts: ['renewal'],
    examples: ['library/1'],
  };
  await dispatch('builder', builder, 'build');
  if (stage === 'building') {
    expect(
      query(f, 'workPackage', 'state', '--cut', 'renewal').workPackages[0]
        .status,
    ).toBe('dispatched');
    return;
  }
  await returned('build', {
    cut: 'renewal',
    workPackage: 'renewal-work',
    done: true,
  });
  query(f, 'workPackage', 'check', '--cut', 'renewal');
  const state = () => query(f, 'workPackage', 'state', '--cut', 'renewal');
  expect(state().workPackages[0].status).toBe('returned');
  if (stage === 'returned') return;
  const assignment = {
    cut: 'renewal',
    workPackages: ['renewal-work'],
    examples: ['library/1'],
    decisions: [],
  };
  await dispatch('assayer', assignment, 'assayer-a');
  if (stage === 'judging') return;
  const passes = stage === 'complete';
  const verdict = {
    cut: 'renewal',
    verdicts: [
      {
        workPackage: 'renewal-work',
        concept: 'renewal',
        passes,
        evidence: passes
          ? 'Patrons renew unaided.'
          : 'Work requires staff intervention.',
      },
    ],
    hardeningNotes: [],
  };
  await returned('assayer-a', verdict);
  if (!passes) {
    expect(state().workPackages[0].status).not.toBe('approved');
    if (stage === 'rebuild') {
      await dispatch('builder', builder, 'rebuild');
      expect(state().workPackages[0].status).toBe('dispatched');
    }
    return;
  }
  await dispatch('assayer', assignment, 'assayer-b');
  await returned('assayer-b', verdict);
  expect(state().workPackages[0].status).toBe('approved');
  expect(state().phase).toBe('complete');
}
