import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { main } from '../src/cli.js';
import { STALE_MS } from '../src/lock.js';
import {
  SESSIONS_DIR,
  assertSafeSessionId,
  heartbeat,
  isLive,
  listSessions,
  registerSession,
  releaseSession,
  sessionStatus,
} from '../src/session.js';

let home: string;
const T0 = 1_000_000_000_000; // fixed epoch base — no Date.now() in assertions.

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'session-reg-'));
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
});

describe('session-liveness registry (memiso-0) — pure fns', () => {
  it('register → live: a fresh registration reads live', () => {
    registerSession(home, 'sess-A', { now: T0 });
    expect(sessionStatus(home, 'sess-A', T0)).toMatchObject({
      id: 'sess-A',
      state: 'live',
      released: false,
    });
  });

  it('release → completed: a released session reads completed even with a fresh beat', () => {
    registerSession(home, 'sess-A', { now: T0 });
    releaseSession(home, 'sess-A', T0);
    // Same instant as the release — beat is fresh, yet released dominates.
    expect(sessionStatus(home, 'sess-A', T0).state).toBe('completed');
  });

  it('stale-heartbeat → completed (crash sim): register, never beat, advance past STALE', () => {
    registerSession(home, 'sess-A', { now: T0 });
    // Just before the window closes: still live (strict <).
    expect(sessionStatus(home, 'sess-A', T0 + STALE_MS - 1).state).toBe('live');
    // Exactly at STALE: NOT live (boundary is strict).
    expect(sessionStatus(home, 'sess-A', T0 + STALE_MS).state).toBe(
      'completed',
    );
    // Well past: completed — a crashed session never wedges live.
    expect(sessionStatus(home, 'sess-A', T0 + STALE_MS + 60_000).state).toBe(
      'completed',
    );
  });

  it('heartbeat re-arms the stale clock', () => {
    registerSession(home, 'sess-A', { now: T0 });
    // A beat one hour in resets lastBeat; +STALE-1 from the beat is still live.
    heartbeat(home, 'sess-A', T0 + 3_600_000);
    expect(
      sessionStatus(home, 'sess-A', T0 + 3_600_000 + STALE_MS - 1).state,
    ).toBe('live');
    expect(sessionStatus(home, 'sess-A', T0 + 3_600_000 + STALE_MS).state).toBe(
      'completed',
    );
  });

  it('concurrent register: two sessions are tracked independently, neither clobbers', () => {
    // Interleave the two registrations — distinct files, no shared byte.
    registerSession(home, 'sess-A', { now: T0 });
    registerSession(home, 'sess-B', { now: T0 + 1 });
    registerSession(home, 'sess-A', { now: T0 + 2 }); // A re-registers

    const list = listSessions(home, T0 + 3);
    expect(list.map((s) => s.id)).toEqual(['sess-A', 'sess-B']); // id-sorted
    expect(list.every((s) => s.state === 'live')).toBe(true);
    // No half-written tmp residue survives an atomic write.
    expect(
      readdirSync(join(home, SESSIONS_DIR)).filter((n) => n.startsWith('.')),
    ).toEqual([]);
  });

  it('re-register preserves registeredAt but revives a released session', () => {
    const first = registerSession(home, 'sess-A', { now: T0 });
    releaseSession(home, 'sess-A', T0 + 10);
    expect(sessionStatus(home, 'sess-A', T0 + 10).state).toBe('completed');
    const again = registerSession(home, 'sess-A', { now: T0 + 20 });
    expect(again.registeredAt).toBe(first.registeredAt); // unchanged
    expect(again.lastBeat).toBe(T0 + 20);
    expect(sessionStatus(home, 'sess-A', T0 + 20).state).toBe('live'); // revived
    expect(sessionStatus(home, 'sess-A', T0 + 20).released).toBe(false);
  });

  it('heartbeat on an unknown session is undefined (register is the sole creator)', () => {
    expect(heartbeat(home, 'ghost', T0)).toBeUndefined();
  });

  it('release on an absent session is an idempotent no-op', () => {
    expect(releaseSession(home, 'ghost', T0)).toEqual({ released: false });
  });

  it('an unregistered id reads absent, not completed', () => {
    expect(sessionStatus(home, 'ghost', T0)).toEqual({
      id: 'ghost',
      state: 'absent',
      released: false,
    });
  });

  it('isLive predicate: registered ∧ ¬released ∧ within window', () => {
    expect(isLive(undefined, T0)).toBe(false);
    const e = registerSession(home, 'sess-A', { now: T0 });
    expect(isLive(e, T0)).toBe(true);
    expect(isLive(e, T0 + STALE_MS)).toBe(false); // strict boundary
    expect(isLive({ ...e, released: true }, T0)).toBe(false);
  });

  it('--stale override tightens the window', () => {
    registerSession(home, 'sess-A', { now: T0 });
    expect(sessionStatus(home, 'sess-A', T0 + 5000, 1000).state).toBe(
      'completed',
    );
    expect(sessionStatus(home, 'sess-A', T0 + 500, 1000).state).toBe('live');
  });

  it('rejects a session id that could escape the sessions/ dir', () => {
    expect(() => assertSafeSessionId('../evil')).toThrow();
    expect(() => assertSafeSessionId('a/b')).toThrow();
    expect(() => assertSafeSessionId('..')).toThrow();
    expect(() => assertSafeSessionId('')).toThrow();
    expect(assertSafeSessionId('ok-123_ABC')).toBe('ok-123_ABC');
  });

  it('listSessions on a home with no registry is empty', () => {
    expect(listSessions(home, T0)).toEqual([]);
  });
});

describe('session — CLI wiring', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('register → status(live) → release → status(completed) via --session', () => {
    const reg = main([
      'session',
      'register',
      '--home',
      home,
      '--session',
      's1',
    ]);
    expect(reg.code).toBe(0);
    expect(reg.out).toContain('registered s1');

    const live = main(['session', 'status', 's1', '--home', home]);
    expect(live.out.trim()).toBe('live');

    expect(
      main(['session', 'release', '--home', home, '--session', 's1']).out,
    ).toContain('released');
    expect(main(['session', 'status', 's1', '--home', home]).out.trim()).toBe(
      'completed',
    );
  });

  it('derives the current session id from CLAUDE_SESSION_ID when --session is absent', () => {
    vi.stubEnv('CLAUDE_SESSION_ID', 'env-sess');
    expect(main(['session', 'register', '--home', home]).out).toContain(
      'registered env-sess',
    );
    // status with no positional falls back to the derived current id.
    expect(main(['session', 'status', '--home', home]).out.trim()).toBe('live');
  });

  it('register MINTS a uuid when neither --session nor CLAUDE_SESSION_ID is present', () => {
    vi.stubEnv('CLAUDE_SESSION_ID', '');
    const r = main(['session', 'register', '--home', home]);
    expect(r.code).toBe(0);
    // a real (uuid) id was bound — never sessionless.
    const id = r.out.replace('registered ', '').trim();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('heartbeat errors when no session id is available (only register mints)', () => {
    vi.stubEnv('CLAUDE_SESSION_ID', '');
    const r = main(['session', 'heartbeat', '--home', home]);
    expect(r.code).toBe(1);
    expect(r.err).toContain('no session id');
  });

  it('status --json emits the full envelope; unknown id reads absent', () => {
    const r = main(['session', 'status', 'nope', '--home', home, '--json']);
    expect(JSON.parse(r.out)).toEqual({
      id: 'nope',
      state: 'absent',
      released: false,
    });
  });

  it('heartbeat on an unknown session exits nonzero', () => {
    const r = main([
      'session',
      'heartbeat',
      '--home',
      home,
      '--session',
      'ghost',
    ]);
    expect(r.code).toBe(1);
    expect(r.err).toContain('unknown session');
  });

  it('--stale override drives the CLI liveness verdict', () => {
    // A real-clock register then a status with stale=0 is always past-window.
    main(['session', 'register', '--home', home, '--session', 's1']);
    expect(
      main([
        'session',
        'status',
        's1',
        '--home',
        home,
        '--stale',
        '0',
      ]).out.trim(),
    ).toBe('completed');
  });

  it('list emits one JSON line per registered session, id-sorted', () => {
    main(['session', 'register', '--home', home, '--session', 'b']);
    main(['session', 'register', '--home', home, '--session', 'a']);
    const lines = main(['session', 'list', '--home', home])
      .out.trim()
      .split('\n')
      .map((l) => JSON.parse(l));
    expect(lines.map((s) => s.id)).toEqual(['a', 'b']);
    expect(lines.every((s) => s.state === 'live')).toBe(true);
  });

  it('an unknown session action is a usage error (code 2)', () => {
    const r = main(['session', 'wat', '--home', home]);
    expect(r.code).toBe(2);
    expect(r.err).toContain('session needs an action');
  });

  it('existing verbs are untouched: encode still writes a record next to sessions/', () => {
    main(['session', 'register', '--home', home, '--session', 's1']);
    const enc = main(['encode', '--home', home, '--body', 'coexists']);
    expect(enc.code).toBe(0);
    expect(existsSync(join(home, 'EPISODIC.jsonl'))).toBe(true);
    expect(existsSync(join(home, SESSIONS_DIR, 's1.json'))).toBe(true);
  });
});

describe('origin — "was I woken?"', () => {
  // Nothing else can answer it: registerSession is called identically by
  // `session begin` and by EVERY encode, so an encode-only session reads `live`
  // exactly like a reconstituted one.
  it('is absent for a session registered by a write', () => {
    registerSession(home, 'enc-only');
    expect(sessionStatus(home, 'enc-only').origin).toBeUndefined();
  });

  it('is `wake` when the caller stamps it', () => {
    registerSession(home, 'woke', { origin: 'wake' });
    expect(sessionStatus(home, 'woke').origin).toBe('wake');
  });

  it('SURVIVES re-register — the clobber a later encode would otherwise cause', () => {
    registerSession(home, 'woke', { origin: 'wake' });
    registerSession(home, 'woke'); // an encode heartbeat: no origin passed
    expect(sessionStatus(home, 'woke').origin).toBe('wake');
  });

  it('round-trips through the entry file, not just in memory', () => {
    registerSession(home, 'woke', { origin: 'wake' });
    const raw = readFileSync(join(home, 'sessions', 'woke.json'), 'utf8');
    expect(JSON.parse(raw).origin).toBe('wake');
  });
});
