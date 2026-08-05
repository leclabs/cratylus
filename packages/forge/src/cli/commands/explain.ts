// `cratylus explain [agent] [--config <path>] [--json]` — the PROVENANCE skin
// of `resolve()` (precedent: `eslint --print-config`, `terraform plan`). For each
// resolved fragment it reports, IN FOLD ORDER, which plugin/patch each contribution
// came from, whether that contribution set the base (`replace`) or accumulated onto
// it (`append`/`merge`), and the final resolved value — so a first-timer decodes
// "why this fragment won its value" with zero source-archaeology (NORTH-STAR §5).
//
// Provenance is read STRAIGHT off `resolve()`'s output: P2's `ResolvedFragment`
// carries `provenance` (the source-attributed fold), so this command only RENDERS
// it — no re-derivation, no second resolve pass.
//
// The `[agent]` positional is an optional FILTER over the resolved fragment ids
// (substring, case-insensitive) — a discovery convenience. Resolving a preset
// (agent) to the SUBSET of fragments it draws from is a forward seam (presets join
// the resolved set in a later shard); until then `explain` reports the whole
// resolved fragment graph, optionally narrowed by the filter. Said in the output,
// never silently.

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pc from 'picocolors';
import { FORGE_BIN } from '../../bin-name.js';
import { composeFromFile } from '../../config/index.js';
import { CONFIG_FILE } from '../../config/scaffold.js';
import type {
  ContributionSource,
  FragmentContribution,
  ResolvedFragment,
} from '../../resolve/index.js';

export interface ExplainOpts {
  /** Optional filter: keep only fragments whose id contains this token (ci). */
  agent?: string;
  /** Path to the config; defaults to `<cwd>/agents.config.ts`. */
  config?: string;
  /** Emit the machine contract as JSON instead of the human report. */
  json?: boolean;
  cwd?: string;
}

/** One-line preview of a value (arrays/objects summarized, strings clipped). */
function preview(value: unknown): string {
  if (typeof value === 'string') {
    const one = value.replace(/\s+/g, ' ').trim();
    return JSON.stringify(one.length > 60 ? `${one.slice(0, 59)}…` : one);
  }
  if (Array.isArray(value)) {
    return `[${value.length} item${value.length === 1 ? '' : 's'}]`;
  }
  if (value && typeof value === 'object') {
    const n = Object.keys(value).length;
    return `{${n} key${n === 1 ? '' : 's'}}`;
  }
  return String(value);
}

/** Render a contribution's source cell: `plugin <name>` or `patch #<index>`. */
function sourceCell(source: ContributionSource): string {
  return source.kind === 'plugin'
    ? `plugin ${source.name}`
    : `patch #${source.index}`;
}

/**
 * The ROLE of each contribution in the fold, so a cold read decodes why the value
 * won: the LAST `reset` (a `replace`) is the effective `[base]`; every contribution
 * before it was discarded by that reset (`[shadowed]`); every one after accumulates
 * (`[+append]` / `[+merge]`). With no reset at all, the fold accumulates from empty
 * (every entry `[+op]`).
 */
function roles(provenance: readonly FragmentContribution[]): string[] {
  let lastReset = -1;
  provenance.forEach((c, i) => {
    if (c.reset) lastReset = i;
  });
  return provenance.map((c, i) => {
    if (i === lastReset) return '[base]';
    if (i < lastReset) return '[shadowed]';
    return `[+${c.op}]`;
  });
}

/** Render the full human report for the (already-filtered, sorted) fragments. */
function renderReport(rows: readonly ResolvedFragment[]): string {
  const lines: string[] = [];
  for (const r of rows) {
    lines.push(
      `${pc.bold(r.fragment.id)} ${pc.gray(`[${r.fragment.valueShape}]`)}`,
    );
    lines.push(`  ${pc.green('=')} ${preview(r.value)}`);
    const role = roles(r.provenance);
    r.provenance.forEach((c, i) => {
      const force =
        c.force !== undefined ? pc.magenta(` force:${c.force}`) : '';
      lines.push(
        `    ${pc.gray('←')} ${sourceCell(c.source).padEnd(16)} ` +
          `${c.op.padEnd(7)} ${preview(c.value)}${force}  ${pc.gray(role[i] ?? '')}`,
      );
    });
    lines.push('');
  }
  return lines.join('\n').replace(/\n+$/, '\n');
}

/** The machine contract for `--json`: one record per fragment, provenance verbatim. */
function toJson(rows: readonly ResolvedFragment[]): unknown {
  return rows.map((r) => ({
    id: r.fragment.id,
    valueShape: r.fragment.valueShape,
    value: r.value,
    provenance: r.provenance.map((c) => ({
      source: c.source,
      op: c.op,
      value: c.value,
      ...(c.force !== undefined ? { force: c.force } : {}),
      reset: c.reset,
    })),
  }));
}

export async function runExplain(opts: ExplainOpts): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  const configPath = opts.config
    ? resolve(opts.config)
    : join(cwd, CONFIG_FILE);
  if (!existsSync(configPath)) {
    console.error(
      pc.red(
        `${FORGE_BIN} explain: no ${CONFIG_FILE} at ${configPath} — run \`${FORGE_BIN} init\` first`,
      ),
    );
    return 1;
  }

  let composed: Awaited<ReturnType<typeof composeFromFile>>;
  try {
    composed = await composeFromFile(configPath);
  } catch (e) {
    console.error(pc.red(`${FORGE_BIN} explain: ${(e as Error).message}`));
    return 1;
  }

  const filter = opts.agent?.toLowerCase();
  const rows = [...composed.resolved.fragments.values()]
    .filter((r) => !filter || r.fragment.id.toLowerCase().includes(filter))
    .sort((a, b) =>
      a.fragment.id < b.fragment.id
        ? -1
        : a.fragment.id > b.fragment.id
          ? 1
          : 0,
    );

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(toJson(rows), null, 2)}\n`);
    return 0;
  }

  const names =
    composed.config.extends.map((p) => p.name).join(' › ') || '(none)';
  console.log(
    pc.bold(`${FORGE_BIN} explain`),
    pc.gray(
      `(extends: ${names} — ${rows.length} fragment${rows.length === 1 ? '' : 's'}` +
        `${filter ? ` matching '${opts.agent}'` : ''})`,
    ),
  );
  if (filter && rows.length === 0) {
    console.log('');
    console.log(
      pc.yellow(`  no resolved fragment id contains '${opts.agent}'`),
    );
    return 0;
  }
  console.log('');
  process.stdout.write(renderReport(rows));
  if (opts.agent) {
    console.log('');
    console.log(
      pc.gray(
        'note: [agent] filters resolved fragment ids; scoping to the exact fragment ' +
          'set a preset draws from lands when presets join the resolved set (forward seam).',
      ),
    );
  }
  return 0;
}
