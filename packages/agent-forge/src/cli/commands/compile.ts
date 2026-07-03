import pc from 'picocolors';
import { writeClaudePlugin } from '../../adapters/claude/index.js';
import {
  type Adapter,
  type CompileReport,
  type Scope,
  compile,
  defaultIRRoot,
  findAdapter,
  findIRRoot,
  readIR,
} from '../../core/index.js';

export interface CompileOpts {
  clients?: string[];
  scope?: Scope;
  dryRun?: boolean;
  strict?: boolean;
  explain?: boolean;
  cwd?: string;
  /**
   * Bundle the claude target as a distributable plugin (E5.S5) — value is
   * the plugin's `name` — instead of compiling the ordinary per-scope
   * `.claude/` tree. Claude-only: pairing it with any other client is a
   * usage error (a plugin bundle isn't a per-client dialect emission).
   */
  asPlugin?: string;
}

export async function runCompile(
  opts: CompileOpts,
  adapters: Adapter[],
): Promise<number> {
  const scope = opts.scope ?? 'project';
  const cwd = opts.cwd ?? process.cwd();

  let ir: Awaited<ReturnType<typeof readIR>>;
  try {
    ir = await readIR(scope, cwd);
  } catch (e) {
    console.error(pc.red(`agent-forge: ${(e as Error).message}`));
    return 2;
  }

  if (opts.asPlugin) {
    const targets = opts.clients ?? [];
    if (
      targets.length > 1 ||
      (targets.length === 1 && targets[0] !== 'claude')
    ) {
      console.error(
        pc.red(
          'agent-forge: --as-plugin bundles the claude target only — pass no clients, or just "claude"',
        ),
      );
      return 1;
    }
    const report = await writeClaudePlugin(ir, cwd, opts.asPlugin);
    const head =
      report.warnings.length > 0
        ? pc.yellow(`⚠ claude-plugin '${opts.asPlugin}'`)
        : pc.green(`✓ claude-plugin '${opts.asPlugin}'`);
    console.log(
      `${head}  ${formatSummary(report.written.length, report.warnings.length, report.skipped.length)}`,
    );
    for (const w of report.warnings) {
      console.log(`    ${pc.yellow('•')} ${w}`);
    }
    return 0;
  }

  // Name the resolved IR home: from a nested cwd the walk-up result is not
  // self-evident, and a dry-run report must say what it would compile.
  console.log(pc.gray(`IR: ${findIRRoot(scope, cwd)}`));

  const targetIds =
    opts.clients && opts.clients.length > 0
      ? opts.clients
      : ir.manifest.targets;
  if (targetIds.length === 0) {
    console.error(
      pc.yellow(
        'agent-forge: no targets — declare some in manifest.yaml or pass clients on CLI',
      ),
    );
    return 1;
  }
  const targets: Adapter[] = [];
  for (const id of targetIds) {
    const a = findAdapter(adapters, id);
    if (!a) {
      console.error(pc.red(`agent-forge: unknown adapter '${id}'`));
      return 1;
    }
    targets.push(a);
  }

  const stateDir = defaultIRRoot('project', cwd);
  const report = await compile(ir, targets, scope, cwd, {
    dryRun: opts.dryRun,
    strict: opts.strict,
    explain: opts.explain,
    stateDir,
  });

  printReport(report, opts);
  const hasError = report.results.some((r) => r.error);
  return hasError ? (opts.strict ? 4 : 1) : 0;
}

function printReport(report: CompileReport, opts: CompileOpts): void {
  for (const r of report.results) {
    const head = r.error
      ? pc.red(`✗ ${r.adapter}`)
      : r.report && r.report.warnings.length > 0
        ? pc.yellow(`⚠ ${r.adapter}`)
        : pc.green(`✓ ${r.adapter}`);
    const summary = r.report
      ? formatSummary(
          r.report.written.length,
          r.report.warnings.length,
          r.report.skipped.length,
        )
      : (r.error?.message ?? '');
    console.log(`${head}  ${summary}`);

    // Warnings are loss reports — always visible, never gated behind
    // --explain (a loss the user must opt in to see is a silent loss).
    if (r.report && r.report.warnings.length > 0) {
      console.log(`    ${pc.bold(pc.yellow('warnings:'))}`);
      for (const w of r.report.warnings) {
        console.log(`      ${pc.yellow('•')} ${w}`);
      }
    }

    if (opts.explain && r.report) {
      const skipped = r.report.skipped;
      if (skipped.length === 0) continue;

      // Skips grouped by reason
      const byReason = new Map<string, string[]>();
      for (const s of skipped) {
        const list = byReason.get(s.reason) ?? [];
        list.push(s.path);
        byReason.set(s.reason, list);
      }
      if (byReason.size > 0) {
        console.log(`    ${pc.bold(pc.gray('skipped:'))}`);
        for (const [reason, paths] of byReason) {
          console.log(
            `      ${pc.gray('•')} ${pc.gray(reason)} (${paths.length})`,
          );
          for (const p of paths) console.log(`          ${pc.gray(p)}`);
        }
      }
    }
  }

  // Unanswerable placements: surface each elicit question.
  if (report.elicit.length > 0) {
    console.log(`  ${pc.bold(pc.yellow('elicit:'))}`);
    for (const e of report.elicit) {
      console.log(
        `    ${pc.yellow('?')} ${e.target} · ${e.resource} · ${e.question}`,
      );
    }
  }

  // Footer summary across adapters
  const adapters = report.results.length;
  const failed = report.results.filter((r) => r.error).length;
  console.log('');
  const footerSym =
    failed > 0
      ? pc.red('✗')
      : report.totalWarnings > 0
        ? pc.yellow('⚠')
        : pc.green('✓');
  const footerWords = `${adapters} adapter${adapters === 1 ? '' : 's'} · ${report.totalWritten} files written · ${report.totalWarnings} warning${report.totalWarnings === 1 ? '' : 's'} · ${report.totalSkipped} skipped${failed ? ` · ${failed} failed` : ''}`;
  console.log(`${footerSym} ${footerWords}`);
}

function formatSummary(
  written: number,
  warnings: number,
  skipped: number,
): string {
  return `${written} written · ${pc.yellow(`${warnings} warn`)} · ${pc.gray(`${skipped} skip`)}`;
}
