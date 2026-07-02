import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { auditHome, loadLines, repoKeysFromConfig } from './audit.js';
import { migrateFile } from './migrate.js';
import type { JsonValue } from './record.js';
import {
  type HostEnv,
  type Scope,
  assertScope,
  createHostEnv,
} from './resolve.js';
import { DEFAULT_EPISODIC_PATH, EpisodicStore } from './store.js';

/**
 * The episodic CLI — the **encode affordance** the memory protocol relies on.
 *
 * EPISODIC is a JSONL record log (`{id: ULID, scope, body}`); an LLM agent
 * cannot hand-mint a ULID, so "encode an event" must be a tool call, not a
 * markdown append. This CLI is that tool: `encode` mints the id and appends the
 * record, `read` lists them, `migrate` runs the markdown→JSONL converter.
 *
 * Dependency-free by design (matches the package ethos): a minimal argv parser,
 * no cac/commander. `main` returns a {@link CliResult} so it is unit-testable;
 * the bin shim ({@link runMain}) maps that to process IO + exit code.
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

/** Build a HostEnv from `--home` (user-scope base) and optional `--project-root`. */
function hostEnvFrom(flags: ParsedArgs['flags']): HostEnv {
  const home = str(flags.home);
  if (home === undefined)
    throw new Error('--home <agent-home-dir> is required');
  const roots: Record<string, string> = {};
  const projectRoot = str(flags['project-root']);
  const projectKey = str(flags['project-key']);
  if (projectRoot !== undefined && projectKey !== undefined)
    roots[projectKey] = projectRoot;
  return createHostEnv(home, roots);
}

function readStdin(): string {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const USAGE = `episodic — portable EPISODIC JSONL store

usage:
  episodic encode --home <dir> [--scope <tag>] [--path <p>] \\
                  (--body <text> | --body-json <json> | --body -)
  episodic read   --home <dir> [--scope <tag>] [--path <p>] [--count]
  episodic migrate <src.md> <dest.jsonl> [--dry-run] [--overwrite]
  episodic drain  --home <dir> [--keep N] [--path <p>]
  episodic audit  --home <dir> [--allow <file>] [--config <file>] [--keys <file>]

Scope tag grammar: user | project:<key> | plan:<key>/<plan>   (key = repo basename).
The agent reasons the tag (narrowest active scope); the tool only validates it —
no cwd inference. Unknown shapes are rejected loudly.

EPISODIC is a JSONL event log: encode mints a ULID and appends one open record.
The raw log is ALWAYS the agent home (--home); --scope is a routing TAG written
onto the record (and, on read, an optional filter over it), never a store
location — capture never writes into a project tree.
For a body that starts with "--", use --body=<text> or pipe via --body -.

audit scans <home>/{SELF,MEMORY}.md for scope markers (workspace paths, plan
paths, branch/PR/issue refs, repo keys): exit 1 + line-numbered findings on any
unpinned hit, 0 clean. --allow pins reviewed exceptions (one exact matched
marker per line; a pin that no longer matches is reported STALE — shrink-only).
--config points at a .agent-factory.config (default: $AGENT_FACTORY_CONFIG,
else ./.agent-factory.config when present) for repo keys; --keys adds a
one-key-per-line list.
`;

/** `encode`: mint a ULID and append one open record; print the new id. */
function runEncode(args: ParsedArgs): CliResult {
  const scope: Scope = assertScope(str(args.flags.scope) ?? 'user');
  const path = str(args.flags.path);
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
  const store = new EpisodicStore({ env: hostEnvFrom(args.flags) });
  const rec = store.encode({
    scope,
    ...(path !== undefined ? { path } : {}),
    body,
  });
  return { code: 0, out: `${rec.id}\n`, err: '' };
}

/**
 * `read`: list records (or `--count`) from the home-anchored RAW LOG. `--scope`
 * is a routing-tag FILTER over the records, never a store selector — the raw log
 * is always the agent home (ideas/memory.md, raw capture is single-store).
 */
function runRead(args: ParsedArgs): CliResult {
  const scopeFilter = str(args.flags.scope);
  if (scopeFilter !== undefined) assertScope(scopeFilter); // validate if given
  const path = str(args.flags.path) ?? DEFAULT_EPISODIC_PATH;
  const store = new EpisodicStore({ env: hostEnvFrom(args.flags) });
  const all = store.read(path);
  const records =
    scopeFilter === undefined
      ? all
      : all.filter((r) => r.scope === scopeFilter);
  if (args.flags.count === true)
    return { code: 0, out: `${records.length}\n`, err: '' };
  return {
    code: 0,
    out:
      records.map((r) => JSON.stringify(r)).join('\n') +
      (records.length ? '\n' : ''),
    err: '',
  };
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
  const store = new EpisodicStore({ env: hostEnvFrom(args.flags) });
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
 * `audit`: the scope-pollution detector (plans/scoped-memory SPEC §6) over
 * `<home>/{SELF,MEMORY}.md`. Exit 1 + line-numbered findings on any unpinned
 * hit; 0 clean. Repo keys come from an EXPLICIT config/keylist (flag, env, or a
 * cwd-present `.agent-factory.config`) — the detector itself never sniffs
 * context. Stale allow pins are reported on stderr but do not fail the audit
 * (the ratchet shrinks at review time; the gate bites on pollution).
 */
function runAudit(args: ParsedArgs): CliResult {
  const home = str(args.flags.home);
  if (home === undefined)
    return { code: 2, out: '', err: '--home <agent-home-dir> is required\n' };

  const allowFile = str(args.flags.allow);
  const allowPins = allowFile !== undefined ? loadLines(allowFile) : [];

  const repoKeys: string[] = [];
  const configPath =
    str(args.flags.config) ??
    process.env.AGENT_FACTORY_CONFIG ??
    (existsSync('.agent-factory.config') ? '.agent-factory.config' : undefined);
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
  out += `audit: ${report.findings.length} finding(s) (${report.pinned.length} pinned) — scope-tagged content belongs in its project/plan AGENTS.md, not SELF/MEMORY\n`;
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
