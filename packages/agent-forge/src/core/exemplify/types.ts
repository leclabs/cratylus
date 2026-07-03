/**
 * The exemplify pipeline's mechanical frame — types.
 *
 * SEMANTIC SEAM (the load-bearing boundary of this module): the pipeline's
 * three stages — conceptualize (cut the source at meaning joints, fill
 * `gloss`), signify (assign each concept its canonical anchor σ*_R, fill
 * `anchor`), materialize (realize the artifacts, fill the routed bodies) —
 * are LLM passes. This code NEVER performs them. The operating agent authors
 * their output as an {@link ExemplifyInput} plan (concepts + artifacts); the
 * frame owns everything mechanical downstream: fragment digests, the accept
 * gate (REC-containment · minimal · conform · coverage), the R3 routing
 * manifest, deterministic rendering, idempotence dispositions, and loud
 * refusal. An absent plan is refused, never defaulted (`s = ∅ ⇒ ⊥`).
 *
 * Contract source: `~/.claude/skills/{exemplify,conceptualize,signify,
 * materialize}/SKILL.md`.
 */

/** A concept-contract record ⟨gloss, anchor?, factorization?⟩ plus its R3
 *  routing decision. Stage provenance: `gloss` = conceptualize, `anchor` =
 *  signify, `factors` = materialize (composite ⇒ factor anchors, cite-by-ref;
 *  primitive ⇒ omitted). Routing: `home` = the artifact (path relative to the
 *  out dir) that carries the concept — `routes[]`; `delta: true` = consciously
 *  acknowledged-but-unhomed — `delta[]`. Exactly one of the two; a concept
 *  with neither is the withheld/dropped idea the gate refuses on. */
export interface ConceptRecord {
  /** The meaning by value (densest-faithful-point) — conceptualize's field. */
  gloss: string;
  /** The canonical anchor σ*_R — signify's field. Required when routed. */
  anchor?: string;
  /** Composite factorization as factor ANCHORS (cite-by-ref, never content). */
  factors?: readonly string[];
  /** Routed home: artifact path (relative to `outDir`) carrying the concept. */
  home?: string;
  /** Acknowledged-but-unhomed: lands in the manifest's `delta[]`. */
  delta?: boolean;
  /** Routing rank carried into the manifest entry. */
  rank?: number;
}

/** A realized artifact the plan emits — path relative to `outDir`, body
 *  authored at register = ρ = LLM (the gate enforces `conform`). */
export interface ArtifactSpec {
  path: string;
  body: string;
}

/** One `routes[]` entry of the R3 routing manifest. */
export interface RouteEntry {
  fragment_digest: string;
  idea_gloss: string;
  home_slug: string;
  disposition: 'reuse' | 'mint';
  rank: number;
}

/** One `delta[]` entry of the R3 routing manifest. */
export interface DeltaEntry {
  fragment_digest: string;
  idea_gloss: string;
}

/** The R3 routing manifest — `.manifests/<source>.json`; every concept in
 *  exactly one of `routes[]`/`delta[]` (the coverage equation). */
export interface RoutingManifest {
  source: string;
  exemplified_at: string;
  reader: string;
  routes: RouteEntry[];
  delta: DeltaEntry[];
}

/** The gate's input: the LLM-authored plan over one source. */
export interface ExemplifyInput {
  /** The source label/path recorded in the manifest. */
  source: string;
  /** The reader every register is judged at. Default (and only) `'LLM'`. */
  reader?: string;
  /** The concept lattice C_R with stage fields + routing filled. */
  concepts: readonly ConceptRecord[];
  /** The realized artifact set. */
  artifacts: readonly ArtifactSpec[];
  /** A prior accepted manifest: digests found in it route as `reuse`. */
  prior?: RoutingManifest | null;
}

/** `optimize` = exemplify (the gate) + write artifacts under `outDir` +
 *  write the manifest. */
export interface OptimizeInput extends ExemplifyInput {
  outDir: string;
  /** Default: `<dirname(source)>/.manifests/<basename(source)>.json`. */
  manifestPath?: string;
}

export interface OptimizeResult {
  manifest: RoutingManifest;
  /** Absolute paths written: artifacts then the manifest. */
  written: string[];
}

/** The loud refusal — the gate never drops silently. */
export class ExemplifyRefusal extends Error {
  readonly reasons: readonly string[];

  constructor(reasons: readonly string[]) {
    super(`exemplify: REFUSED —\n  - ${reasons.join('\n  - ')}`);
    this.name = 'ExemplifyRefusal';
    this.reasons = reasons;
  }
}
