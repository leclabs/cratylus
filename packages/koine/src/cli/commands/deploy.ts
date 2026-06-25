// `koine deploy` — ship an already-projected render tree (agents/ + skills/) to
// a host `.claude/` root. The deploy half of the projection↔deploy self-binding
// (the projection is `koine` claude-adapter output; this lands it on a host).
//
// Faithful CLI port of `toolkit/deploy.py main()`: single-host + `--fleet`,
// per-host result codes (0 landed, 2 unreachable-deferred), and the
// `.polis.config` topology resolution with the no-default-user hard-error.

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

export interface DeployCmdOpts {
  // The render tree to deploy.
  agentsDir: string;
  skillsDir: string;
  // Per-skill bundle/asset companion declarations + the bundle base root.
  companions?: Record<string, SkillCompanions>;
  bundleBaseRoot?: string;
  // What to ship.
  kind: DeployKind;
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
          `--${field}: '${pair}' must be <skill>=<spec> (e.g. memory=episodic/dist/episodic.mjs)`,
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

  try {
    if (opts.fleet) {
      if (cfg == null) {
        console.error(
          pc.red(
            '--fleet needs a .polis.config (fleet topology) -- none found at repo root',
          ),
        );
        return 1;
      }
      const r = deployFleet({
        kind: opts.kind,
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
      return r.rc;
    }

    const r = deploySingle({
      kind: opts.kind,
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
    return r.rc;
  } catch (e) {
    if (e instanceof ConfigError) {
      console.error(pc.red(`config error: ${e.message}`));
      return 1;
    }
    console.error(pc.red(`koine deploy: ${(e as Error).message}`));
    return 1;
  }
}
