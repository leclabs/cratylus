// SYMBOL-PROBE gate — the per-symbol `probe` round-trip lifecycle success-gate. ADDITIVE
// sibling of `symbols.test.ts`: that gate binds DECODABILITY (every fence glyph is a
// declared register member); this one binds SIGNIFICATION (every DECLARED symbol
// round-trips — `concept_R(symbol)` at reader=LLM circumscribes the concept its block
// ASSIGNS it, its σ* target). A mis-signified symbol FAILS; the formal blocks are thereby
// the symbolic-σ* regression suite. Wired into the lifecycle: ENGINE.md `verify` /
// `stage-invariant`, CANON.md §Signification-gate.
//
// INDEPENDENT-LEG HONESTY. The round-trip's semantic leg (`concept_R(w) = intended C`) is
// an LLM judgment; this suite does NOT fake a deterministic oracle over it. It tests the
// DETERMINISTIC leg (obligation extraction + verdict routing) and the FAILURE SURFACE with
// RECORDED probe readouts (the judgment leg, authored by an agent, supplied as data). The
// live corpus's un-probed symbols route to `needs-probe` — an owed agent check, surfaced,
// NOT a vacuous pass. See `src/toolkit/symbol-probe-gate.ts` header for the full contract.

import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Skill } from '@leclabs/agent-schema';
import { describe, expect, it } from 'vitest';
import {
  type ProbeObligation,
  type ProbeReadout,
  ledgerOf,
  manifestRow,
  obligationsOf,
  roundTrip,
  symbolProbeGate,
} from '../src/toolkit/symbol-probe-gate.js';
import { firstExport } from './support/cell-module.js';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

async function loadSkills(): Promise<Skill[]> {
  const out: Skill[] = [];
  for await (const p of glob('skills/*/skill.ts', { cwd: srcRoot })) {
    out.push(await firstExport<Skill>(join(srcRoot, p)));
  }
  return out;
}

/** The whole-corpus probe manifest: every σ*-regression row across every skill. */
async function corpusManifest(): Promise<ProbeObligation[]> {
  const rows: ProbeObligation[] = [];
  for (const s of await loadSkills()) {
    rows.push(...obligationsOf(s.name, s.formalBlock));
  }
  return rows;
}

describe('SYMBOL-PROBE gate — per-symbol round-trip signification', () => {
  // ── DETERMINISTIC leg: obligation extraction over the LIVE corpus ─────────────
  it('extracts a well-formed obligation for every declared symbol (live corpus)', async () => {
    const manifest = await corpusManifest();
    // Non-vacuous coverage: the corpus raises a substantial obligation set.
    expect(manifest.length).toBeGreaterThan(30);
    for (const ob of manifest) {
      expect(ob.cell).not.toBe('');
      expect(ob.symbol).not.toBe('');
      // Every symbol carries an ASSIGNED concept — the σ* target to round-trip against.
      // A blank gloss would make the round-trip undefined; the extractor forbids it.
      expect(ob.assignedConcept, `${ob.cell}::${ob.symbol}`).not.toBe('');
    }
    // The two σ*-algebra cells are covered (the reference symbols live here).
    const cells = new Set(manifest.map((o) => o.cell));
    expect(cells.has('probe')).toBe(true);
    expect(cells.has('signify')).toBe(true);
  });

  // ── HONESTY PIVOT: an un-probed symbol is `needs-probe`, never a pass ──────────
  it('routes an un-probed symbol to needs-probe (not a vacuous pass)', async () => {
    const manifest = await corpusManifest();
    const emptyLedger = ledgerOf([]);
    const result = symbolProbeGate(manifest, emptyLedger);
    // With no recorded probes, NOTHING passes and NOTHING fails — all are owed.
    expect(result.passed.length).toBe(0);
    expect(result.failed.length).toBe(0);
    expect(result.pending.length).toBe(manifest.length);
    // Canonization is WITHHELD: the corpus is not vacuously admitted.
    expect(result.ok).toBe(false);
    for (const ob of manifest) {
      expect(roundTrip(ob, emptyLedger)).toBe('needs-probe');
    }
  });

  // ── ACCEPTANCE 3: a correctly-signified reference symbol PASSES ────────────────
  // σ* and circ, from the LIVE signify.ts obligations, with recorded probe readouts
  // whose `concept_R` circumscribes the assigned gloss (cold-verified by mav's cold-read,
  // `.scratchpad/signify-review-jul-22/…verdict.md` claim A: σ* routes to the fittest
  // symbolic sign by density — `argmin |n|` — and circ ⇔ fired(n)=D(c)).
  it('PASSES a correctly-signified reference symbol (σ*, circ)', async () => {
    const signify = (await loadSkills()).find((s) => s.name === 'signify');
    expect(signify).toBeDefined();
    const obs = obligationsOf('signify', (signify as Skill).formalBlock);
    const sigmaStar = obs.find((o) => o.symbol === 'σ*');
    const circ = obs.find((o) => o.symbol.startsWith('circ'));
    expect(sigmaStar, 'signify declares σ*').toBeDefined();
    expect(circ, 'signify declares circ').toBeDefined();

    const ledger = ledgerOf([
      {
        cell: 'signify',
        symbol: (sigmaStar as ProbeObligation).symbol,
        firedPriors:
          'σ (the chosen/summed one) + star (the optimum, the best); the distinguished-best selector over a domain',
        circumscribes:
          'the density-optimal fittest sign a concept maps to — argmin over circumscribing names',
        matchesAssignment: true,
      },
      {
        cell: 'signify',
        symbol: (circ as ProbeObligation).symbol,
        firedPriors:
          'circ- (circumscribe / encircle) over (name, concept); a fit predicate between a signifier and a concept',
        circumscribes:
          'the predicate: name n circumscribes concept c ⇔ its fired priors equal the concept extent',
        matchesAssignment: true,
      },
    ]);

    expect(roundTrip(sigmaStar as ProbeObligation, ledger)).toBe('pass');
    expect(roundTrip(circ as ProbeObligation, ledger)).toBe('pass');

    const result = symbolProbeGate(
      [sigmaStar as ProbeObligation, circ as ProbeObligation],
      ledger,
    );
    expect(result.ok).toBe(true);
    expect(result.passed.length).toBe(2);
  });

  // ── ACCEPTANCE 2: a mis-signified symbol FAILS ────────────────────────────────
  // Fixture block ASSIGNS σ* the WRONG concept ("the longest, least-fit name"). An agent
  // probing σ* circumscribes the OPPOSITE (the fittest/shortest sign). Priors circumscribe
  // a DIFFERENT concept than assigned ⇒ the round-trip verdict is `fail`. (Falsifier: were
  // this a pass, the gate would be vacuous — a mis-signification would canonize.)
  it('FAILS a mis-signified symbol (priors circumscribe a different concept)', () => {
    const poisoned = `DECLARATIONS
  σ*   — the LONGEST, least-fit, most verbose name a concept could take

LAWS
  σ*(c) ≜ argmax over names`;
    const obs = obligationsOf('fixture-poison', poisoned);
    const misSignified = obs.find((o) => o.symbol === 'σ*');
    expect(misSignified, 'fixture declares σ*').toBeDefined();
    expect((misSignified as ProbeObligation).assignedConcept).toContain(
      'LONGEST',
    );

    const recorded: ProbeReadout = {
      cell: 'fixture-poison',
      symbol: 'σ*',
      firedPriors:
        'σ + star = the optimum / the distinguished BEST — a minimizer, never a maximizer',
      circumscribes: 'the fittest / shortest sign for a concept',
      // The agent's judgment: the circumscribed concept (fittest/shortest) is NOT the
      // assigned concept (longest/least-fit). Recorded, never recomputed here.
      matchesAssignment: false,
    };
    const ledger = ledgerOf([recorded]);

    expect(roundTrip(misSignified as ProbeObligation, ledger)).toBe('fail');

    const result = symbolProbeGate([misSignified as ProbeObligation], ledger);
    expect(result.ok).toBe(false);
    expect(result.failed).toHaveLength(1);
    expect(manifestRow(result.failed[0] as ProbeObligation, 'fail')).toContain(
      'FAIL',
    );
  });

  // ── The gate DISCRIMINATES: same symbol, right gloss passes / wrong gloss fails ─
  it('discriminates a correct vs a mis-signified assignment of the same symbol', () => {
    const good: ProbeObligation = {
      cell: 'c',
      symbol: 'σ*',
      assignedConcept: 'the fittest / shortest sign for a concept',
    };
    const bad: ProbeObligation = {
      cell: 'c',
      symbol: 'σ*',
      assignedConcept: 'the longest / least-fit name for a concept',
    };
    // One recorded probe: σ*'s priors circumscribe the fittest sign.
    const probeOf = (matches: boolean): ProbeReadout => ({
      cell: 'c',
      symbol: 'σ*',
      firedPriors: 'σ + star = the optimum',
      circumscribes: 'the fittest / shortest sign for a concept',
      matchesAssignment: matches,
    });
    expect(roundTrip(good, ledgerOf([probeOf(true)]))).toBe('pass');
    expect(roundTrip(bad, ledgerOf([probeOf(false)]))).toBe('fail');
  });
});
