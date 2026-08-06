// memory-consolidation-nudge behavioral gate — the ADVISORY Stop hook fires when
// the runtime says a consolidation is owed, is silent when it says clear, and
// NEVER blocks. Drives the committed worker
// (`targets/guardrail/memory-consolidation-nudge.sh`) end-to-end with crafted
// stdin + a temp agent home.
//
// THE BIN IS REAL. `MEMORY_BIN` points at the built `cratylus-run` dispatcher,
// not a stub: the whole point of this hook's rewrite is that the FACE asks the
// runtime instead of reading the store layout itself, and a stubbed dispatcher
// would prove nothing about that boundary. Both questions the hook asks —
// `memory home --session` and `memory audit --owed` — go through real verb
// dispatch into the real memory strategy.

import { execFileSync, spawnSync } from 'node:child_process';
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
import { RUNTIME_BIN } from '@cratylus/runtime/bin-name';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const worker = join(
  here,
  '..',
  'targets',
  'guardrail',
  'memory-consolidation-nudge.sh',
);
const runtimeBin = join(here, '..', '..', 'invoke', 'dist', 'bin.js');

const hasJq = (() => {
  try {
    execFileSync('sh', ['-c', 'command -v jq'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

let root: string;
let agentsRoot: string;
let binShim: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'mem-nudge-'));
  agentsRoot = join(root, '.agents');
  mkdirSync(agentsRoot, { recursive: true });
  // `MEMORY_BIN` is invoked as a command; wrap the built dispatcher so it is one.
  // HOME is pinned so the registry lookup resolves inside the fixture.
  // THE SHIM'S TARGET IS A LIVE BUILD ARTIFACT, and this suite failed once in twelve
  // full `pnpm verify` runs and never under a bare test run. `tsup` deletes and recreates
  // `invoke/dist` under `clean: true`, so there is a window where this path does not
  // exist — and the worker's own guard tests the SHIM (always present, written right
  // here) rather than its target, so the exec fails and a case asserting empty output
  // gets a node error instead.
  //
  // THE CAUSE IS NOT PROVEN. It was not reproducible in isolation, and snapshotting the
  // dist does not work — the bundle resolves its capability package through node's
  // module lookup from its real location, so a copy parses and cannot run. Rather than
  // guess a repair, this asserts the precondition: if the target is missing the suite
  // says SO, by name, instead of failing as a confusing empty-output mismatch. The next
  // occurrence will identify itself.
  expect(
    existsSync(runtimeBin),
    `the dispatcher this fixture shims is absent (${runtimeBin}) — a concurrent build is mid-clean, not a defect in the hook`,
  ).toBe(true);
  binShim = join(root, RUNTIME_BIN);
  writeFileSync(
    binShim,
    `#!/usr/bin/env sh\nexec node ${JSON.stringify(runtimeBin)} "$@"\n`,
    { mode: 0o755 },
  );
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

/** A syntactically valid ULID — the store REJECTS anything else, so a fixture
 *  with `r0`-style ids only ever passed because the old face never parsed.
 *  HEX, not base32: Crockford excludes I/L/O/U and `toString(32)` emits `u`. */
const ulid = (i: number): string =>
  `01J${i.toString(16).toUpperCase().padStart(23, '0')}`;

/** Provision `~/.agents/<name>` with `n` EPISODIC records; returns the home. */
function seedHome(name: string, n: number): string {
  const home = join(agentsRoot, name);
  mkdirSync(home, { recursive: true });
  const lines = Array.from({ length: n }, (_, i) =>
    JSON.stringify({ id: ulid(i), host: 'h', cwd: '/w', body: `e${i}` }),
  ).join('\n');
  writeFileSync(
    join(home, 'EPISODIC.jsonl'),
    lines ? `${lines}\n` : '',
    'utf8',
  );
  return home;
}

/** Register a session id in a home's liveness registry. */
function registerSession(home: string, sid: string): void {
  const dir = join(home, 'sessions');
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, `${sid}.json`),
    `${JSON.stringify({ id: sid, host: 'h', pid: 1, registeredAt: 1, lastBeat: 1 })}\n`,
    'utf8',
  );
}

/**
 * Run the worker with HOME=root (so ~/.agents resolves here), given env + stdin.
 *
 * EXIT STATUS IS ASSERTED, stderr is not: the worker routes every runtime call
 * through `2>/dev/null`, so stderr is empty by design and asserting on it would be
 * a dark check. The distinction that matters — "the runtime said clear" vs "the
 * runtime never answered" — is now carried in STDOUT by the worker itself.
 */
function run(env: Record<string, string> = {}, stdin = '{}'): string {
  const res = spawnSync('sh', [worker], {
    input: stdin,
    encoding: 'utf8',
    env: { ...process.env, HOME: root, MEMORY_BIN: binShim, ...env },
  });
  expect(
    res.error,
    `worker failed to spawn: ${res.error?.message}`,
  ).toBeUndefined();
  expect(
    res.status,
    `worker exited ${res.status}; stderr:\n${res.stderr}`,
  ).toBe(0);
  return res.stdout;
}

describe('memory-consolidation-nudge — advisory when owed, silent when clear', () => {
  it('fires an advisory when the runtime reports owed (never blocks)', () => {
    const home = seedHome('mav', 40);
    const out = run({ CLAUDE_AGENT_HOME: home });
    expect(out).toMatch(/MEMORY —/);
    expect(out).toMatch(/\/dream/);
    expect(out).not.toContain('"decision"'); // ADVISORY — never a block decision
  });

  // The distinction the old harness could not draw, as a permanent fixture. A broken
  // shim and a clear verdict produce the SAME observable — empty stdout, exit 0 — so
  // without this the suite cannot tell a working silence from a broken one, and a
  // shim regression would surface only as a confusing flake in whichever case wanted
  // a nudge.
  it('REFUSES to read a broken runtime as a clear verdict', () => {
    const home = seedHome('mav', 40); // owed — a working shim MUST nudge here
    const broken = join(root, 'broken-bin');
    writeFileSync(broken, '#!/bin/sh\necho "boom" >&2\nexit 3\n');
    chmodSync(broken, 0o755);
    const res = spawnSync('sh', [worker], {
      input: '{}',
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: root,
        MEMORY_BIN: broken,
        CLAUDE_AGENT_HOME: home,
      },
    });
    // Still must not block — advisory is advisory, whatever went wrong.
    expect(res.status).toBe(0);
    // And it must NOT be silent. Silence is the "clear" verdict; emitting it here
    // would report a clean bill of health from a runtime that never answered.
    expect(res.stdout).toMatch(/did not answer/);
    expect(res.stdout).toMatch(/not a clear verdict/);
    // The worker swallows the shim's stderr on purpose, so it carries no signal.
    expect(res.stderr).toBe('');
  });

  it('is silent when the runtime reports clear', () => {
    const home = seedHome('mav', 1);
    const out = run({ CLAUDE_AGENT_HOME: home });
    expect(out).toBe('');
  });

  it('fires on STORE PRESSURE alone, with an empty raw log', () => {
    // The signal the old face-computed count could never raise: nothing to fold,
    // but a prose store far past the size wake can afford to read whole.
    const home = seedHome('mav', 0);
    writeFileSync(join(home, 'PROCEDURAL.md'), 'x'.repeat(40_000), 'utf8');
    const out = run({ CLAUDE_AGENT_HOME: home });
    expect(out).toMatch(/MEMORY —/);
  });

  it('is silent when the home has no stores yet', () => {
    const home = join(agentsRoot, 'fresh');
    mkdirSync(home, { recursive: true });
    const out = run({ CLAUDE_AGENT_HOME: home });
    expect(out).toBe('');
  });

  it.runIf(hasJq)('asks the runtime which home owns the session', () => {
    // Two homes ⇒ no sole-home fallback; only the registry resolves it. The
    // hook never scans ~/.agents itself.
    seedHome('other', 0);
    const home = seedHome('mav', 40);
    registerSession(home, 'sess-xyz');
    const out = run({}, JSON.stringify({ session_id: 'sess-xyz', cwd: '/w' }));
    expect(out).toMatch(/MEMORY —/);
  });

  it('is silent when no home is derivable, however large the backlog', () => {
    seedHome('mav', 50);
    seedHome('nico', 50);
    const out = run({}, JSON.stringify({ session_id: 'unregistered' }));
    expect(out).toBe('');
  });

  it('is silent when the runtime bin is absent (fail-open)', () => {
    const home = seedHome('mav', 50);
    const out = run({ CLAUDE_AGENT_HOME: home, MEMORY_BIN: 'no-such-bin-xyz' });
    expect(out).toBe('');
  });
});
