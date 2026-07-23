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
// A skill formalBlock is `DECLARATIONS … LAWS …`. Only the DECLARATIONS region binds a
// fresh symbol to a gloss (the σ* target); LAWS wield already-declared symbols + register
// operators. We extract obligations from DECLARATIONS only.

/** The DECLARATIONS region of a formal block (between the `DECLARATIONS` header and the
 *  `LAWS` header, or block end). Header-line match is whitespace-tolerant + case-exact. */
export function declarationsRegion(formalBlock: string): string {
  const lines = formalBlock.split('\n');
  let start = -1;
  let end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const t = (lines[i] as string).trim();
    if (start === -1) {
      if (t === 'DECLARATIONS') {
        start = i + 1;
      }
    } else if (t === 'LAWS') {
      end = i;
      break;
    }
  }
  if (start === -1) {
    return '';
  }
  return lines.slice(start, end).join('\n');
}

const EM_DASH = '—'; // — gloss separator
const DEFINE = '≜'; // ≜
const IFF = '⇔'; // ⇔

/**
 * Split one declaration line into ⟨symbol, assignedConcept⟩, or `null` when the line is not
 * a symbol-assigning declaration (blank, a sub-comment, a continuation). The gloss is the
 * assigned concept the round-trip must recover. Precedence:
 *   1. ` — gloss`      → symbol = LHS, concept = the em-dash gloss (the canonical form).
 *   2. `… -- gloss`    → concept = the trailing comment; symbol = LHS up to `:`/`≜`/`⇔`.
 *   3. `sym : sig` / `sym ≜ def` / `sym ⇔ def` → symbol = LHS, concept = the RHS definiens.
 */
export function splitDeclaration(
  line: string,
): { symbol: string; assignedConcept: string } | null {
  const raw = line.replace(/\s+/g, ' ').trim();
  if (raw === '') {
    return null;
  }
  // A pure comment line (`-- …`) declares nothing.
  if (raw.startsWith('--')) {
    return null;
  }

  const em = raw.indexOf(EM_DASH);
  if (em !== -1) {
    const symbol = raw.slice(0, em).trim();
    const concept = raw.slice(em + 1).trim();
    return symbol && concept ? { symbol, assignedConcept: concept } : null;
  }

  // Locate the leftmost binding operator among ` : `, ` ≜ `, ` ⇔ `.
  const ops = [' : ', ` ${DEFINE} `, ` ${IFF} `];
  let cut = -1;
  for (const op of ops) {
    const idx = raw.indexOf(op);
    if (idx !== -1 && (cut === -1 || idx < cut)) {
      cut = idx;
    }
  }
  if (cut === -1) {
    return null;
  }
  const symbol = raw.slice(0, cut).trim();
  let rhs = raw
    .slice(cut)
    .replace(/^\s*[:≜⇔]\s*/u, '')
    .trim();
  // Prefer a trailing `-- gloss` as the assigned concept when present.
  const comment = rhs.indexOf('--');
  if (comment !== -1) {
    const gloss = rhs.slice(comment + 2).trim();
    if (gloss) {
      rhs = gloss;
    } else {
      rhs = rhs.slice(0, comment).trim();
    }
  }
  return symbol && rhs ? { symbol, assignedConcept: rhs } : null;
}

/** Every ProbeObligation a cell's formal block raises (its DECLARATIONS, extracted). */
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
