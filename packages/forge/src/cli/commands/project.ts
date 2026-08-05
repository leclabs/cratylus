// `cratylus project [--out <dir>] [--config <path>] [--harness <name>]` — the
// step that was missing between `compose` and `deploy`.
//
// `compose` resolved the plugin set and wrote nothing; `deploy` required a render
// tree; and the only producer of one was a monorepo script that bypassed the
// resolver. A consumer could install, extend, and resolve — and still obtain no
// artifact. This command materializes the resolved set, so the consumer pipeline
// is finally closed: init → add → project → deploy.

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pc from 'picocolors';
import { adapterByName } from '../../adapters/registry/index.js';
import { loadAgentsConfig } from '../../config/index.js';
import { CONFIG_FILE } from '../../config/scaffold.js';
import {
  type ProjectablePlugin,
  discoverFragments,
  projectPluginSet,
  resolveFragmentBodies,
  writeRenderTree,
} from '../../project/index.js';

export interface ProjectCmdOpts {
  /** Path to `agents.config.ts`; defaults to `<cwd>/agents.config.ts`. */
  config?: string;
  /** Render-tree root; defaults to `<cwd>/.render`. */
  out?: string;
  /** Harness adapter name; defaults to `claude`. */
  harness?: string;
  cwd?: string;
}

export async function runProject(opts: ProjectCmdOpts = {}): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  const configPath = resolve(opts.config ?? join(cwd, CONFIG_FILE));
  if (!existsSync(configPath)) {
    process.stderr.write(
      `${pc.red('✗')} no ${CONFIG_FILE} at ${configPath} — run ${pc.cyan('forge init')} first\n`,
    );
    return 1;
  }

  const config = await loadAgentsConfig(configPath);
  // No cast: `AgentPlugin` now satisfies `ProjectablePlugin` structurally, because
  // projection consumes the `fragments` dir too. The cast this line used to carry
  // was the census's tell — it silently DISCARDED the one field the fold needs.
  const plugins: readonly ProjectablePlugin[] = config.extends;
  if (plugins.length === 0) {
    process.stderr.write(
      `${pc.yellow('!')} ${CONFIG_FILE} extends no plugins — nothing to project\n`,
    );
    return 1;
  }

  const out = resolve(opts.out ?? join(cwd, '.render'));
  const adapter = adapterByName(opts.harness ?? 'claude');

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
  // discovery already minted (identity addressing, NORTH-STAR §3).
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
    log: (line) => process.stdout.write(`${line}\n`),
  });
  writeRenderTree(out, report.files);

  process.stdout.write(
    `\n${pc.green('✓')} projected ${report.agents} agent(s) + ${report.skills} skill(s)` +
      `${report.shims > 0 ? ` + ${report.shims} runtime shim(s)` : ''}` +
      `${report.hooks > 0 ? ` + ${report.hooks} hook(s)` : ''} → ${out}\n` +
      // `--hooks-dir` is NOT optional here and it is the render ROOT, not `<out>/hooks`.
      // `deploy --kind` defaults to `all`, and `all` requires all three dirs or exits 1
      // — so the hint printed without it failed on EVERY run, in the one place the
      // printer knows a consumer is following it. `command-veracity` cannot see this
      // class: its extractor reads `pnpm|npm|yarn` invocations against package.json
      // script keys, and an `forge <verb> <flags>` line never enters that stream.
      `${pc.gray(`ship it with: cratylus deploy --agents-dir ${join(out, 'agents')} --skills-dir ${join(out, 'skills')} --hooks-dir ${out}`)}\n`,
  );
  return 0;
}
