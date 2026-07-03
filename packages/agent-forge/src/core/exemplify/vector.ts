/**
 * Agent elevation — the exemplify+elicit leg: a step-1 agent (raw NL held
 * verbatim on the `persona` organ) → a typed 24-organ selection vector that
 * REPLACES the config-IR form as the agent's single source of truth.
 *
 * SEMANTIC SEAM: reading evidence out of the description — which organ a
 * span speaks to, which value it selects, which organs are SILENT and what
 * the bisecting elicitation question is (/elicit's information-gain law) —
 * is an LLM pass, authored into the {@link ElevationSpec}. The frame owns the
 * mechanical laws and refuses loudly on each:
 *  - completeness: all 24 organ keys, always (inherit renders as `null`);
 *  - never-invent: a concrete value MUST carry a provenance trace — a
 *    `quote` that is verbatim-containable in the source, or an explicit
 *    `inference` tag with a note; an untraceable value is an invented value;
 *  - silence ⇒ `ELICIT:` marker (machine-greppable) + a sidecar elicitation
 *    script with ≥ 2 candidates and 1 bisecting question — never an enum;
 *  - arity: a scalar organ takes exactly one fragment;
 *  - replacement no-loss (REC ≽): the step-1 source text must be recoverable
 *    from the emitted vector module, else replacement would drop content.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ANATOMY, ORGAN_NAMES, type Organ } from '../../anatomy/index.js';
import { canonicalText } from './digest.js';
import { ORGAN_FIELD } from './organ-fields.js';
import { ExemplifyRefusal } from './types.js';

/** The provenance trace a concrete organ value must carry. */
export interface OrganEvidence {
  /** `quote`: `note` is a verbatim span of the source (checked). `inference`:
   *  an explicit inference tag; `note` states the inference. */
  type: 'quote' | 'inference';
  note: string;
}

/** A selected fragment (slug + definiens) for one organ value. */
export interface OrganFragmentSpec {
  slug: string;
  definiens: string;
}

/** A concrete, evidence-traced organ value. */
export interface OrganValuePlan {
  kind: 'value';
  /** Exactly one for scalar organs; one-or-more for the five set organs. */
  fragments: readonly OrganFragmentSpec[];
  evidence: OrganEvidence;
}

/** A silent organ: no answer is invented — the operator is asked. */
export interface OrganElicitPlan {
  kind: 'elicit';
  /** ≥ 2 candidate values the bisecting question discriminates between. */
  candidates: readonly string[];
  /** The one maximally-informative yes/no question (/elicit). */
  question: string;
}

/** Deliberate harness-inheritance (`null` in the vector). */
export interface OrganInheritPlan {
  kind: 'inherit';
}

export type OrganPlan = OrganValuePlan | OrganElicitPlan | OrganInheritPlan;

export interface ElevationSpec {
  /** The agent name (module + export identity). */
  name: string;
  /** TS export identifier; default: the name camel-cased. */
  exportName?: string;
  /** All 24 organs — completeness is the type; runtime re-checked. */
  organs: Record<Organ, OrganPlan>;
}

export interface RenderedVector {
  /** The TS module source (`export const <name>: Agent = { … }`). */
  module: string;
  /** Sidecar elicitation scripts, one per silent organ; null when none. */
  elicit: Record<string, { candidates: string[]; question: string }> | null;
  /** Sidecar provenance map, one trace per non-null organ. */
  provenance: Record<string, OrganEvidence>;
}

const camel = (s: string): string =>
  s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

function tsString(value: string): string {
  return JSON.stringify(value);
}

function renderFragment(organ: Organ, f: OrganFragmentSpec): string {
  return `{ organ: '${organ}', slug: '${f.slug}', definiens: ${tsString(f.definiens)} }`;
}

/**
 * Render an elevation spec to the vector module + sidecars, enforcing the
 * mechanical laws above. `sourceText`, when given, grounds `quote` evidence:
 * a quote not contained in it (whitespace-normalized) refuses.
 */
export function renderAgentVector(
  spec: ElevationSpec,
  opts: { sourceText?: string } = {},
): RenderedVector {
  const reasons: string[] = [];
  const organKeys = Object.keys(spec.organs) as Organ[];
  for (const organ of ORGAN_NAMES) {
    if (!(organ in spec.organs)) reasons.push(`missing organ '${organ}'`);
  }
  for (const key of organKeys) {
    if (!ORGAN_NAMES.includes(key)) reasons.push(`unknown organ '${key}'`);
  }
  const source =
    opts.sourceText === undefined ? undefined : canonicalText(opts.sourceText);
  const elicit: Record<string, { candidates: string[]; question: string }> = {};
  const provenance: Record<string, OrganEvidence> = {};
  const lines: string[] = [`  name: '${spec.name}',`];

  for (const organ of ORGAN_NAMES) {
    const plan = spec.organs[organ];
    const field = ORGAN_FIELD[organ];
    if (plan === undefined) continue;
    if (plan.kind === 'inherit') {
      lines.push(`  ${field}: null,`);
      continue;
    }
    if (plan.kind === 'elicit') {
      if (plan.candidates.length < 2) {
        reasons.push(
          `organ '${organ}': an elicitation needs ≥ 2 candidates (a bisecting question needs a live split)`,
        );
      }
      if (!plan.question) {
        reasons.push(`organ '${organ}': elicitation without a question`);
      }
      elicit[organ] = {
        candidates: [...plan.candidates],
        question: plan.question,
      };
      lines.push(
        `  ${field}: null, // ELICIT: ${spec.name}.elicit.json#${organ}`,
      );
      continue;
    }
    // kind === 'value' — never-invent: a value with no trace is invented.
    if (!plan.evidence?.note) {
      reasons.push(
        `organ '${organ}': concrete value with no provenance trace — an untraced value is an invented value`,
      );
      continue;
    }
    if (
      plan.evidence.type === 'quote' &&
      source !== undefined &&
      !source.includes(canonicalText(plan.evidence.note))
    ) {
      reasons.push(
        `organ '${organ}': quote evidence not found in the source — an unfounded quote is an invented value`,
      );
      continue;
    }
    const arity = ANATOMY[organ].arity;
    if (arity === 'scalar' && plan.fragments.length !== 1) {
      reasons.push(
        `organ '${organ}' is scalar: exactly one fragment (got ${plan.fragments.length})`,
      );
      continue;
    }
    if (plan.fragments.length === 0) {
      reasons.push(`organ '${organ}': value plan with zero fragments`);
      continue;
    }
    provenance[organ] = plan.evidence;
    if (arity === 'set') {
      const items = plan.fragments
        .map((f) => `    ${renderFragment(organ, f)},`)
        .join('\n');
      lines.push(`  ${field}: [\n${items}\n  ],`);
    } else {
      const f = plan.fragments[0] as OrganFragmentSpec;
      lines.push(`  ${field}: ${renderFragment(organ, f)},`);
    }
  }
  if (reasons.length > 0) throw new ExemplifyRefusal(reasons);

  const exportName = spec.exportName ?? camel(spec.name);
  const module = [
    `/** ${spec.name} — 24-organ selection vector, elevated via exemplify+elicit`,
    ` *  (agent-forge optimize). Sidecars: ${spec.name}.provenance.json${
      Object.keys(elicit).length > 0 ? ` · ${spec.name}.elicit.json` : ''
    }. */`,
    `import type { Agent } from '@leclabs/agent-forge/anatomy';`,
    '',
    `export const ${exportName}: Agent = {`,
    ...lines,
    '};',
    '',
  ].join('\n');
  return {
    module,
    elicit: Object.keys(elicit).length > 0 ? elicit : null,
    provenance,
  };
}

export interface ElevateOptions {
  /** The step-1 config-IR form; REMOVED on accept (replacement semantics). */
  sourcePath?: string;
  /** Source text override (else read from `sourcePath`). */
  sourceText?: string;
  /** Root the `agents/` dir is created under. */
  outDir: string;
  spec: ElevationSpec;
}

export interface ElevateResult {
  modulePath: string;
  provenancePath: string;
  elicitPath: string | null;
}

/**
 * Elevate: render the vector, enforce replacement no-loss (REC ≽ — the
 * step-1 text must be recoverable from the module), write
 * `agents/<name>.ts` + sidecars, then REPLACE the step-1 source (no
 * lingering config-IR twin).
 */
export function elevateAgent(opts: ElevateOptions): ElevateResult {
  const sourceText =
    opts.sourceText ??
    (opts.sourcePath !== undefined
      ? readFileSync(opts.sourcePath, 'utf8')
      : undefined);
  const rendered = renderAgentVector(opts.spec, { sourceText });
  // REC ≽ at the data level: the step-1 text must be recoverable from the
  // vector's own fragment definientia (serialization escaping is irrelevant
  // to recoverability — the vector, not the TS file, is the source form).
  const carried = Object.values(opts.spec.organs)
    .flatMap((plan) => (plan.kind === 'value' ? [...plan.fragments] : []))
    .map((f) => canonicalText(f.definiens))
    .join('\n');
  if (
    sourceText !== undefined &&
    !carried.includes(canonicalText(sourceText))
  ) {
    throw new ExemplifyRefusal([
      'replacement would lose step-1 content (REC ≽ fails): the source text is not recoverable from the vector — carry it verbatim (persona organ) before replacing',
    ]);
  }
  const agentsDir = join(opts.outDir, 'agents');
  mkdirSync(agentsDir, { recursive: true });
  const modulePath = join(agentsDir, `${opts.spec.name}.ts`);
  writeFileSync(modulePath, rendered.module, 'utf8');
  const provenancePath = join(agentsDir, `${opts.spec.name}.provenance.json`);
  writeFileSync(
    provenancePath,
    `${JSON.stringify(rendered.provenance, null, 2)}\n`,
    'utf8',
  );
  let elicitPath: string | null = null;
  if (rendered.elicit) {
    elicitPath = join(agentsDir, `${opts.spec.name}.elicit.json`);
    writeFileSync(
      elicitPath,
      `${JSON.stringify(rendered.elicit, null, 2)}\n`,
      'utf8',
    );
  }
  // Replacement: exactly one source form per agent survives.
  if (opts.sourcePath !== undefined) {
    rmSync(opts.sourcePath, { force: true });
  }
  return { modulePath, provenancePath, elicitPath };
}
