// `agent-forge project [--out <dir>] [--config <path>] [--harness <name>]` — the
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
  projectPluginSet,
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
      `${pc.red('✗')} no ${CONFIG_FILE} at ${configPath} — run ${pc.cyan('agent-forge init')} first\n`,
    );
    return 1;
  }

  const config = await loadAgentsConfig(configPath);
  const plugins = config.extends as readonly ProjectablePlugin[];
  if (plugins.length === 0) {
    process.stderr.write(
      `${pc.yellow('!')} ${CONFIG_FILE} extends no plugins — nothing to project\n`,
    );
    return 1;
  }

  const out = resolve(opts.out ?? join(cwd, '.render'));
  const adapter = adapterByName(opts.harness ?? 'claude');

  const report = await projectPluginSet({
    plugins,
    out,
    adapter,
    log: (line) => process.stdout.write(`${line}\n`),
  });

  process.stdout.write(
    `\n${pc.green('✓')} projected ${report.agents} agent(s) + ${report.skills} skill(s)` +
      `${report.shims > 0 ? ` + ${report.shims} runtime shim(s)` : ''}` +
      `${report.hooks > 0 ? ` + ${report.hooks} hook(s)` : ''} → ${out}\n` +
      `${pc.gray(`ship it with: agent-forge deploy --agents-dir ${join(out, 'agents')} --skills-dir ${join(out, 'skills')}`)}\n`,
  );
  return 0;
}
