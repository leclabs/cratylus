// SYMBOLS gate — the TS port of `toolkit/verify.py` `gate_symbols`. The register
// rule (declared table = `src/toolkit/operator-lexicon.ts`): a fenced FORMAL
// block carries ONLY declared symbols plus the cell's own definienda. This gate is the
// positive form — every fence-interior glyph in each fragment / skill `.ts` definiens
// must be in (the declared table col-1 ∪ the calibrated exemption classes); an
// undeclared glyph FAILS, named cell + glyph + codepoint.
//
// SOURCE-GRAIN, not markdown: the TS modules are the source now (the `.md` is a
// projection). The "fence interior" of a skill is its `body`'s fenced block(s) (which is
// exactly the pre-extracted `body`); of a fragment it is any fenced block in its
// `definiens` (the current corpus has none — provenance `glyph·color` marks live in
// PROSE, never a fence, so they are out of register-scope, exactly as the Python gate
// only ever scanned fence interiors). The declared table IS the `operator-lexicon` source
// module (the single home; DRY) — read directly, never a markdown projection.
//
// CONTRACT (llm-native): this gate is a decodability REGISTRY, not an expression cap.
// When it rejects the FITTEST sign for a concept, the remedy is to DECLARE that sign
// (add it to `operator-lexicon`, cold-verify its decode) — NEVER to degrade the sign to
// a weaker already-declared one (a substitute is no longer the σ* the authoring seam owes;
// see `formalize`). The gate binds decodability; it does not cap the fittest sign.
//
// NON-VACUOUS: an injected undeclared glyph inside a fence is caught; the live corpus
// passes. Both halves are asserted below.

import { glob } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Skill } from '@leclabs/agent-forge/anatomy';
import { describe, expect, it } from 'vitest';
import { declaredGlyphs } from '../src/toolkit/operator-lexicon.js';

const anatomyRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(anatomyRoot, 'src');

/**
 * Every non-ASCII declared glyph — read from the `operator-lexicon` SOURCE MODULE (the
 * single home; DRY), NOT a markdown projection. The gate now tracks the truth source
 * directly. (Formerly parsed col-1 of `references/formal-symbolic-notation.md`, deleted.)
 */
const declaredSymbols = declaredGlyphs;

/**
 * The definienda-class + register-neutral exemptions (mirrors verify.py
 * `_symbol_exempt`). True for a glyph the register rule does not constrain:
 *   - ASCII (≤ U+007F) — never a declared formal symbol's concern.
 *   - Greek block (U+0391–03C9) — definienda-class variables (η σ Φ Δ ρ λ μ …).
 *   - Subscript alphanumerics (U+2080–2089 digits, U+2090–209C letters, U+1D62–1D6A, U+2C7C) —
 *     name-material (C₀ cᵢ waveₙ-as-name). Subscript OPERATORS (U+208A–208E ₊ ₋ ₌ ₍ ₎) stay
 *     excluded: an index that computes is application form — wave(n+1), never ₙ₊₁ chains.
 *   - Box-drawing (U+2500–257F) — diagram art (trees, pipeline rules); no logic.
 *   - Em dash (U+2014) — prose-in-fence punctuation.
 * (Ellipsis `…` U+2026 is DECLARED in the table, not exempted here.)
 */
function symbolExempt(ch: string): boolean {
  const o = ch.codePointAt(0) ?? 0;
  if (o <= 0x7f) {
    return true;
  }
  if (o >= 0x0391 && o <= 0x03c9) {
    return true;
  }
  if (
    (o >= 0x2080 && o <= 0x2089) ||
    (o >= 0x2090 && o <= 0x209c) ||
    (o >= 0x1d62 && o <= 0x1d6a) ||
    o === 0x2c7c
  ) {
    return true;
  }
  if (o >= 0x2500 && o <= 0x257f) {
    return true;
  }
  if (o === 0x2014) {
    return true;
  }
  // ⊕ (U+2295) — the model's canonical organ-vector builder (`vector(A) ≜
  // ⊕{ o ↦ value(o) }`, create-agent). DELIBERATELY absent from the operator
  // table: the RESIDUE gate excludes member-composition from an organ-value
  // residue ("no compose-op without its own cold survey" — reader-density L569),
  // so ⊕ is not a shared `OPERATORS` key. It is legitimate STRUCTURAL notation in
  // a multi-line formalize block, so the register-scoped SYMBOLS gate exempts it.
  if (o === 0x2295) {
    return true;
  }
  return false;
}

/**
 * The interiors of every ``` fenced block in `text`, each as a `{ line, content }`
 * record (line = 1-based interior start, for diagnostics). Mirrors the Python fence
 * walk: a line starting with ``` toggles in/out; interior lines are between markers.
 */
function fenceInteriors(
  text: string,
): Array<{ line: number; content: string }> {
  const lines = text.split('\n');
  const out: Array<{ line: number; content: string }> = [];
  let open = -1;
  for (let i = 0; i < lines.length; i++) {
    if ((lines[i] as string).startsWith('```')) {
      if (open === -1) {
        open = i;
      } else {
        out.push({
          line: open + 2, // 1-based first interior line
          content: lines.slice(open + 1, i).join('\n'),
        });
        open = -1;
      }
    }
  }
  return out;
}

/** Every undeclared, non-exempt glyph across the lines of `block` (1-based `line0`
 *  is the block's first-line number, for diagnostics). */
function offendingGlyphsInLines(
  label: string,
  block: string,
  declared: Set<string>,
  line0: number,
  note: string,
): string[] {
  const errs: string[] = [];
  const flines = block.split('\n');
  for (let j = 0; j < flines.length; j++) {
    for (const ch of flines[j] as string) {
      if (symbolExempt(ch) || declared.has(ch)) {
        continue;
      }
      const cp = (ch.codePointAt(0) ?? 0)
        .toString(16)
        .toUpperCase()
        .padStart(4, '0');
      errs.push(
        `SYMBOL ${label}:${line0 + j}: undeclared glyph ${JSON.stringify(ch)} (U+${cp})${note} — not in the symbol table, not a definiendum-class/exempt glyph`,
      );
    }
  }
  return errs;
}

/** Every undeclared, non-exempt glyph in the fence interiors of `text` (fragment
 *  definientia: any fenced block; the current corpus has none). */
function offendingGlyphs(
  label: string,
  text: string,
  declared: Set<string>,
): string[] {
  const errs: string[] = [];
  for (const fb of fenceInteriors(text)) {
    errs.push(
      ...offendingGlyphsInLines(
        label,
        fb.content,
        declared,
        fb.line,
        ' in a fence',
      ),
    );
  }
  return errs;
}

/** Every undeclared, non-exempt glyph in a skill's `formalBlock` — the σ* set-builder
 *  block IS the formal notation (the retired body's fence interior), scanned WHOLE. */
function offendingGlyphsInFormalBlock(
  label: string,
  formalBlock: string,
  declared: Set<string>,
): string[] {
  return offendingGlyphsInLines(label, formalBlock, declared, 1, '');
}

async function firstExport<T>(modPath: string): Promise<T> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  return mod[key as string] as T;
}

async function collect(pattern: string): Promise<string[]> {
  const out: string[] = [];
  for await (const p of glob(pattern, { cwd: srcRoot })) {
    out.push(p);
  }
  return out.sort();
}

describe('SYMBOLS gate — fence-interior glyph coverage', () => {
  const declared = declaredSymbols();

  it('the declared table loads (sanity: the core operators are present)', () => {
    // Guards against a silently-empty table making the gate vacuous.
    expect(declared.size).toBeGreaterThan(20);
    for (const g of ['≜', '∈', '→', '⇔', '℘', '∀']) {
      expect(declared.has(g)).toBe(true);
    }
  });

  it('every skill formalBlock uses only declared / exempt glyphs', async () => {
    const modules = await collect('skills/*.ts');
    expect(modules.length).toBe(15);
    const failures: string[] = [];
    for (const rel of modules) {
      const s = await firstExport<Skill>(join(srcRoot, rel));
      // The σ* `formalBlock` IS the formal notation (the retired body's fence
      // interior), so scan it WHOLE — not via fence extraction (it carries no ```).
      failures.push(
        ...offendingGlyphsInFormalBlock(
          `skill ${s.name}`,
          s.formalBlock,
          declared,
        ),
      );
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('every fragment definiens uses only declared / exempt glyphs in any fence', async () => {
    const modules = await collect('organs/**/*.ts');
    expect(modules.length).toBeGreaterThan(100);
    const failures: string[] = [];
    for (const rel of modules) {
      const f = await firstExport<string>(join(srcRoot, rel));
      const label = `fragment ${relative('organs', rel).replace(/\.ts$/, '')}`;
      failures.push(...offendingGlyphs(label, f, declared));
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  // ── NON-VACUOUS: the gate BITES on an injected violation ──────────────────────
  it('FAILS on an undeclared glyph injected inside a fence', () => {
    // ✗ (U+2717) is not in the table, not Greek/subscript/box-drawing/em-dash.
    const poisoned = [
      '\n# poison\n',
      '```text\nDECLARATIONS\n  x ✗ y   -- undeclared operator smuggled into a fence\n```\n',
    ].join('');
    const offenders = offendingGlyphs('fixture poison', poisoned, declared);
    expect(offenders.length).toBe(1);
    expect(offenders[0]).toContain('U+2717');
    expect(offenders[0]).toContain('in a fence');
  });

  it('PASSES the same glyph when it sits in PROSE (no fence) — register-scoped', () => {
    // A bare ✗ outside any fence is out of the gate's scope (it scans fence
    // interiors only) — exactly why provenance `glyph·color` marks never trip it.
    const prose = '\n# ok\n\nthis ✗ is prose, not a fenced formal block\n';
    expect(offendingGlyphs('fixture prose', prose, declared)).toEqual([]);
  });
});
