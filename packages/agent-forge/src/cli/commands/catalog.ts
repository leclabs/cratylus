// `agent-forge catalog [--corpus <dir>] [--json]` — enumerate an organ-value catalog
// so a builder can DISCOVER the live option-space instead of hard-coding it.
//
// agent-forge owns the mechanism (it types the 24 organs via `ANATOMY`); the corpus
// supplies the data (the value modules under `<corpus>/<organ>/*.ts`). Default
// `--corpus` resolves to agent-anatomy's `src/organs` when that sibling exists in this
// monorepo — a convenience default, still overridable for ANY organ-module
// corpus (agent-forge stays doctrine-agnostic; agent-anatomy is just the default data dir).

import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import { type CatalogEntry, enumerateCatalog } from '../../catalog/index.js';

export interface CatalogCmdOpts {
  /** Corpus `organs/` dir; defaults to agent-anatomy's `src/organs` when present. */
  corpus?: string;
  /** Emit the machine contract as JSON instead of the human table. */
  json?: boolean;
}

/**
 * Resolve the default corpus organs dir: agent-anatomy's `src/organs`, located relative
 * to this package (works from both `src/` under tsx and `dist/` at runtime).
 * Returns undefined if no such sibling exists (then `--corpus` is required).
 */
function defaultCorpus(): string | undefined {
  const here = dirname(fileURLToPath(import.meta.url));
  // here = <agent-forge>/dist/cli  or  <agent-forge>/src/cli  →  up to <packages>, into agent-anatomy.
  const candidate = resolve(
    here,
    '..',
    '..',
    '..',
    'agent-anatomy',
    'src',
    'organs',
  );
  return existsSync(candidate) ? candidate : undefined;
}

/** Render the catalog as a human-readable table grouped by organ. */
function renderTable(entries: CatalogEntry[]): string {
  const lines: string[] = [];
  for (const e of entries) {
    const head = `${pc.bold(e.organ)} ${pc.gray(
      `[${e.axis} · ${e.kind} · ${e.arity}]`,
    )} ${pc.gray(`(${e.values.length})`)}`;
    lines.push(head);
    if (e.values.length === 0) {
      lines.push(`  ${pc.gray('(no value modules)')}`);
    }
    for (const v of e.values) {
      const oneLine = v.replace(/\s+/g, ' ').trim();
      const clipped =
        oneLine.length > 80 ? `${oneLine.slice(0, 79)}…` : oneLine;
      lines.push(`  ${pc.gray('·')} ${clipped}`);
    }
    lines.push('');
  }
  return lines.join('\n').replace(/\n+$/, '\n');
}

export async function runCatalog(opts: CatalogCmdOpts): Promise<number> {
  const corpus = opts.corpus ? resolve(opts.corpus) : defaultCorpus();
  if (!corpus) {
    console.error(
      'agent-forge catalog: no --corpus given and no default agent-anatomy/src/organs found',
    );
    return 1;
  }
  if (!existsSync(corpus)) {
    console.error(
      `agent-forge catalog: corpus organs dir not found: ${corpus}`,
    );
    return 1;
  }
  const entries = await enumerateCatalog(corpus);
  if (opts.json) {
    process.stdout.write(`${JSON.stringify(entries, null, 2)}\n`);
  } else {
    const total = entries.reduce((n, e) => n + e.values.length, 0);
    console.log(
      pc.bold('agent-forge catalog'),
      pc.gray(`(${entries.length} organs, ${total} values — ${corpus})`),
    );
    console.log('');
    process.stdout.write(renderTable(entries));
  }
  return 0;
}
