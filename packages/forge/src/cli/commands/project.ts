// `cratylus project [--out <dir>] [--config <path>] [--harness <name>] [--verbose]` — the
// step that was missing between `compose` and `deploy`.
//
// `compose` resolved the plugin set and wrote nothing; `deploy` required a render
// tree; and the only producer of one was a monorepo script that bypassed the
// resolver. A consumer could install, extend, and resolve — and still obtain no
// artifact. This command materializes the resolved set, so the consumer pipeline
// is finally closed: init → add → project → deploy.

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { adapterByName } from '../../adapters/registry/index.js';
import { CLI_BIN } from '../../bin-name.js';
import { loadConfig, requirePlugins } from '../../config/index.js';
import { CONFIG_FILE } from '../../config/scaffold.js';
import {
  type ProjectablePlugin,
  discoverFragments,
  projectPluginSet,
  resolveFragmentBodies,
  writeRenderTree,
} from '../../project/index.js';
import { fail, say, warn } from '../style.js';

/** The harness `project` and `deploy` both default to. */
const DEFAULT_HARNESS = 'claude';

export interface ProjectCmdOpts {
  /** Path to `cratylus.config.ts`; defaults to `<cwd>/cratylus.config.ts`. */
  config?: string;
  /** Render-tree root; defaults to `<cwd>/.cratylus/<harness>`, the tree `deploy` reads. */
  out?: string;
  /** Harness adapter name; defaults to `claude`. */
  harness?: string;
  /** Also print one line per file rendered and per stale file pruned. */
  verbose?: boolean;
  cwd?: string;
}

/** The `deploy` invocation that ships a tree this command wrote: bare when the tree
 *  is where `deploy` looks by default, else with the flags that point it there. */
function deployCommand(
  out: string,
  defaultOut: string,
  harness: string,
): string {
  const flags = [
    out === defaultOut ? '' : `--from ${out}`,
    harness === DEFAULT_HARNESS ? '' : `--harness ${harness}`,
  ].filter((f) => f !== '');
  return [CLI_BIN, 'deploy', ...flags].join(' ');
}

export async function runProject(opts: ProjectCmdOpts = {}): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  const configPath = resolve(opts.config ?? join(cwd, CONFIG_FILE));
  if (!existsSync(configPath)) {
    fail(
      'project',
      `no ${CONFIG_FILE} at ${configPath}; run \`${CLI_BIN} init\` first`,
    );
    return 1;
  }
  try {
    return await project(opts, cwd, configPath);
  } catch (e) {
    fail('project', (e as Error).message);
    return 1;
  }
}

async function project(
  opts: ProjectCmdOpts,
  cwd: string,
  configPath: string,
): Promise<number> {
  const config = await loadConfig(configPath);
  requirePlugins(config, configPath);
  // No cast: `AgentPlugin` now satisfies `ProjectablePlugin` structurally, because
  // projection consumes the `fragments` dir too. The cast this line used to carry
  // was the census's tell — it silently DISCARDED the one field the fold needs.
  const plugins: readonly ProjectablePlugin[] = config.extends;
  const harness = opts.harness ?? DEFAULT_HARNESS;
  // THE ONE TREE `deploy` READS: `.cratylus/<harness>`, named after the tool and so
  // derived from the bin. A default of any other name is a render `deploy` refuses.
  const defaultOut = resolve(cwd, `.${CLI_BIN}`, harness);
  const out = resolve(opts.out ?? defaultOut);
  const adapter = adapterByName(harness);
  const detail = opts.verbose ? say : () => {};

  // RESOLVE, then render, then write.
  //
  // `compose` folded the plugin set's fragments and `project` rendered agents
  // straight off their import bindings — two pipelines over one plugin set that
  // never met, so a consumer `patches` entry was read here and silently dropped.
  // The fold now runs FIRST and its result rewrites each agent's dimension values,
  // which is what makes `compose(select(a)) = ir(a)` (ENGINE:22) hold under a patch
  // rather than only when `patches` happens to be empty.
  //
  // Discovery is separate from the fold because a patch can only target a node a
  // discovery already minted (identity addressing).
  const resolvedBodies = resolveFragmentBodies(
    await discoverFragments(plugins),
    config.patches ?? [],
  );

  // Render, THEN write — the projector hands back the artifact tree and this
  // command is the one writer. A projection that throws leaves no half-tree.
  const report = await projectPluginSet({
    plugins,
    adapter,
    resolvedBodies,
    log: detail,
    warn: (line) => warn('project', line),
  });
  // The writer CONVERGES `out` — it writes the tree and removes what a prior
  // projection into this same dir left behind. It reports what it removed; the
  // removal is not announced by the writer itself, because a library that prints
  // is a library a consumer cannot embed quietly.
  const { removed, bootstrap } = writeRenderTree(out, report.files);
  for (const rel of removed) detail(`pruned stale ${rel}`);
  if (bootstrap) {
    detail(
      'no prior render record in this dir, so nothing here is attributable to this command and nothing was pruned; this run establishes the record and the next one converges',
    );
  }

  say(
    `projected ${report.agents} agent(s) + ${report.skills} skill(s)` +
      `${report.shims > 0 ? ` + ${report.shims} runtime shim(s)` : ''}` +
      `${report.hooks > 0 ? ` + ${report.hooks} hook(s)` : ''}` +
      `${removed.length > 0 ? `, pruned ${removed.length} stale file(s)` : ''} into ${out}`,
  );
  say(`ship it with: ${deployCommand(out, defaultOut, harness)}`);
  return 0;
}
