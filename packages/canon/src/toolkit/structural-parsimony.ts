// structural-parsimony.ts — the STRUCTURAL leg of PARSIMONIOUS the per-cell
// lexical witness (`@cratylus/forge/validate` `accept.ts` `parsimonious`) cannot
// see. `accept.ts` reads ONE cell's body against ONE anchor (residue ⊉ fired(α));
// the accretion this gate pays down lives ABOVE the cell — in the import-graph +
// the module set:
//
//   parsimonious-over-structure(corpus) ⇔
//     ¬∃ file/type/field existing SOLELY to restate what an archetype holds.
//
// A disposition with no `accept()` leg binds attention, not the corpus — so the
// class re-accretes. This module adds the missing machine-checked leg as three
// DECIDABLE structural predicates (import-graph · export-AST · cross-agent
// reference-count — never a prose lint), one per standing counter-example class:
//
//   GENUS-FLOOR       (a) — the `base.ts` class. A module M ∈ agents/ imported by
//                           a SIBLING agent module yet selecting ZERO dimensions:
//                           a shared floor spread (`...base`) into every agent,
//                           carrying no dimension-selection of its own.
//                           ⇔ M.dimensionImports = ∅ ∧ ∃s∈agents: M.name ∈ s.siblingImports
//   RESOLVED-DUP      (b) — the `ResolvedAgent` class. An export in agents/ whose
//                           id matches /Resolved$/ or is typed `ResolvedAgent`:
//                           a PARALLEL representation duplicating the `Agent`
//                           vector already declared in the same module.
//   ABSORBED-IDENTITY (c) — the provenance-mega-fragment class. A dimension
//                           value-cell carrying an inlinable IDENTITY token (a
//                           `mark:{emoji,hue}`) AND referenced by ≤1 agent:
//                           content wholly absorbed into ONE agent's identity,
//                           not a reusable dimension value. The AND is load-bearing —
//                           refCount≥2 is a genuine SHARED value (reusable, green),
//                           a mark-less single-ref cell is a legit open-dimension
//                           value (role/build, curate — green). Only mark ∧
//                           refCount≤1 is "identity, not dimension value".
//
// GOVERNING INVARIANT (project's whole point): every deployed artifact the model
// reads is formal σ* under ρ, never human prose — held here structurally: the
// gate refuses re-accretion of files/types/fields that restate an archetype, the
// structural face of the same parsimony `accept.ts` enforces per-cell.
//
// CANON'S, NOT THE PROJECTOR'S. This is a gate over THIS corpus's own tree, and the
// coupling is in the WITNESSES, not in extractable constants: `genusFloor` quantifies
// over `agents/`, `resolvedDup` names `ResolvedAgent`, `absorbedIdentity` reads canon's
// `mark:{emoji,hue}` identity token. Injecting those through the engine's `Policy` seam
// would relocate three regexes and leave three functions whose LOGIC still encodes
// canon's tree — a seam that looks satisfied while the fusion hides behind it. So the
// module lives with the corpus it quantifies over (ARCHITECTURE property 2: nothing —
// least of all a gate over canon's own corpus — depends on the projector). Its siblings
// are the other pure canon-corpus gates flat under `toolkit/` (`symbol-probe-gate.ts`,
// `formal-block-self-sufficiency.ts`), NOT `toolkit/cold-oracle/`, which is the live
// LLM-isolation concern and its injected policy DATA.
//
// PURE — witnesses over a supplied structural model, zero IO. Corpus loading (read
// src/ · parse) lives in the caller (`test/structural-parsimony.test.ts`), which
// drives BOTH the live tree (must be GREEN — E1 already deleted the motivating
// cruft, so this is a REGRESSION-PREVENTION leg) and held-out synthetic fixtures
// carrying the verbatim deleted cruft (must RED — proof the gate bites).

/** The three standing counter-example classes (the accretion this leg refuses). */
export type StructuralClass =
  | 'GENUS-FLOOR'
  | 'RESOLVED-DUP'
  | 'ABSORBED-IDENTITY';

export const STRUCTURAL_CLASSES: readonly StructuralClass[] = [
  'GENUS-FLOOR',
  'RESOLVED-DUP',
  'ABSORBED-IDENTITY',
] as const;

/** An `agents/<name>.ts` module reduced to what the structural witnesses read. */
export interface AgentModule {
  /** basename sans `.ts` — the module's identity in the intra-agents graph. */
  readonly name: string;
  /** `'<dimension>/<slug>'` for each `../dimensions/<dimension>/<slug>` import (the SELECTION). */
  readonly dimensionImports: readonly string[];
  /** basename of each sibling `./<name>` import (an intra-agents graph edge). */
  readonly siblingImports: readonly string[];
  /** ids of exports matching /Resolved$/ or typed `ResolvedAgent` (parallel reps). */
  readonly resolvedExports: readonly string[];
}

/** An `dimensions/<dimension>/<slug>.ts` value-cell reduced to the reference-count grain. */
export interface FragmentModule {
  readonly dimension: string;
  readonly slug: string;
  /** exports an inlinable identity token (`mark:{emoji,hue}`) — the (c) signature. */
  readonly carriesMark: boolean;
}

/** The parsed structural model the witnesses quantify over. */
export interface StructuralCorpus {
  readonly agents: readonly AgentModule[];
  readonly fragments: readonly FragmentModule[];
}

export interface StructuralVerdict {
  readonly cls: StructuralClass;
  readonly pass: boolean;
  /** the convicted ids ([] ⇔ pass) — named so a reader can decide membership. */
  readonly convicted: readonly string[];
}

// ── parsers (source-text → structural model; the caller supplies the text) ──────

const DIMENSION_IMPORT =
  /from\s+'\.\.\/dimensions\/([a-z0-9-]+)\/([a-z0-9-]+)(?:\.js)?'/g;
const SIBLING_IMPORT = /from\s+'\.\/([a-z0-9-]+)(?:\.js)?'/g;
const CONST_EXPORT = /export\s+const\s+(\w+)\s*(?::\s*(\w+))?/g;
/** an identity token — `mark:` at a word boundary (not `benchmark:`). */
const MARK_FIELD = /\bmark\s*:/;

export function parseAgentModule(name: string, src: string): AgentModule {
  const dimensionImports: string[] = [];
  for (const m of src.matchAll(DIMENSION_IMPORT)) {
    if (m[1] && m[2]) {
      dimensionImports.push(`${m[1]}/${m[2]}`);
    }
  }
  const siblingImports: string[] = [];
  for (const m of src.matchAll(SIBLING_IMPORT)) {
    if (m[1]) {
      siblingImports.push(m[1]);
    }
  }
  const resolvedExports: string[] = [];
  for (const m of src.matchAll(CONST_EXPORT)) {
    const id = m[1];
    const typ = m[2];
    if (id && (/Resolved$/.test(id) || typ === 'ResolvedAgent')) {
      resolvedExports.push(id);
    }
  }
  return { name, dimensionImports, siblingImports, resolvedExports };
}

export function parseFragment(
  dimension: string,
  slug: string,
  src: string,
): FragmentModule {
  return { dimension, slug, carriesMark: MARK_FIELD.test(src) };
}

// ── the three witnesses ─────────────────────────────────────────────────────────

/**
 * GENUS-FLOOR — an agents/ module imported by a sibling agent yet selecting no
 * dimension (the `base.ts` class: a shared floor spread into every agent, ¬dimension). A
 * legit agent vector imports MANY dimensions and no sibling; the clean tree has zero
 * intra-agents edges, so `convicted = ∅`.
 */
export function genusFloor(corpus: StructuralCorpus): StructuralVerdict {
  const importedBySibling = new Set(
    corpus.agents.flatMap((a) => a.siblingImports),
  );
  const convicted = corpus.agents
    .filter(
      (a) => a.dimensionImports.length === 0 && importedBySibling.has(a.name),
    )
    .map((a) => a.name);
  return { cls: 'GENUS-FLOOR', pass: convicted.length === 0, convicted };
}

/**
 * RESOLVED-DUP — any `*Resolved` / `: ResolvedAgent` export (the `ResolvedAgent`
 * class: a parallel representation duplicating the `Agent` vector). The clean tree
 * exports only `<name>: Agent`.
 */
export function resolvedDup(corpus: StructuralCorpus): StructuralVerdict {
  const convicted = corpus.agents.flatMap((a) =>
    a.resolvedExports.map((e) => `${a.name}:${e}`),
  );
  return { cls: 'RESOLVED-DUP', pass: convicted.length === 0, convicted };
}

/**
 * ABSORBED-IDENTITY — a dimension value-cell carrying an identity token (`mark`) AND
 * referenced by ≤1 agent (the provenance-mega-fragment class: identity wholly
 * absorbed into one agent, not a reusable dimension value). The AND is the guard
 * against false positives — refCount≥2 ⇒ genuine shared value; ¬mark ⇒ legit
 * open-dimension value even at refCount=1. The clean tree carries no marked value-cell
 * (provenance collapsed to inline `provenance:{mark}` on each agent).
 */
export function absorbedIdentity(corpus: StructuralCorpus): StructuralVerdict {
  const refCount = new Map<string, number>();
  for (const a of corpus.agents) {
    for (const ref of a.dimensionImports) {
      refCount.set(ref, (refCount.get(ref) ?? 0) + 1);
    }
  }
  const convicted = corpus.fragments
    .filter(
      (v) =>
        v.carriesMark && (refCount.get(`${v.dimension}/${v.slug}`) ?? 0) <= 1,
    )
    .map((v) => `${v.dimension}/${v.slug}`);
  return { cls: 'ABSORBED-IDENTITY', pass: convicted.length === 0, convicted };
}

/** The three structural verdicts (∀pass ⇔ parsimonious-over-structure holds). */
export function structuralParsimony(
  corpus: StructuralCorpus,
): StructuralVerdict[] {
  return [genusFloor(corpus), resolvedDup(corpus), absorbedIdentity(corpus)];
}

/** The classes a verdict list convicts (∅ ⇔ every structural leg passes). */
export function failingClasses(
  verdicts: readonly StructuralVerdict[],
): StructuralClass[] {
  return verdicts.filter((v) => !v.pass).map((v) => v.cls);
}
