import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { auditHome, loadLines, repoKeysFromConfig } from './audit.js';
import { foldRecords, manifestToJsonl } from './fold.js';
import { STALE_MS, acquireLock, lockStatus, releaseLock } from './lock.js';
import { migrateFile } from './migrate.js';
import {
  type NodeConfig,
  canonical,
  loadNodeConfig,
  resolveNode,
  underOrEqual,
} from './node.js';
import type { EpisodicRecord, JsonValue } from './record.js';
import { SEED_FILES } from './seeds.js';
import {
  heartbeat,
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

const str = (v: string | boolean | undefined): string | undefined =>
  typeof v === 'string' ? v : undefined;

/**
 * The agent home the verb acts on: an explicit `--home <dir>` wins; else a bare
 * `--name <name>` derives `~/.agents/<name>` (uv-tool-style, {@link homeForName}).
 * One of the two is required.
 */
function requireHome(flags: ParsedArgs['flags']): string {
  const home = str(flags.home);
  if (home !== undefined) return resolve(home);
  const name = str(flags.name);
  if (name !== undefined) return homeForName(name);
  throw new Error('--home <agent-home-dir> or --name <agent-name> is required');
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
  memory install
  memory init    (--home <dir> | --name <name>)
  memory encode  (--home <dir> | --name <name>) [--session <id>] [--tags <a,b>] [--path <p>] \\
                 (--body <text> | --body-json <json> | --body -)
  memory read    (--home <dir> | --name <name>) [--under <path>] [--for-session <S>] [--stale <ms>] \\
                 [--scope <tag>] [--path <p>] [--count]
  memory node    <path> [--json] [--config <file>]
  memory fold    (--home <dir> | --name <name>) [--path <p>] [--config <file>]
  memory lock    (acquire | release | status) (--home <dir> | --name <name>)
  memory session (register | heartbeat | release | list) (--home <dir> | --name <name>) [--session <id>]
  memory session status [<id>] (--home <dir> | --name <name>) [--json] [--stale <ms>]
  memory drain   (--home <dir> | --name <name>) [--keep N] [--path <p>] [--completed-only | --for-session <S>]
  memory audit   (--home <dir> | --name <name>) [--allow <file>] [--config <file>] [--keys <file>]
  memory migrate <src.md> <dest.jsonl> [--dry-run] [--overwrite]

install is a documented self-check (the tool installs on PATH via the package
\`bin\`); it changes no host state. init provisions a fresh home — mkdir + seed
the {SEMANTIC.md, PROCEDURAL.md, EPISODIC.jsonl} stores if-absent (never
clobbered).

encode appends one open record {id, session, host, cwd, body, tags?} to the
home log. {host, cwd} are DERIVED by the tool — never caller-supplied. The
session is bound at encode (--session > CLAUDE_SESSION_ID > the sole live
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
      const r = acquireLock(home);
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
  // --session > CLAUDE_SESSION_ID env (error if neither), since you cannot touch
  // a session you did not first name. register is the one exception: it MINTS a
  // uuid when neither is present, so a harness with no CLAUDE_SESSION_ID still
  // binds a real session id (never sessionless).
  const currentId = (): string => {
    const id = str(args.flags.session) ?? defaultDerive.session();
    if (id === undefined)
      throw new Error(
        'no session id: set CLAUDE_SESSION_ID or pass --session <id>',
      );
    return id;
  };

  switch (action) {
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
        err: 'session needs an action: register | heartbeat | release | status <id> | list\n',
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
  const keepStr = str(args.flags.keep);
  const keep = keepStr !== undefined ? Number.parseInt(keepStr, 10) : 5;
  if (!Number.isInteger(keep) || keep < 0)
    return { code: 2, out: '', err: '--keep must be a non-negative integer\n' };
  const path = str(args.flags.path);
  const home = requireHome(args.flags);
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
  if (r.archived === null)
    return {
      code: 0,
      out: 'drain: nothing to archive (raw log empty)\n',
      err: '',
    };
  return {
    code: 0,
    out: `drained ${r.records} record(s) -> ${r.archived}\n.bak/: ${r.kept.length} kept, ${r.pruned.length} pruned (keep=${keep})\n`,
    err: '',
  };
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
  const home = str(args.flags.home);
  if (home === undefined)
    return { code: 2, out: '', err: '--home <agent-home-dir> is required\n' };

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
 * `install`: the host-bootstrap self-check. The tool installs on PATH via the
 * package `bin` (`memory`), so there is nothing to build or link — this verb is
 * a documented no-op that confirms the tool runs and points at `init`. Keeping
 * it makes the uv-tool-style install flow explicit (`memory install` succeeds
 * ⇒ the tool is on PATH) without minting any host state.
 */
function runInstall(): CliResult {
  return {
    code: 0,
    out: `memory ${VERSION} — installed as a PATH tool (package bin: \`memory\`). No host state changed.\nProvision an agent home with: memory init --name <agent>\n`,
    err: '',
  };
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
  for (const [fname, seedfn] of SEED_FILES) {
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
  try {
    switch (cmd) {
      case 'install':
        return runInstall();
      case 'init':
        return runInit(args);
      case 'encode':
        return runEncode(args);
      case 'read':
        return runRead(args);
      case 'node':
        return runNode(args);
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
