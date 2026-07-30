// `agent-forge deploy` — place an already-projected render tree (agents/ +
// skills/) into the LOCAL `.claude/` root. The deploy half of the
// projection↔deploy self-binding (the projection is `agent-forge`
// claude-adapter output; this lands it locally).
//
// Local-only by construction: installing the packages on a host is npm's job,
// and iterating hosts is the operator's outer loop around the whole pipeline.
// Neither is a stage, so neither is here.

import pc from 'picocolors';
import { adapterByName } from '../../adapters/registry/index.js';
import {
  type DeployKind,
  type RenderTree,
  type Scope,
  type SkillCompanions,
  deploySingle,
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
  // Per-skill committed `assets:` companion declarations.
  companions?: Record<string, SkillCompanions>;
  // What to ship. `all` expands to agent → skill → hooks (same target opts).
  kind: DeployKindArg;
  scope: Scope;
  /** Harness name (`claude` | `codex`); decides WHICH home the tree lands in. */
  harness?: string | null;
  // Target — the local harness root the scope resolves to.
  home?: string | null;
  project?: string | null;
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

/** Parse a `--assets skill=spec[,skill=spec...]` declaration into a companions
 *  map. Each entry binds one committed-asset spec to a skill; repeated keys
 *  accumulate. Specs resolve against the skill's source dir. */
export function parseCompanions(
  assets: string | null | undefined,
): Record<string, SkillCompanions> | undefined {
  const map: Record<string, SkillCompanions> = {};
  for (const pair of splitList(assets) ?? []) {
    const eq = pair.indexOf('=');
    if (eq < 0) {
      throw new Error(
        `--assets: '${pair}' must be <skill>=<spec> (e.g. skill=logo.png)`,
      );
    }
    const skill = pair.slice(0, eq).trim();
    const spec = pair.slice(eq + 1).trim();
    if (!map[skill]) {
      map[skill] = {};
    }
    const c = map[skill];
    if (!c.assets) {
      c.assets = [];
    }
    c.assets.push(spec);
  }
  return Object.keys(map).length ? map : undefined;
}

export async function runDeploy(opts: DeployCmdOpts): Promise<number> {
  // WHICH harness's home the tree lands in. Resolved by NAME through the same
  // registry `project` uses, so `deploy --harness codex` and `project --harness
  // codex` cannot disagree about where codex lives. Unknown name fails loudly
  // here rather than silently deploying into `.claude`.
  const harnessAdapter = adapterByName(opts.harness ?? 'claude');
  const tree: RenderTree = {
    agentsDir: opts.agentsDir,
    skillsDir: opts.skillsDir,
    hooksDir: opts.hooksDir,
    companions: opts.companions,
  };
  const log = (line: string) => console.log(line);
  const warn = (line: string) => console.error(line);

  // Expand the `all` sugar to the concrete kinds; a single kind runs a
  // one-element loop. Every kind reuses the EXISTING per-kind engine path with
  // IDENTICAL target opts. The overall rc is the first non-zero kind's rc.
  const kinds: readonly DeployKind[] =
    opts.kind === 'all' ? ALL_KINDS : [opts.kind];

  try {
    let rc = 0;
    for (const kind of kinds) {
      const r = deploySingle({
        kind,
        scope: opts.scope,
        tree,
        harnessHome: harnessAdapter.home,
        agentExt: harnessAdapter.agentExt,
        hooksFile: harnessAdapter.hooksFile,
        home: opts.home ?? null,
        project: opts.project ?? null,
        only: splitList(opts.only),
        dry: opts.dryRun ?? false,
        log,
        warn,
      });
      if (r.rc !== 0 && rc === 0) {
        rc = r.rc;
      }
    }
    return rc;
  } catch (e) {
    console.error(pc.red(`agent-forge deploy: ${(e as Error).message}`));
    return 1;
  }
}
