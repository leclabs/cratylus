import type { Adapter, WriteOpts, WriteReport } from '../adapter/types.js';
import type { IR, Rule, Scope } from '../ir/types.js';
import { detectDrift, recordCompileState } from './drift.js';
import { splitScopedRules, writeNestedRuleFiles } from './nested-rules.js';
import { RESOURCE_IR_KEY, emitPluginResources } from './plugin.js';

export interface CompileOpts {
  /** Skip writing to disk; collect what would be written and return it. */
  dryRun?: boolean;
  /** Abort the compile if any adapter reports warnings or skipped resources. */
  strict?: boolean;
  /** Include verbose substitution explanations in the report. */
  explain?: boolean;
  /**
   * Directory to record `.compile-state.json` into for drift tracking.
   * Typically the project's `.agent-forge/` root. If undefined, drift state is not
   * recorded for this compile.
   */
  stateDir?: string;
}

export interface AdapterCompileResult {
  adapter: string;
  detected: boolean;
  report?: WriteReport;
  error?: Error;
}

/**
 * A resolution question the compile could not answer itself: the target has
 * no documented surface for the resource at this scope, so the loss is
 * surfaced as a question instead of a silent (or fabricated) file.
 */
export interface ElicitEntry {
  target: string;
  resource: string;
  question: string;
}

export interface CompileReport {
  scope: Scope;
  results: AdapterCompileResult[];
  elicit: ElicitEntry[];
  totalWritten: number;
  totalSkipped: number;
  totalWarnings: number;
}

/**
 * Compile an IR to one or more adapters at the given scope.
 *
 * Per adapter: detect → drift check → plugin route → write → record drift
 * state. Aggregates per-adapter `WriteReport`s into a single `CompileReport`.
 *
 * - Rules are sorted by their `order` field (stable; unordered rules keep
 *   array position after ordered ones) before any adapter sees them.
 * - `local` scope compiles only to adapters that declare a documented local
 *   tier (`capabilities.scopes` includes `'local'`); every other target gets
 *   per-resource `no-local-tier` skips plus paired `elicit` entries — never a
 *   fabricated file.
 * - Resources declared `plugin` are routed to the adapter's plugin emitter;
 *   `write` receives the IR with those resources stripped.
 * - A `dir`-scoped rule (E7.S2) never reaches an adapter's own rules writer:
 *   the engine writes it straight to `<cwd>/<dir>/AGENTS.md` — one
 *   self-sufficient neutral file per subtree, adapter-agnostic and written
 *   once per compile — before any adapter runs; adapters see only the
 *   root-scope rules.
 * - `manifest.options.drift_check` governs recompiling over drifted emitted
 *   files: `error` refuses (naming the drifted files), `warn` (the default)
 *   proceeds with a drift warning, `ignore` disables the check.
 * - `strict` mode aborts the entire compile on the first adapter that reports
 *   any warning or skipped resource.
 * - `dryRun` skips writes (adapters are still called and may simulate); drift
 *   state is neither checked nor recorded.
 */
export async function compile(
  ir: IR,
  adapters: Adapter[],
  scope: Scope,
  cwd: string,
  opts: CompileOpts = {},
): Promise<CompileReport> {
  const results: AdapterCompileResult[] = [];
  const elicit: ElicitEntry[] = [];
  const sortedIR = withSortedRules(ir);
  const driftMode = ir.manifest.options?.drift_check ?? 'warn';

  // dir-scoped rules (E7.S2) are the shared neutral standards surface, not
  // any one adapter's dialect: split them out and write their nested
  // AGENTS.md files once, up front — adapters below see root-scope rules
  // only. Dir-scoping a project-tree concept: skip at 'user' scope.
  const { root: rootRules, scoped: scopedRules } = splitScopedRules(
    sortedIR.rules,
  );
  const engineIR: IR =
    scopedRules.size > 0 ? { ...sortedIR, rules: rootRules } : sortedIR;
  if (scopedRules.size > 0 && scope !== 'user') {
    await writeNestedRuleFiles(scopedRules, cwd, opts.dryRun);
  }
  const resourceOf = resourceAttributor(engineIR);

  for (const adapter of adapters) {
    const result: AdapterCompileResult = {
      adapter: adapter.id,
      detected: false,
    };
    try {
      result.detected = await adapter.detect(scope, cwd);

      // Local tier: no documented local surface ⇒ loud skip + elicit, no file.
      if (scope === 'local' && !adapter.capabilities.scopes.includes('local')) {
        result.report = noLocalTierReport(engineIR, adapter.id, elicit);
        results.push(result);
        continue;
      }

      const writeOpts: WriteOpts = {
        dryRun: opts.dryRun,
        strict: opts.strict,
        explain: opts.explain,
      };

      // Drift enforcement: recompiling over hand-edited emitted files is a
      // reported conflict, never a silent reclaim.
      const driftWarnings: string[] = [];
      if (!opts.dryRun && opts.stateDir && driftMode !== 'ignore') {
        const drift = await detectDrift(opts.stateDir, adapter.id, cwd);
        if (drift.drifted.length > 0) {
          const named = drift.drifted
            .map(
              (d) =>
                `${d.path}${d.resource ? ` (resource: ${d.resource})` : ''}`,
            )
            .join(', ');
          if (driftMode === 'error') {
            result.error = new Error(
              `[${adapter.id}] drift_check: refusing to compile — ${drift.drifted.length} emitted file(s) drifted since last compile: ${named}`,
            );
            results.push(result);
            if (opts.strict) return finalize(results, scope, elicit);
            continue;
          }
          for (const d of drift.drifted) {
            driftWarnings.push(
              `drift: ${d.path} ${d.status} since last compile${d.resource ? ` (resource: ${d.resource})` : ''} — overwriting (drift_check: warn)`,
            );
          }
        }
      }

      // Plugin-declared resources go to the adapter's plugin emitters; the
      // adapter's write sees the IR without them.
      const { rest, reports: pluginReports } = await emitPluginResources(
        adapter,
        engineIR,
        scope,
        cwd,
        writeOpts,
      );

      const report = mergeReports([
        await adapter.write(rest, scope, cwd, writeOpts),
        ...pluginReports,
      ]);
      report.warnings.push(...driftWarnings);
      result.report = report;

      if (
        opts.strict &&
        (report.warnings.length > 0 || report.skipped.length > 0)
      ) {
        result.error = new Error(
          `[${adapter.id}] strict: ${report.warnings.length} warning(s), ${report.skipped.length} skipped`,
        );
        results.push(result);
        return finalize(results, scope, elicit);
      }

      if (!opts.dryRun && opts.stateDir && report.written.length > 0) {
        await recordCompileState(
          opts.stateDir,
          adapter.id,
          cwd,
          report.written,
          resourceOf,
        );
      }
    } catch (err) {
      result.error = err as Error;
      if (opts.strict) {
        results.push(result);
        return finalize(results, scope, elicit);
      }
    }
    results.push(result);
  }

  return finalize(results, scope, elicit);
}

/** Rules sorted by `order` (stable; unordered rules after ordered ones). */
function withSortedRules(ir: IR): IR {
  if (!ir.rules || ir.rules.length < 2) return ir;
  const rules = [...ir.rules].sort(
    (a: Rule, b: Rule) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) -
      (b.order ?? Number.MAX_SAFE_INTEGER),
  );
  return { ...ir, rules };
}

function mergeReports(reports: WriteReport[]): WriteReport {
  return {
    written: reports.flatMap((r) => r.written),
    skipped: reports.flatMap((r) => r.skipped),
    warnings: reports.flatMap((r) => r.warnings),
  };
}

/** Per-resource `no-local-tier` skips + paired elicit entries for a target
 *  that documents no local tier; nothing is written. */
function noLocalTierReport(
  ir: IR,
  target: string,
  elicit: ElicitEntry[],
): WriteReport {
  const skipped: { path: string; reason: string }[] = [];
  for (const resource of presentResources(ir)) {
    skipped.push({ path: resource, reason: 'no-local-tier' });
    elicit.push({
      target,
      resource,
      question: `Where should '${resource}' land for '${target}' at local scope? ${target} documents no local tier — name a native local surface, or move the resource to project scope.`,
    });
  }
  return {
    written: [],
    skipped,
    warnings: [
      `${target}: no documented local tier — ${skipped.length} resource(s) skipped (no-local-tier), nothing fabricated`,
    ],
  };
}

/** Every resource present in the IR as `<collection>/<id>` (or the bare
 *  collection key for the singleton permissions/env resources). */
function presentResources(ir: IR): string[] {
  const out: string[] = [];
  for (const key of Object.values(RESOURCE_IR_KEY)) {
    const value = ir[key];
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        const id =
          (item as { id?: string; name?: string }).id ??
          (item as { id?: string; name?: string }).name;
        out.push(id ? `${key}/${id}` : key);
      }
    } else {
      out.push(key);
    }
  }
  return out;
}

/** Emitted-path → `<collection>/<id>` attribution by basename match against
 *  the IR's resource ids/names (best-effort; undefined when ambiguous). */
function resourceAttributor(ir: IR): (path: string) => string | undefined {
  const byBasename = new Map<string, string | null>(); // null = ambiguous
  for (const key of Object.values(RESOURCE_IR_KEY)) {
    const value = ir[key];
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      const id =
        (item as { id?: string; name?: string }).id ??
        (item as { id?: string; name?: string }).name;
      if (!id) continue;
      byBasename.set(
        id,
        byBasename.has(id) && byBasename.get(id) !== `${key}/${id}`
          ? null
          : `${key}/${id}`,
      );
    }
  }
  return (path: string) => {
    const base = path.split(/[/\\]/).pop() ?? path;
    const stem = base.replace(/\.[^.]+$/, '');
    return byBasename.get(stem) ?? undefined;
  };
}

function finalize(
  results: AdapterCompileResult[],
  scope: Scope,
  elicit: ElicitEntry[],
): CompileReport {
  let totalWritten = 0;
  let totalSkipped = 0;
  let totalWarnings = 0;
  for (const r of results) {
    if (!r.report) continue;
    totalWritten += r.report.written.length;
    totalSkipped += r.report.skipped.length;
    totalWarnings += r.report.warnings.length;
  }
  return { scope, results, elicit, totalWritten, totalSkipped, totalWarnings };
}
