// `.agent-factory.config` loader + resolution contract (docs/agent-factory-config-schema.md).
//
// The deterministic, per-host deployment-parameter source for `agent-forge deploy`.
// It exists so deploy resolves *who* (ssh user) and *where* (hostname / home /
// locality) without per-host tribal knowledge or `--user` silently defaulting
// to the current shell user — the failure that made `upmav` look "unreachable"
// when the real fault was a wrong SSH user (`lex` vs `lcaraccioli`).
//
// Contract (firm, owned by nico's schema; this module is the consumer that
// enforces it):
//
// - JSON, repo root, `.agent-factory.config` (gitignored; `.agent-factory.config.example`
//   committed).
// - Resolution precedence per parameter, first-present wins:
//     1. CLI flag (--user/--home/--host) — an explicit override always trumps
//        config.
//     2. `.agent-factory.config` host.<name> — the deterministic per-host value.
//     3. Built-in default — only where the schema names one (hostname→key,
//        home→omit, local→false). `user` has NO default (non-local host
//        lacking user is a hard error).
// - Hard errors (degrade-visibly / no-permissive-defaults) — never silent:
//   unknown --host, fleet↔host drift, non-local host missing user,
//   missing/unknown schema, malformed JSON. An ABSENT file is NOT an error
//   (legacy flag-only mode); a PRESENT file is authoritative.
//
// This module decides nothing about *how* to ship bytes (that is the placer
// backends) — it only resolves the deployment TOPOLOGY into concrete
// `(local, user, hostname, home)` params and enumerates the fleet.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';

export const SCHEMA_VERSION = 1;
export const CONFIG_NAME = '.agent-factory.config';
// Explicit config-path override (an alternate topology file). Honored before
// the repo-root search — lets an operator (or a hermetic test) point deploy at
// a config other than the one beside `.git`. An absent override falls through
// to the repo-root `.agent-factory.config`.
export const CONFIG_ENV = 'AGENT_FACTORY_CONFIG';

/** A malformed / drift / unknown-host fault in `.agent-factory.config`. Thrown loudly
 *  so the CLI exits non-zero with the cause — never a silent permissive path. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** The resolved deployment parameters for one host — the concrete answer the
 *  placer backends consume. `local` ⇒ in-place (no ssh); otherwise ship to
 *  `user@hostname:<home>/.claude`. `home === null` ⇒ deploy's `~/.claude`
 *  server-side default. */
export interface HostParams {
  name: string;
  local: boolean;
  user: string | null;
  hostname: string;
  home: string | null;
}

// The validated config shape (`host` / `fleet` are loosely typed because the
// loader shape-validates structurally before any field is read).
export interface AgentFactoryConfig {
  schema: number;
  reader?: string;
  fleet?: { hosts?: string[]; exclude?: string[] };
  host: Record<
    string,
    { local?: boolean; user?: string; hostname?: string; home?: string }
  >;
}

/** The repo root holding `.agent-factory.config` — the nearest ancestor of `start`
 *  (default: cwd) containing a `.git` dir. Falls back to cwd so a detached
 *  checkout still resolves a config beside it. */
export function repoRoot(start?: string): string {
  let here = resolvePath(start ?? process.cwd());
  while (true) {
    if (existsSync(resolvePath(here, '.git'))) {
      return here;
    }
    const parent = dirname(here);
    if (parent === here) {
      return resolvePath(start ?? process.cwd());
    }
    here = parent;
  }
}

/** The `.agent-factory.config` path to read (whether or not it exists). The
 *  `AGENT_FACTORY_CONFIG` env override wins when set (an explicit alternate topology
 *  file); else the `.agent-factory.config` beside the repo root. An explicit `root`
 *  argument (test/internal) still takes precedence over the env override. */
export function configPath(root?: string): string {
  if (root !== undefined) {
    return resolvePath(root, CONFIG_NAME);
  }
  const override = process.env[CONFIG_ENV];
  if (override) {
    return resolvePath(override);
  }
  return resolvePath(repoRoot(), CONFIG_NAME);
}

/** Parse `.agent-factory.config` at the repo root. Returns the validated config, or
 *  `null` if the file is ABSENT (legacy flag-only mode — a missing config is
 *  not an error). A PRESENT but malformed / wrong-schema / drifted file is a
 *  hard error (degrade-visibly): the topology source must never silently
 *  mis-resolve. */
export function loadConfig(root?: string): AgentFactoryConfig | null {
  const p = configPath(root);
  if (!existsSync(p)) {
    return null;
  }
  let cfg: unknown;
  try {
    cfg = JSON.parse(readFileSync(p, 'utf-8'));
  } catch (e) {
    throw new ConfigError(`${p}: malformed JSON (${(e as Error).message})`);
  }
  if (typeof cfg !== 'object' || cfg === null || Array.isArray(cfg)) {
    throw new ConfigError(`${p}: top-level must be a JSON object`);
  }
  const obj = cfg as Record<string, unknown>;
  const schema = obj.schema;
  if (schema === undefined) {
    throw new ConfigError(`${p}: missing required \`schema\``);
  }
  if (schema !== SCHEMA_VERSION) {
    throw new ConfigError(
      `${p}: unrecognized schema ${JSON.stringify(schema)} (this consumer ` +
        `speaks schema ${SCHEMA_VERSION}) — refusing to guess`,
    );
  }
  const hosts = obj.host;
  if (typeof hosts !== 'object' || hosts === null || Array.isArray(hosts)) {
    throw new ConfigError(`${p}: \`host\` must be an object of host entries`);
  }
  const fleet = obj.fleet ?? {};
  if (typeof fleet !== 'object' || fleet === null || Array.isArray(fleet)) {
    throw new ConfigError(`${p}: \`fleet\` must be an object`);
  }
  const fleetHosts = (fleet as Record<string, unknown>).hosts ?? [];
  if (!Array.isArray(fleetHosts)) {
    throw new ConfigError(`${p}: \`fleet.hosts\` must be an array`);
  }
  const hostKeys = Object.keys(hosts as object);
  // Drift: every fleet.hosts entry needs a host.<name>, and vice-versa — a
  // one-sided entry is a topology mistake, surfaced not absorbed.
  const missingHost = (fleetHosts as string[]).filter(
    (h) => !hostKeys.includes(h),
  );
  if (missingHost.length > 0) {
    throw new ConfigError(
      `${p}: fleet.hosts entries with no host.<name> object: ` +
        `[${missingHost.map((h) => `'${h}'`).join(', ')}]`,
    );
  }
  const orphanHost = hostKeys.filter(
    (h) => !(fleetHosts as string[]).includes(h),
  );
  if (orphanHost.length > 0) {
    throw new ConfigError(
      `${p}: host.<name> entries absent from fleet.hosts: ` +
        `[${orphanHost.map((h) => `'${h}'`).join(', ')}]`,
    );
  }
  return obj as unknown as AgentFactoryConfig;
}

export interface ResolveHostOpts {
  cliUser?: string | null;
  cliHome?: string | null;
  cfg?: AgentFactoryConfig | null;
  root?: string;
}

/** Resolve one host's deployment params under the precedence contract
 *  (CLI flag › config host.<name> › built-in default). `cfg` may be passed to
 *  avoid re-reading; else loaded from the repo root.
 *
 *  Hard-errors when a present config does not name `name` in host.{} (the
 *  upmav-class failure — no silent current-user fallback), or when a non-local
 *  host resolves no user. */
export function resolveHost(
  name: string,
  opts: ResolveHostOpts = {},
): HostParams {
  const cliUser = opts.cliUser ?? null;
  const cliHome = opts.cliHome ?? null;
  let cfg = opts.cfg;
  if (cfg === undefined) {
    cfg = loadConfig(opts.root);
  }
  // No config at all: legacy flag-only mode. Non-local; resolve purely from
  // flags, no per-host record to consult.
  if (cfg === null) {
    return { name, local: false, user: cliUser, hostname: name, home: cliHome };
  }
  const hostEntry = cfg.host[name];
  if (hostEntry === undefined) {
    const known = Object.keys(cfg.host)
      .sort()
      .map((h) => `'${h}'`)
      .join(', ');
    throw new ConfigError(
      `--host '${name}' is absent from \`.agent-factory.config\` host.{} (known: [${known}]) — refusing a current-user fallback`,
    );
  }
  if (
    typeof hostEntry !== 'object' ||
    hostEntry === null ||
    Array.isArray(hostEntry)
  ) {
    throw new ConfigError(
      `host.${name} must be an object, got ${typeof hostEntry}`,
    );
  }
  const local = Boolean(hostEntry.local ?? false);
  // precedence: CLI flag › config › default
  const user = cliUser !== null ? cliUser : (hostEntry.user ?? null);
  const hostname = hostEntry.hostname ?? name;
  const home = cliHome !== null ? cliHome : (hostEntry.home ?? null);
  if (!local && !user) {
    throw new ConfigError(
      `host.${name} is non-local and resolves no \`user\` ` +
        `(set host.${name}.user or pass --user) — no default-to-current-user`,
    );
  }
  return { name, local, user, hostname, home };
}

export interface FleetTargetsOpts {
  only?: string[] | null;
  extraExclude?: string[] | null;
}

/** The ordered host names `--fleet` deploys: `fleet.hosts` minus
 *  `fleet.exclude` (∪ `extraExclude` for a single run), optionally restricted
 *  to `only`. An excluded host is NEVER returned — the exclude is honored
 *  before any `only` subset so `--only upgoose` can never re-include an
 *  excluded host. */
export function fleetTargets(
  cfg: AgentFactoryConfig,
  opts: FleetTargetsOpts = {},
): string[] {
  const fleet = cfg.fleet ?? {};
  const hosts: string[] = [...(fleet.hosts ?? [])];
  const exclude = new Set<string>(fleet.exclude ?? []);
  if (opts.extraExclude) {
    for (const h of opts.extraExclude) {
      exclude.add(h);
    }
  }
  let targets = hosts.filter((h) => !exclude.has(h));
  if (opts.only != null) {
    const want = new Set(opts.only);
    const unknown = [...want].filter((h) => !hosts.includes(h));
    if (unknown.length > 0) {
      throw new ConfigError(
        `--only names host(s) not in fleet.hosts: [${unknown
          .sort()
          .map((h) => `'${h}'`)
          .join(', ')}]`,
      );
    }
    targets = targets.filter((h) => want.has(h));
  }
  return targets;
}
