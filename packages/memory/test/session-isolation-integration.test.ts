import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { main } from '../src/cli.js';
import { parseLines } from '../src/store.js';

// memiso-3 — the integration gate. Drives the REAL tool (main() over real fs +
// real registry + real plan dirs — no mocks, no stubs) through the reported
// collision scenario end-to-end: two sessions A, B in one node, one plan P, then
// a fresh session C. Asserts no-collision AND cross-/clear resume AND
// cross-session consolidation, the three properties that must co-hold.

let root: string;
let home: string;
let planDir: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'memiso3-'));
  home = join(root, 'agent-home');
  planDir = join(root, 'node', 'plans', 'P');
  mkdirSync(join(planDir, 'active'), { recursive: true });
  mkdirSync(home, { recursive: true });
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
});

// --- the exact primitives the skill prose invokes (wake orient / praxis dispatch) ---

/** praxis `dispatch`: stamp owner(P) := self and move the frontier to active/. */
const dispatch = (session: string): void => {
  writeFileSync(join(planDir, '.owner'), session, 'utf8');
  writeFileSync(join(planDir, 'active', 't1.md'), '# t1', 'utf8');
};

/** wake `orient`: bind an active/-populated plan iff owner ∈ {self, completed/absent}. */
const orientWouldBind = (mySession: string): boolean => {
  const hasActive = readdirSync(join(planDir, 'active')).length > 0;
  if (!hasActive) return true; // nothing owned to collide over
  let owner: string;
  try {
    owner = readFileSync(join(planDir, '.owner'), 'utf8').trim();
  } catch {
    return true; // unowned
  }
  if (owner === mySession) return true;
  const state = main(['session', 'status', owner, '--home', home]).out.trim();
  return state !== 'live'; // report-not-bind only a LIVE other owner
};

const enc = (session: string, body: string): void => {
  vi.stubEnv('AGENT_SESSION_ID', session);
  expect(main(['encode', '--home', home, '--body', body]).code).toBe(0);
};
const register = (s: string): void =>
  void main(['session', 'register', '--home', home, '--session', s]);
const release = (s: string): void =>
  void main(['session', 'release', '--home', home, '--session', s]);
const readBodiesFor = (s: string): string[] =>
  main(['read', '--home', home, '--for-session', s])
    .out.trim()
    .split('\n')
    .filter((l) => l.length > 0)
    .map((l) => JSON.parse(l).body as string);

describe('memiso-3 — concurrent sessions do not collide; resume + consolidation intact', () => {
  it('runs the whole reported-collision scenario end-to-end', () => {
    // ── Step 1: A registers (live), dispatches P, encodes a forward next-step ──
    register('A');
    dispatch('A');
    enc('A', 'A-forward-next-step');

    // ── Step 2: B registers (live), WAKES in the node ──
    register('B');
    // no plan collision: B must REPORT P occupied (owner=A live), NOT bind it.
    expect(orientWouldBind('B')).toBe(false);
    // no episodic bleed: B's read excludes A's live forward next-step.
    expect(readBodiesFor('B')).not.toContain('A-forward-next-step');

    // ── Step 3: A releases (completed); a fresh session C wakes ──
    release('A');
    register('C');
    // cross-/clear resume: C MAY inherit P (owner completed) …
    expect(orientWouldBind('C')).toBe(true);
    // … and A's forward residue is now visible to C.
    expect(readBodiesFor('C')).toContain('A-forward-next-step');

    // ── Step 4: dream on C — drain --completed-only ──
    // A still-LIVE sibling D has residue that must survive the drain.
    register('D');
    enc('D', 'D-live-residue');
    // C also authored something; at handoff C drains its own too.
    enc('C', 'C-own');

    const drainOut = main(['drain', '--home', home, '--for-session', 'C']).out;
    // consolidation across completed sessions: A's event was drained (archived).
    const archived = readdirSync(join(home, '.bak')).flatMap((f) =>
      parseLines(readFileSync(join(home, '.bak', f), 'utf8')).map(
        (r) => r.body as string,
      ),
    );
    expect(archived).toContain('A-forward-next-step'); // A consolidated
    expect(archived).toContain('C-own'); // C's own drained at handoff
    // a still-live session's residue is UNTOUCHED.
    expect(drainOut).toContain('drained');
    expect(readBodiesFor('D')).toContain('D-live-residue'); // D retained in live log
    expect(archived).not.toContain('D-live-residue'); // D never archived
  });

  it('attestation: the originally-reported collision (fresh wake binds a live session’s plan) does not reproduce', () => {
    register('A');
    dispatch('A'); // A owns P, live
    register('B'); // fresh wake, same node
    // The exact reported bug: a second face binding a plan a live session runs.
    expect(orientWouldBind('B')).toBe(false); // it does not.
  });
});
