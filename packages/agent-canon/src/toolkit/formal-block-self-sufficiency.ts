// formal-block-self-sufficiency — the SELF-SUFFICIENCY lint over every skill
// `formalBlock`. Companion to the SYMBOLS gate (`test/symbols.test.ts`): SYMBOLS binds
// decodability (every glyph declared); this binds `self-sufficient-formalism`'s prose
// clause — `gloss(B) ≜ prose beyond β ∪ ι ; gloss ≠ ∅ ⇒ ¬complete(B) ⇒ ⊥` (see
// `skills/formalize.ts`). A `--` OR `—` annotation carrying a LAW or a DEFINITION is prose doing
// a signifier's job — the exact degradation `formalize` refuses, one register up. The corpus
// lays notation in two columns as `notation — gloss` (em-dash, U+2014); the gate reads BOTH the
// `--` (ASCII) and the `—` (em-dash) gloss markers, space-delimited.
//
// ADMISSIBLE PROSE (the only forms `self-sufficient-formalism` permits) — a gloss on a
// DECLARATION (the carrier, LEFT of the marker, is not a law):
//   (a) a signature `symbol : type-expr`, or
//   (b) a by-value PRIMITIVE declaration `symbol ≜ <value literal>` — a set `{…}`, tuple `⟨…⟩`,
//       or enumeration whose RHS bears NO law-op / quantifier / function-application, or
//   (c) a bare declared term `symbol — gloss`, or a β ∪ ι CITATION (imported / boundary-bound
//       anchor, invocation-resolved symbol). This is W1's permitted primitive by-value gloss.
//
// VIOLATION: a `--`/`—` annotation whose CARRIER is a LAW or an OPERATIONAL DEFINITION —
//   • a full-line prose statement (empty carrier), or
//   • a LAW: a carrier bearing a law-op / quantifier (`⇒` `=` `∈` `⊆` `⊻` `⊨` `∀` `∃` `⇔`), or
//   • an OPERATIONAL DEFINITION: `symbol ≜ <rhs>` whose RHS bears an operator, a quantifier, or a
//     function-application (`g(x) ∘ h`, `argmin_{…} φ`), or
//   • a `label : <prose-sentence>` named law.
// FUZZY `≜`-RHS (can't cleanly decide value-literal vs operational) ⇒ flag WITH `reviewFork`
// (route to nico); never guess. A `--` inside a CLI flag (`--home`) is not a comment: the marker
// is space-delimited (`(?:^|\s)(--|—)(?=\s|$)`), so `--word` never trips it.
//
// FORK (redundancy-check-FIRST, per the `signify` review's R2 lesson — mis-forking here
// re-commits the `dec`-gloss error). Before calling a violation load-bearing, test whether
// its content is reconstructable from other notation IN THE SAME BLOCK:
//   • redundant  → the carrier already formalizes the concept; the prose restates it → DELETE.
//   • load-bearing → the annotation names a rule / operation with no formal home → FORMALIZE.
// An implication-shaped annotation on an already-formalized carrier is the R2 hazard zone
// (faithful restatement vs. a hidden new law): default `redundant` but set `reviewFork` so a
// human (nico) confirms rather than the lint guessing.

export type Verdict = 'redundant' | 'load-bearing';

export interface Finding {
  /** 1-based line within the `formalBlock`. */
  readonly line: number;
  /** the notation before the `--` (trimmed); empty for a full-line prose comment. */
  readonly carrier: string;
  /** the prose after the `--` (trimmed). */
  readonly annotation: string;
  readonly verdict: Verdict;
  readonly reason: string;
  /** R2 hazard zone: the fork is a genuine naming call — route to nico, do not trust blindly. */
  readonly reviewFork: boolean;
}

export interface BlockScan {
  readonly name: string;
  readonly findings: readonly Finding[];
  /**
   * Count of suspected WHITESPACE-GAP glosses in the block (a wide space-run then lowercase
   * prose on a law/def carrier, NO `--`/`—` marker). Out of scope for flagging this pass —
   * reported as a deferred tally only. Defaults to 0 when unset.
   */
  readonly deferredWhitespaceGap?: number;
}

/** Section-label words a full-line `--` decoration may carry (case-insensitive prefix). */
const SECTION_KEYWORDS = [
  'declarations',
  'laws',
  'entities',
  'operations',
  'derived sets',
  'k members',
];

/**
 * A full-line `--` comment that is structural decoration (a section header / rule line),
 * NOT a prose law. Only an empty carrier can be decoration. Strip non-alphanumeric ends
 * (dashes, box-drawing `─`, `--`), then: empty ⇒ decoration; a section keyword prefix ⇒
 * decoration; a bare label (≤3 words, no sentence punctuation) ⇒ decoration.
 */
export function isDecoration(carrier: string, annotation: string): boolean {
  if (carrier.trim() !== '') {
    return false;
  }
  const resid = annotation
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/[^\p{L}\p{N}]+$/u, '')
    .trim();
  if (resid === '') {
    return true;
  }
  const low = resid.toLowerCase();
  if (SECTION_KEYWORDS.some((kw) => low.startsWith(kw))) {
    return true;
  }
  const words = resid.split(/\s+/);
  if (words.length <= 3 && !/[;:.⇒⇔]|≜/.test(resid)) {
    return true;
  }
  return false;
}

/** The admissibility verdict for a carrier (LEFT of the `--`/`—` marker). */
export type CarrierClass = 'violation' | 'admissible' | 'fuzzy';

/**
 * Operators, quantifiers, and function-application that make an expression OPERATIONAL (rules
 * out a by-value literal). Arrows (`→ ↦ ⇀ ↣`) are deliberately EXCLUDED so a finite-map / type
 * literal inside `{…}`/`⟨…⟩` still reads as by-value. `=` is handled separately (its regex must
 * exclude `≜ ≠ ≤ ≥ ⇔ ⇒ ==`).
 */
function isOperationalExpr(expr: string): boolean {
  if (/[∀∃]/u.test(expr)) {
    return true; // a quantifier
  }
  if (/[A-Za-z_][A-Za-z0-9_'-]*\(/u.test(expr)) {
    return true; // a function-application `name(…)`
  }
  if (/[⇒⇔∈∉⊆⊇⊊⊻⊨∘⊔⊓∪∩∖⊎×⊗∧∨¬⋈∑∏⨆⨅⊕⊖⊙⋆∙⋂⋃≺≻⪯⪰⊳⊲∂∇√∫∐⨂⨁]/u.test(expr)) {
    return true; // an operator / law-op glyph
  }
  if (/(^|[^:=≠≜≤≥<>⇔⇒])=([^=]|$)/u.test(expr)) {
    return true; // an '=' assertion
  }
  return false;
}

/**
 * Classify the RHS of a `symbol ≜ <rhs>` definition. A pure value literal — a set `{…}`, tuple
 * `⟨…⟩`, or bare enumeration with no operational content — is ADMISSIBLE (by-value primitive).
 * Operational content ⇒ VIOLATION. Anything that is neither cleanly value-literal nor cleanly
 * operational (a bare alias, an opaque expression) ⇒ FUZZY, routed to nico rather than guessed.
 */
export function classifyDefRhs(rhs: string): CarrierClass {
  const r = rhs.trim();
  if (r === '') {
    return 'fuzzy'; // nothing to judge
  }
  if (/^`[\s\S]*`$/u.test(r)) {
    return 'admissible'; // a backtick command / code literal — by value, not operational
  }
  const wrapped = /^\{[\s\S]*\}$/u.test(r) || /^⟨[\s\S]*⟩$/u.test(r);
  if (wrapped) {
    const inner = r.slice(1, -1);
    return isOperationalExpr(inner) ? 'violation' : 'admissible';
  }
  if (isOperationalExpr(r)) {
    return 'violation';
  }
  if (/[,|∣·]/u.test(r)) {
    return 'admissible'; // a bare enumeration of atoms — by value
  }
  return 'fuzzy'; // a single symbol / alias / opaque RHS — can't cleanly decide
}

/**
 * Classify a carrier (LEFT of the marker): a LAW or an OPERATIONAL DEFINITION ⇒ `violation`; an
 * admissible DECLARATION (signature `symbol : type-expr`, by-value primitive `symbol ≜ {…}`, or
 * a bare declared term) ⇒ `admissible`; an undecidable `≜`-RHS ⇒ `fuzzy` (route to nico).
 */
export function classifyCarrier(carrier: string): CarrierClass {
  const c = carrier.trim();
  if (c === '') {
    return 'violation'; // full-line prose (decoration already filtered by the caller)
  }
  // A law-op or quantifier ANYWHERE in the carrier ⇒ a law (fires before the ≜-RHS inspection,
  // which is reserved for the residual "clean" `≜` whose logical content is not yet visible).
  if (/[⇒⊻⊨⇔∀∃]/u.test(c)) {
    return 'violation'; // implication / xor / entailment / iff / quantifier
  }
  if (/(^|[^:=≠≜≤≥<>⇔⇒])=([^=]|$)/u.test(c)) {
    return 'violation'; // an '=' assertion (not ≜, ≠, ≤, ≥, ⇔, ⇒, ==)
  }
  if (/[∈∉⊆⊇⊊]/u.test(c)) {
    return 'violation'; // a set-membership / subset assertion
  }
  const di = c.indexOf('≜');
  if (di >= 0) {
    return classifyDefRhs(c.slice(di + 1)); // a definition — decide by its RHS shape
  }
  const ci = c.indexOf(':');
  if (ci >= 0) {
    const rhs = c.slice(ci + 1);
    // a `label : <prose sentence>` named law — ≥3 consecutive lowercase words in the RHS
    if (/(?:\b[a-z]{2,}\b[^\S\n]+){2}\b[a-z]{2,}\b/.test(rhs)) {
      return 'violation';
    }
  }
  return 'admissible'; // a plain declaration signature / bare declared term → admissible
}

/**
 * True when a carrier is a LAW or an OPERATIONAL DEFINITION (a trailing `--`/`—` annotation is a
 * self-sufficiency violation). Back-compat boolean wrapper over `classifyCarrier`; a `fuzzy`
 * carrier is treated as non-admissible (it still yields a finding, with `reviewFork`).
 */
export function carrierIsLawOrDef(carrier: string): boolean {
  return classifyCarrier(carrier) !== 'admissible';
}

/**
 * The symbols the block declares or defines — the LHS token of every notation line. Used by
 * the fork to test whether an annotation references anything with no formal home in-block.
 */
export function blockDefinedSymbols(block: string): Set<string> {
  const set = new Set<string>();
  for (const raw of block.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('--') || line.startsWith('—')) {
      continue;
    }
    if (/^(DECLARATIONS|LAWS)\b/.test(line)) {
      continue;
    }
    const mm = line.match(/^([^\s:≜⇔—=⇒∈(]+)/u);
    if (mm) {
      set.add(mm[1] as string);
    }
  }
  return set;
}

/** Classify a confirmed violation: redundant (delete) vs. load-bearing (formalize). */
export function classify(
  carrier: string,
  annotation: string,
  symbols: Set<string>,
): { verdict: Verdict; reason: string; reviewFork: boolean } {
  // Redundancy-check-FIRST: an operation APPLIED in the annotation (`name(...)`, tight — real
  // notation applies functions without a space, unlike a prose aside `word (parenthetical)`)
  // with no home in the block is content the notation cannot reconstruct ⇒ load-bearing.
  const applied = [...annotation.matchAll(/([A-Za-z_][A-Za-z0-9_'-]*)\(/g)].map(
    (x) => x[1] as string,
  );
  const orphans = applied.filter((s) => !symbols.has(s));
  if (orphans.length > 0) {
    return {
      verdict: 'load-bearing',
      reason: `references un-formalized operation(s) ${orphans.map((o) => `${o}()`).join(', ')} with no home in the block — formalize`,
      reviewFork: false,
    };
  }
  const carrierComplete =
    /[≜⇔=⇒∈⊆]/.test(carrier) && /[≜⇔=⇒∈⊆]\s*\S/.test(carrier);
  const hasImplication = /[⇒⇔]/.test(annotation);
  if (!carrierComplete) {
    return {
      verdict: 'load-bearing',
      reason:
        'carrier has no complete formal counterpart on its line — the annotation is the sole carrier of this content; formalize',
      reviewFork: false,
    };
  }
  if (hasImplication) {
    return {
      verdict: 'redundant',
      reason:
        'carrier already formalizes the concept; the implication-shaped prose restates it (R2 hazard — confirm the fork before deleting)',
      reviewFork: true,
    };
  }
  return {
    verdict: 'redundant',
    reason:
      'carrier already formalizes the concept; the annotation is a prose restatement — delete',
    reviewFork: false,
  };
}

/** The gloss marker: `--` (ASCII) or `—` (em-dash, U+2014), space-delimited on both sides. */
const MARKER_RE = /(?:^|\s)(--|—)(?=\s|$)/u;

/**
 * Scan one `formalBlock`. Returns a Finding per `--`/`—` annotation whose carrier is a law or an
 * operational definition. Admissible declaration/primitive glosses, β ∪ ι citations, and
 * structural decorations produce no finding; a `fuzzy` `≜`-RHS is flagged WITH `reviewFork`.
 */
export function scanFormalBlock(name: string, block: string): Finding[] {
  const lines = block.split('\n');
  const symbols = blockDefinedSymbols(block);
  const findings: Finding[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    const m = line.match(MARKER_RE);
    if (m?.index === undefined) {
      continue;
    }
    const markerLen = (m[1] as string).length; // 2 for `--`, 1 for `—`
    const idx = m.index + m[0].length - markerLen; // start of the marker glyph(s)
    const carrier = line.slice(0, idx).replace(/\s+$/, '');
    const annotation = line.slice(idx + markerLen).trim();
    if (isDecoration(carrier, annotation)) {
      continue;
    }
    const carrierClass = classifyCarrier(carrier);
    if (carrierClass === 'admissible') {
      continue; // admissible declaration / primitive gloss / β ∪ ι citation
    }
    // Redundancy-check-FIRST classify (R2 lesson) decides redundant vs load-bearing; a fuzzy
    // `≜`-RHS is undecidable value-vs-operational, so force the nico fork rather than guess.
    const c = classify(carrier, annotation, symbols);
    const reviewFork = c.reviewFork || carrierClass === 'fuzzy';
    const reason =
      carrierClass === 'fuzzy'
        ? `${c.reason}; ≜-RHS undecidable (value-literal vs operational) — nico decides`
        : c.reason;
    findings.push({
      line: i + 1,
      carrier: carrier.trim(),
      annotation,
      verdict: c.verdict,
      reason,
      reviewFork,
    });
  }
  return findings;
}

/**
 * Count suspected WHITESPACE-GAP glosses: a wide space-run (≥6) mid-line then lowercase prose,
 * on a law/def carrier, with NO `--`/`—` marker (e.g. `reconstruct(B) ⋡ P ⇒ ⊥        repair …`).
 * OUT OF SCOPE for flagging this pass (too ambiguous vs notation) — reported as a deferred tally
 * only, never as a finding, never silently omitted.
 */
export function countWhitespaceGapGlosses(block: string): number {
  let count = 0;
  for (const raw of block.split('\n')) {
    if (MARKER_RE.test(raw)) {
      continue; // an explicit-marker gloss is handled by the scan, not deferred
    }
    const m = raw.match(/^(.*?\S)[^\S\n]{6,}([a-z].*)$/u);
    if (!m) {
      continue;
    }
    if (classifyCarrier(m[1] as string) === 'violation') {
      count++;
    }
  }
  return count;
}

/** A printable per-file worklist: each flagged annotation, its line, and its fork verdict. */
export function formatWorklist(scans: readonly BlockScan[]): string {
  const out: string[] = [];
  out.push('FORMAL-BLOCK SELF-SUFFICIENCY — drain worklist');
  out.push('='.repeat(72));
  let total = 0;
  let redundant = 0;
  let loadBearing = 0;
  let review = 0;
  let deferredGap = 0;
  for (const scan of scans) {
    deferredGap += scan.deferredWhitespaceGap ?? 0;
    if (scan.findings.length === 0) {
      out.push(`\n${scan.name}: ✓ self-sufficient (no law/def annotation)`);
      continue;
    }
    out.push(`\n${scan.name}: ${scan.findings.length} annotation(s) to drain`);
    for (const f of scan.findings) {
      total++;
      if (f.verdict === 'redundant') {
        redundant++;
      } else {
        loadBearing++;
      }
      if (f.reviewFork) {
        review++;
      }
      const tag =
        f.verdict === 'redundant'
          ? 'REDUNDANT→delete'
          : 'LOAD-BEARING→formalize';
      const flag = f.reviewFork ? ' [reviewFork→nico]' : '';
      const carrier = f.carrier === '' ? '(full-line prose)' : f.carrier;
      out.push(`  L${f.line}  ${tag}${flag}`);
      out.push(`        carrier   : ${carrier}`);
      out.push(`        annotation: -- ${f.annotation}`);
      out.push(`        reason    : ${f.reason}`);
    }
  }
  out.push('');
  out.push('-'.repeat(72));
  out.push(
    `TOTAL ${total} flagged — ${redundant} redundant, ${loadBearing} load-bearing, ${review} need a nico fork-call`,
  );
  out.push(
    `deferred: ${deferredGap} suspected whitespace-gap glosses (out of scope this pass — not flagged)`,
  );
  return out.join('\n');
}
