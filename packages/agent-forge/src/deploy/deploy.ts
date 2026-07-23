// Deploy orchestrator — resolve a SCOPE to a `.claude/` root, then run a placer
// backend (local fs or ssh) that ships the generated defs (the SOUL) and seeds
// each agent's `{SEMANTIC,PROCEDURAL,EPISODIC}` sidecars ONLY IF ABSENT (`memory`).
// Governed oppositely to the def (`substance-over-accident`): the def is
// regenerated substance (overwritten freely); the sidecars are the
// self-authored individual (never clobbered).
//
// Join key is the agent NAME (`named-marker-as-index-key`):
//   <name>.md (def) <-> <name>/SEMANTIC.md (the individual).
//
// Per-host topology comes from `.agent-factory.config` (docs/agent-factory-config-schema.md)
// when present. Resolution precedence per param: CLI flag › config host.<name>
// › built-in default. An ABSENT config keeps legacy flag-only mode working.
//
// Faithful port of `toolkit/deploy.py`. The deploy layer consumes an
// ALREADY-PROJECTED render tree; the projection itself is agent-forge's claude
// adapter, driven by agent-canon's project-cli.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import {
  type AgentFactoryConfig,
  type FleetTargetsOpts,
  type HostParams,
  fleetTargets,
  resolveHost,
} from './config.js';
import { hookTreeNames, placeHooksLocal } from './hooks.js';
import { placeAgentsLocal, placeSkillsLocal } from './local.js';
import {
  type RuntimeBundle,
  buildRuntimeBundle,
  installRuntimeLocal,
  installRuntimeSsh,
} from './runtime-install.js';
import { projectScope, userScope } from './scope.js';
import {
  type SshPlaceOpts,
  placeAgentsSsh,
  placeHooksSsh,
  placeSkillsSsh,
  realRunner,
} from './ssh.js';
import type {
  CommandRunner,
  DeployKind,
  PlaceReport,
  PlaceResult,
  RenderTree,
} from './types.js';

export type Scope = 'user' | 'project';

export interface DeployOpts {
  kind: DeployKind;
  scope: Scope;
  tree: RenderTree;
  // CLI overrides (null ⇒ unset, defer to config / default).
  home?: string | null;
  project?: string | null;
  dry?: boolean;
  // Restrict to a subset of names (single-host). Unknown name → hard error.
  only?: string[] | null;
  // Injectable ssh runner for hermetic tests (default: real ssh/scp).
  runner?: CommandRunner;
  log?: (line: string) => void;
  warn?: (line: string) => void;
  // ── S7 per-host runtime install (FORK-3) ────────────────────────────────
  // Opt-in the runtime-install step (bundle + flat co-install of
  // `@leclabs/agent-runtime` + capability plugins). Runs once per host, on the
  // `agent` kind. Default OFF at the engine boundary so the placement engine's
  // pure tests stay hermetic; the `deploy` CLI turns it ON. Idempotent.
  runtimeInstall?: boolean;
  // Override the install prefix (default: the host's npm global prefix). A test
  // points this at a temp dir; production leaves it unset.
  runtimePrefix?: string | null;
  // Override the monorepo root the bundle is packed from (default: discovered).
  monorepoRoot?: string | null;
  // A pre-built bundle reused across fleet hosts (pack once per deploy).
  runtimeBundle?: RuntimeBundle | null;
}

/** Names available to deploy for a kind, read from the render tree. Agents are
 *  the `<name>.md` files in agentsDir; skills are the `<name>/` dirs (with a
 *  SKILL.md) in skillsDir. */
export function treeNames(kind: DeployKind, tree: RenderTree): string[] {
  if (kind === 'hooks') {
    return tree.hooksDir ? hookTreeNames(tree.hooksDir) : [];
  }
  if (kind === 'skill') {
    if (!existsSync(tree.skillsDir)) {
      return [];
    }
    return readdirSync(tree.skillsDir)
      .filter((d) => {
        const p = resolvePath(tree.skillsDir, d);
        return (
          statSync(p).isDirectory() && existsSync(resolvePath(p, 'SKILL.md'))
        );
      })
      .sort();
  }
  if (!existsSync(tree.agentsDir)) {
    return [];
  }
  return readdirSync(tree.agentsDir)
    .filter(
      (f) =>
        f.endsWith('.md') && statSync(resolvePath(tree.agentsDir, f)).isFile(),
    )
    .map((f) => f.slice(0, -'.md'.length))
    .sort();
}

/** The set of def/skill names to deploy for `kind`, optionally narrowed by an
 *  `only` allowlist (hard-errors on an unknown name). */
export function resolveNames(
  kind: DeployKind,
  tree: RenderTree,
  only: string[] | null | undefined,
): string[] {
  let names = treeNames(kind, tree);
  if (only && only.length > 0) {
    const want = only.map((n) => n.trim()).filter(Boolean);
    const unknown = want.filter((n) => !names.includes(n));
    if (unknown.length > 0) {
      throw new Error(
        `--only: unknown ${kind}(s) [${unknown.map((n) => `'${n}'`).join(', ')}]; ` +
          `known: [${names.map((n) => `'${n}'`).join(', ')}]`,
      );
    }
    names = names.filter((n) => want.includes(n));
  }
  return names;
}

function placeOpts(opts: DeployOpts): SshPlaceOpts {
  return {
    dry: opts.dry ?? false,
    log: opts.log,
    warn: opts.warn,
    runner: opts.runner,
  };
}

/** Deploy in-place to a local `.claude/` root resolved from the scope. */
function deployLocal(
  hp: HostParams,
  names: string[],
  opts: DeployOpts,
): PlaceResult {
  const log = opts.log ?? (() => {});
  const scopeRes =
    opts.scope === 'project' ? projectScope(opts.project) : userScope(hp.home);
  if (scopeRes.note) {
    (opts.warn ?? (() => {}))(scopeRes.note.message);
  }
  log(`=== LOCAL deploy -> ${scopeRes.claudeDir} ===`);
  if (opts.kind === 'hooks') {
    return placeHooksLocal(
      scopeRes.claudeDir,
      opts.tree,
      names,
      placeOpts(opts),
    );
  }
  if (opts.kind === 'skill') {
    return placeSkillsLocal(
      scopeRes.claudeDir,
      opts.tree,
      names,
      placeOpts(opts),
    );
  }
  const result = placeAgentsLocal(
    scopeRes.claudeDir,
    opts.tree.agentsDir,
    names,
    placeOpts(opts),
  );
  // After placing agent artifacts, ensure the per-host runtime is installed so a
  // deployed skill's `agent-runtime <cap> <verb>` shim resolves (S7/FORK-3). Once
  // per host, on the `agent` kind; idempotent + version-pinned.
  if (opts.runtimeInstall) {
    installRuntimeLocal(scopeRes.claudeDir, {
      dry: opts.dry ?? false,
      log,
      warn: opts.warn,
      runner: opts.runner,
      prefix: opts.runtimePrefix ?? null,
      monorepoRoot: opts.monorepoRoot ?? null,
      bundle: opts.runtimeBundle ?? null,
    });
  }
  return result;
}

/** Deploy over ssh to a resolved non-local host (user@hostname:<home>). */
function deployRemote(
  hp: HostParams,
  names: string[],
  opts: DeployOpts,
): PlaceResult {
  const log = opts.log ?? (() => {});
  const home = hp.home ?? '~/.claude';
  log(
    `=== REMOTE deploy -> ${hp.user}@${hp.hostname}:${home} (host key '${hp.name}') ===`,
  );
  if (opts.kind === 'hooks') {
    return placeHooksSsh(
      hp.user as string,
      hp.hostname,
      home,
      opts.tree,
      names,
      placeOpts(opts),
    );
  }
  if (opts.kind === 'skill') {
    return placeSkillsSsh(
      hp.user as string,
      hp.hostname,
      home,
      opts.tree,
      names,
      placeOpts(opts),
    );
  }
  const result = placeAgentsSsh(
    hp.user as string,
    hp.hostname,
    home,
    opts.tree.agentsDir,
    names,
    placeOpts(opts),
  );
  // Ensure the remote runtime is installed (S7/FORK-3) once per host, on `agent`.
  // Skipped when the host was unreachable (rc 2) — nothing to install against.
  if (opts.runtimeInstall && result.rc === 0) {
    installRuntimeSsh(`${hp.user}@${hp.hostname}`, {
      dry: opts.dry ?? false,
      log,
      warn: opts.warn,
      runner: opts.runner,
      prefix: opts.runtimePrefix ?? null,
      monorepoRoot: opts.monorepoRoot ?? null,
      bundle: opts.runtimeBundle ?? null,
    });
  }
  return result;
}

/** Deploy to one resolved host — locality from its params, not a magic name. */
export function deployHost(
  hp: HostParams,
  names: string[],
  opts: DeployOpts,
): PlaceResult {
  return hp.local
    ? deployLocal(hp, names, opts)
    : deployRemote(hp, names, opts);
}

export interface DeploySingleOpts extends DeployOpts {
  // host key in `.agent-factory.config`; null / 'local' ⇒ deploy in place.
  host?: string | null;
  user?: string | null;
  cfg?: AgentFactoryConfig | null;
}

export interface DeploySingleResult {
  rc: number;
  host: HostParams;
  result: PlaceResult;
}

/** Single-host deploy (deploy.py `main` non-fleet path). Resolves locality
 *  from the config (host.<name>.local), NOT a magic name list. `--host`
 *  omitted / 'local' stays the local convenience; a named host MUST resolve
 *  through a present config (no current-user fallback). */
export function deploySingle(opts: DeploySingleOpts): DeploySingleResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const cfg = opts.cfg;
  const names = resolveNames(opts.kind, opts.tree, opts.only);
  log(
    `${opts.kind.endsWith('s') ? opts.kind : `${opts.kind}s`} (${names.length}): ${names.join(', ')}`,
  );

  let hp: HostParams;
  if (opts.host == null || opts.host === 'local') {
    hp = {
      name: 'local',
      local: true,
      user: null,
      hostname: 'local',
      home: opts.home ?? null,
    };
  } else {
    hp = resolveHost(opts.host, {
      cliUser: opts.user ?? null,
      cliHome: opts.home ?? null,
      cfg,
    });
    if (cfg == null) {
      warn(
        `  NOTE no .agent-factory.config -- legacy flag-only mode for host '${opts.host}' ` +
          `(user=${opts.user ?? '(current)'})`,
      );
    }
  }
  const result = deployHost(hp, names, opts);
  return { rc: result.rc === 2 ? 2 : 0, host: hp, result };
}

export type FleetHostStatus =
  | 'dry-run'
  | 'landed'
  | 'unreachable-deferred'
  | `failed (rc=${number})`;

export interface FleetResult {
  rc: number;
  resolved: HostParams[];
  excluded: string[];
  results: Array<{
    name: string;
    status: FleetHostStatus;
    result: PlaceResult;
  }>;
}

export interface DeployFleetOpts extends DeployOpts {
  cfg: AgentFactoryConfig;
  user?: string | null;
  exclude?: string[] | null;
  // In fleet mode `only` restricts HOSTS, not names.
  onlyHosts?: string[] | null;
}

/** `--fleet`: iterate fleet.hosts minus fleet.exclude (∪ extraExclude), deploy
 *  each with config-resolved params, report a per-host result. A host in
 *  exclude is NEVER touched. Needs a config (fleet topology has no flag-only
 *  fallback). */
export function deployFleet(opts: DeployFleetOpts): FleetResult {
  const log = opts.log ?? (() => {});
  const cfg = opts.cfg;
  const extraExclude = opts.exclude ?? null;
  const ftOpts: FleetTargetsOpts = {
    only: opts.onlyHosts ?? null,
    extraExclude,
  };
  const targets = fleetTargets(cfg, ftOpts);
  const resolved = targets.map((h) =>
    resolveHost(h, {
      cliUser: opts.user ?? null,
      cliHome: opts.home ?? null,
      cfg,
    }),
  );

  const excluded = [
    ...new Set([...(cfg.fleet?.exclude ?? []), ...(extraExclude ?? [])]),
  ].sort();
  // --only restricts HOSTS in fleet mode, so names are the full tree set.
  const names = resolveNames(opts.kind, opts.tree, null);
  log(
    `=== FLEET deploy (${opts.kind}) -> ${resolved.length} host(s): ` +
      `${resolved.map((h) => h.name).join(', ')} ===`,
  );
  if (excluded.length) {
    log(`    excluded (never touched): ${excluded.join(', ')}`);
  }
  log(
    `    ${opts.kind.endsWith('s') ? opts.kind : `${opts.kind}s`} (${names.length}): ${names.join(', ')}`,
  );

  // Pack the runtime bundle ONCE for the whole fleet (a re-pack per host is
  // wasteful and the artifact is identical); each host reuses it. Only when the
  // install is on, the kind is `agent`, and a bundle was not already supplied.
  let fleetBundle = opts.runtimeBundle ?? null;
  if (
    opts.runtimeInstall &&
    opts.kind === 'agent' &&
    !fleetBundle &&
    !opts.dry
  ) {
    fleetBundle = buildRuntimeBundle({
      dry: false,
      log,
      warn: opts.warn,
      runner: opts.runner,
      monorepoRoot: opts.monorepoRoot ?? null,
    });
  }

  const results: FleetResult['results'] = [];
  for (const hp of resolved) {
    const where = hp.local
      ? `local ${hp.home ?? '~/.claude'}`
      : `${hp.user}@${hp.hostname}:${hp.home ?? '~/.claude'}`;
    log(`\n--- host '${hp.name}' -> ${where} ---`);
    const r = deployHost(hp, names, { ...opts, runtimeBundle: fleetBundle });
    const rc = r.rc;
    const status: FleetHostStatus = opts.dry
      ? 'dry-run'
      : rc === 0
        ? 'landed'
        : rc === 2
          ? 'unreachable-deferred'
          : (`failed (rc=${rc})` as FleetHostStatus);
    results.push({ name: hp.name, status, result: r });
  }

  log('\n=== FLEET summary ===');
  for (const { name, status } of results) {
    log(`  ${name}: ${status}`);
  }
  if (excluded.length) {
    log(`  (excluded: ${excluded.join(', ')})`);
  }
  const failed = results.filter((r) => r.status.startsWith('failed'));
  return { rc: failed.length ? 1 : 0, resolved, excluded, results };
}

// Re-export the real runner so callers/tests can pick the production seam.
export { realRunner };
export type { PlaceReport, PlaceResult };
