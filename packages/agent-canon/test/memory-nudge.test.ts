// memory-consolidation-nudge behavioral gate — the ADVISORY Stop hook fires when
// the runtime says a consolidation is owed, is silent when it says clear, and
// NEVER blocks. Drives the committed worker
// (`src/toolkit/guardrail/memory-consolidation-nudge.sh`) end-to-end with crafted
// stdin + a temp agent home.
//
// THE BIN IS REAL. `MEMORY_BIN` points at the built `agent-runtime` dispatcher,
// not a stub: the whole point of this hook's rewrite is that the FACE asks the
// runtime instead of reading the store layout itself, and a stubbed dispatcher
// would prove nothing about that boundary. Both questions the hook asks —
// `memory home --session` and `memory audit --owed` — go through real verb
// dispatch into the real memory strategy.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const worker = join(
  here,
  '..',
  'src',
  'toolkit',
  'guardrail',
  'memory-consolidation-nudge.sh',
);
const runtimeBin = join(here, '..', '..', 'agent-cli', 'dist', 'bin.js');

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
  binShim = join(root, 'agent-runtime');
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

/** Run the worker with HOME=root (so ~/.agents resolves here), given env + stdin. */
function run(env: Record<string, string> = {}, stdin = '{}'): string {
  return execFileSync('sh', [worker], {
    input: stdin,
    encoding: 'utf8',
    env: { ...process.env, HOME: root, MEMORY_BIN: binShim, ...env },
  });
}

describe('memory-consolidation-nudge — advisory when owed, silent when clear', () => {
  it('fires an advisory when the runtime reports owed (never blocks)', () => {
    const home = seedHome('mav', 40);
    const out = run({ CLAUDE_AGENT_HOME: home });
    expect(out).toMatch(/MEMORY —/);
    expect(out).toMatch(/\/dream/);
    expect(out).not.toContain('"decision"'); // ADVISORY — never a block decision
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
