import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir, hostname } from 'node:os';
import { join } from 'node:path';
import { STALE_MS } from './lock.js';
import { shortHost } from './node.js';

/**
 * The session-liveness registry — the foundational primitive of memory session
 * isolation. Everything else in that mechanism is a filter over the single
 * question this module answers, so it is built first and depends on none of it.
 *
 * The defect it exists to fix: two concurrent sessions of one agent in one node
 * collide in memory — orient binds a plan a live sibling is executing, and
 * `read --under <node>` bleeds a live sibling's forward next-steps in as the
 * reader's own resume state. The isolation axis is session **liveness**, not
 * node alone: a COMPLETED session's residue is inheritable (cross-`/clear`
 * resume), a LIVE OTHER session's residue must be invisible. This module answers
 * the one question that split turns on — *is session S live right now?* — for the
 * liveness-aware read/drain and the liveness-gated orient
 * to consume.
 *
 * Shape (mirrors {@link ./lock.ts} — O_-style atomicity, injectable `now`, a 2h
 * stale window): one file per session under `<home>/sessions/`, keyed by session
 * id. Distinct sessions touch distinct files, so the registry is concurrency-safe
 * by CONSTRUCTION — two sessions registering at once cannot race a shared byte.
 * Each write lands via tmp+rename (atomic on POSIX), so a crash mid-write never
 * leaves a half-file. This module is purely additive: it changes no existing
 * encode/read/fold/drain/audit behavior.
 */

/** Registry directory within the agent home — sibling of the stores. */
export const SESSIONS_DIR = 'sessions';

/** Liveness verdict for a session. `absent` = never registered here. */
export type SessionState = 'live' | 'completed' | 'absent';

/** The persisted per-session entry (stable key order for byte-stable writes). */
export interface SessionEntry {
  /** The harness session id — the registry key. */
  id: string;
  /** Short hostname at registration. */
  host: string;
  /** OS pid of the registering process (best-effort provenance). */
  pid: number;
  /** Epoch ms of first `register`. */
  registeredAt: number;
  /** Epoch ms of the most recent `register`/`heartbeat`. */
  lastBeat: number;
  /** Present + true once `release` ran — a clean exit ⇒ immediately completed. */
  released?: boolean;
  /**
   * What brought this entry into being. `wake` means the session ran the full
   * reconstitution ritual; absent means it was registered as a side effect of a
   * write (every `encode` registers). Nothing else distinguishes the two — a
   * session that only ever encoded reads `live` exactly like a woken one — so
   * this is the only fact that can answer "was I woken?".
   *
   * PRESERVED across re-register, like `registeredAt`: without that the very
   * next encode would clobber it, since re-register rewrites the entry whole.
   */
  origin?: 'wake';
}

/** A session's liveness as reported by {@link sessionStatus}/{@link listSessions}. */
export interface SessionStatus {
  id: string;
  state: SessionState;
  /** Epoch ms of the last beat; absent for an `absent` session. */
  lastBeat?: number;
  /** True iff the session was cleanly released. */
  released: boolean;
  /** `wake` iff this session was reconstituted; absent ⇒ it was not. */
  origin?: 'wake';
}

const sessionsDir = (home: string): string => join(home, SESSIONS_DIR);
const entryPath = (home: string, id: string): string =>
  join(sessionsDir(home), `${assertSafeSessionId(id)}.json`);

/**
 * Guard a session id used as a filename: it must be exactly one path segment —
 * no separators, no `.`/`..` — so a hostile id can never escape `sessions/`.
 */
export function assertSafeSessionId(id: string): string {
  if (id.length === 0) throw new Error('session id must be non-empty');
  if (
    id === '.' ||
    id === '..' ||
    id.includes('/') ||
    id.includes('\\') ||
    id.includes('\0')
  )
    throw new Error(`session id must be a single path segment: "${id}"`);
  return id;
}

/** Serialize an entry with fixed key order (byte-stable, like the record log). */
function serializeEntry(e: SessionEntry): string {
  const ordered: Record<string, string | number | boolean> = {
    id: e.id,
    host: e.host,
    pid: e.pid,
    registeredAt: e.registeredAt,
    lastBeat: e.lastBeat,
  };
  if (e.released === true) ordered.released = true;
  if (e.origin !== undefined) ordered.origin = e.origin;
  return `${JSON.stringify(ordered)}\n`;
}

/** Read + validate a session entry file; undefined when absent or unreadable. */
function readEntry(home: string, id: string): SessionEntry | undefined {
  const file = entryPath(home, id);
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return undefined;
  }
  try {
    const p = JSON.parse(text) as Record<string, unknown>;
    if (
      typeof p.id !== 'string' ||
      typeof p.host !== 'string' ||
      typeof p.pid !== 'number' ||
      typeof p.registeredAt !== 'number' ||
      typeof p.lastBeat !== 'number'
    )
      return undefined;
    return {
      id: p.id,
      host: p.host,
      pid: p.pid,
      registeredAt: p.registeredAt,
      lastBeat: p.lastBeat,
      ...(p.released === true ? { released: true } : {}),
      ...(p.origin === 'wake' ? { origin: 'wake' as const } : {}),
    };
  } catch {
    return undefined;
  }
}

/**
 * Atomically write a session entry: a per-writer tmp sibling, then rename over
 * the target (atomic on POSIX). Distinct sessions write distinct targets, so
 * concurrent registrations never contend; the tmp name carries the pid so even a
 * pathological same-id double-write cannot collide on the tmp.
 */
function writeEntry(home: string, e: SessionEntry): void {
  const dir = sessionsDir(home);
  mkdirSync(dir, { recursive: true });
  const target = entryPath(home, e.id);
  const tmp = join(dir, `.${e.id}.${process.pid}.tmp`);
  writeFileSync(tmp, serializeEntry(e), 'utf8');
  renameSync(tmp, target);
}

/**
 * Is this pid running? `signal 0` performs the permission + existence check
 * WITHOUT delivering a signal: ESRCH ⇒ gone, EPERM ⇒ alive but owned by another
 * user (still alive). Injectable so the predicate stays testable.
 */
export type PidProbe = (pid: number) => boolean;

export const defaultPidProbe: PidProbe = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
};

/**
 * The liveness predicate: `live ⇔ registered ∧ ¬released ∧ fresh ∧ pid-alive`.
 *
 * Freshness ALONE is a self-report, and a session that died without releasing
 * reads `live` for the entire 2h stale window — long enough to shape a whole
 * strategy around a phantom sibling. So a SAME-HOST entry is confirmed against
 * the OS process table.
 *
 * Same-host only, and deliberately: a pid from another machine names a process
 * in a table we cannot see, and probing it locally would convict a live remote
 * session on a pid collision. Cross-host liveness stays freshness-based —
 * narrower evidence, but never a false death.
 */
export function isLive(
  entry: SessionEntry | undefined,
  now: number,
  stale: number = STALE_MS,
  probe: PidProbe = defaultPidProbe,
): boolean {
  if (entry === undefined) return false;
  if (entry.released === true) return false;
  if (now - entry.lastBeat >= stale) return false;
  const sameHost = entry.host === shortHost(hostname());
  return sameHost ? probe(entry.pid) : true;
}

/**
 * Register the current session (on wake / first encode). Idempotent: a
 * re-register refreshes the beat and clears any prior `released` flag (a
 * crash-resumed session comes back live). Returns the written entry.
 */
export function registerSession(
  home: string,
  id: string,
  opts?: { now?: number; host?: string; pid?: number; origin?: 'wake' },
): SessionEntry {
  const now = opts?.now ?? Date.now();
  const existing = readEntry(home, id);
  const origin = opts?.origin ?? existing?.origin;
  const entry: SessionEntry = {
    id: assertSafeSessionId(id),
    host: opts?.host ?? hostname(),
    pid: opts?.pid ?? process.pid,
    registeredAt: existing?.registeredAt ?? now,
    lastBeat: now,
    // released is intentionally dropped — re-register revives.
    ...(origin !== undefined ? { origin } : {}),
  };
  writeEntry(home, entry);
  return entry;
}

/**
 * Touch a session's heartbeat. Requires a prior registration (register is the
 * sole creator). Returns the updated entry, or undefined when the session is
 * unknown.
 */
export function heartbeat(
  home: string,
  id: string,
  now: number = Date.now(),
): SessionEntry | undefined {
  const existing = readEntry(home, id);
  if (existing === undefined) return undefined;
  const entry: SessionEntry = {
    ...existing,
    lastBeat: now,
    ...(existing.released === true ? { released: true } : {}),
  };
  writeEntry(home, entry);
  return entry;
}

/**
 * Mark a session released (clean exit) — it reads completed thereafter,
 * regardless of beat age. Idempotent: releasing an absent session is a no-op
 * (returns false); the crash path never calls this, and relies on staleness.
 */
export function releaseSession(
  home: string,
  id: string,
  now: number = Date.now(),
): { released: boolean } {
  const existing = readEntry(home, id);
  if (existing === undefined) return { released: false };
  writeEntry(home, { ...existing, lastBeat: now, released: true });
  return { released: true };
}

/** Report one session's liveness. */
export function sessionStatus(
  home: string,
  id: string,
  now: number = Date.now(),
  stale: number = STALE_MS,
): SessionStatus {
  const entry = readEntry(home, id);
  if (entry === undefined) return { id, state: 'absent', released: false };
  return {
    id,
    state: isLive(entry, now, stale) ? 'live' : 'completed',
    lastBeat: entry.lastBeat,
    released: entry.released === true,
    ...(entry.origin !== undefined ? { origin: entry.origin } : {}),
  };
}

/** List every registered session's liveness, id-sorted for stable output. */
export function listSessions(
  home: string,
  now: number = Date.now(),
  stale: number = STALE_MS,
): SessionStatus[] {
  const dir = sessionsDir(home);
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((n) => n.endsWith('.json') && !n.startsWith('.'))
    .map((n) => n.slice(0, -'.json'.length))
    .sort()
    .map((id) => sessionStatus(home, id, now, stale));
}

/**
 * The set of session ids currently LIVE — the orthogonal liveness filter's
 * liveness-aware `read`/`drain` consume. A record whose `session` is in this set
 * AND ≠ the reader's own is a live sibling's residue (excluded); everything else
 * (own · completed · sessionless) is inheritable. Reuses {@link sessionStatus} —
 * the predicate is defined once, in {@link isLive}.
 */
export function liveSessions(
  home: string,
  now: number = Date.now(),
  stale: number = STALE_MS,
): Set<string> {
  return new Set(
    listSessions(home, now, stale)
      .filter((s) => s.state === 'live')
      .map((s) => s.id),
  );
}

/** Remove a session entry entirely (registry housekeeping; not a lifecycle verb). */
export function forgetSession(home: string, id: string): { removed: boolean } {
  const file = entryPath(home, id);
  if (!existsSync(file)) return { removed: false };
  rmSync(file);
  return { removed: true };
}

/**
 * The agent home that owns a session id — the registry answers it, so a caller
 * never scans `~/.agents/*` itself. Falls back to the sole home when exactly
 * one exists; returns undefined when nothing resolves, so callers fail silent
 * rather than fabricate a home.
 */
export function homeOfSession(
  id: string,
  agentsRoot: string = join(homedir(), '.agents'),
): string | undefined {
  let homes: string[];
  try {
    homes = readdirSync(agentsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => join(agentsRoot, d.name));
  } catch {
    return undefined;
  }
  for (const home of homes) {
    if (existsSync(join(sessionsDir(home), `${id}.json`))) return home;
  }
  return homes.length === 1 ? homes[0] : undefined;
}
