// formal-block-self-sufficiency — the SELF-SUFFICIENCY lint over every skill `formalBlock`.
// Companion to the SYMBOLS gate (`test/symbols.test.ts`): SYMBOLS binds decodability (every
// glyph declared); this binds `self-sufficient-formalism`'s prose clause — `gloss(B) ≜ prose
// beyond β ∪ ι ; gloss ≠ ∅ ⇒ ¬complete(B) ⇒ ⊥` (see `skills/formalize.ts`).
//
// THE ABSOLUTE. The corpus is now ZERO-COMMENT corpus-wide: no formalBlock carries ANY comment
// marker. So the gate no longer classifies carriers (law vs declaration, redundant vs
// load-bearing) — a comment is simply a finding. `scanFormalBlock` flags EVERY `--` (ASCII) or
// `—` (em-dash, U+2014) marker, space-delimited on both sides (`(?:^|\s)(--|—)(?=\s|$)`), so a
// `--word` CLI flag never trips it. Any finding is a self-sufficiency violation to drain.

export interface Finding {
  /** 1-based line within the `formalBlock`. */
  readonly line: number;
  /** the marker glyph found: `--` (ASCII) or `—` (em-dash, U+2014). */
  readonly marker: string;
  /** the notation before the marker (trimmed); empty for a full-line prose comment. */
  readonly carrier: string;
  /** the prose after the marker (trimmed). */
  readonly annotation: string;
}

export interface BlockScan {
  readonly name: string;
  readonly findings: readonly Finding[];
  /**
   * Count of suspected WHITESPACE-GAP glosses in the block (a wide space-run then lowercase
   * prose, NO `--`/`—` marker). Out of scope for flagging this pass — reported as a deferred
   * tally only (currently 0 corpus-wide). Defaults to 0 when unset.
   */
  readonly deferredWhitespaceGap?: number;
}

/** The comment marker: `--` (ASCII) or `—` (em-dash, U+2014), space-delimited on both sides. */
const MARKER_RE = /(?:^|\s)(--|—)(?=\s|$)/u;

/**
 * Scan one `formalBlock`. Returns a Finding per `--`/`—` comment marker — the ABSOLUTE gate:
 * a zero-comment block yields no findings; any marker is a finding, regardless of what its
 * carrier is. `carrier` / `annotation` are reported for the drain worklist, not for a verdict.
 */
export function scanFormalBlock(_name: string, block: string): Finding[] {
  const lines = block.split('\n');
  const findings: Finding[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    const m = line.match(MARKER_RE);
    if (m?.index === undefined) {
      continue;
    }
    const marker = m[1] as string;
    const markerLen = marker.length; // 2 for `--`, 1 for `—`
    const idx = m.index + m[0].length - markerLen; // start of the marker glyph(s)
    const carrier = line.slice(0, idx).trim();
    const annotation = line.slice(idx + markerLen).trim();
    findings.push({ line: i + 1, marker, carrier, annotation });
  }
  return findings;
}

/**
 * Count suspected WHITESPACE-GAP glosses: a wide space-run (≥6) mid-line then lowercase prose,
 * with NO `--`/`—` marker (e.g. `reconstruct(B) ⋡ P ⇒ ⊥        repair …`). OUT OF SCOPE for
 * flagging this pass (too ambiguous vs. aligned notation) — reported as a deferred tally only,
 * never as a finding, never silently omitted. Currently 0 corpus-wide.
 */
export function countWhitespaceGapGlosses(block: string): number {
  let count = 0;
  for (const raw of block.split('\n')) {
    if (MARKER_RE.test(raw)) {
      continue; // an explicit-marker gloss is handled by the scan, not deferred
    }
    if (/^.*?\S[^\S\n]{6,}[a-z].*$/u.test(raw)) {
      count++;
    }
  }
  return count;
}

/** A printable per-file worklist: each flagged marker, its line, carrier, and annotation. */
export function formatWorklist(scans: readonly BlockScan[]): string {
  const out: string[] = [];
  out.push(
    'FORMAL-BLOCK SELF-SUFFICIENCY — drain worklist (zero-comment absolute)',
  );
  out.push('='.repeat(72));
  let total = 0;
  let deferredGap = 0;
  for (const scan of scans) {
    deferredGap += scan.deferredWhitespaceGap ?? 0;
    if (scan.findings.length === 0) {
      out.push(`\n${scan.name}: ✓ zero-comment (self-sufficient)`);
      continue;
    }
    out.push(
      `\n${scan.name}: ${scan.findings.length} comment marker(s) to drain`,
    );
    for (const f of scan.findings) {
      total++;
      const carrier = f.carrier === '' ? '(full-line prose)' : f.carrier;
      out.push(`  L${f.line}  marker '${f.marker}'`);
      out.push(`        carrier   : ${carrier}`);
      out.push(`        annotation: ${f.marker} ${f.annotation}`);
    }
  }
  out.push('');
  out.push('-'.repeat(72));
  out.push(`TOTAL ${total} comment marker(s) flagged`);
  out.push(
    `deferred: ${deferredGap} suspected whitespace-gap glosses (out of scope this pass — not flagged)`,
  );
  return out.join('\n');
}
