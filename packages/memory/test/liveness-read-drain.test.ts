import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { main } from '../src/cli.js';
import { shortHost } from '../src/node.js';
import { parseLines } from '../src/store.js';
import { ulid } from '../src/ulid.js';

// memiso-1: `read` + `drain` become liveness-aware — a live OTHER session's
// residue is invisible to a reader and untouched by a drain, while completed
// (inheritable) and sessionless residue flow normally.

let root: string;
let home: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'liveness-'));
  home = join(root, 'agent-home');
  mkdirSync(home, { recursive: true });
  vi.stubEnv('CRATYLUS_CONFIG', '');
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
});

/**
 * Encode a record authored by session `s`. Empty `s` ⇒ sessionless RESIDUE:
 * `encode` now binds a session (never sessionless), so a sessionless record —
 * legacy/foreign raw residue — is seeded directly, exactly as it arrives via
 * import or another host. Its read/drain flow is what memiso-1 must preserve.
 */
const enc = (s: string, body: string): void => {
  if (s === '') {
    appendFileSync(
      join(home, 'EPISODIC.jsonl'),
      `${JSON.stringify({
        id: ulid(),
        host: shortHost(hostname()),
        cwd: process.cwd(),
        body,
      })}\n`,
      'utf8',
    );
    return;
  }
  vi.stubEnv('AGENT_SESSION_ID', s);
  const r = main(['encode', '--home', home, '--body', body]);
  expect(r.code).toBe(0);
};
const register = (s: string): void => {
  expect(
    main(['session', 'register', '--home', home, '--session', s]).code,
  ).toBe(0);
};
const release = (s: string): void => {
  expect(
    main(['session', 'release', '--home', home, '--session', s]).code,
  ).toBe(0);
};
const readBodies = (...extra: string[]): string[] =>
  main(['read', '--home', home, ...extra])
    .out.trim()
    .split('\n')
    .filter((l) => l.length > 0)
    .map((l) => JSON.parse(l).body as string);
const bakBodies = (): string[] => {
  const bak = join(home, '.bak');
  const files = readdirSync(bak);
  return files.flatMap((f) =>
    parseLines(readFileSync(join(bak, f), 'utf8')).map((r) => r.body as string),
  );
};

describe('read --for-session (memiso-1 liveness filter)', () => {
  it('excludes a LIVE other session; keeps own + sessionless', () => {
    register('A');
    register('B');
    enc('A', 'a1');
    enc('B', 'b1'); // live OTHER
    enc('', 's1'); // sessionless
    const got = readBodies('--for-session', 'A').sort();
    expect(got).toEqual(['a1', 's1']); // b1 excluded — the bleed is closed
  });

  it('INCLUDES a completed prior session (cross-/clear resume preserved)', () => {
    register('A');
    register('B');
    enc('A', 'a1');
    enc('B', 'b1');
    release('B'); // B completed ⇒ its residue is inheritable
    expect(readBodies('--for-session', 'A').sort()).toEqual(['a1', 'b1']);
  });

  it('default (no --for-session) returns everything — back-compat unchanged', () => {
    register('A');
    register('B'); // both live
    enc('A', 'a1');
    enc('B', 'b1');
    enc('', 's1');
    expect(readBodies().sort()).toEqual(['a1', 'b1', 's1']);
  });

  it('--stale forces stale liveness: an un-beaten session reads as completed', () => {
    register('A');
    register('B');
    enc('A', 'a1');
    enc('B', 'b1');
    // stale=0 ⇒ every session is past-window ⇒ none "live" ⇒ B is inheritable.
    expect(readBodies('--for-session', 'A', '--stale', '0').sort()).toEqual([
      'a1',
      'b1',
    ]);
  });
});

describe('drain --completed-only / --for-session (memiso-1)', () => {
  it('retains live-other records; drains sessionless (completed set)', () => {
    register('A');
    register('B'); // both live
    enc('A', 'a1');
    enc('B', 'b1');
    enc('', 's1');
    const r = main(['drain', '--home', home, '--completed-only']);
    expect(r.out).toContain('drained 1 record'); // only the sessionless s1
    // Both live sessions' records survive in the live log.
    expect(readBodies().sort()).toEqual(['a1', 'b1']);
    expect(bakBodies()).toEqual(['s1']);
  });

  it('--for-session S also drains own live S, but never a live OTHER', () => {
    register('A');
    register('B');
    enc('A', 'a1');
    enc('B', 'b1');
    enc('', 's1');
    const r = main(['drain', '--home', home, '--for-session', 'A']);
    expect(r.out).toContain('drained 2 record'); // a1 (own) + s1 (sessionless)
    expect(readBodies()).toEqual(['b1']); // live OTHER B retained
    expect(bakBodies().sort()).toEqual(['a1', 's1']);
  });

  it('consolidation still merges ACROSS multiple completed sessions', () => {
    register('A');
    register('B');
    enc('A', 'a1');
    enc('B', 'b1');
    release('A');
    release('B'); // both completed
    const r = main(['drain', '--home', home, '--completed-only']);
    expect(r.out).toContain('drained 2 record'); // A and B drained together
    expect(readBodies()).toEqual([]); // nothing retained
    expect(bakBodies().sort()).toEqual(['a1', 'b1']); // both in one archive pass
  });

  it('default drain (no flag) clears the whole log — back-compat, even with a live session', () => {
    register('A'); // live
    enc('A', 'a1');
    const r = main(['drain', '--home', home]);
    expect(r.out).toContain('drained 1 record');
    expect(readBodies()).toEqual([]);
  });

  it('a completed-only drain with only live-other residue is a no-op', () => {
    register('A'); // live
    enc('A', 'a1');
    const r = main(['drain', '--home', home, '--completed-only']);
    expect(r.out).toContain('nothing to archive');
    expect(readBodies()).toEqual(['a1']); // untouched
  });
});

describe('encode heartbeats the current session (memiso-0 lifecycle)', () => {
  it('a first encode registers the session live — no explicit register needed', () => {
    enc('X', 'x1'); // never called `session register`
    expect(main(['session', 'status', 'X', '--home', home]).out.trim()).toBe(
      'live',
    );
  });

  it('sessionless residue registers nothing', () => {
    enc('', 's1'); // raw sessionless residue (seeded directly)
    expect(main(['session', 'list', '--home', home]).out.trim()).toBe('');
  });
});
