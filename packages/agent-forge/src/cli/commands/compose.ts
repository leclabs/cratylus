// `agent-forge compose [--dry-run] [--config <path>]` — the config-is-code skin
// of `resolve()`. Loads `agents.config.ts` (no build step), runs THE LOAD STEP +
// `resolve()`, and prints the RESOLVED SET. `--dry-run` prints and writes nothing
// (the pre-publish `file:`-link workflow — inspect a locally-linked plugin's
// contribution before publishing). Materializing the resolved set into the render
// tree (the compile-unification) is a forward seam; P4 ships the dry inspection.

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pc from 'picocolors';
import { composeFromFile } from '../../config/index.js';
import { CONFIG_FILE } from '../../config/scaffold.js';
import type { ResolvedAgentSet } from '../../resolve/index.js';

export interface ComposeOpts {
  /** Path to the config; defaults to `<cwd>/agents.config.ts`. */
  config?: string;
  /** Print the resolved set and write nothing. */
  dryRun?: boolean;
  cwd?: string;
}

/** One-line preview of a resolved value (arrays/objects summarized, strings clipped). */
function preview(value: unknown): string {
  if (typeof value === 'string') {
    const one = value.replace(/\s+/g, ' ').trim();
    return one.length > 72 ? `${one.slice(0, 71)}…` : one;
  }
  if (Array.isArray(value)) {
    return `[${value.length} item${value.length === 1 ? '' : 's'}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).length} key${Object.keys(value).length === 1 ? '' : 's'}}`;
  }
  return String(value);
}

function printResolved(
  config: { extends: readonly { name: string }[] },
  set: ResolvedAgentSet,
): void {
  const names = config.extends.map((p) => p.name).join(' › ') || '(none)';
  const rows = [...set.fragments.values()]
    .map((r) => ({ id: r.fragment.id, value: r.value }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  console.log(
    pc.bold('agent-forge compose'),
    pc.gray(`(extends: ${names} — ${rows.length} resolved fragments)`),
  );
  console.log('');
  for (const r of rows) {
    console.log(`  ${pc.gray('·')} ${r.id}  ${pc.gray(preview(r.value))}`);
  }
}

export async function runCompose(opts: ComposeOpts): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  const configPath = opts.config
    ? resolve(opts.config)
    : join(cwd, CONFIG_FILE);
  if (!existsSync(configPath)) {
    console.error(
      pc.red(
        `agent-forge compose: no ${CONFIG_FILE} at ${configPath} — run \`agent-forge init\` first`,
      ),
    );
    return 1;
  }

  let composed: Awaited<ReturnType<typeof composeFromFile>>;
  try {
    composed = await composeFromFile(configPath);
  } catch (e) {
    console.error(pc.red(`agent-forge compose: ${(e as Error).message}`));
    return 1;
  }

  printResolved(composed.config, composed.resolved);

  if (!opts.dryRun) {
    // P4 ships the dry inspection only; projecting the resolved set into a render
    // tree is the compile-unification (forward seam). Say so — never write silently.
    console.log('');
    console.log(
      pc.yellow(
        'note: materializing the resolved set (compose → render tree) lands in a later shard; ' +
          'nothing was written. Use --dry-run to make the read-only intent explicit.',
      ),
    );
  }
  return 0;
}
