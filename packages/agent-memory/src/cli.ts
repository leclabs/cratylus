import { existsSync, readFileSync } from 'node:fs';
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
import { DEFAULT_EPISODIC_PATH, EpisodicStore } from './store.js';

/**
 * The episodic CLI — the memory protocol's tool surface (scoped-memory-v2).
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

function requireHome(flags: ParsedArgs['flags']): string {
  const home = str(flags.home);
  if (home === undefined)
    throw new Error('--home <agent-home-dir> is required');
  return resolve(home);
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

const USAGE = `episodic — the scoped-memory tool (path-scoped, v2)

usage:
  episodic encode --home <dir> [--tags <a,b>] [--path <p>] \\
                  (--body <text> | --body-json <json> | --body -)
  episodic read   --home <dir> [--under <path>] [--scope <tag>] [--path <p>] [--count]
  episodic node   <path> [--json] [--config <file>]
  episodic fold   --home <dir> [--path <p>] [--config <file>]
  episodic lock   (acquire | release | status) --home <dir>
  episodic drain  --home <dir> [--keep N] [--path <p>]
  episodic audit  --home <dir> [--allow <file>] [--config <file>] [--keys <file>]
  episodic migrate <src.md> <dest.jsonl> [--dry-run] [--overwrite]

encode appends one open record {id, session?, host, cwd, body, tags?} to the
home log. {session?, host, cwd} are DERIVED by the tool — never caller-
supplied. Scope is not stored: it is node(cwd), computed at fold time. A
--scope value is accepted as an inert tags entry (compat), never routing.
For a body that starts with "--", use --body=<text> or pipe via --body -.

node resolves a path to its boundary node: the nearest ancestor (reflexive)
holding a marker — .git (a .git FILE resolves through to the primary
checkout), a package manifest, PLAN.md, or $HOME; extend via
memory.scopeMarkers globs in .agent-factory.config. Markerless => the path is
its own boundary; nonexistent => nearest existing ancestor. Prints the BARE
node path so it composes: read --under "$(episodic node <cwd>)". --json
prints the {node, basis} envelope instead.

fold emits the dream routing manifest: one {id, node, basis} line per record
in log order, byte-deterministic. Records without cwd land in the "legacy"
bucket.

read --under <node> lists same-host records whose node(cwd) sits under the
given node; foreign-host and legacy records report as counts on stderr.

lock manages <home>/dream.lock (acquire is O_EXCL; a lock older than 2h is
stale and stolen). audit scans <home>/{SEMANTIC,PROCEDURAL}.md for scope
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
  const store = new EpisodicStore({ home: requireHome(args.flags) });
  const rec = store.encode(
    { body, ...(tags.length > 0 ? { tags } : {}) },
    str(args.flags.path),
  );
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
  const store = new EpisodicStore({ home: requireHome(args.flags) });
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
 * `read --under "$(episodic node <cwd>)"` is the wake ritual's load line, and
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
 */
function runDrain(args: ParsedArgs): CliResult {
  const keepStr = str(args.flags.keep);
  const keep = keepStr !== undefined ? Number.parseInt(keepStr, 10) : 5;
  if (!Number.isInteger(keep) || keep < 0)
    return { code: 2, out: '', err: '--keep must be a non-negative integer\n' };
  const path = str(args.flags.path);
  const store = new EpisodicStore({ home: requireHome(args.flags) });
  const r = store.drain({ keep, ...(path !== undefined ? { path } : {}) });
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

/** Dispatch one CLI invocation. Pure: returns a {@link CliResult}, performs no process IO. */
export function main(argv: readonly string[]): CliResult {
  const [cmd, ...rest] = argv;
  if (cmd === undefined || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    return { code: 0, out: USAGE, err: '' };
  }
  const args = parseArgs(rest);
  try {
    switch (cmd) {
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
