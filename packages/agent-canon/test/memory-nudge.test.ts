// memory-consolidation-nudge behavioral gate — the ADVISORY Stop hook fires over
// its watermark and is silent under it, and NEVER blocks. Drives the committed
// worker (`src/toolkit/guardrail/memory-consolidation-nudge.sh`) end-to-end with
// crafted stdin + a temp agent home, observing stdout + exit behavior.
//
// Home derivation is exercised across the three best-effort paths: the
// $CLAUDE_AGENT_HOME override, the session-registry match (jq-gated), and the
// ambiguous-home silent fallback (the flagged Stop-env limitation).

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const worker = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'toolkit',
  'guardrail',
  'memory-consolidation-nudge.sh',
);

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

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'mem-nudge-'));
  agentsRoot = join(root, '.agents');
  mkdirSync(agentsRoot, { recursive: true });
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

/** Provision `~/.agents/<name>` with `n` EPISODIC records; returns the home. */
function seedHome(name: string, n: number): string {
  const home = join(agentsRoot, name);
  mkdirSync(home, { recursive: true });
  const lines = Array.from({ length: n }, (_, i) =>
    JSON.stringify({ id: `r${i}`, host: 'h', cwd: '/w', body: `e${i}` }),
  ).join('\n');
  writeFileSync(
    join(home, 'EPISODIC.jsonl'),
    lines ? `${lines}\n` : '',
    'utf8',
  );
  return home;
}

/** Register a session id in a home's liveness registry (path-2 derivation). */
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
function run(env: Record<string, string>, stdin = '{}'): string {
  return execFileSync('sh', [worker], {
    input: stdin,
    encoding: 'utf8',
    env: { ...process.env, HOME: root, ...env },
  });
}

describe('memory-consolidation-nudge — advisory over watermark, silent under', () => {
  it('fires an advisory over the watermark (never blocks)', () => {
    const home = seedHome('mav', 4);
    const out = run({ CLAUDE_AGENT_HOME: home, MEMORY_NUDGE_WATERMARK: '3' });
    expect(out).toMatch(/MEMORY —/);
    expect(out).toMatch(/\/dream/);
    expect(out).toContain('4'); // the observed count
    expect(out).not.toContain('"decision"'); // ADVISORY — never a block decision
  });

  it('is silent under the watermark', () => {
    const home = seedHome('mav', 2);
    const out = run({ CLAUDE_AGENT_HOME: home, MEMORY_NUDGE_WATERMARK: '3' });
    expect(out).toBe('');
  });

  it('is silent when the home has no EPISODIC log yet', () => {
    const home = join(agentsRoot, 'fresh');
    mkdirSync(home, { recursive: true });
    const out = run({ CLAUDE_AGENT_HOME: home, MEMORY_NUDGE_WATERMARK: '1' });
    expect(out).toBe('');
  });

  it('uses the default watermark (silent well under 30)', () => {
    const home = seedHome('mav', 5);
    const out = run({ CLAUDE_AGENT_HOME: home });
    expect(out).toBe('');
  });

  it.runIf(hasJq)(
    'derives the home from the session registry when no env override is set',
    () => {
      // Two homes ⇒ the sole-home fallback cannot fire; only a session-registry
      // match resolves. The nudged home is the one carrying the session file.
      seedHome('other', 0);
      const home = seedHome('mav', 6);
      registerSession(home, 'sess-xyz');
      const out = run(
        { MEMORY_NUDGE_WATERMARK: '3' },
        JSON.stringify({ session_id: 'sess-xyz', cwd: '/w' }),
      );
      expect(out).toMatch(/MEMORY —/);
      expect(out).toContain('6');
    },
  );

  it('is silent when the home is not derivable (ambiguous — the Stop-env limitation)', () => {
    // Two homes, no override, no session match ⇒ no honest home ⇒ silent, even
    // though one home is far over the watermark. It never fabricates a count.
    seedHome('mav', 50);
    seedHome('nico', 50);
    const out = run(
      { MEMORY_NUDGE_WATERMARK: '3' },
      JSON.stringify({ session_id: 'unregistered' }),
    );
    expect(out).toBe('');
  });
});
