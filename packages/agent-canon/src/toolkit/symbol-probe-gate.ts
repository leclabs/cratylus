// SYMBOL-PROBE gate — the per-symbol `probe` round-trip lifecycle success-gate. Where the
// SYMBOLS gate (`test/symbols.test.ts`) binds DECODABILITY (every fence glyph is a declared
// register member), this gate binds SIGNIFICATION: every symbol a skill's formal block
// DECLARES must round-trip — the concept the reader's priors circumscribe for the symbol
// (`concept_R(w)`, probe.ts) must be the concept the block ASSIGNS it (its σ* target, the
// declaration gloss). A mis-signified symbol — priors circumscribing a DIFFERENT concept
// than assigned — FAILS. Formal blocks thereby become the symbolic-σ* regression suite.
//
// INDEPENDENT-LEG HONESTY (the load-bearing design constraint). The round-trip's semantic
// leg — `concept_R(w) = intended C` at reader=LLM — is an LLM judgment. This module does
// NOT fake a deterministic oracle over that semantic equality. It splits the round-trip:
//
//   • DETERMINISTIC leg (here, mechanized): extract each declaration into a ProbeObligation
//     ⟨cell, symbol, assignedConcept⟩ (the σ*-regression rows), and ROUTE recorded probe
//     readouts to a verdict. Pure, total, tested.
//   • JUDGMENT leg (external, documented): the readout — `probe(w) = ⟨fired_R(w) ·
//     concept_R(w)⟩` plus the match verdict — is produced by an agent probing the symbol
//     at reader=LLM, then RECORDED into the ProbeLedger. The gate never computes it.
//
// The honesty pivot is the third verdict: a symbol with NO recorded readout is `needs-probe`
// — it does NOT pass. An un-probed symbol cannot canonize. That is what keeps the gate from
// vacuously green-lighting the corpus: pending obligations are surfaced as an owed agent
// check, never swallowed into a pass.

import { OPERATORS } from './operator-lexicon.js';

/**
 * A round-trip obligation extracted from one declaration line: the block ASSIGNS
 * `symbol` the concept `assignedConcept` (its gloss / σ* target). The gate's question:
 * does `concept_R(symbol)` at reader=LLM circumscribe exactly `assignedConcept`?
 */
export interface ProbeObligation {
  /** the cell whose formal block declared the symbol (e.g. `probe`, `signify`). */
  readonly cell: string;
  /** the declared signifier under probe (`w` in probe.ts): `σ*`, `circ`, `fired_R`, … */
  readonly symbol: string;
  /** the concept the block assigns the symbol — the gloss, the intended C / σ* target. */
  readonly assignedConcept: string;
}

/**
 * A recorded probe of a symbol at reader=LLM — the JUDGMENT leg's product, authored by an
 * agent, NEVER computed here. `probe(w) = ⟨fired_R(w) · concept_R(w)⟩` plus the round-trip
 * verdict. `matchesAssignment` is the agent's call that `concept_R(symbol)` circumscribes
 * the obligation's `assignedConcept` (precise-circumscription: covers it, reaches nothing
 * beyond). `firedPriors` / `circumscribes` carry the evidence for a human/agent auditor.
 */
export interface ProbeReadout {
  readonly cell: string;
  readonly symbol: string;
  /** `fired_R(symbol)` — the latent priors the token evokes, as an agent reported them. */
  readonly firedPriors: string;
  /** `concept_R(symbol)` — the concept those priors circumscribe. */
  readonly circumscribes: string;
  /** the round-trip verdict: does `circumscribes` = the block's `assignedConcept`? */
  readonly matchesAssignment: boolean;
}

/** Recorded agent probes, keyed `${cell}␟${symbol}`. The judgment leg's ledger. */
export type ProbeLedger = ReadonlyMap<string, ProbeReadout>;

export type RoundTripVerdict = 'pass' | 'fail' | 'needs-probe';

const KEY_SEP = '␟';
export function ledgerKey(cell: string, symbol: string): string {
  return `${cell}${KEY_SEP}${symbol}`;
}

/** Build a ledger from recorded readouts (last write wins on a duplicate key). */
export function ledgerOf(readouts: readonly ProbeReadout[]): ProbeLedger {
  const m = new Map<string, ProbeReadout>();
  for (const r of readouts) {
    m.set(ledgerKey(r.cell, r.symbol), r);
  }
  return m;
}

// ── Declaration extraction — the DETERMINISTIC leg ──────────────────────────────
//
// The drained corpus is HEADERLESS and ZERO-COMMENT: `DECLARATIONS`/`LAWS` markers no longer
// separate declarations from laws, so extraction can no longer key off headers. Instead we
// extract by FORM, scanning the WHOLE block. A line binds a fresh symbol — and thus raises an
// obligation — iff its LHS is a symbol token (identifier, optionally with `(args)` and/or
// subscripts/superscripts: `σ*`, `circ(n,c)`, `fired_R`, `<_lex`, `|n|`) IMMEDIATELY followed
// by a binding operator ` : ` (signature), ` ≜ `, or ` ⇔ `. Law/proposition lines are rejected:
// an LHS bearing a quantifier (`∀`/`∃`) or a relation over existing symbols (`∀ d ∈ D_R : …`,
// `X ⊆ Y ⇒ …`, `a = b`, `dispatch(P) ⇒ …`) is not a fresh binding.

const EM_DASH = '—'; // — gloss separator (fixtures; the live corpus is zero-comment)
const DEFINE = '≜'; // ≜
const IFF = '⇔'; // ⇔

/** The binding operators whose LHS is a freshly-bound symbol (leftmost wins). */
const BIND_OPS = [' : ', ` ${DEFINE} `, ` ${IFF} `];

/**
 * A well-formed fresh-symbol LHS: a single symbol token, no internal whitespace and no law /
 * relation / quantifier glyph. This is what discriminates a DECLARATION (`circ(n,c) ⇔ …`,
 * `σ* : C → Names`) from a LAW that merely contains a binding operator (`∀ c ∈ dom(α) : …`,
 * `cᵢ <_N cⱼ ⇔ …`, `{ n : circ(n,c) } = …`): a law's LHS carries a quantifier, a set-builder,
 * or a relational operator, or splits across whitespace. `<` / `|` / `,` / `_` / `*` / `(` `)`
 * are admitted so `<_lex`, `|n|`, `register(a)`, `circ(n,c)` still read as fresh symbols.
 */
function isFreshSymbolLhs(lhs: string): boolean {
  return lhs !== '' && !/[∀∃∈∉⊆⊇⊊=⇒∧∨⊻⊨\s]/u.test(lhs);
}

/**
 * Split one line into ⟨symbol, assignedConcept⟩, or `null` when it is not a fresh-symbol
 * binding (blank, a law/proposition, a citation with no binding op, a continuation). The RHS
 * is the assigned concept the round-trip must recover. Recognized binding forms:
 *   1. `sym — gloss`  → the em-dash gloss form (fixtures; the drained corpus carries none).
 *   2. `sym : sig` / `sym ≜ def` / `sym ⇔ def` → concept = the RHS definiens (leftmost op).
 * In both cases the LHS must pass `isFreshSymbolLhs`, else the line is a law and yields null.
 */
export function splitDeclaration(
  line: string,
): { symbol: string; assignedConcept: string } | null {
  const raw = line.replace(/\s+/g, ' ').trim();
  if (raw === '') {
    return null;
  }

  // Em-dash gloss form `sym — concept` (kept for fixtures; the live corpus is zero-comment).
  const em = raw.indexOf(EM_DASH);
  if (em !== -1) {
    const symbol = raw.slice(0, em).trim();
    const concept = raw.slice(em + 1).trim();
    return isFreshSymbolLhs(symbol) && concept
      ? { symbol, assignedConcept: concept }
      : null;
  }

  // Locate the leftmost binding operator among ` : `, ` ≜ `, ` ⇔ `.
  let cut = -1;
  for (const op of BIND_OPS) {
    const idx = raw.indexOf(op);
    if (idx !== -1 && (cut === -1 || idx < cut)) {
      cut = idx;
    }
  }
  if (cut === -1) {
    return null; // no binding operator ⇒ not a declaration (a law, a citation, prose)
  }
  const symbol = raw.slice(0, cut).trim();
  const rhs = raw
    .slice(cut)
    .replace(/^\s*[:≜⇔]\s*/u, '')
    .trim();
  return isFreshSymbolLhs(symbol) && rhs
    ? { symbol, assignedConcept: rhs }
    : null;
}

/** The declaration lines of a formal block, inferred by FORM (not by `DECLARATIONS`/`LAWS`
 *  headers, which the drained corpus no longer carries): every line whose LHS binds a fresh
 *  symbol. Retained as the region `obligationsOf` extracts over the whole block. */
export function declarationsRegion(formalBlock: string): string {
  return formalBlock
    .split('\n')
    .filter((line) => splitDeclaration(line) !== null)
    .join('\n');
}

/** Every ProbeObligation a cell's formal block raises (its fresh-symbol bindings, by form). */
export function obligationsOf(
  cell: string,
  formalBlock: string,
): ProbeObligation[] {
  const out: ProbeObligation[] = [];
  const seen = new Set<string>();
  for (const line of declarationsRegion(formalBlock).split('\n')) {
    const d = splitDeclaration(line);
    if (!d) {
      continue;
    }
    if (seen.has(d.symbol)) {
      continue; // one obligation per distinct symbol per cell
    }
    seen.add(d.symbol);
    out.push({ cell, symbol: d.symbol, assignedConcept: d.assignedConcept });
  }
  return out;
}

// ── Round-trip routing — the gate ───────────────────────────────────────────────

/**
 * The round-trip verdict for one obligation against the ledger. NO recorded readout ⇒
 * `needs-probe` (the honesty pivot: an un-probed symbol does NOT pass — canonization is
 * owed an agent probe). A recorded readout routes to `pass` / `fail` by its
 * `matchesAssignment` — the agent's judgment, never recomputed here.
 */
export function roundTrip(
  ob: ProbeObligation,
  ledger: ProbeLedger,
): RoundTripVerdict {
  const r = ledger.get(ledgerKey(ob.cell, ob.symbol));
  if (!r) {
    return 'needs-probe';
  }
  return r.matchesAssignment ? 'pass' : 'fail';
}

export interface GateResult {
  /** obligations whose recorded readout says the symbol is mis-signified. */
  readonly failed: ProbeObligation[];
  /** obligations with no recorded probe — the owed agent judgment (NOT a pass). */
  readonly pending: ProbeObligation[];
  /** obligations with a recorded passing probe. */
  readonly passed: ProbeObligation[];
  /** canonization admissible ⇔ no failures AND no pending probes. */
  readonly ok: boolean;
}

/**
 * Run the gate over a manifest of obligations against a ledger. Canonization is admissible
 * only when EVERY symbol has a recorded PASSING probe: a single `fail` (mis-signified) or a
 * single `needs-probe` (un-probed) withholds the gate. `pending` is surfaced, never a pass.
 */
export function symbolProbeGate(
  manifest: readonly ProbeObligation[],
  ledger: ProbeLedger,
): GateResult {
  const failed: ProbeObligation[] = [];
  const pending: ProbeObligation[] = [];
  const passed: ProbeObligation[] = [];
  for (const ob of manifest) {
    switch (roundTrip(ob, ledger)) {
      case 'fail':
        failed.push(ob);
        break;
      case 'needs-probe':
        pending.push(ob);
        break;
      case 'pass':
        passed.push(ob);
        break;
    }
  }
  return {
    failed,
    pending,
    passed,
    ok: failed.length === 0 && pending.length === 0,
  };
}

/** A one-line manifest row for the owed-probe report (the σ*-regression suite surface). */
export function manifestRow(ob: ProbeObligation, v: RoundTripVerdict): string {
  return `${v.toUpperCase().padEnd(11)} ${ob.cell} :: ${ob.symbol} — assigned: ${ob.assignedConcept}`;
}

/** True when `symbol` is a declared register operator (its concept is the lexicon `sense`,
 *  an independently-authored registry — a cross-check source, not a per-cell gloss). */
export function isLexiconOperator(symbol: string): boolean {
  return Object.hasOwn(OPERATORS, symbol);
}
