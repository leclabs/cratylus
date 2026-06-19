import { readFileSync } from 'node:fs';
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
  episodic encode --home <dir> [--scope user|project:<key>] [--path <p>] \\
                  (--body <text> | --body-json <json> | --body -)
  episodic read   --home <dir> [--scope user] [--path <p>] [--count]
  episodic migrate <src.md> <dest.jsonl> [--dry-run] [--overwrite]

EPISODIC is a JSONL event log: encode mints a ULID and appends one open record.
For a body that starts with "--", use --body=<text> or pipe via --body -.
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

/** `read`: list records (or `--count`) from a (scope, path) store. */
function runRead(args: ParsedArgs): CliResult {
  const scope: Scope = assertScope(str(args.flags.scope) ?? 'user');
  const path = str(args.flags.path) ?? DEFAULT_EPISODIC_PATH;
  const store = new EpisodicStore({ env: hostEnvFrom(args.flags) });
  const records = store.read(scope, path);
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
