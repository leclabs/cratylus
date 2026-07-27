// GATE — one sign, one concept, CORPUS-WIDE. The injectivity leg no per-cell check can reach.
//
// `signify` declares `α : C ↣ Names` injective and states `α(cᵢ) = α(cⱼ) ⇒ D(cᵢ) = D(cⱼ)`.
// The symbol-probe gate keys every obligation `${cell}␟${symbol}` — PER CELL — so a sign
// assigned concept A in one cell and concept B in another round-trips green in BOTH while
// the pair violates injectivity. The blind spot is the KEY, not the rubric: no per-item
// check can establish an across-item invariant, however green every item is.
//
// This is the `altitude` law — a sign taken at another altitude IN THE SAME CORPUS is still
// a collision. It is not hypothetical: authoring `register-relative-decode` in this corpus
// was blocked because `register` already means ARTIFACT register (`signify`, `σ* ∨ human`),
// and nothing would have caught it.
//
// WHY A LEDGER AND NOT A BARE ASSERTION. The corpus carried 26 divergences when this gate
// was built (25 now — `resume` is paid), and 13 are LEGITIMATE — `probe` re-declares `dec`
// with a terser gloss and an `@ signify`
// pointer; same concept, shorter words. A gate that failed on all 26 would be wrong on half
// and would be silenced within a week. A gate that is wrong about legitimate shared
// vocabulary does not merely miss defects: it destroys the instrument, because every future
// agent learns to route around it. So the mechanized leg is DETECTION, and the
// shared-vs-collision call is recorded agent judgment — the same honesty pivot the
// symbol-probe gate makes with `needs-probe`.
//
// The ledger is DEBT, held in the open. It ratchets shrink-only.

import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Skill } from '@leclabs/agent-forge/anatomy';
import { describe, expect, it } from 'vitest';
import {
  type ProbeObligation,
  divergentSymbols,
  obligationsOf,
} from '../src/toolkit/symbol-probe-gate.js';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

/**
 * COLLISION  — genuinely different concepts sharing one sign. Real debt; each is a naming
 *              defect awaiting a signify pass on one side or the other.
 * REFERENCE  — one concept, re-declared in a consuming cell with a terser gloss (often with
 *              an `@ <cell>` pointer). Not a defect; injectivity holds.
 */
type Verdict = 'COLLISION' | 'REFERENCE';

/** The recorded judgment for every divergence the live corpus carries. */
const LEDGER: Readonly<Record<string, Verdict>> = {
  // ── REFERENCE — one concept, restated tersely by a consumer ──────────────────
  C: 'REFERENCE', // the concept lattice; conceptualize gives the constructive form
  Names: 'REFERENCE',
  dec: 'REFERENCE', // probe carries `@ signify` explicitly
  'prim(c)': 'REFERENCE', // prose in signify, formal in conceptualize
  'concept-record': 'REFERENCE',
  cl: 'REFERENCE', // gloss in probe, signature in conceptualize
  'σ*': 'REFERENCE',
  '≺': 'REFERENCE', // same order operator over different carriers
  O: 'REFERENCE', // both: the SOUL dimension-section set
  green: 'REFERENCE', // both: a gate-pass reached by FIXING, never by loosening
  dream: 'REFERENCE', // handoff points at the dream operation with `@ dream`
  realize: 'REFERENCE', // exemplify carries `@ materialize`
  boundary: 'REFERENCE', // both: this cell's remit against its neighbour's
  // `A` PAID 2026-07-27 — was a three-way COLLISION. signify used it ONCE for the
  // assigned-anchor set while introspect and create-agent used it 5× each for the AGENT.
  // signify renamed to `Anchors`, built from its own declared `anchor` — a disambiguation
  // out of existing vocabulary, not a coinage. What remains is introspect↔create-agent,
  // both meaning the agent in question: a REFERENCE, not a collision.
  A: 'REFERENCE',

  // ── COLLISION — distinct concepts, one sign ──────────────────────────────────
  D: 'COLLISION', // distinction-space in four cells — exemplify: "the source corpus"
  K: 'COLLISION', // FOUR: kind-set · K_cfg∪misnomer · project-K warm knowledge · candidate set
  P: 'COLLISION', // wake/praxis/carry-on: a plan — formalize: the SOURCE PROSE
  S: 'COLLISION', // materialize: artifact forms — formalize: symbols(B)
  c: 'COLLISION', // probe: a target concept — elicit: a closed distinction-set
  gate: 'COLLISION', // dream: the audit verb — create-agent: the full test suite
  intent: 'COLLISION', // praxis: the stated goal — introspect: what a fragment addresses
  kind: 'COLLISION', // materialize: C → K — create-agent: O → {enum, open, coined}
  memory: 'COLLISION', // wake: a capability — dream: the dimension-home ∪ its runtime
  read: 'COLLISION', // event-tap: the tap verb — dream: the memory verb
  release: 'COLLISION', // praxis: unbind a plan — handoff: release the session
  // `resume` PAID 2026-07-27: praxis declared `resume : P ↦ frontier(P)`, an alias used
  // nowhere and saying nothing `frontier(P)` did not already say. wake owns the sign (a
  // term of the WAKE sequence, with a law). Resolved by DELETING the alias, not renaming
  // it — the collision investigation found dead vocabulary, which is the cheapest possible
  // outcome and the one to look for first.
};

async function liveObligations(): Promise<ProbeObligation[]> {
  const out: ProbeObligation[] = [];
  for await (const p of glob('skills/*/skill.ts', { cwd: srcRoot })) {
    const mod = (await import(pathToFileURL(join(srcRoot, p)).href)) as Record<
      string,
      unknown
    >;
    for (const v of Object.values(mod)) {
      const skill = v as Skill | undefined;
      if (!skill?.formalBlock) continue;
      out.push(...obligationsOf(skill.name, skill.formalBlock));
    }
  }
  return out;
}

describe('ALTITUDE gate — one sign, one concept, across the whole corpus', () => {
  it('reaches the corpus at all — an empty scan is DARK, not clean', async () => {
    const obs = await liveObligations();
    expect(
      obs.length,
      'no obligations extracted — the scan is dark',
    ).toBeGreaterThan(100);
  });

  it('admits no divergence that is not in the LEDGER', async () => {
    const found = divergentSymbols(await liveObligations());
    const unrecorded = found
      .filter((d) => LEDGER[d.symbol] === undefined)
      .map((d) => `${d.symbol} (${d.cells.join(', ')})`);
    expect(
      unrecorded,
      `a sign now carries two concepts and nothing recorded it. Rename one side, or classify it in LEDGER — COLLISION (real debt) / REFERENCE (one concept, terser gloss): ${unrecorded.join('; ')}`,
    ).toEqual([]);
  });

  // SHRINK-ONLY. A ledger entry that no longer diverges is a stale pin claiming debt that is
  // already paid — the same fabricated-coverage shape `gate-convicts` rejects. Resolving a
  // collision REQUIRES deleting its row, so the ledger can only get shorter.
  it('carries no stale LEDGER row — a resolved divergence must be DELETED', async () => {
    const live = new Set(
      divergentSymbols(await liveObligations()).map((d) => d.symbol),
    );
    const stale = Object.keys(LEDGER).filter((s) => !live.has(s));
    expect(
      stale,
      `no longer divergent — delete from LEDGER: ${stale.join(', ')}`,
    ).toEqual([]);
  });

  // NON-VACUOUS, both directions. Without these the detector could be returning [] always
  // and every assertion above would still be green.
  it('CONVICTS a synthetic collision and acquits a synthetic agreement', () => {
    const collide: ProbeObligation[] = [
      { cell: 'alpha', symbol: 'W', assignedConcept: 'a weight' },
      { cell: 'beta', symbol: 'W', assignedConcept: 'a window' },
    ];
    expect(divergentSymbols(collide).map((d) => d.symbol)).toEqual(['W']);

    const agree: ProbeObligation[] = [
      { cell: 'alpha', symbol: 'W', assignedConcept: 'a weight' },
      { cell: 'beta', symbol: 'W', assignedConcept: 'a weight' },
    ];
    expect(divergentSymbols(agree)).toEqual([]);

    // One cell restating a symbol is not divergence either.
    const oneCell: ProbeObligation[] = [
      { cell: 'alpha', symbol: 'W', assignedConcept: 'a weight' },
      { cell: 'alpha', symbol: 'W', assignedConcept: 'a window' },
    ];
    expect(divergentSymbols(oneCell)).toEqual([]);
  });

  // NO SILENT CAP: the outstanding collision count is asserted, not merely tolerated, so it
  // cannot drift upward inside the ledger while every other check stays green.
  it('holds the collision debt at its recorded size (11) — never higher', async () => {
    const live = new Set(
      divergentSymbols(await liveObligations()).map((d) => d.symbol),
    );
    const collisions = Object.entries(LEDGER)
      .filter(([s, v]) => v === 'COLLISION' && live.has(s))
      .map(([s]) => s);
    expect(
      collisions.length,
      `outstanding sign collisions: ${collisions.join(', ')}`,
    ).toBeLessThanOrEqual(11);
  });
});
