// `project-targets` — regenerate the committed DEPLOY TARGETS of the `hook` source
// cells (`src/hooks/*.ts`) from the cells themselves: the cell owns the bytes — as a
// TEMPLATE the projector resolves — and the committed target is a deploy-owned
// projection of the RESOLVED bytes, byte-locked by `test/hook-rule-boundary.test.ts`.
//
//   hook worker → its `worker.targetPath` (a `.sh`/`.md` the harness or `.husky/*`
//                 dispatcher runs; executable bit set per the cell)
//
// `rule` is a live KIND (MODEL's 5 Kinds). Retiring the `AGENTS.md@node` dream
// memory-sink route freed the repo-root `AGENTS.md` to become a byte-locked rule
// TARGET (it is no longer SelfAuthored memory): `src/rules/*.ts` cells project their
// `body` to `targetPath` here alongside the hook workers.
//
//   rule cell → its `targetPath` (a committed instruction file, e.g. `/AGENTS.md`)
//
// `regenerateTargets({ check:true })` DIFFS instead of writing (the `--check` mode):
// a drift between a committed target and its cell's bytes is reported, never
// silently fixed. This is `deploy` for these locked artifacts (`inject(content(c),
// realize(activation(class c), adapter))`) materialized into the source tree.

import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { projectionFacts } from '@cratylus/forge/project';
import { type HookCell, type RuleCell, resolveWorker } from '@cratylus/schema';

const here = dirname(fileURLToPath(import.meta.url));
const canonRoot = join(here, '..', '..');
/** Repo root — hook targets are repo-relative (`.husky/*` sits above the pkg). */
const repoRoot = join(canonRoot, '..', '..');
const srcRoot = join(canonRoot, 'src');

async function firstExport<T>(modPath: string): Promise<T> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  return mod[key as string] as T;
}

async function collect(pattern: string): Promise<string[]> {
  const out: string[] = [];
  for await (const p of glob(pattern, { cwd: srcRoot })) {
    out.push(p);
  }
  return out.sort();
}

/** Every `hook` source cell (`src/hooks/*.ts`), slug-sorted. */
export async function allHookCells(): Promise<HookCell[]> {
  const cells: HookCell[] = [];
  for (const rel of await collect('hooks/*.ts')) {
    cells.push(await firstExport<HookCell>(join(srcRoot, rel)));
  }
  return cells;
}

/** Every `rule` source cell (`src/rules/*.ts`), slug-sorted. */
export async function allRuleCells(): Promise<RuleCell[]> {
  const cells: RuleCell[] = [];
  for (const rel of await collect('rules/*.ts')) {
    cells.push(await firstExport<RuleCell>(join(srcRoot, rel)));
  }
  return cells;
}

/** One regenerable target: its repo-relative path + the cell bytes that own it. */
export interface CellTarget {
  readonly path: string;
  readonly content: string;
  readonly executable: boolean;
  readonly kind: 'hook' | 'rule';
  readonly source: string;
}

/**
 * Flatten every hook worker + rule body into its committed target.
 *
 * WORKERS ARE RESOLVED HERE, not carried raw. `workers[].content` is a template
 * (`{{fact:…}}` / `{{speech:…}}`) and the committed `.sh` is the RESOLVED bytes — the
 * same bytes `projectPluginSet` emits, from the same `resolveWorker` over the same
 * `projectionFacts()`. Regenerating from the raw template would commit a literal
 * `{{fact:runtime-bin}}` and the byte-lock would then hold the WRONG subject fixed.
 *
 * Reaching `@cratylus/forge` from here is the LICENSED edge: this is one of canon's
 * build scripts driving the projector as a tool (`ARCHITECTURE.md` — "the divergence
 * is a CELL importing it"). The cell that used to import the value now names it.
 */
export async function cellTargets(): Promise<CellTarget[]> {
  const targets: CellTarget[] = [];
  const facts = projectionFacts();
  for (const cell of await allHookCells()) {
    for (const w of cell.workers) {
      const resolved = resolveWorker(w, facts, cell.speech);
      targets.push({
        path: resolved.targetPath,
        content: resolved.content,
        executable: resolved.executable,
        kind: 'hook',
        source: `${cell.id}/${resolved.filename}`,
      });
    }
  }
  for (const cell of await allRuleCells()) {
    targets.push({
      path: cell.targetPath,
      content: cell.body,
      executable: false,
      kind: 'rule',
      source: cell.id,
    });
  }
  return targets;
}

export interface RegenReport {
  /** Targets whose committed bytes DIFFER from the cell (drift). */
  readonly drift: readonly string[];
  /** Targets written (empty in `check` mode). */
  readonly written: readonly string[];
}

/**
 * Regenerate (or, in `check` mode, diff) every hook/rule committed target from its
 * source cell. Deterministic: pure function of the cells (no clock/host).
 */
export async function regenerateTargets(
  opts: { check?: boolean } = {},
): Promise<RegenReport> {
  const drift: string[] = [];
  const written: string[] = [];
  for (const t of await cellTargets()) {
    const abs = join(repoRoot, t.path);
    let committed: string | undefined;
    try {
      committed = readFileSync(abs, 'utf8');
    } catch {
      committed = undefined;
    }
    if (committed !== t.content) {
      drift.push(t.path);
    }
    if (!opts.check) {
      writeFileSync(abs, t.content);
      if (t.executable) {
        chmodSync(abs, 0o755);
      }
      written.push(t.path);
    }
  }
  return { drift, written };
}
