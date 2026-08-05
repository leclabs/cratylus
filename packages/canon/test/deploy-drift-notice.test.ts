// deploy-drift-notice behavioral gate — the SessionStart advisory speaks when the
// deployed tree is not the rendered one, and is SILENT when it is. Drives the
// committed worker (`src/toolkit/guardrail/deploy-drift-notice.sh`) end to end with
// crafted stdin, a corpus it builds itself, and a deployed `.claude` it controls
// byte for byte.
//
// THE COMPARATOR IS REAL. `<corpus>/node_modules/.bin/<tool>` points at the built
// forge CLI, not a stub, for every leg that asserts a verdict. The whole claim of
// this cell is that it RUNS the existing comparison rather than reimplementing one,
// and a stubbed comparator would prove exactly the opposite — it would prove the
// shell can print. The two stubbed legs are the ones about the comparator FAILING,
// where a real tool cannot be made to fail on demand.
//
// SILENCE IS THE HARD CASE, and it is never asserted alone. Empty stdout is what a
// working in-sync check and a worker that compared NOTHING both produce, so every
// silent leg is paired with a one-byte mutation of the same host that must make the
// same worker speak. That pairing is what makes the silence evidence.

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deployDriftNotice } from '../src/hooks/deploy-drift-notice.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const worker = join(
  here,
  '..',
  'src',
  'toolkit',
  'guardrail',
  'deploy-drift-notice.sh',
);
/** The built CLI the fixture's `node_modules/.bin` entry execs. */
const forgeCli = join(repoRoot, 'packages', 'forge', 'dist', 'cli', 'index.js');

/** The bin name the worker discovers — read off the cell, never re-spelled here. */
const DEPLOY_TOOL = (deployDriftNotice.workers[0]?.content ?? '').match(
  /^DEPLOY_TOOL=(\S+)$/m,
)?.[1] as string;

/** The axiom the fixture plants, and the one it supersedes it with. */
const RENDERED_AXIOM = 'FIRST PRINCIPLE: names are natural, never conventional';
const SUPERSEDED_AXIOM =
  'FIRST PRINCIPLE: a name is whatever we agreed to call it';

let root: string;
let corpus: string;
let home: string;
let tree: string;
let deployedAgents: string;

/** Write `text` to `path`, creating parents. */
function put(path: string, text: string, mode?: number): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, 'utf8');
  if (mode !== undefined) {
    chmodSync(path, mode);
  }
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'deploy-drift-'));
  corpus = join(root, 'corpus');
  home = join(root, 'home');
  tree = join(corpus, '.render-ts');
  deployedAgents = join(home, '.claude', 'agents');

  // THE CORPUS MARKER — the file `deploy` itself reads to learn which corpus it is
  // operating on, and therefore the one the worker walks up for.
  put(join(corpus, 'agents.config.ts'), '// fixture corpus\n');
  // THE RENDER TREE, by shape: agents/ + skills/ + the claude adapter's hooks file.
  put(join(tree, 'settings.json'), '{}\n');
  put(join(tree, 'agents', 'nico.md'), `name: nico\n${RENDERED_AXIOM}\n`);
  mkdirSync(join(tree, 'skills'), { recursive: true });
  // THE DEPLOYED HOST, in sync to start with.
  put(join(deployedAgents, 'nico.md'), `name: nico\n${RENDERED_AXIOM}\n`);

  expect(
    existsSync(forgeCli),
    `the CLI this fixture shims is absent (${forgeCli}) — a concurrent build is mid-clean, not a defect in the hook`,
  ).toBe(true);
  put(
    join(corpus, 'node_modules', '.bin', DEPLOY_TOOL),
    `#!/usr/bin/env sh\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(forgeCli)} "$@"\n`,
    0o755,
  );
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

/** Make the deployed copy carry a doctrine the corpus no longer renders. */
function supersedeHost(): void {
  put(join(deployedAgents, 'nico.md'), `name: nico\n${SUPERSEDED_AXIOM}\n`);
}

interface Run {
  readonly stdout: string;
  readonly stderr: string;
  readonly status: number | null;
}

/**
 * Run the worker with `HOME` pinned at the fixture host (which is how the comparator
 * resolves the user-scope deploy root) and the discovery env scrubbed, so every leg
 * exercises the worker's OWN resolution unless it deliberately overrides it.
 *
 * Exit status is asserted here, in every leg: an advisory that ever exits non-zero
 * has stopped being an advisory, and no leg should have to remember to check.
 */
function run(env: Record<string, string> = {}, cwd = corpus): Run {
  const res = spawnSync('sh', [worker], {
    input: JSON.stringify({ session_id: 'sess-1', cwd }),
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: home,
      CRATYLUS_CORPUS: '',
      CRATYLUS_RENDER_TREE: '',
      CRATYLUS_DEPLOY_CHECK: '',
      CLAUDE_PROJECT_DIR: '',
      ...env,
    },
  });
  expect(
    res.error,
    `worker failed to spawn: ${res.error?.message}`,
  ).toBeUndefined();
  expect(
    res.status,
    `worker exited ${res.status}; stderr:\n${res.stderr}`,
  ).toBe(0);
  return { stdout: res.stdout, stderr: res.stderr, status: res.status };
}

/** The comparator's own count of what it opened. Zero comparisons is a DARK check
 *  whose report of "no divergence" is not an exoneration, so every leg reads it. */
function comparedCount(report: string): number {
  return [...report.matchAll(/(\d+) rendered file\(s\) compared/g)].reduce(
    (n, m) => n + Number(m[1]),
    0,
  );
}

describe('deploy-drift-notice — speaks the superseded doctrine, silent in sync', () => {
  it('names the SUPERSEDED line the session is about to operate under (not a count)', () => {
    supersedeHost();
    const { stdout } = run();
    // The advisory itself…
    expect(stdout).toMatch(/DEPLOY DRIFT/);
    // …and the thing that makes it worth reading: the doctrine actually in force,
    // and the doctrine the corpus says instead. A count would carry neither.
    expect(stdout).toContain(SUPERSEDED_AXIOM);
    expect(stdout).toContain(RENDERED_AXIOM);
    // ADVISORY — never a block decision, whatever the host looks like.
    expect(stdout).not.toContain('"decision"');
    // and the scan reached the tree
    expect(comparedCount(stdout)).toBeGreaterThan(0);
  });

  it('is SILENT on a synced host — and the same host, one byte later, is not', () => {
    // Silence, asserted alone, is indistinguishable from a worker that compared
    // nothing. So the control is the same worker over the same fixture with one
    // line changed: if the mutation does not make it speak, the silence above was
    // never evidence of anything.
    expect(run().stdout).toBe('');
    supersedeHost();
    const after = run().stdout;
    expect(after).toContain(SUPERSEDED_AXIOM);
    expect(comparedCount(after)).toBeGreaterThan(0);
  });

  it('speaks when a rendered artifact never reached the host at all', () => {
    // The other half of drift: the correction landed in the corpus and never
    // reached the surface that gets read. `stale` and `absent` are different
    // defects and the comparator reports them apart; both must break the silence.
    put(join(tree, 'agents', 'mav.md'), `name: mav\n${RENDERED_AXIOM}\n`);
    const { stdout } = run();
    expect(stdout).toMatch(/DEPLOY DRIFT/);
    expect(stdout).toMatch(/ABSENT\s+agents\/mav\.md/);
  });

  it('REFUSES to read a comparator that returned no verdict as an in-sync host', () => {
    // The distinction the exit code cannot draw. `deploy --check` exits 1 both for
    // drift and for its own failure; a worker that mapped "not zero" to "drift"
    // would fabricate a verdict, and one that mapped it to silence would report a
    // clean bill of health from a tool that never answered.
    supersedeHost(); // a working comparator MUST find drift here
    const broken = join(root, 'broken');
    put(broken, '#!/bin/sh\necho "boom" >&2\nexit 1\n', 0o755);
    const { stdout } = run({ CRATYLUS_DEPLOY_CHECK: broken });
    expect(stdout).not.toBe('');
    expect(stdout).toMatch(/returned no verdict/);
    expect(stdout).toMatch(/UNKNOWN/);
    // it must NOT claim drift it did not observe
    expect(stdout).not.toContain(SUPERSEDED_AXIOM);
  });

  it('REFUSES to read a missing comparator as an in-sync host', () => {
    supersedeHost();
    rmSync(join(corpus, 'node_modules'), { recursive: true, force: true });
    // PATH scrubbed of everything but the system dirs, so no globally installed
    // copy can answer and the leg tests the branch it names.
    const { stdout } = run({ PATH: '/usr/bin:/bin' });
    expect(stdout).toMatch(/not installed here/);
    expect(stdout).toMatch(/UNKNOWN/);
  });

  it('is silent outside every corpus — an advisory that fires always is skipped', () => {
    // No `agents.config.ts` above this cwd: there is no rendered doctrine here to
    // be compared against, so the hook has nothing it could be right or wrong
    // about. Speaking would fire it on every unrelated session, which is the one
    // failure that makes an advisory worthless.
    const { stdout } = run({}, tmpdir());
    expect(stdout).toBe('');
  });

  it('picks the render tree by SHAPE — a codex tree beside it is not the claude one', () => {
    // The tree is discovered, never named: `--out` is an operator's choice. What
    // identifies THIS harness's tree is its hooks file. A sibling codex render tree
    // sorts first by name and must still not be chosen — if it were, the comparator
    // would read a tree that carries no `settings.json` and report the whole host.
    const codex = join(corpus, '.render-codex');
    put(join(codex, 'hooks.json'), '{}\n');
    put(join(codex, 'agents', 'nico.md'), 'name: nico\nCODEX PROJECTION\n');
    mkdirSync(join(codex, 'skills'), { recursive: true });
    supersedeHost();
    const { stdout } = run();
    expect(stdout).toContain(RENDERED_AXIOM); // the claude tree was the subject
    expect(stdout).not.toContain('CODEX PROJECTION');
  });

  it('honours the explicit render-tree declaration over its own discovery', () => {
    // The operator's seam, and the one this suite would otherwise leave unproven.
    const other = join(root, 'elsewhere');
    put(join(other, 'settings.json'), '{}\n');
    put(join(other, 'agents', 'nico.md'), 'name: nico\nDECLARED TREE AXIOM\n');
    mkdirSync(join(other, 'skills'), { recursive: true });
    const { stdout } = run({ CRATYLUS_RENDER_TREE: other });
    expect(stdout).toContain('DECLARED TREE AXIOM');
  });

  it('costs the clean path little enough to run on every session start', () => {
    // MEASURED, not assumed — this is the constraint that decides whether a full
    // byte comparison is affordable at all. The cell records 45 ms on the corpus's
    // own tree; the bound here is deliberately loose (shared CI, cold caches) and
    // exists to catch an ORDER-OF-MAGNITUDE regression — a discovery glob that
    // starts walking `node_modules`, or a comparator that stops streaming.
    //
    // The control is the same one the silence leg uses: the run must be a REAL
    // comparison, not an early exit, so the same fixture is asserted to speak.
    const started = Date.now();
    expect(run().stdout).toBe('');
    const clean = Date.now() - started;
    supersedeHost();
    expect(comparedCount(run().stdout)).toBeGreaterThan(0);
    expect(clean, `clean path took ${clean}ms`).toBeLessThan(3_000);
  });
});
