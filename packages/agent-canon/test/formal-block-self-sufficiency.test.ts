// SELF-SUFFICIENCY gate — flags every `--` annotation in a skill `formalBlock` that carries a
// LAW or a DEFINITION (a `self-sufficient-formalism` violation: `gloss(B) ≠ ∅ ⇒ ¬complete`,
// see `skills/formalize.ts`), classifying each REDUNDANT (delete) vs LOAD-BEARING (formalize).
// Companion to the SYMBOLS gate (`symbols.test.ts`): that binds decodability, this binds the
// no-explanatory-prose clause. The lint proper lives in
// `src/toolkit/formal-block-self-sufficiency.ts`; this file wires it over the live corpus.
//
// ROLLOUT (advisory, shrinking to ∅). The corpus is mid-drain: only the `signify` σ*-cluster
// and the `probe` experiment/coverage lines are drained. So the gate is a REGRESSION GUARD —
// a file NOT on `ALLOW_LIST` must stay self-sufficient (0 findings), while allow-listed files
// are reported-only. The anti-stale assertion (every allow-listed file still has ≥1 finding)
// forces the list to shrink as t2 drains each block: drain a file to 0 and its stale
// allow-list entry FAILS until it is removed. `ALLOW_LIST` == exactly the flagged set, always.

import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Skill } from '@leclabs/agent-forge/anatomy';
import { describe, expect, it } from 'vitest';
import {
  type BlockScan,
  type Finding,
  classify,
  countWhitespaceGapGlosses,
  formatWorklist,
  scanFormalBlock,
} from '../src/toolkit/formal-block-self-sufficiency.js';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

/**
 * Not-yet-drained blocks — reported by the worklist, not failed. Removed one-by-one as t2
 * drains each; the anti-stale assertion below keeps this == exactly the currently-flagged set.
 */
// Empty: the corpus is fully drained. praxis was the last residual — its former
// `-- plan-retirement: …` line has been formalized into the plan-set-dynamics algebra
// (Phase / landing / retire) and now scans to 0 findings, so it is off the list. Every
// block is now held self-sufficient by the regression guard; nothing is reported-only.
const ALLOW_LIST = new Set<string>([]);

async function firstExport<T>(modPath: string): Promise<T> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  return mod[key as string] as T;
}

async function scanCorpus(): Promise<{
  scans: BlockScan[];
  byName: Map<string, BlockScan>;
}> {
  const rels: string[] = [];
  for await (const p of glob('skills/*.ts', { cwd: srcRoot })) {
    rels.push(p);
  }
  rels.sort();
  const scans: BlockScan[] = [];
  for (const rel of rels) {
    const s = await firstExport<Skill>(join(srcRoot, rel));
    if (!s?.formalBlock) {
      continue;
    }
    scans.push({
      name: s.name,
      findings: scanFormalBlock(s.name, s.formalBlock),
      deferredWhitespaceGap: countWhitespaceGapGlosses(s.formalBlock),
    });
  }
  const byName = new Map(scans.map((s) => [s.name, s]));
  return { scans, byName };
}

/** 1-based block-line numbers of lines whose leading token matches `re`. */
function lineNumbersOf(block: string, re: RegExp): number[] {
  return block
    .split('\n')
    .map((l, i) => (re.test(l) ? i + 1 : -1))
    .filter((n) => n > 0);
}

async function blockOf(rel: string): Promise<string> {
  const s = await firstExport<Skill>(join(srcRoot, rel));
  return s.formalBlock;
}

describe('SELF-SUFFICIENCY gate — formal-block prose (law/def annotations)', () => {
  it('prints the drain worklist and holds every non-allow-listed block self-sufficient', async () => {
    const { scans } = await scanCorpus();
    expect(scans.length).toBe(15);

    // Emit the authoritative worklist (annotation · line · {redundant|load-bearing}).
    // biome-ignore lint/suspicious/noConsole: the worklist is the deliverable.
    console.log(`\n${formatWorklist(scans)}\n`);

    // REGRESSION GUARD: a block outside the allow-list must carry no law/def annotation.
    const regressions = scans
      .filter((s) => !ALLOW_LIST.has(s.name) && s.findings.length > 0)
      .map((s) => `${s.name}: ${s.findings.length} undrained annotation(s)`);
    expect(regressions, regressions.join('\n')).toEqual([]);

    // ANTI-STALE (shrink-to-∅): no allow-list entry that is already drained.
    const stale = [...ALLOW_LIST].filter(
      (n) => (scans.find((s) => s.name === n)?.findings.length ?? 0) === 0,
    );
    expect(
      stale,
      `drained — remove from ALLOW_LIST: ${stale.join(', ')}`,
    ).toEqual([]);
  });

  // ── ACCEPTANCE 3: no false positive on the already-drained reference sub-blocks ──────────
  it('the drained signify σ*-cluster carries no finding (whole DECLARATIONS section clean)', async () => {
    const block = await blockOf('skills/signify.ts');
    const findings = scanFormalBlock('signify', block);
    // The σ*-cluster: fired · dec · circ · |n| · σ* · mint · α. Its two `--` primitive glosses
    // (on `fired` and `α`) are admissible declaration glosses — the discriminating true-negative.
    const glossLines = lineNumbersOf(block, /^\s*(fired\s*:|α\s*:).*--/u);
    expect(glossLines.length).toBe(2); // `fired : … -- …` and `α : … -- the anchor`
    const flaggedGlosses = findings.filter((f) => glossLines.includes(f.line));
    expect(
      flaggedGlosses,
      `false positive on drained σ*-cluster primitive glosses: ${JSON.stringify(flaggedGlosses)}`,
    ).toEqual([]);
    // signify is now fully drained (σ*-cluster, reader-binding, and laws): every remaining `—`
    // gloss sits on a DECLARATION carrier (admissible W1 by-value gloss); no law/def gloss
    // remains. Gate non-vacuity is covered by the fixture tests below, not by a live corpus
    // block that (correctly) drains to zero.
    expect(
      findings,
      `signify carries a residual law/def gloss: ${JSON.stringify(findings)}`,
    ).toEqual([]);
  });

  it('the drained probe experiment/coverage lines carry no finding', async () => {
    const block = await blockOf('skills/probe.ts');
    const findings = scanFormalBlock('probe', block);
    const drained = lineNumbersOf(
      block,
      /^\s*(experiment|coverage|crystallize)\b/,
    );
    expect(drained.length).toBe(3);
    const flagged = findings.filter((f) => drained.includes(f.line));
    expect(
      flagged,
      `false positive on drained probe lines: ${JSON.stringify(flagged)}`,
    ).toEqual([]);
    // Under the carrier-based admissibility boundary probe is fully self-sufficient: every `—`
    // gloss sits on a DECLARATION carrier (bare term / predicate signature — W1's by-value
    // gloss), and the fired_R cluster (`fired_R(w) ≜ latent-priors(w,R)`, …) carries NO gloss
    // marker at all. So there is no law/def gloss left to flag — 0 findings is the true state.
    expect(findings).toEqual([]);
  });

  // ── ACCEPTANCE 2: a law-annotation on a def line is FLAGGED; primitives + β∪ι PASS ───────
  it('FLAGS a `--` law annotation on a definition line', () => {
    const poisoned = [
      'DECLARATIONS',
      '  foo   : A → B          -- the foo map',
      'LAWS',
      '  foo(x) ≜ bar(x) ⊔ baz(x)   -- foo is bar joined with baz whenever x holds',
    ].join('\n');
    const findings = scanFormalBlock('fixture-poison', poisoned);
    // The definition line is flagged; the declaration signature gloss is not.
    expect(findings.length).toBe(1);
    expect((findings[0] as Finding).carrier).toContain('foo(x) ≜');
  });

  it('PASSES a block of only primitive glosses + a β∪ι citation', () => {
    const clean = [
      'DECLARATIONS',
      '  Names   — the shared symbol space',
      '  fired   : Names → ℘(D)   -- the latent priors a name fires',
      '  α       : C ↣ Names       -- the anchor',
      '  η       : E ⇀ Names       -- signify : an imported anchor, cited once',
    ].join('\n');
    expect(scanFormalBlock('fixture-clean', clean)).toEqual([]);
  });

  // ── EM-DASH (`—`) BOUNDARY: the widened marker, carrier decides admissibility ─────────────
  it('FLAGS a `—` gloss whose carrier is a LAW', () => {
    const block =
      'LAWS\n  α(cᵢ) = α(cⱼ) ⇒ cᵢ, cⱼ share load — same anchor ⇒ same distinctions';
    const findings = scanFormalBlock('fixture-emdash-law', block);
    expect(findings.length).toBe(1);
    expect((findings[0] as Finding).carrier).toContain('⇒');
  });

  it('ADMITS a `—` gloss on a DECLARATION signature (no finding)', () => {
    const block =
      'DECLARATIONS\n  fired : Names → ℘(D) — the latent priors a name fires';
    expect(scanFormalBlock('fixture-emdash-sig', block)).toEqual([]);
  });

  it('ADMITS `States ≜ {a,b,c} — gloss` (≜-to-set is a by-value primitive)', () => {
    const block = 'DECLARATIONS\n  States ≜ {a,b,c} — the three run states';
    expect(scanFormalBlock('fixture-emdash-set', block)).toEqual([]);
  });

  it('FLAGS `f(x) ≜ g(x) ∘ h — gloss` (≜-to-operation is an operational definition)', () => {
    const block = 'LAWS\n  f(x) ≜ g(x) ∘ h — f post-composes h with g';
    const findings = scanFormalBlock('fixture-emdash-op', block);
    expect(findings.length).toBe(1);
    expect((findings[0] as Finding).carrier).toContain('f(x) ≜');
  });

  // ── ACCEPTANCE 4: the redundant-vs-load-bearing fork, one fixture of each ────────────────
  it('classifies a REDUNDANT annotation (reconstructable from the same-block notation)', () => {
    const block = 'LAWS\n  merge ≜ a ⊔ b   -- merge joins a and b';
    const [f] = scanFormalBlock('fixture-redundant', block);
    expect(f?.verdict).toBe('redundant');
    expect(f?.reviewFork).toBe(false);
  });

  it('classifies a LOAD-BEARING annotation (names an operation with no in-block home)', () => {
    const block =
      'LAWS\n  pick ≜ argmin cands   -- none match ⇒ escalate(ctx) to the operator';
    const [f] = scanFormalBlock('fixture-loadbearing', block);
    expect(f?.verdict).toBe('load-bearing');
    expect(f?.reason).toContain('escalate()');
  });

  it('redundancy-check-FIRST: an implication-shaped restatement forks REDUNDANT but flags nico', () => {
    // The R2 hazard the signify review mis-decided: `coalesce ⇔ …` is fully formalized, so the
    // `⇒`-shaped gloss is a restatement (delete), NOT a new law — but the fork is a naming call.
    const { verdict, reviewFork } = classify(
      'coalesce(cᵢ, cⱼ) ⇔ α(cᵢ) = α(cⱼ) ∧ D(cᵢ) = D(cⱼ)',
      'same anchor, no residual distinct load ⇒ merge to one',
      new Set(['coalesce', 'α', 'D']),
    );
    expect(verdict).toBe('redundant');
    expect(reviewFork).toBe(true);
  });
});
