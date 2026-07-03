/**
 * `agent-forge optimize <source> --plan <file>` — the exemplify leg of the
 * documented import → optimize → compile flow.
 *
 * The plan file carries the LLM passes' output (conceptualize → signify →
 * materialize): the concept lattice with glosses, anchors, and routing, plus
 * the realized R=LLM artifact bodies. This command is the mechanical frame
 * only — it gates the plan (REC ≽ · minimal · conform · coverage), writes the
 * accepted artifacts, and emits the R3 routing manifest. Optimization is
 * OPT-IN: `compile` never runs this pass implicitly, and an absent plan is a
 * loud refusal, never a permissive default (`s = ∅ ⇒ ⊥`).
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  type ArtifactSpec,
  type ConceptRecord,
  ExemplifyRefusal,
  optimize,
  readManifest,
} from '../../core/exemplify/index.js';

export interface OptimizeCommandOptions {
  source: string;
  plan?: string;
  out?: string;
  manifest?: string;
  prior?: string;
}

interface PlanFile {
  reader?: string;
  concepts?: ConceptRecord[];
  artifacts?: ArtifactSpec[];
}

export async function runOptimize(
  opts: OptimizeCommandOptions,
): Promise<number> {
  if (!opts.plan) {
    console.error(
      [
        'agent-forge optimize: --plan is required.',
        'The semantic stages (conceptualize → signify → materialize) are LLM',
        'passes: author the plan — { concepts: [{ gloss, anchor, home | delta,',
        'factors?, rank? }], artifacts: [{ path, body }] } — and pass it here.',
        'No permissive default (s = ∅ ⇒ ⊥).',
      ].join('\n'),
    );
    return 1;
  }
  const source = resolve(opts.source);
  if (!existsSync(source)) {
    console.error(`agent-forge optimize: source not found: ${source}`);
    return 1;
  }
  let plan: PlanFile;
  try {
    plan = JSON.parse(readFileSync(resolve(opts.plan), 'utf8')) as PlanFile;
  } catch (e) {
    console.error(
      `agent-forge optimize: unreadable plan '${opts.plan}': ${(e as Error).message}`,
    );
    return 1;
  }
  try {
    const { manifest, written } = optimize({
      source,
      reader: plan.reader,
      concepts: plan.concepts ?? [],
      artifacts: plan.artifacts ?? [],
      outDir: resolve(opts.out ?? 'optimized'),
      manifestPath: opts.manifest ? resolve(opts.manifest) : undefined,
      prior: opts.prior ? readManifest(resolve(opts.prior)) : undefined,
    });
    const reused = manifest.routes.filter(
      (r) => r.disposition === 'reuse',
    ).length;
    console.log(
      `optimize: ACCEPTED — ${manifest.routes.length} routed (${reused} reuse, ${
        manifest.routes.length - reused
      } mint), ${manifest.delta.length} delta; ${written.length} file(s) written`,
    );
    for (const w of written) console.log(`  ${w}`);
    return 0;
  } catch (e) {
    if (e instanceof ExemplifyRefusal) {
      console.error('optimize: REFUSED —');
      for (const r of e.reasons) console.error(`  - ${r}`);
      return 1;
    }
    throw e;
  }
}
