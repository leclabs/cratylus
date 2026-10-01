// `cratylus compose [--config <path>]` — the config-is-code skin of `resolve()`.
// Loads `cratylus.config.ts` (no build step), runs THE LOAD STEP + `resolve()`, and
// prints the RESOLVED SET: one fragment per line, nothing else on stdout. It is a
// read-only inspection (the pre-publish `file:`-link workflow — see what a
// locally-linked plugin contributes before it ships); writing the resolved set into
// a render tree is `project`'s job, not this command's.

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CLI_BIN } from '../../bin-name.js';
import { composeFromFile } from '../../config/index.js';
import { CONFIG_FILE } from '../../config/scaffold.js';
import { fail, say } from '../style.js';

export interface ComposeOpts {
  /** Path to the config; defaults to `<cwd>/cratylus.config.ts`. */
  config?: string;
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

export async function runCompose(opts: ComposeOpts): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  const configPath = opts.config
    ? resolve(opts.config)
    : join(cwd, CONFIG_FILE);
  if (!existsSync(configPath)) {
    fail(
      'compose',
      `no ${CONFIG_FILE} at ${configPath}; run \`${CLI_BIN} init\` first`,
    );
    return 1;
  }

  let composed: Awaited<ReturnType<typeof composeFromFile>>;
  try {
    composed = await composeFromFile(configPath);
  } catch (e) {
    fail('compose', (e as Error).message);
    return 1;
  }

  const rows = [...composed.resolved.fragments.values()]
    .map((r) => ({ id: r.fragment.id, value: r.value }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const r of rows) say(`${r.id}  ${preview(r.value)}`);
  return 0;
}
