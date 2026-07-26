import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import {
  STORE_WATERMARK,
  auditHome,
  ceilingRefusal,
  loadLines,
  refusesReplace,
  repoKeysFromConfig,
} from './audit.js';
import { applyRoutes, resolveTarget } from './dream.js';
import { foldRecords, manifestToJsonl } from './fold.js';
import {
  STALE_MS,
  acquireLock,
  guardPartitionWrite,
  lockStatus,
  releaseLock,
} from './lock.js';
import { migrateFile } from './migrate.js';
import {
  type NodeConfig,
  canonical,
  loadNodeConfig,
  resolveNode,
  underOrEqual,
} from './node.js';
import type { EpisodicRecord, JsonValue } from './record.js';
import type {
  Classifier,
  RouteDecision,
  RouteTarget,
  StoreName,
} from './route.js';
import { seedTemplates } from './seeds.js';
import {
  heartbeat,
  homeOfSession,
  listSessions,
  liveSessions,
  registerSession,
  releaseSession,
  sessionStatus,
} from './session.js';
import {
  DEFAULT_EPISODIC_PATH,
  EpisodicStore,
  defaultDerive,
  homeForName,
  resolveSession,
} from './store.js';
import { AgentMemory } from './strategy.js';

/** The standalone `memory` tool version. A constant (not read from
 *  package.json): the bundled `dist/memory.mjs` ships without its manifest when
 *  carried beside the memory skill, so a runtime package.json read is unsafe. */
export const VERSION = '0.0.0';

/**
 * The memory CLI — the memory protocol's tool surface (scoped-memory-v2).
 *
 * EPISODIC is a JSONL record log (`{id, session?, host, cwd, body, tags?}`);
 * an LLM agent cannot hand-mint a ULID and must never reason scope, so both
 * are the tool's job: `encode` mints the id and DERIVES `{session?, host,
 * cwd}` from the process environment; `node`/`fold` COMPUTE scope as
 * `node(cwd)` over the marker lattice; `lock` serializes dream's shared home
 * partition; `audit` is dream's exit gate.
 *
 * Dependency-free by design (matches the package ethos): a minimal argv
 * parser, no cac/commander. `main` returns a {@link CliResult} so it is
 * unit-testable; the bin shim ({@link runMain}) maps that to process IO.
 */

export interface CliResult {
  code: number;
  out: string;
  err: string;
}

interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

/** Minimal parser: `--flag value`, `--flag=value`, boolean `--flag`, and positionals. */
function parseArgs(argv: readonly string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i] as string;
    if (!tok.startsWith('--')) {
      positionals.push(tok);
      continue;
    }
    const body = tok.slice(2);
    const eq = body.indexOf('=');
    if (eq !== -1) {
      flags[body.slice(0, eq)] = body.slice(eq + 1);
      continue;
    }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags[body] = next;
      i++;
    } else {
      flags[body] = true;
    }
  }
  return { positionals, flags };
}

/**
 * The flag surface each verb accepts. An unrecognized flag is REFUSED rather
 * than absorbed: without this, `drain --help` parses `help` as an inert boolean
 * and the verb runs its default — which for `drain` is "drain the whole log".
 * Probing a destructive verb for its own usage must never execute it.
 */
const HOME_FLAGS = ['home', 'name'] as const;
const VERB_FLAGS: Readonly<Record<string, readonly string[]>> = {
  init: HOME_FLAGS,
  encode: [
    ...HOME_FLAGS,
    'session',
    'tags',
    'scope',
    'path',
    'body',
    'body-json',
  ],
  read: [
    ...HOME_FLAGS,
    'under',
    'for-session',
    'stale',
    'scope',
    'path',
    'count',
    'json',
  ],
  node: ['json', 'config'],
  home: [...HOME_FLAGS, 'session'],
  fold: [...HOME_FLAGS, 'path', 'config'],
  lock: [...HOME_FLAGS, 'stale', 'session'],
  session: [...HOME_FLAGS, 'session', 'json', 'stale', 'under'],
  drain: [
    ...HOME_FLAGS,
    'keep',
    'path',
    'completed-only',
    'for-session',
    'session',
  ],
  apply: [...HOME_FLAGS, 'path', 'routes', 'session'],
  get: [...HOME_FLAGS, 'store'],
  replace: [...HOME_FLAGS, 'store', 'body', 'session'],
  rollover: [
    ...HOME_FLAGS,
    'routes',
    'residue',
    'path',
    'keep',
    'completed-only',
    'for-session',
    'session',
  ],
  audit: [...HOME_FLAGS, 'allow', 'config', 'keys', 'owed'],
  migrate: ['dry-run', 'overwrite'],
};

/** The command set `main` dispatches — the authoritative source the runtime's
 *  `MEMORY_VERBS` roster must equal (pinned by `test/verb-roster.test.ts`). */
export const CLI_VERBS: readonly string[] = Object.keys(VERB_FLAGS);

/** The USAGE lines naming this verb — what `memory <verb> --help` prints. */
function usageFor(verb: string): string {
  const lines = USAGE.split('\n').filter((l) =>
    l.trimStart().startsWith(`memory ${verb} `),
  );
  return lines.length > 0 ? `${lines.join('\n')}\n` : USAGE;
}

const str = (v: string | boolean | undefined): string | undefined =>
  typeof v === 'string' ? v : undefined;

/**
 * The agent home the verb acts on, resolved override-first with an intelligent
 * default (the `configPathFrom` pattern): an explicit `--home <dir>` flag wins;
 * else the `$AGENT_HOME` env (the consumer's deployment override); else a bare
 * `--name <name>` derives `~/.agents/<name>` (uv-tool-style, {@link homeForName}).
 * A caller that passes `--name <self>` gets the canonical home with no hardcoded
 * path, and a deployment may still override via `$AGENT_HOME`. One is required.
 */
function requireHome(flags: ParsedArgs['flags']): string {
  const home = str(flags.home);
  if (home !== undefined) return resolve(home);
  const env = process.env.AGENT_HOME;
  if (env !== undefined && env !== '') return resolve(env);
  const name = str(flags.name);
  if (name !== undefined) return homeForName(name);
  throw new Error(
    '--home <dir>, $AGENT_HOME, or --name <agent-name> is required',
  );
}

/** `--config` > `$AGENT_FACTORY_CONFIG` > a cwd-present `.agent-factory.config` > none. */
function configPathFrom(flags: ParsedArgs['flags']): string | undefined {
  return (
    str(flags.config) ??
    process.env.AGENT_FACTORY_CONFIG ??
    (existsSync('.agent-factory.config') ? '.agent-factory.config' : undefined)
  );
}

function nodeConfigFrom(flags: ParsedArgs['flags']): NodeConfig {
  return loadNodeConfig(configPathFrom(flags));
}

function readStdin(): string {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const USAGE = `memory — the scoped-memory tool (path-scoped, v2)

Every verb takes the agent home as --home <dir> OR --name <name> (⇒ ~/.agents/<name>).

usage:
  memory --version
  memory init    (--home <dir> | --name <name>)
  memory encode  (--home <dir> | --name <name>) [--session <id>] [--tags <a,b>] [--path <p>] \\
                 (--body <text> | --body-json <json> | --body -)
  memory read    (--home <dir> | --name <name>) [--under <path>] [--for-session <S>] [--stale <ms>] \\
                 [--scope <tag>] [--path <p>] [--count]
  memory node    <path> [--json] [--config <file>]
  memory home    (--home <dir> | --name <name> | --session <id>)   -- print the resolved agent home
  memory fold    (--home <dir> | --name <name>) [--path <p>] [--config <file>]
  memory lock    (acquire | release | status) (--home <dir> | --name <name>) [--session <id>]
  memory session (register | heartbeat | release | list) (--home <dir> | --name <name>) [--session <id>]
  memory session status [<id>] (--home <dir> | --name <name>) [--json] [--stale <ms>]
  memory drain   (--home <dir> | --name <name>) [--keep N] [--path <p>] [--session <id>] \\
                 [--completed-only | --for-session <S>]
  memory apply   (--home <dir> | --name <name>) [--path <p>] [--session <id>] (--routes <json> | --routes -)
  memory get     (--home <dir> | --name <name>) --store SEMANTIC|PROCEDURAL
  memory replace (--home <dir> | --name <name>) [--session <id>] --store SEMANTIC|PROCEDURAL (--body <text> | --body -)
  memory rollover (--home <dir> | --name <name>) (--routes <json> | --routes -) [--residue <json>] \\
                 [--session <id>] [--keep N] [--completed-only | --for-session <S>]
                 --residue is a JSON array of record BODIES as bare strings —
                 '["carry this forward"]', never '[{"body":"…"}]'.
  memory audit   (--home <dir> | --name <name>) [--allow <file>] [--config <file>] [--keys <file>] [--owed]
  memory migrate <src.md> <dest.jsonl> [--dry-run] [--overwrite]

init provisions a fresh home — mkdir + seed the {SEMANTIC.md, PROCEDURAL.md,
EPISODIC.jsonl} stores if-absent (never clobbered). (The old \`install\`
self-check is RETIRED — the runtime is placed per host by agent-forge deploy's
runtime-install step, not by a tool self-check.)

encode appends one open record {id, session, host, cwd, body, tags?} to the
home log. {host, cwd} are DERIVED by the tool — never caller-supplied. The
session is bound at encode (--session > $AGENT_SESSION_ID > the sole live
registered session; error if none or ambiguous) so no record is sessionless.
Scope is not stored: it is node(cwd), computed at fold time. A --scope value is
accepted as an inert tags entry (compat), never routing. For a body that starts
with "--", use --body=<text> or pipe via --body -.

node resolves a path to its boundary node: the nearest ancestor (reflexive)
holding a marker — .git (a .git FILE resolves through to the primary
checkout), a package manifest, PLAN.md, or $HOME; extend via
memory.scopeMarkers globs in .agent-factory.config. Markerless => the path is
its own boundary; nonexistent => nearest existing ancestor. Prints the BARE
node path so it composes: read --under "$(memory node <cwd>)". --json
prints the {node, basis} envelope instead.

fold emits the dream routing manifest: one {id, node, basis} line per record
in log order, byte-deterministic. Records without cwd land in the "legacy"
bucket.

read --under <node> lists same-host records whose node(cwd) sits under the
given node; foreign-host and legacy records report as counts on stderr.
--for-session <S> adds the ORTHOGONAL liveness filter (memiso-1): records of a
LIVE OTHER session are excluded; own + completed + sessionless records pass —
the reader resumes its own + inheritable residue, never a live sibling's.
drain --completed-only (or --for-session <S>, which also drains the caller's own
live S) RETAINS live-other records while draining every completed session
together (cross-session consolidation intact); no flag ⇒ the whole log drains.

lock manages <home>/dream.lock (acquire is O_EXCL; a lock older than 2h is
stale and stolen).

session is the liveness registry (one file per session under <home>/sessions/):
register on wake, heartbeat to touch, release on clean exit. The mutating verbs
act on the CURRENT session (id DERIVED from the environment, like encode; or
--session <id>). live(s) ⇔ registered ∧ not released ∧ (now − last_beat) < STALE
(STALE = 2h, override --stale <ms>); a crash ⇒ stale ⇒ completed. status prints
a bare live|completed|absent word (--json for {id,state,lastBeat,released});
list prints one JSON line per registered session. Distinct sessions write
distinct files, so the registry is concurrency-safe by construction.

apply is dream's mechanical write-back: it consumes the ROUTE DECISIONS the
agent computed at dream (as DATA) and lands them. --routes is a JSON array
[{"id":"<record-id>","targets":[{"store":"SEMANTIC|PROCEDURAL|EPISODIC","content":"<distilled>"}]}]
(pipe via --routes -). For each record whose id IS listed, its decision is
applied: SEMANTIC/PROCEDURAL targets append their content to the home prose
store, an EPISODIC target retains the record, an empty target set drops it.
A record NOT listed is RETAINED untouched (never dropped). The tool owns the
reasoning of NONE of this — the agent decided; apply only executes + compacts.

replace is a whole-file supersede of a resident prose store:
--store SEMANTIC|PROCEDURAL overwrites <home>/{SEMANTIC,PROCEDURAL}.md with
--body (or --body - from stdin). EPISODIC and any unknown store are rejected
loudly (EPISODIC is the raw log, not a whole-file prose store). This is the
depalimpsest write path — the agent reconciles the resident set to current
ground-truth and supersedes the file, rather than only appending.

Both prose-store write paths are BOUNDED by a per-store byte ceiling
(${STORE_WATERMARK}B; audit reports a store over it as pressure). The two
predicates differ, deliberately:
  append  (apply, rollover)  accepts <=> bytes(after) <= ceiling
  replace                    accepts <=> bytes(after) <= ceiling
                                      OR bytes(after) < bytes(before)
So a store already over the ceiling is frozen to SHRINK, never bricked: appends
refuse, but any strictly smaller replace lands — it converges across successive
dreams. Nothing is ever truncated for you. WHAT to evict is the agent's
judgement; the tool only refuses, and its refusal names the store, the ceiling,
and the overage so the eviction has a budget.

audit scans <home>/{SEMANTIC,PROCEDURAL}.md for scope
markers: exit 1 + findings on any unpinned hit, 0 clean. Allow-file
resolution: --allow > <home>/audit-allow.txt > none.
`;

/** `encode`: mint a ULID, derive {session?, host, cwd}, append; print the id. */
function runEncode(args: ParsedArgs): CliResult {
  let body: JsonValue;
  const bodyJson = str(args.flags['body-json']);
  const bodyText = args.flags.body;
  if (bodyJson !== undefined) {
    try {
      body = JSON.parse(bodyJson) as JsonValue;
    } catch {
      return {
        code: 2,
        out: '',
        err: `--body-json is not valid JSON: ${bodyJson}\n`,
      };
    }
  } else if (bodyText === '-' || bodyText === true) {
    body = readStdin().replace(/\n$/, '');
  } else if (typeof bodyText === 'string') {
    body = bodyText;
  } else {
    return {
      code: 2,
      out: '',
      err: 'encode needs --body, --body-json, or --body -\n',
    };
  }
  const tags: string[] = [];
  const tagsFlag = str(args.flags.tags);
  if (tagsFlag !== undefined) {
    tags.push(
      ...tagsFlag
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    );
  }
  // Compat: a caller-supplied --scope is an INERT tags entry (SPEC D4) — the
  // fold is the only scope authority. The v1 tag grammar is not validated.
  const scopeFlag = str(args.flags.scope);
  if (scopeFlag !== undefined) tags.push(scopeFlag);
  const home = requireHome(args.flags);
  // Bind the session BEFORE capture (never sessionless): --session > env > the
  // sole live registered session; throws on none/ambiguous. Inject it as the
  // store's derive.session so the written record carries it.
  const session = resolveSession(home, { flag: str(args.flags.session) });
  const store = new EpisodicStore({
    home,
    derive: { ...defaultDerive, session: () => session },
  });
  const rec = store.encode(
    { body, ...(tags.length > 0 ? { tags } : {}) },
    str(args.flags.path),
  );
  // Encode is a heartbeat: register-if-absent + touch the bound session, so an
  // actively-encoding session stays live in the registry (memiso-0 "register on
  // wake/first-encode") — a session idle past STALE, or one never encoding,
  // correctly falls to completed. The session is always defined here (resolve
  // threw otherwise), so every capture heartbeats its session.
  registerSession(home, session);
  return { code: 0, out: `${rec.id}\n`, err: '' };
}

/**
 * `read`: list records (or `--count`) from the home-anchored raw log.
 * `--under <node>` filters to same-host records whose `node(cwd)` resolves
 * under the given node (SPEC D5); foreign-host and legacy (cwd-less) records
 * report as counts on stderr. `--scope` remains a plain inert-field filter
 * (compat) — it never routes.
 */
function runRead(args: ParsedArgs): CliResult {
  const path = str(args.flags.path) ?? DEFAULT_EPISODIC_PATH;
  const home = requireHome(args.flags);
  const store = new EpisodicStore({ home });
  const all = store.read(path);

  const scopeFilter = str(args.flags.scope);
  let records =
    scopeFilter === undefined
      ? all
      : all.filter(
          (r) => r.scope === scopeFilter || r.tags?.includes(scopeFilter),
        );

  let err = '';
  const underFlag = str(args.flags.under);
  if (underFlag !== undefined) {
    // Canonicalize the query node so a symlinked spelling (/tmp vs
    // /private/tmp) still joins against recorded realpath cwds.
    const under = canonical(resolve(underFlag));
    const cfg = nodeConfigFrom(args.flags);
    const matched: EpisodicRecord[] = [];
    const foreign = new Map<string, number>();
    let legacy = 0;
    for (const r of records) {
      if (r.cwd === undefined) {
        legacy++;
        continue;
      }
      if (r.host !== undefined && r.host !== cfg.currentHost) {
        foreign.set(r.host, (foreign.get(r.host) ?? 0) + 1);
        continue;
      }
      const { node } = resolveNode(r.cwd, r.host, cfg);
      if (underOrEqual(node, under)) matched.push(r);
    }
    records = matched;
    const foreignParts = [...foreign.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([h, n]) => `${h}=${n}`);
    err = `under ${under}: ${matched.length} matched; foreign-host: ${
      foreignParts.length > 0 ? foreignParts.join(' ') : 'none'
    }; legacy: ${legacy}\n`;
  }

  // Liveness filter (memiso-1), ORTHOGONAL to `--under`: with `--for-session
  // <S>`, exclude records authored by a LIVE OTHER session — own, completed, and
  // sessionless records all pass (the reader inherits its own + completed
  // residue, never a live sibling's). Absent the flag, behavior is unchanged.
  const forSession = str(args.flags['for-session']);
  if (forSession !== undefined) {
    const live = liveSetFrom(home, args.flags);
    records = records.filter(
      (r) =>
        r.session === undefined ||
        r.session === forSession ||
        !live.has(r.session),
    );
  }

  if (args.flags.count === true)
    return { code: 0, out: `${records.length}\n`, err };
  return {
    code: 0,
    out:
      records.map((r) => JSON.stringify(r)).join('\n') +
      (records.length ? '\n' : ''),
    err,
  };
}

/**
 * `node <path>`: resolve a path to its boundary node. Default stdout is the
 * BARE node path (newline-terminated, nothing else) so the verb composes —
 * `read --under "$(memory node <cwd>)"` is the wake ritual's load line, and
 * a JSON envelope there silently matches zero records. `--json` opts into the
 * `{node, basis}` envelope for inspection.
 */
function runNode(args: ParsedArgs): CliResult {
  const [path] = args.positionals;
  if (path === undefined)
    return { code: 2, out: '', err: 'node needs a <path> positional\n' };
  const cfg = nodeConfigFrom(args.flags);
  const { node, basis } = resolveNode(path, cfg.currentHost, cfg);
  if (args.flags.json === true)
    return { code: 0, out: `${JSON.stringify({ node, basis })}\n`, err: '' };
  return { code: 0, out: `${node}\n`, err: '' };
}

/** `home`: print the resolved agent home — the same `--home` > `$AGENT_HOME` >
 *  `--name` resolution every verb shares. Lets a skill bind
 *  `AGENT_HOME=$(memory home --name <self>)` to the canonical `~/.agents/<name>`
 *  (or an explicit override) with no hardcoded path in the skill text. */
function runHome(args: ParsedArgs): CliResult {
  // `--session <id>`: resolve the home OWNING that session, by asking the
  // registry rather than by knowing the layout. This exists for harness faces
  // (a Stop hook carries a session_id but no agent identity), so that a face
  // never has to scan `~/.agents/*` itself — the being's memory home is not a
  // thing a face may read.
  const sid = str(args.flags.session);
  if (sid !== undefined) {
    const found = homeOfSession(sid);
    if (found === undefined)
      return { code: 1, out: '', err: `no home owns session ${sid}\n` };
    return { code: 0, out: `${found}\n`, err: '' };
  }
  return { code: 0, out: `${requireHome(args.flags)}\n`, err: '' };
}

/** `fold`: emit the deterministic routing manifest for the home log. */
function runFold(args: ParsedArgs): CliResult {
  const store = new EpisodicStore({ home: requireHome(args.flags) });
  const records = store.read(str(args.flags.path));
  const cfg = nodeConfigFrom(args.flags);
  return { code: 0, out: manifestToJsonl(foldRecords(records, cfg)), err: '' };
}

/** `lock acquire|release|status` on `<home>/dream.lock` (stale > 2h stolen). */
function runLock(args: ParsedArgs): CliResult {
  const [action] = args.positionals;
  const home = requireHome(args.flags);
  const fmtAge = (ms: number): string => `${(ms / 60000).toFixed(1)}m`;
  switch (action) {
    case 'acquire': {
      // Stamp the acquiring SESSION into the lock: the agent acquires here and
      // writes in later invocations, so ownership must survive this process.
      const r = acquireLock(
        home,
        Date.now(),
        resolveSession(home, { flag: str(args.flags.session) }),
      );
      if (r.acquired) {
        return {
          code: 0,
          out: r.stolen
            ? `acquired (stole stale lock, age ${fmtAge(r.ageMs ?? 0)})\n`
            : 'acquired\n',
          err: '',
        };
      }
      return {
        code: 1,
        out: '',
        err: `lock held (age ${fmtAge(r.ageMs ?? 0)}, stale after ${fmtAge(STALE_MS)})${
          r.holder !== undefined ? `: ${r.holder}` : ''
        }\n`,
      };
    }
    case 'release': {
      const r = releaseLock(home);
      return {
        code: 0,
        out: r.released ? 'released\n' : 'no lock held\n',
        err: '',
      };
    }
    case 'status': {
      const s = lockStatus(home);
      if (!s.held) return { code: 0, out: 'free\n', err: '' };
      return {
        code: 0,
        out: `held (age ${fmtAge(s.ageMs ?? 0)})${s.holder !== undefined ? `: ${s.holder}` : ''}\n`,
        err: '',
      };
    }
    default:
      return {
        code: 2,
        out: '',
        err: 'lock needs an action: acquire | release | status\n',
      };
  }
}

/** Parse an optional `--stale <ms>` override; undefined means the module default (2h). */
function staleFrom(flags: ParsedArgs['flags']): number | undefined {
  const s = str(flags.stale);
  if (s === undefined) return undefined;
  const n = Number.parseInt(s, 10);
  if (!Number.isInteger(n) || n < 0)
    throw new Error('--stale must be a non-negative integer (ms)');
  return n;
}

/** The live-session set for the liveness filters (memiso-1), honoring `--stale`. */
function liveSetFrom(home: string, flags: ParsedArgs['flags']): Set<string> {
  const stale = staleFrom(flags);
  return stale !== undefined
    ? liveSessions(home, Date.now(), stale)
    : liveSessions(home);
}

/**
 * `session register|heartbeat|release|status <id>|list`: the session-liveness
 * registry (memiso-0). The mutating verbs act on the CURRENT session — its id is
 * DERIVED from the environment (the same seam `encode` uses), with `--session
 * <id>` as an explicit override; the caller never reasons it. `status`/`list`
 * are read verbs: `status <id>` prints a bare liveness word (`--json` for the
 * envelope), `list` prints one JSON line per registered session.
 */
function runSession(args: ParsedArgs): CliResult {
  const [action, ...actionRest] = args.positionals;
  const home = requireHome(args.flags);
  const stale = staleFrom(args.flags);
  const staleArgs = stale !== undefined ? [Date.now(), stale] : [];

  // The mutating verbs heartbeat/release act on the CURRENT session — its id is
  // --session > $AGENT_SESSION_ID env (error if neither), since you cannot touch
  // a session you did not first name. register is the one exception: it MINTS a
  // uuid when neither is present, so a harness with no $AGENT_SESSION_ID still
  // binds a real session id (never sessionless).
  const currentId = (): string => {
    const id = str(args.flags.session) ?? defaultDerive.session();
    if (id === undefined)
      throw new Error(
        'no session id: set $AGENT_SESSION_ID or pass --session <id>',
      );
    return id;
  };

  switch (action) {
    case 'begin': {
      // The wake-facing verb. Delegates to the STRATEGY rather than re-composing
      // primitives here: the strategy owns home layout and store format, so it is
      // the only place that can decide whether a migration is owed.
      const strategy = new AgentMemory({
        ...(str(args.flags.name) ? { name: str(args.flags.name) } : {}),
        ...(str(args.flags.home) ? { home: str(args.flags.home) } : {}),
      });
      const r = strategy.session('begin', {
        ...(str(args.flags.session) ? { id: str(args.flags.session) } : {}),
        ...(str(args.flags.under) ? { under: str(args.flags.under) } : {}),
      });
      return { code: 0, out: `${JSON.stringify(r, null, 2)}\n`, err: '' };
    }
    case 'register': {
      const id =
        str(args.flags.session) ?? defaultDerive.session() ?? randomUUID();
      const e = registerSession(home, id);
      return { code: 0, out: `registered ${e.id}\n`, err: '' };
    }
    case 'heartbeat': {
      const id = currentId();
      const e = heartbeat(home, id);
      return e === undefined
        ? { code: 1, out: '', err: `unknown session: ${id}\n` }
        : { code: 0, out: 'ok\n', err: '' };
    }
    case 'release': {
      const r = releaseSession(home, currentId());
      return {
        code: 0,
        out: r.released ? 'released\n' : 'no session registered\n',
        err: '',
      };
    }
    case 'status': {
      const id = actionRest[0] ?? currentId();
      const s = sessionStatus(home, id, ...staleArgs);
      if (args.flags.json === true)
        return { code: 0, out: `${JSON.stringify(s)}\n`, err: '' };
      return { code: 0, out: `${s.state}\n`, err: '' };
    }
    case 'list': {
      const list = listSessions(home, ...staleArgs);
      return {
        code: 0,
        out:
          list.map((s) => JSON.stringify(s)).join('\n') +
          (list.length ? '\n' : ''),
        err: '',
      };
    }
    default:
      return {
        code: 2,
        out: '',
        err: 'session needs an action: begin | register | heartbeat | release | status <id> | list\n',
      };
  }
}

/** `migrate`: convert a markdown EPISODIC.md to EPISODIC.jsonl (no-loss gated). */
function runMigrate(args: ParsedArgs): CliResult {
  const [src, dest] = args.positionals;
  if (src === undefined || dest === undefined) {
    return { code: 2, out: '', err: 'migrate needs <src.md> <dest.jsonl>\n' };
  }
  const result = migrateFile(src, dest, {
    dryRun: args.flags['dry-run'] === true,
    overwrite: args.flags.overwrite === true,
  });
  const verb = result.written ? 'migrated' : 'dry-run';
  return {
    code: 0,
    out: `${verb}: ${result.itemCount} items -> ${result.written ? dest : '(nothing written)'}\n`,
    err: '',
  };
}

/**
 * `drain`: the dreamer's post-consolidation clear. Archive the home-anchored raw
 * log to `<home>/.bak/EPISODIC.<ULID>.jsonl` (verified), then empty it; keep only
 * the newest `--keep N` (default 5) archives, prune the rest — so `.bak/` is
 * bounded, never the unbounded sibling-file creep.
 *
 * Liveness-aware (memiso-1): with `--completed-only` (or `--for-session <S>`,
 * which additionally drains the caller's own live session S), a LIVE OTHER
 * session's records are RETAINED — never archived, never cleared — so a
 * concurrent sibling's residue survives the dreamer's drain. Cross-session
 * consolidation is intact: every COMPLETED session (all not-live) still drains
 * together. Absent both flags, the whole log drains (unchanged back-compat).
 */
function runDrain(args: ParsedArgs): CliResult {
  const home = requireHome(args.flags);
  const release = guardPartitionWrite(
    home,
    resolveSession(home, { flag: str(args.flags.session) }),
  );
  try {
    return drainGuarded(args, home);
  } finally {
    release();
  }
}

function drainGuarded(args: ParsedArgs, home: string): CliResult {
  const keepStr = str(args.flags.keep);
  const keep = keepStr !== undefined ? Number.parseInt(keepStr, 10) : 5;
  if (!Number.isInteger(keep) || keep < 0)
    return { code: 2, out: '', err: '--keep must be a non-negative integer\n' };
  const path = str(args.flags.path);
  const store = new EpisodicStore({ home });

  const forSession = str(args.flags['for-session']);
  const completedOnly = args.flags['completed-only'] === true;
  // retain(rec) = KEEP it in the live log. Keep a record iff its session is a
  // LIVE OTHER (live ∧ ≠ S). Sessionless + completed records drain; the caller's
  // own S drains too (S is excluded from "other"). No flag ⇒ retain nothing.
  let retain: ((rec: EpisodicRecord) => boolean) | undefined;
  if (forSession !== undefined || completedOnly) {
    const live = liveSetFrom(home, args.flags);
    retain = (rec) =>
      rec.session !== undefined &&
      rec.session !== forSession &&
      live.has(rec.session);
  }

  const r = store.drain({
    keep,
    ...(path !== undefined ? { path } : {}),
    ...(retain !== undefined ? { retain } : {}),
  });
  if (r.archived === null) {
    // "nothing archived" has TWO causes and they are not the same state: an
    // empty log, or a log whose every record was RETAINED by the liveness
    // filter. Reporting the second as "empty" tells the caller its sibling's
    // records are gone when they are exactly what was preserved.
    const remaining = store.read(path).length;
    return {
      code: 0,
      out:
        remaining === 0
          ? 'drain: nothing to archive (raw log empty)\n'
          : `drain: nothing to archive (${remaining} record(s) retained)\n`,
      err: '',
    };
  }
  return {
    code: 0,
    out: `drained ${r.records} record(s) -> ${r.archived}\n.bak/: ${r.kept.length} kept, ${r.pruned.length} pruned (keep=${keep})\n`,
    err: '',
  };
}

/** One route-decision as the agent hands it in on `apply --routes`: a record id
 *  plus the store targets it computed at dream. */
interface RouteDecisionInput {
  id: string;
  targets: RouteTarget[];
}

/**
 * `apply`: land the agent's dream ROUTE DECISIONS. `--routes <json>` is
 * `[{id, targets:[{store, content}]}]` — the classifier the agent computed at
 * dream, handed to the tool as DATA. A record whose id IS in the json gets its
 * decision; a record NOT in the json is RETAINED untouched (mapped to an
 * EPISODIC target) — NEVER dropped, since {@link applyRoutes} iterates EVERY
 * record and an unlisted one would otherwise land nowhere and be consumed. The
 * engine ({@link applyRoutes}) lands content + atomically compacts; store
 * validity (SEMANTIC | PROCEDURAL | EPISODIC only) is enforced there, loudly.
 */
function runApply(args: ParsedArgs): CliResult {
  const home = requireHome(args.flags);
  const release = guardPartitionWrite(
    home,
    resolveSession(home, { flag: str(args.flags.session) }),
  );
  try {
    return applyGuarded(args, home);
  } finally {
    release();
  }
}

function applyGuarded(args: ParsedArgs, home: string): CliResult {
  const routesFlag = args.flags.routes;
  let jsonText: string;
  if (routesFlag === '-' || routesFlag === true) {
    jsonText = readStdin();
  } else if (typeof routesFlag === 'string') {
    jsonText = routesFlag;
  } else {
    return {
      code: 2,
      out: '',
      err: 'apply needs --routes <json> or --routes -\n',
    };
  }
  let decisions: RouteDecisionInput[];
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    if (!Array.isArray(parsed))
      throw new Error('--routes must be a JSON array of {id, targets}');
    decisions = parsed as RouteDecisionInput[];
  } catch (e) {
    return {
      code: 2,
      out: '',
      err: `--routes is not a valid decision array: ${
        e instanceof Error ? e.message : String(e)
      }\n`,
    };
  }
  const byId = new Map<string, RouteDecision>();
  for (const d of decisions) {
    if (d === null || typeof d.id !== 'string' || !Array.isArray(d.targets))
      return {
        code: 2,
        out: '',
        err: 'each --routes entry needs {id: string, targets: [...]}\n',
      };
    byId.set(d.id, { targets: d.targets });
  }
  // An unlisted record is RETAINED (mapped to EPISODIC) — never consumed. This
  // is the load-bearing safety: applyRoutes reads ALL records, so silence = drop
  // unless we explicitly retain.
  const classifier: Classifier = (rec) =>
    byId.get(rec.id) ?? { targets: [{ store: 'EPISODIC' }] };
  const store = new EpisodicStore({ home });
  const result = applyRoutes(store, str(args.flags.path), classifier);
  return {
    code: 0,
    out: `applied ${byId.size} decision(s): ${result.consumed.length} consumed, ${result.retained.length} retained, ${result.landed.length} home(s) landed\n`,
    err: '',
  };
}

/**
 * `get`: hand back the whole current text of a resident prose store. The
 * counterpart of {@link runReplace} and the reason a skill no longer has to
 * `Read` a raw path — reading one meant the caller knew the home layout, which
 * is exactly what the port exists to hide. Distinct from `read`, which returns
 * individual timestamped EPISODIC records rather than a document.
 */
function runGet(args: ParsedArgs): CliResult {
  const home = requireHome(args.flags);
  const storeName = str(args.flags.store);
  if (storeName === undefined)
    return { code: 2, out: '', err: 'get needs --store SEMANTIC|PROCEDURAL\n' };
  const file = resolveTarget(home, { store: storeName as StoreName });
  if (file === null)
    return {
      code: 2,
      out: '',
      err: `get: ${storeName} is not a whole-file prose store\n`,
    };
  if (!existsSync(file)) return { code: 0, out: '', err: '' };
  return { code: 0, out: readFileSync(file, 'utf8'), err: '' };
}

/**
 * `replace`: whole-file supersede of a resident prose store. `--store
 * SEMANTIC|PROCEDURAL` overwrites `<home>/{SEMANTIC,PROCEDURAL}.md` with the
 * `--body` (or `--body -` from stdin). Reuses the {@link resolveTarget} store
 * selector, so EPISODIC (the raw log, not a whole-file prose store) and any
 * unknown store are rejected loudly. This is dream's depalimpsest write path:
 * reconcile the resident set to current ground-truth by superseding the file,
 * not only appending. Reads of resident prose stay agent-direct (no read verb).
 *
 * **The ceiling's other predicate.** This is the one write that may leave a
 * store over the byte ceiling: it accepts any STRICT shrink as well as any
 * result that fits. That asymmetry against the append guard is what keeps an
 * over-ceiling store repairable rather than bricked — see `refusesReplace`.
 */
function runReplace(args: ParsedArgs): CliResult {
  const home = requireHome(args.flags);
  const release = guardPartitionWrite(
    home,
    resolveSession(home, { flag: str(args.flags.session) }),
  );
  try {
    return replaceGuarded(args, home);
  } finally {
    release();
  }
}

function replaceGuarded(args: ParsedArgs, home: string): CliResult {
  const storeName = str(args.flags.store);
  if (storeName === undefined)
    return {
      code: 2,
      out: '',
      err: 'replace needs --store SEMANTIC|PROCEDURAL\n',
    };
  // resolveTarget throws loudly on an unknown/retired store, and returns null for
  // EPISODIC (which has no whole-file prose home) — both rejected here.
  const file = resolveTarget(home, { store: storeName as StoreName });
  if (file === null)
    return {
      code: 2,
      out: '',
      err: 'replace targets a prose store (SEMANTIC | PROCEDURAL); EPISODIC is the raw log, not a whole-file prose store\n',
    };
  const bodyFlag = args.flags.body;
  let body: string;
  if (bodyFlag === '-' || bodyFlag === true) {
    body = readStdin();
  } else if (typeof bodyFlag === 'string') {
    body = bodyFlag;
  } else {
    return {
      code: 2,
      out: '',
      err: 'replace needs --body <text> or --body -\n',
    };
  }
  const text = body.endsWith('\n') ? body : `${body}\n`;
  // The ceiling, on the OTHER predicate from append's. `replace` additionally
  // accepts any STRICT shrink, so a store already over the line stays
  // repairable — see `refusesReplace`. This is the depalimpsest write, i.e. the
  // very act an over-ceiling store is refused an append in order to force.
  const after = Buffer.byteLength(text, 'utf8');
  const before = existsSync(file) ? statSync(file).size : 0;
  if (refusesReplace(before, after))
    return { code: 1, out: '', err: `${ceilingRefusal(file, after)}\n` };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text, 'utf8');
  return {
    code: 0,
    out: `replaced ${basename(file)} (${body.length} bytes)\n`,
    err: '',
  };
}

/** The JSON kind of a value, as an error message says it: `null`, `array`, `object`, or the typeof. */
function jsonKindOf(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

/**
 * Parse + validate `--residue` into the BODIES it must be: bare strings.
 *
 * `EpisodicRecord.body` is `JsonValue`, so *every* JSON value type-checks as a
 * body — an unchecked `as JsonValue` therefore accepts the one shape callers
 * most naturally send, `[{"body":"x"}]` (a record, not a body), and writes a
 * record whose body is the wrapper `{"body":"x"}`. `assertRecord` never catches
 * it: it only checks `'body' in r`. The corruption surfaces nowhere until a
 * reader finds a dict where prose belongs. So the shape is checked HERE, at the
 * boundary, and a wrapper is REFUSED — never unwrapped, since coercing it would
 * hide the same bug in the next caller.
 */
function parseResidue(
  flag: ParsedArgs['flags'][string] | undefined,
): { bodies: string[] } | { err: string } {
  const text =
    flag === '-' || flag === true
      ? readStdin()
      : typeof flag === 'string'
        ? flag
        : '';
  if (text.trim().length === 0) return { bodies: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return {
      err: `--residue is not valid JSON: ${
        e instanceof Error ? e.message : String(e)
      }\n`,
    };
  }
  if (!Array.isArray(parsed))
    return {
      err: `--residue must be a JSON array of record bodies, got ${jsonKindOf(parsed)} — wanted ["carry this forward", …]\n`,
    };

  const bodies: string[] = [];
  for (const [i, entry] of parsed.entries()) {
    if (typeof entry === 'string') {
      bodies.push(entry);
      continue;
    }
    const wrapped =
      typeof entry === 'object' &&
      entry !== null &&
      !Array.isArray(entry) &&
      'body' in entry;
    const lines = [
      `--residue[${i}] must be a record body as a bare string, got ${jsonKindOf(entry)}`,
    ];
    if (wrapped)
      lines.push(
        '  --residue takes BODIES, not records — pass the body itself, not a {"body": …} wrapper',
      );
    lines.push('  wanted: --residue \'["carry this forward"]\'');
    return { err: `${lines.join('\n')}\n` };
  }
  return { bodies };
}

/**
 * `rollover`: land the routing decisions, archive + empty the raw pile, and put
 * the carry-forward residue back — as ONE operation under ONE lock.
 *
 * Run as three separate invocations (`apply` ▸ `drain` ▸ `encode`), the residue
 * exists between the second and the third NOWHERE but in the caller's working
 * memory. A crash, a killed session, or an agent that simply forgets the last
 * step loses it with no trace. Closing that gap is the whole point.
 *
 * `--routes` takes the same decision array as `apply`; `--residue` takes the
 * record BODIES to re-encode after the drain — a JSON array of bare strings
 * (`["carry this forward"]`), NOT records. It is validated up front, before the
 * destructive half runs: refusing after the drain would lose the very forward
 * state this verb exists to preserve.
 */
function runRollover(args: ParsedArgs): CliResult {
  const home = requireHome(args.flags);
  const session = resolveSession(home, { flag: str(args.flags.session) });
  const release = guardPartitionWrite(home, session);
  try {
    const residue = parseResidue(args.flags.residue);
    if ('err' in residue) return { code: 2, out: '', err: residue.err };

    const applied = applyGuarded(args, home);
    if (applied.code !== 0) return applied;
    const drained = drainGuarded(args, home);
    if (drained.code !== 0) return drained;

    let reseeded = 0;
    if (residue.bodies.length > 0) {
      const store = new EpisodicStore({
        home,
        derive: { ...defaultDerive, session: () => session },
      });
      for (const body of residue.bodies) {
        store.encode({ body }, str(args.flags.path));
        reseeded++;
      }
    }
    return {
      code: 0,
      out: `${applied.out}${drained.out}rollover: ${reseeded} residue record(s) re-encoded\n`,
      err: `${applied.err}${drained.err}`,
    };
  } finally {
    release();
  }
}

/**
 * `audit`: the scope-pollution detector over `<home>/{SEMANTIC,PROCEDURAL}.md`
 * (the v2 scan set — dream's exit gate, SPEC D5). Exit 1 + line-numbered
 * findings on any unpinned hit; 0 clean. Allow-file resolution:
 * `--allow > <home>/audit-allow.txt > none`. Repo keys come from an EXPLICIT
 * config/keylist (flag, env, or a cwd-present `.agent-factory.config`) — the
 * detector itself never sniffs context. Stale allow pins are reported on
 * stderr but do not fail the audit (the ratchet shrinks at review time).
 */
function runAudit(args: ParsedArgs): CliResult {
  const home = requireHome(args.flags);

  // `--owed`: the backlog verdict, ONE home for the predicate. The nudge hook
  // used to compute its own count by awk-ing the raw log, which put a second
  // home on the same concept and made a harness face read the store layout.
  if (args.flags.owed === true) {
    const mem = new AgentMemory({ home });
    const owed = mem.consolidationOwed();
    return { code: 0, out: `${owed ? 'owed' : 'clear'}\n`, err: '' };
  }

  const defaultAllow = join(home, 'audit-allow.txt');
  const allowFile =
    str(args.flags.allow) ??
    (existsSync(defaultAllow) ? defaultAllow : undefined);
  const allowPins = allowFile !== undefined ? loadLines(allowFile) : [];

  const repoKeys: string[] = [];
  const configPath = configPathFrom(args.flags);
  if (configPath !== undefined && existsSync(configPath))
    repoKeys.push(...repoKeysFromConfig(configPath));
  const keysFile = str(args.flags.keys);
  if (keysFile !== undefined) repoKeys.push(...loadLines(keysFile));

  const report = auditHome(home, { allowPins, repoKeys });

  let out = '';
  for (const p of report.pressure)
    out += `${basename(p.file)}: ${p.bytes}B over the ${p.watermark}B watermark — depalimpsest owed\n`;
  for (const f of report.findings)
    out += `${basename(f.file)}:${f.line}: [${f.cls}] ${f.match}\n`;
  let err = '';
  for (const p of report.stalePins)
    err += `stale pin (matches nothing — remove from allow file): ${p}\n`;

  if (report.findings.length === 0) {
    out += `audit: clean (${report.scanned.length} file(s) scanned, ${report.pinned.length} pinned)\n`;
    return { code: 0, out, err };
  }
  out += `audit: ${report.findings.length} finding(s) (${report.pinned.length} pinned) — node-scoped content belongs in that node's AGENTS.md, not SEMANTIC/PROCEDURAL\n`;
  return { code: 1, out, err };
}

/**
 * `init`: provision a fresh agent home. Creates the home dir and seeds the
 * self-authored stores {SEMANTIC.md, PROCEDURAL.md, EPISODIC.jsonl} IF-ABSENT —
 * never clobbering an existing store (`substance-over-accident`). This is the
 * seed authority (relocated out of the forge deploy path): a home is provisioned
 * at wake-register, not at def-deploy. The seed name is `--name` (or the home's
 * basename) — it stamps the store headings.
 */
function runInit(args: ParsedArgs): CliResult {
  const home = requireHome(args.flags);
  const name = str(args.flags.name) ?? basename(home);
  mkdirSync(home, { recursive: true });
  const seeded: string[] = [];
  const present: string[] = [];
  for (const [fname, seedfn] of seedTemplates) {
    const file = join(home, fname);
    if (existsSync(file)) {
      present.push(fname);
    } else {
      writeFileSync(file, seedfn(name), 'utf8');
      seeded.push(fname);
    }
  }
  return {
    code: 0,
    out: `init ${home}\n  seeded: ${seeded.join(', ') || '-'}\n  present, untouched: ${present.join(', ') || '-'}\n`,
    err: '',
  };
}

/** Dispatch one CLI invocation. Pure: returns a {@link CliResult}, performs no process IO. */
export function main(argv: readonly string[]): CliResult {
  const [cmd, ...rest] = argv;
  if (cmd === undefined || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    return { code: 0, out: USAGE, err: '' };
  }
  if (cmd === '--version' || cmd === '-v' || cmd === 'version') {
    return { code: 0, out: `${VERSION}\n`, err: '' };
  }
  const args = parseArgs(rest);
  const allowed = VERB_FLAGS[cmd];
  if (allowed !== undefined) {
    if (args.flags.help === true || rest.includes('-h')) {
      return { code: 0, out: usageFor(cmd), err: '' };
    }
    const unknown = Object.keys(args.flags).filter((f) => !allowed.includes(f));
    if (unknown.length > 0) {
      return {
        code: 2,
        out: '',
        err: `${cmd}: unknown flag${unknown.length === 1 ? '' : 's'}: ${unknown
          .map((f) => `--${f}`)
          .join(', ')}\n\n${usageFor(cmd)}`,
      };
    }
  }
  try {
    switch (cmd) {
      case 'init':
        return runInit(args);
      case 'encode':
        return runEncode(args);
      case 'read':
        return runRead(args);
      case 'node':
        return runNode(args);
      case 'home':
        return runHome(args);
      case 'fold':
        return runFold(args);
      case 'lock':
        return runLock(args);
      case 'session':
        return runSession(args);
      case 'migrate':
        return runMigrate(args);
      case 'drain':
        return runDrain(args);
      case 'apply':
        return runApply(args);
      case 'get':
        return runGet(args);
      case 'replace':
        return runReplace(args);
      case 'rollover':
        return runRollover(args);
      case 'audit':
        return runAudit(args);
      default:
        return { code: 2, out: '', err: `unknown command: ${cmd}\n\n${USAGE}` };
    }
  } catch (e) {
    return {
      code: 1,
      out: '',
      err: `${e instanceof Error ? e.message : String(e)}\n`,
    };
  }
}

/** Bin entrypoint: run `main`, write to stdio, exit with its code. */
export function runMain(argv: readonly string[]): void {
  const { code, out, err } = main(argv);
  if (out) process.stdout.write(out);
  if (err) process.stderr.write(err);
  process.exitCode = code;
}
