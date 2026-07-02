// `agent-forge deploy` — ship an already-projected render tree (agents/ + skills/) to
// a host `.claude/` root. The deploy half of the projection↔deploy self-binding
// (the projection is `agent-forge` claude-adapter output; this lands it on a host).
//
// Faithful CLI port of `toolkit/deploy.py main()`: single-host + `--fleet`,
// per-host result codes (0 landed, 2 unreachable-deferred), and the
// `.agent-factory.config` topology resolution with the no-default-user hard-error.

import pc from 'picocolors';
import {
  ConfigError,
  type DeployKind,
  type RenderTree,
  type Scope,
  type SkillCompanions,
  deployFleet,
  deploySingle,
  loadConfig,
} from '../../deploy/index.js';

/** The CLI `--kind` argument: a real `DeployKind`, or the `all` sugar that
 *  expands to every kind in ONE invocation (agent → skill → hooks) under the
 *  SAME target resolution. `all` is a CLI-layer concept only; the deploy engine
 *  never sees it (it is expanded here before any engine call). */
export type DeployKindArg = DeployKind | 'all';

/** The kinds `all` expands to, in deploy order. */
export const ALL_KINDS: readonly DeployKind[] = ['agent', 'skill', 'hooks'];

export interface DeployCmdOpts {
  // The render tree to deploy.
  agentsDir: string;
  skillsDir: string;
  // Render tree hooks root (settings.json + hooks/<id>/); --kind hooks only.
  hooksDir?: string;
  // Per-skill bundle/asset companion declarations + the bundle base root.
  companions?: Record<string, SkillCompanions>;
  bundleBaseRoot?: string;
  // What to ship. `all` expands to agent → skill → hooks (same target opts).
  kind: DeployKindArg;
  scope: Scope;
  // Topology / target.
  host?: string | null;
  user?: string | null;
  home?: string | null;
  project?: string | null;
  fleet?: boolean;
  exclude?: string | null;
  only?: string | null;
  dryRun?: boolean;
}

function splitList(s: string | null | undefined): string[] | null {
  if (!s) {
    return null;
  }
  const items = s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

/** Parse a `--bundle skill=spec[,skill=spec...]` (or `--assets`) declaration
 *  into a companions map. Each entry binds one build-artifact (or committed
 *  asset) spec to a skill; repeated keys accumulate. Resolved against
 *  `--bundle-base-root` (bundle) / the skill's source dir (assets). */
export function parseCompanions(
  bundle: string | null | undefined,
  assets: string | null | undefined,
): Record<string, SkillCompanions> | undefined {
  const map: Record<string, SkillCompanions> = {};
  const add = (decl: string | null | undefined, field: 'bundle' | 'assets') => {
    for (const pair of splitList(decl) ?? []) {
      const eq = pair.indexOf('=');
      if (eq < 0) {
        throw new Error(
          `--${field}: '${pair}' must be <skill>=<spec> (e.g. memory=agent-memory/dist/episodic.mjs)`,
        );
      }
      const skill = pair.slice(0, eq).trim();
      const spec = pair.slice(eq + 1).trim();
      if (!map[skill]) {
        map[skill] = {};
      }
      const c = map[skill];
      if (!c[field]) {
        c[field] = [];
      }
      c[field].push(spec);
    }
  };
  add(bundle, 'bundle');
  add(assets, 'assets');
  return Object.keys(map).length ? map : undefined;
}

export async function runDeploy(opts: DeployCmdOpts): Promise<number> {
  const tree: RenderTree = {
    agentsDir: opts.agentsDir,
    skillsDir: opts.skillsDir,
    hooksDir: opts.hooksDir,
    companions: opts.companions,
    bundleBaseRoot: opts.bundleBaseRoot,
  };
  const log = (line: string) => console.log(line);
  const warn = (line: string) => console.error(line);

  let cfg: ReturnType<typeof loadConfig>;
  try {
    cfg = loadConfig();
  } catch (e) {
    if (e instanceof ConfigError) {
      console.error(pc.red(`config error: ${e.message}`));
      return 1;
    }
    throw e;
  }

  // Expand the `all` sugar to the concrete kinds; a single kind runs a
  // one-element loop. Every kind reuses the EXISTING per-kind engine path with
  // IDENTICAL target opts — so `--fleet` / `--host` / `--exclude` apply to all
  // three (the fix for the old `&&`-chain leak where `--fleet` reached only the
  // trailing kind). The overall rc is the first non-zero kind's rc.
  const kinds: readonly DeployKind[] =
    opts.kind === 'all' ? ALL_KINDS : [opts.kind];

  try {
    if (opts.fleet) {
      if (cfg == null) {
        console.error(
          pc.red(
            '--fleet needs a .agent-factory.config (fleet topology) -- none found at repo root',
          ),
        );
        return 1;
      }
      let rc = 0;
      for (const kind of kinds) {
        const r = deployFleet({
          kind,
          scope: opts.scope,
          tree,
          cfg,
          home: opts.home ?? null,
          project: opts.project ?? null,
          user: opts.user ?? null,
          exclude: splitList(opts.exclude),
          onlyHosts: splitList(opts.only),
          dry: opts.dryRun ?? false,
          log,
          warn,
        });
        if (r.rc !== 0 && rc === 0) {
          rc = r.rc;
        }
      }
      return rc;
    }

    let rc = 0;
    for (const kind of kinds) {
      const r = deploySingle({
        kind,
        scope: opts.scope,
        tree,
        host: opts.host ?? null,
        user: opts.user ?? null,
        home: opts.home ?? null,
        project: opts.project ?? null,
        only: splitList(opts.only),
        dry: opts.dryRun ?? false,
        cfg,
        log,
        warn,
      });
      if (r.rc !== 0 && rc === 0) {
        rc = r.rc;
      }
    }
    return rc;
  } catch (e) {
    if (e instanceof ConfigError) {
      console.error(pc.red(`config error: ${e.message}`));
      return 1;
    }
    console.error(pc.red(`agent-forge deploy: ${(e as Error).message}`));
    return 1;
  }
}
