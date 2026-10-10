/**
 * Agent elevation — the exemplify+elicit leg: a step-1 agent (raw NL) → a typed
 * dimension vector over the given catalog that REPLACES the free-text source form
 * as the agent's single source of truth.
 *
 * SEMANTIC SEAM: reading evidence out of the description — which dimension a
 * span speaks to, which value it selects, which dimensions are SILENT and what
 * the bisecting elicitation question is (/elicit's information-gain law) —
 * is an LLM pass, authored into the {@link ElevationSpec}. The frame owns the
 * mechanical laws and refuses loudly on each:
 *  - completeness: every dimension that occupies a field, always (an inherited
 *    or silent one renders as the explicitly empty `[]`);
 *  - never-invent: a concrete value MUST carry a provenance trace — a
 *    `quote` that is verbatim-containable in the source, or an explicit
 *    `inference` tag with a note; an untraceable value is an invented value;
 *  - silence ⇒ `ELICIT:` marker (machine-greppable) + a sidecar elicitation
 *    script with ≥ 2 candidates and 1 bisecting question — never an enum;
 *  - arity: a scalar dimension takes exactly one fragment, a `slots` dimension
 *    exactly one per declared slot, and an `attribute` dimension none (it is no
 *    field);
 *  - replacement no-loss (REC ≽): the step-1 source text must be recoverable
 *    from the emitted vector module, else replacement would drop content.
 *
 * Each selected fragment is emitted as an `Entry` at its dimension's default
 * enforcement level.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type DimensionManifest,
  type DimensionMeta,
  kebabToCamel,
} from '@cratylus/schema';
import { canonicalText } from './digest.js';
import { ExemplifyRefusal } from './types.js';

/** The provenance trace a concrete dimension value must carry. */
export interface DimensionEvidence {
  /** `quote`: `note` is a verbatim span of the source (checked). `inference`:
   *  an explicit inference tag; `note` states the inference. */
  type: 'quote' | 'inference';
  note: string;
}

/** A selected fragment (slug + definiens) for one dimension value; `slot` names
 *  the slot it fills when the dimension's arity is `slots`. */
export interface DimensionFragmentSpec {
  slug: string;
  definiens: string;
  slot?: string;
}

/** A concrete, evidence-traced dimension value. */
export interface FragmentPlan {
  kind: 'value';
  /** Exactly one for scalar dimensions, one per slot for `slots` dimensions,
   *  one-or-more for set dimensions. */
  fragments: readonly DimensionFragmentSpec[];
  evidence: DimensionEvidence;
}

/** A silent dimension: no answer is invented — the operator is asked. */
export interface DimensionElicitPlan {
  kind: 'elicit';
  /** ≥ 2 candidate values the bisecting question discriminates between. */
  candidates: readonly string[];
  /** The one maximally-informative yes/no question (/elicit). */
  question: string;
}

/** Deliberate harness-inheritance (`[]` in the vector). */
export interface DimensionInheritPlan {
  kind: 'inherit';
}

export type DimensionPlan =
  | FragmentPlan
  | DimensionElicitPlan
  | DimensionInheritPlan;

export interface ElevationSpec {
  /** The agent name (module + export identity). */
  name: string;
  /** The one-line description the subagent router reads (`Agent.description`). */
  description: string;
  /** TS export identifier; default: the name camel-cased. */
  exportName?: string;
  /** Every field dimension of the catalog — completeness is re-checked at runtime. */
  dimensions: Record<string, DimensionPlan>;
}

export interface RenderedVector {
  /** The TS module source (`export const <name>: Agent = { … }`). */
  module: string;
  /** Sidecar elicitation scripts, one per silent dimension; null when none. */
  elicit: Record<string, { candidates: string[]; question: string }> | null;
  /** Sidecar provenance map, one trace per non-null dimension. */
  provenance: Record<string, DimensionEvidence>;
}

const camel = (s: string): string =>
  s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

function tsString(value: string): string {
  return JSON.stringify(value);
}

function renderEntry(
  f: DimensionFragmentSpec,
  level: string | null,
  slotted: boolean,
): string {
  const slot = slotted ? `, slot: ${tsString(f.slot as string)}` : '';
  return `{ value: ${tsString(`${f.slug} ≜ ${f.definiens}`)}, level: ${level === null ? 'null' : tsString(level)}${slot} }`;
}

/**
 * Render an elevation spec to the vector module + sidecars, enforcing the
 * mechanical laws above. `sourceText`, when given, grounds `quote` evidence:
 * a quote not contained in it (whitespace-normalized) refuses.
 */
export function renderAgentVector(
  spec: ElevationSpec,
  opts: { manifest: DimensionManifest; sourceText?: string },
): RenderedVector {
  // The catalog is what COMPLETENESS is measured against — "all dimensions,
  // always" is a claim about a SPECIFIC catalog, so the caller names it.
  const manifest = opts.manifest;
  // An `attribute` dimension occupies no field: it is neither required of a spec
  // nor admitted by one.
  const dimensionNames = Object.keys(manifest).filter(
    (d) => manifest[d]?.arity !== 'attribute',
  );
  const reasons: string[] = [];
  const dimensionKeys = Object.keys(spec.dimensions);
  for (const dimension of dimensionNames) {
    if (!(dimension in spec.dimensions))
      reasons.push(`missing dimension '${dimension}'`);
  }
  for (const key of dimensionKeys) {
    if (!dimensionNames.includes(key))
      reasons.push(
        key in manifest
          ? `dimension '${key}' is an attribute of other values, not a field`
          : `unknown dimension '${key}'`,
      );
  }
  const source =
    opts.sourceText === undefined ? undefined : canonicalText(opts.sourceText);
  const elicit: Record<string, { candidates: string[]; question: string }> = {};
  const provenance: Record<string, DimensionEvidence> = {};
  const lines: string[] = [
    `  name: ${tsString(spec.name)},`,
    `  description: ${tsString(spec.description)},`,
    '  mark: null,',
    '  key: null,',
  ];

  for (const dimension of dimensionNames) {
    const meta = manifest[dimension] as DimensionMeta;
    const plan = spec.dimensions[dimension];
    // The kebab→camel rule direct, not a lookup: the field a dimension occupies is
    // derivable from its NAME, so a catalog's own keys are all this needs.
    const field = kebabToCamel(dimension);
    if (plan === undefined) continue;
    if (plan.kind === 'inherit') {
      lines.push(`  ${field}: [],`);
      continue;
    }
    if (plan.kind === 'elicit') {
      if (plan.candidates.length < 2) {
        reasons.push(
          `dimension '${dimension}': an elicitation needs ≥ 2 candidates (a bisecting question needs a live split)`,
        );
      }
      if (!plan.question) {
        reasons.push(
          `dimension '${dimension}': elicitation without a question`,
        );
      }
      elicit[dimension] = {
        candidates: [...plan.candidates],
        question: plan.question,
      };
      lines.push(
        `  ${field}: [], // ELICIT: ${spec.name}.elicit.json#${dimension}`,
      );
      continue;
    }
    // kind === 'value' — never-invent: a value with no trace is invented.
    if (!plan.evidence?.note) {
      reasons.push(
        `dimension '${dimension}': concrete value with no provenance trace — an untraced value is an invented value`,
      );
      continue;
    }
    if (
      plan.evidence.type === 'quote' &&
      source !== undefined &&
      !source.includes(canonicalText(plan.evidence.note))
    ) {
      reasons.push(
        `dimension '${dimension}': quote evidence not found in the source — an unfounded quote is an invented value`,
      );
      continue;
    }
    const arity = meta.arity;
    if (arity === 'scalar' && plan.fragments.length !== 1) {
      reasons.push(
        `dimension '${dimension}' is scalar: exactly one fragment (got ${plan.fragments.length})`,
      );
      continue;
    }
    if (arity === 'slots') {
      const declared = (meta.slots ?? []).map((s) => s.name);
      const filled = plan.fragments.map((f) => f.slot);
      if (
        filled.length !== declared.length ||
        declared.some((slot) => !filled.includes(slot))
      ) {
        reasons.push(
          `dimension '${dimension}' has slots: exactly one fragment per slot (${declared.join(', ')}), got ${filled.map((s) => s ?? '(no slot)').join(', ')}`,
        );
        continue;
      }
    }
    if (plan.fragments.length === 0) {
      reasons.push(`dimension '${dimension}': value plan with zero fragments`);
      continue;
    }
    provenance[dimension] = plan.evidence;
    const items = plan.fragments
      .map((f) => `    ${renderEntry(f, meta.level, arity === 'slots')},`)
      .join('\n');
    lines.push(`  ${field}: [\n${items}\n  ],`);
  }
  if (reasons.length > 0) throw new ExemplifyRefusal(reasons);

  const exportName = spec.exportName ?? camel(spec.name);
  const module = [
    `/** ${spec.name} — dimension selection vector, elevated via exemplify+elicit`,
    ` *  (forge optimize). Sidecars: ${spec.name}.provenance.json${
      Object.keys(elicit).length > 0 ? ` · ${spec.name}.elicit.json` : ''
    }. */`,
    `import type { Agent } from '@cratylus/schema';`,
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
  /** The free-text source form; REMOVED on accept (replacement semantics). */
  sourcePath?: string;
  /** Source text override (else read from `sourcePath`). */
  sourceText?: string;
  /** Root the `agents/` dir is created under. */
  outDir: string;
  spec: ElevationSpec;
  /** The catalog the spec is checked against. */
  manifest: DimensionManifest;
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
 * lingering source twin).
 */
export function elevateAgent(opts: ElevateOptions): ElevateResult {
  const sourceText =
    opts.sourceText ??
    (opts.sourcePath !== undefined
      ? readFileSync(opts.sourcePath, 'utf8')
      : undefined);
  const rendered = renderAgentVector(opts.spec, {
    sourceText,
    manifest: opts.manifest,
  });
  // REC ≽ at the data level: the step-1 text must be recoverable from the
  // vector's own fragment definientia (serialization escaping is irrelevant
  // to recoverability — the vector, not the TS file, is the source form).
  const carried = Object.values(opts.spec.dimensions)
    .flatMap((plan) => (plan.kind === 'value' ? [...plan.fragments] : []))
    .map((f) => canonicalText(f.definiens))
    .join('\n');
  if (
    sourceText !== undefined &&
    !carried.includes(canonicalText(sourceText))
  ) {
    throw new ExemplifyRefusal([
      'replacement would lose step-1 content (REC ≽ fails): the source text is not recoverable from the vector — carry it verbatim on an open dimension before replacing',
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
