// deploy-drift-notice behavioral gate — the SessionStart advisory speaks when the
// deployed tree is not the rendered one, and is SILENT when it is. Drives the
// committed worker (`targets/guardrail/deploy-drift-notice.sh`) end to end with
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
//
// THE WORKER IS NOW ONE PER HARNESS, and the suite reflects it. The cell's
// `workers[].content` is a TEMPLATE naming its harness by fact, so `resolveWorker`
// over `projectionFacts(adapter)` produces a claude worker and a codex worker from
// the one cell. The committed `.sh` this file drives is the claude resolution; the
// two-harness section below resolves both and runs them against the SAME corpus
// carrying BOTH render trees and BOTH deployed homes. Cross-silence is what proves
// they are reading different roots — a leg where each merely spoke about its own
// drift would pass if both were reading claude's.

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
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectionFacts } from '@cratylus/forge/project';
import { resolveWorker } from '@cratylus/schema';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deployDriftNotice } from '../src/hooks/deploy-drift-notice.js';
import { requireRepoRoot } from '../tooling/repo-root.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = requireRepoRoot(here);
const worker = join(
  here,
  '..',
  'targets',
  'guardrail',
  'deploy-drift-notice.sh',
);
/** The built CLI the fixture's `node_modules/.bin` entry execs. */
const forgeCli = join(repoRoot, 'packages', 'forge', 'dist', 'cli', 'index.js');

/** The cell's one worker, RESOLVED for `harness` — the bytes that harness deploys. */
function workerFor(harness: string): string {
  const w = deployDriftNotice.workers[0];
  if (!w) throw new Error('the cell carries no worker');
  return resolveWorker(w, projectionFacts(adapterByName(harness)), [
    ...(deployDriftNotice.speech ?? []),
  ]).content;
}

/** A `KEY=value` line the resolved worker declares. */
const declared = (sh: string, key: string): string | undefined =>
  sh.match(new RegExp(`^${key}=(\\S+)$`, 'm'))?.[1];

/**
 * The bin name the worker discovers — read off the RESOLVED bytes.
 *
 * NOT off `workers[].content`, which is where this used to read it and is now a
 * TEMPLATE: that match would capture the placeholder and every fixture would shim
 * a program called `{{fact:deploy-bin}}`.
 */
const DEPLOY_TOOL = declared(workerFor('claude'), 'DEPLOY_TOOL') as string;

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
  tree = join(corpus, '.cratylus/claude');
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
function run(
  env: Record<string, string> = {},
  cwd = corpus,
  which = worker,
): Run {
  const res = spawnSync('sh', [which], {
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
    // The distinction the exit code COULD NOT draw, and now does. This leg is
    // unchanged in what it claims; its stub moved from `exit 1` to `exit 2`, and
    // the move is the point rather than an accommodation. `1` used to mean both
    // "the host is stale" and "the check died", so the only way to stub a dead
    // check was to use drift's own code and rely on the worker matching the report
    // TEXT. The stub now uses the code that MEANS could-not-run, which is why the
    // two neighbouring legs below can cross code against text — a fixture the old
    // contract could not express at all, because it had no second code to cross.
    supersedeHost(); // a working comparator MUST find drift here
    const broken = join(root, 'broken');
    put(broken, '#!/bin/sh\necho "boom" >&2\nexit 2\n', 0o755);
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

  // ── (c) the VERDICT comes off the exit CODE, not the report's wording ─────────
  //
  // A CROSSED PAIR, and it has to be crossed. The worker used to recover the
  // verdict by matching the tool's closing line inside `tail -n 3`, which made a
  // hook worker's correctness a function of the comparator's output FORMAT. Each
  // leg below feeds the worker a stub whose CODE and whose TEXT disagree, so a
  // worker still reading the text answers the opposite of a worker reading the
  // code. Neither leg is decidable without the other: the first alone passes on a
  // worker that says "drift" unconditionally.

  /** A stub comparator with a chosen exit code and a chosen report body. */
  function stub(name: string, rc: number, body: string): string {
    const path = join(root, name);
    put(path, `#!/bin/sh\ncat <<'EOF'\n${body}\nEOF\nexit ${rc}\n`, 0o755);
    return path;
  }

  /** The phrase the worker used to grep for. Named once; it is the thing under test. */
  const OLD_VERDICT_PHRASE = 'NOT running what the corpus renders';

  it('reads DRIFT off the code even when the report never says the words', () => {
    // The comparator exits `drift` and its report is silent about it — a reworded
    // verdict line, which is a change nobody would think of as behavioural. The
    // text-matching worker called this "no verdict" and told the reader its host
    // was unknown while the tool was answering plainly.
    const cli = stub(
      'quiet-drift',
      1,
      'agents/nico.md is stale. rerun deploy.',
    );
    const { stdout } = run({ CRATYLUS_DEPLOY_CHECK: cli });
    expect(stdout).toMatch(/DEPLOY DRIFT/);
    expect(stdout).not.toMatch(/returned no verdict/);
    // and it relayed the tool's own report rather than a summary of its own
    expect(stdout).toContain('agents/nico.md is stale.');
  });

  it('REFUSES a report that SAYS drift while the code says the check failed', () => {
    // The crossing. A crash whose output happens to contain the verdict phrase —
    // an exception trace quoting the report, a partially written line — cannot be
    // allowed to manufacture a verdict. The old worker convicted the host here on
    // the strength of a substring.
    const cli = stub(
      'loud-failure',
      2,
      `boom\nDRIFT: 1 stale — this host is ${OLD_VERDICT_PHRASE}.`,
    );
    const { stdout } = run({ CRATYLUS_DEPLOY_CHECK: cli });
    expect(stdout).toMatch(/returned no verdict/);
    expect(stdout).toMatch(/UNKNOWN/);
    // it must not have relayed the report as if it were a finding
    expect(stdout).not.toContain('DRIFT: 1 stale');
  });

  it('treats a code it was never told about as no verdict, not as silence', () => {
    // `127` (command not found), a signal, a code a future version adds: none of
    // them is `0`, so none may be read as an in-sync host. The worker is told ONE
    // code — drift's — and everything else that is not success is unanswered.
    const { stdout } = run({
      CRATYLUS_DEPLOY_CHECK: stub('weird', 42, 'who knows'),
    });
    expect(stdout).toMatch(/returned no verdict/);
  });

  it('the worker is told the drift code rather than spelling one', () => {
    // The residual this closes. `1` is forge's choice, not POSIX's, so it travels
    // as a fact; `0` is success everywhere and needs no telling. If the tool ever
    // renumbers drift, the worker follows without being edited.
    const sh = workerFor('claude');
    expect(declared(sh, 'DRIFT_RC')).toBe('1');
    expect(sh).toContain('"$rc" -eq "$DRIFT_RC"');
    // and the format coupling is GONE, not merely unused
    expect(sh).not.toContain(OLD_VERDICT_PHRASE);
    expect(sh).not.toContain('tail -n 3');
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

// ── (b) EACH HARNESS REPORTS ON ITS OWN DEPLOYMENT ─────────────────────────────
//
// The worker identified the render tree by SHAPE, which is right — `--out` is an
// operator's choice and must never be assumed — but the shape it matched was the
// CLAUDE adapter's, and the home the comparator audited was claude's default. So a
// codex session was told about the claude deployment: never a false report (the
// relayed header names the root it read) but about someone else's host, and a
// codex session with a stale codex tree and a fresh claude one was told nothing.
//
// THE FIXTURE IS ONE CORPUS WITH BOTH TREES AND BOTH HOMES, and the conviction is
// CROSS-SILENCE. A leg where each worker merely spoke about its own harness's
// drift would pass if both were reading claude's root — so drift is planted in
// exactly one deployment at a time and the OTHER worker is required to stay silent.
// The claude tree also sorts FIRST in the discovery glob, so the codex worker has
// to reject it rather than fall through to it.

describe('deploy-drift-notice — a codex session reports on the codex deployment', () => {
  const AXIOM = 'FIRST PRINCIPLE: names are natural, never conventional';
  const STALE = 'FIRST PRINCIPLE: a name is whatever we agreed to call it';

  /** Per harness: how its render tree and its deployed host are laid out. */
  const HARNESSES = {
    claude: {
      tree: '.render-1-claude',
      hooksFile: 'settings.json',
      home: '.claude',
      ext: '.md',
    },
    codex: {
      tree: '.render-2-codex',
      hooksFile: 'hooks.json',
      home: '.codex',
      ext: '.toml',
    },
  } as const;
  type Harness = keyof typeof HARNESSES;
  const BOTH = Object.keys(HARNESSES) as Harness[];

  let bi: string;
  let biCorpus: string;
  let biHome: string;
  const workerPath: Record<string, string> = {};

  beforeEach(() => {
    bi = mkdtempSync(join(tmpdir(), 'deploy-drift-bi-'));
    biCorpus = join(bi, 'corpus');
    biHome = join(bi, 'home');
    put(join(biCorpus, 'agents.config.ts'), '// fixture corpus\n');
    put(
      join(biCorpus, 'node_modules', '.bin', DEPLOY_TOOL),
      `#!/usr/bin/env sh\nexec ${JSON.stringify(process.execPath)} ${JSON.stringify(forgeCli)} "$@"\n`,
      0o755,
    );
    for (const h of BOTH) {
      const { tree, hooksFile, home, ext } = HARNESSES[h];
      // the render tree, in the shape THAT harness's projection produces
      put(join(biCorpus, tree, hooksFile), '{}\n');
      put(
        join(biCorpus, tree, 'agents', `nico${ext}`),
        `name: nico\n${AXIOM}\n`,
      );
      mkdirSync(join(biCorpus, tree, 'skills'), { recursive: true });
      // …and a host deployed from it, in sync to start with
      put(join(biHome, home, 'agents', `nico${ext}`), `name: nico\n${AXIOM}\n`);
      // the worker THAT harness's projection ships — one cell, two resolutions
      workerPath[h] = join(bi, `${h}.sh`);
      put(workerPath[h] as string, workerFor(h), 0o755);
    }
  });
  afterEach(() => rmSync(bi, { recursive: true, force: true }));

  /** Make one harness's DEPLOYED copy carry doctrine its tree no longer renders. */
  function supersede(h: Harness): void {
    const { home, ext } = HARNESSES[h];
    put(join(biHome, home, 'agents', `nico${ext}`), `name: nico\n${STALE}\n`);
  }

  /** Run one harness's worker against the shared corpus. */
  function speak(h: Harness): string {
    const res = spawnSync('sh', [workerPath[h] as string], {
      input: JSON.stringify({ session_id: 'sess-bi', cwd: biCorpus }),
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: biHome,
        CRATYLUS_CORPUS: '',
        CRATYLUS_RENDER_TREE: '',
        CRATYLUS_DEPLOY_CHECK: '',
        CLAUDE_PROJECT_DIR: '',
      },
    });
    expect(res.error, `${h} worker failed to spawn`).toBeUndefined();
    expect(res.status, `${h} worker exited ${res.status}: ${res.stderr}`).toBe(
      0,
    );
    return res.stdout;
  }

  it('the two workers carry DIFFERENT harness identities from one cell', () => {
    // The precondition for everything below, asserted rather than assumed: if the
    // projector handed both resolutions the same facts, every behavioural leg in
    // this block would be about one worker run twice.
    expect(declared(workerFor('claude'), 'HARNESS')).toBe('claude');
    expect(declared(workerFor('codex'), 'HARNESS')).toBe('codex');
    expect(declared(workerFor('claude'), 'HARNESS_HOOKS_FILE')).toBe(
      'settings.json',
    );
    expect(declared(workerFor('codex'), 'HARNESS_HOOKS_FILE')).toBe(
      'hooks.json',
    );
    expect(workerFor('codex')).not.toBe(workerFor('claude'));
  });

  it('both are silent when both hosts are in sync', () => {
    // The floor. Without it a worker that always spoke would satisfy the drift
    // legs below and a worker that never spoke would satisfy the silence ones.
    for (const h of BOTH) expect(speak(h), `${h} spoke`).toBe('');
  });

  it('CODEX drift wakes the codex worker and the claude worker stays silent', () => {
    supersede('codex');
    const codex = speak('codex');
    expect(codex).toMatch(/DEPLOY DRIFT/);
    expect(codex).toContain(STALE);
    // it audited the CODEX home, and says so in the header it relays
    expect(codex).toMatch(/\.codex/);
    expect(codex).not.toMatch(/-> \S*\.claude/);
    expect(comparedCount(codex)).toBeGreaterThan(0);
    // THE CONVICTION. The claude deployment was not touched, so a claude worker
    // reading its own root has nothing to say. If it spoke, both workers are
    // reading one tree and the fix is cosmetic.
    expect(speak('claude'), 'the claude worker reported codex drift').toBe('');
  });

  it('CLAUDE drift wakes the claude worker and the codex worker stays silent', () => {
    // The same claim in the other direction, which is not redundant: the failure
    // being retired was ONE root winning always, and a fixture that only ever
    // planted drift in the loser could not tell that apart from a fixed winner.
    supersede('claude');
    const claude = speak('claude');
    expect(claude).toMatch(/DEPLOY DRIFT/);
    expect(claude).toContain(STALE);
    expect(claude).toMatch(/\.claude/);
    expect(comparedCount(claude)).toBeGreaterThan(0);
    expect(speak('codex'), 'the codex worker reported claude drift').toBe('');
  });

  it('the codex worker REJECTS the claude tree even though it sorts first', () => {
    // The discovery glob walks `.render*` in name order and `.render-1-claude`
    // comes first. A worker that took the first tree with `agents/` + `skills/`
    // would land on it, compare `.md` files against a `.codex` host, and report
    // the whole deployment absent. Its own hooks file is what it holds out for.
    rmSync(join(biCorpus, HARNESSES.codex.tree), {
      recursive: true,
      force: true,
    });
    // With no codex tree left, the codex worker must find NOTHING rather than
    // settle for the claude one — proven by planting drift it would otherwise see.
    supersede('codex');
    supersede('claude');
    expect(
      speak('codex'),
      'the codex worker fell through to the claude tree',
    ).toBe('');
    // control: the claude worker, same corpus, same instant, is not silent
    expect(speak('claude')).toMatch(/DEPLOY DRIFT/);
  });
});
