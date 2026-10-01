/**
 * `cratylus optimize <source> --plan <file>` — the exemplify leg of the
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
  type RegisterPolicy,
  optimize,
  readManifest,
} from '../../core/exemplify/index.js';
import { fail, say } from '../style.js';

export interface OptimizeCommandOptions {
  source: string;
  plan?: string;
  out?: string;
  manifest?: string;
  prior?: string;
  /** Also list every file written. */
  verbose?: boolean;
}

/** The plan's serialized register doctrine — patterns as source strings, since
 *  JSON has no regex literal. The CLI compiles; the frame never defaults. */
interface RegisterPolicyFile {
  humanMarkers?: string[];
  markerFlags?: string;
  humanHitFloor?: number;
  humanDensityFloor?: number;
}

interface PlanFile {
  reader?: string;
  register?: RegisterPolicyFile;
  concepts?: ConceptRecord[];
  artifacts?: ArtifactSpec[];
}

/** Compile the plan's register block, or name what is missing. `conform` is
 *  judged against the CORPUS's doctrine; an absent block is refused, never
 *  defaulted — a default here would be the projector deciding what "human"
 *  reads like (`s = ∅ ⇒ ⊥`). */
function compileRegisterPolicy(
  file: RegisterPolicyFile | undefined,
): RegisterPolicy | string {
  if (!file) {
    return (
      '--plan carries no `register` block, and there is no default; `conform` is judged ' +
      "against YOUR corpus's human-register doctrine, so add " +
      '"register": { "humanMarkers": ["\\\\bplease\\\\b", …], "markerFlags": "gi", ' +
      '"humanHitFloor": 3, "humanDensityFloor": 0.02 }'
    );
  }
  const { humanMarkers, humanHitFloor, humanDensityFloor } = file;
  if (!humanMarkers?.length) return 'plan.register.humanMarkers is empty';
  if (typeof humanHitFloor !== 'number')
    return 'plan.register.humanHitFloor is missing';
  if (typeof humanDensityFloor !== 'number')
    return 'plan.register.humanDensityFloor is missing';
  const flags = file.markerFlags ?? 'gi';
  if (!flags.includes('g'))
    return "plan.register.markerFlags must include 'g' (the classifier counts every hit)";
  try {
    return {
      humanMarkers: humanMarkers.map((p) => new RegExp(p, flags)),
      humanHitFloor,
      humanDensityFloor,
    };
  } catch (e) {
    return `plan.register.humanMarkers: ${(e as Error).message}`;
  }
}

export async function runOptimize(
  opts: OptimizeCommandOptions,
): Promise<number> {
  if (!opts.plan) {
    fail(
      'optimize',
      '--plan is required, and there is no default; the semantic stages (conceptualize → signify → materialize) are LLM passes, so author the plan { register, concepts: [{ gloss, anchor, home | delta, factors?, rank? }], artifacts: [{ path, body }] } and pass it with --plan <file>',
    );
    return 1;
  }
  const source = resolve(opts.source);
  if (!existsSync(source)) {
    fail('optimize', `source not found: ${source}; check the <source> path`);
    return 1;
  }
  let plan: PlanFile;
  try {
    plan = JSON.parse(readFileSync(resolve(opts.plan), 'utf8')) as PlanFile;
  } catch (e) {
    fail(
      'optimize',
      `unreadable plan '${opts.plan}': ${(e as Error).message}; check the --plan path and that it is JSON`,
    );
    return 1;
  }
  const register = compileRegisterPolicy(plan.register);
  if (typeof register === 'string') {
    fail('optimize', register);
    return 1;
  }
  const outDir = resolve(opts.out ?? 'optimized');
  try {
    const { manifest, written } = optimize({
      source,
      reader: plan.reader,
      register,
      concepts: plan.concepts ?? [],
      artifacts: plan.artifacts ?? [],
      outDir,
      manifestPath: opts.manifest ? resolve(opts.manifest) : undefined,
      prior: opts.prior ? readManifest(resolve(opts.prior)) : undefined,
    });
    const reused = manifest.routes.filter(
      (r) => r.disposition === 'reuse',
    ).length;
    say(
      `accepted: ${manifest.routes.length} routed (${reused} reuse, ${
        manifest.routes.length - reused
      } mint), ${manifest.delta.length} delta; ${written.length} file(s) written to ${outDir}`,
    );
    if (opts.verbose) for (const w of written) say(w);
    return 0;
  } catch (e) {
    if (e instanceof ExemplifyRefusal) {
      fail(
        'optimize',
        `plan refused: ${e.reasons.join('; ')}; amend the plan and run it again`,
      );
      return 1;
    }
    fail('optimize', (e as Error).message);
    return 1;
  }
}
