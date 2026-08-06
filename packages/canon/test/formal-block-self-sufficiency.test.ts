// SELF-SUFFICIENCY gate — the ABSOLUTE zero-comment lint over every skill `formalBlock`. The
// corpus is fully drained: NO formalBlock carries any `--`/`—` comment marker. So this gate no
// longer classifies carriers (law vs declaration) or forks (redundant vs load-bearing) — a
// comment is simply a finding. The lint proper lives in
// `/forge/validate`; this file wires it over the live corpus and
// asserts every one of the 15 skills scans to zero findings. Companion to the SYMBOLS gate
// (`symbols.test.ts`): that binds decodability, this binds the no-explanatory-prose clause.

import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  type BlockScan,
  type Finding,
  countWhitespaceGapGlosses,
  formatWorklist,
  scanFormalBlock,
} from '@cratylus/forge/validate';
import type { Skill } from '@cratylus/schema';
import { describe, expect, it } from 'vitest';
import { firstExport } from './support/cell-module.js';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

/**
 * Not-yet-drained blocks — reported by the worklist, not failed. The corpus is fully drained:
 * ALLOW_LIST is ∅, so EVERY skill is held zero-comment by the regression guard below; nothing
 * is reported-only. A block that regrows a `--`/`—` marker fails the gate outright.
 */
const ALLOW_LIST = new Set<string>([]);

async function scanCorpus(): Promise<{
  scans: BlockScan[];
  byName: Map<string, BlockScan>;
}> {
  const rels: string[] = [];
  for await (const p of glob('skills/*/skill.ts', { cwd: srcRoot })) {
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

describe('SELF-SUFFICIENCY gate — zero-comment corpus (absolute)', () => {
  it('ALLOW_LIST is empty — every block is expected drained', () => {
    expect(ALLOW_LIST.size).toBe(0);
  });

  it('every one of the 16 skill formalBlocks is zero-comment (no `--`/`—` marker)', async () => {
    const { scans } = await scanCorpus();
    expect(scans.length).toBe(16);

    // Emit the authoritative worklist (marker · line · carrier · annotation).
    console.log(`\n${formatWorklist(scans)}\n`);

    // ABSOLUTE regression guard: EVERY block must carry zero comment markers.
    const withComments = scans
      .filter((s) => !ALLOW_LIST.has(s.name) && s.findings.length > 0)
      .map((s) => `${s.name}: ${s.findings.length} comment marker(s)`);
    expect(withComments, withComments.join('\n')).toEqual([]);
  });

  it('reports the deferred whitespace-gap tally (0 corpus-wide, out of scope)', async () => {
    const { scans } = await scanCorpus();
    const deferred = scans.reduce(
      (n, s) => n + (s.deferredWhitespaceGap ?? 0),
      0,
    );
    expect(deferred).toBe(0);
  });

  // ── The marker detector, exhaustively: `--`, `—`, full-line prose, and the CLI-flag negative ─
  it('FLAGS a `--` (ASCII) comment marker', () => {
    const block = 'foo : A → B   -- the foo map';
    const findings = scanFormalBlock('fixture', block);
    expect(findings.length).toBe(1);
    expect((findings[0] as Finding).marker).toBe('--');
    expect((findings[0] as Finding).carrier).toBe('foo : A → B');
    expect((findings[0] as Finding).annotation).toBe('the foo map');
  });

  it('FLAGS a `—` (em-dash) comment marker', () => {
    const block = 'fired : Names → ℘(D) — the latent priors a name fires';
    const findings = scanFormalBlock('fixture', block);
    expect(findings.length).toBe(1);
    expect((findings[0] as Finding).marker).toBe('—');
    expect((findings[0] as Finding).annotation).toBe(
      'the latent priors a name fires',
    );
  });

  it('FLAGS a full-line prose comment (empty carrier)', () => {
    const block = '  -- this whole line is prose';
    const [f] = scanFormalBlock('fixture', block);
    expect(f?.carrier).toBe('');
    expect(f?.annotation).toBe('this whole line is prose');
  });

  it('does NOT flag a `--word` CLI flag (marker is space-delimited)', () => {
    const block = 'run ≜ graphify install --home ~/.claude';
    expect(scanFormalBlock('fixture', block)).toEqual([]);
  });

  it('flags every marker in a multi-comment block (one Finding per marker line)', () => {
    const block = [
      'a : X — first gloss',
      'b ≜ {p,q}   -- second gloss',
      'c : Y', // clean
      '-- full-line prose',
    ].join('\n');
    const findings = scanFormalBlock('fixture', block);
    expect(findings.map((f) => f.line)).toEqual([1, 2, 4]);
  });
});
