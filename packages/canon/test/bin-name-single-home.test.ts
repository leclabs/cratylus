// BIN-NAME SINGLE-HOME gate (V5).
//
// `install-parity` S4 RECORDED that the runtime bin name had "exactly one home, so
// the rebrand is a one-line change". It did not. The literal stood in SEVEN places
// across FOUR packages, and THREE of those were inside emitted strings — a projected
// `scripts/<cap>.mjs`, a generated hook `.sh` — where no compiler can see them. A
// rename that missed one shipped a deployed script that failed at RUNTIME ON A HOST,
// not at build. This file is what makes the claim true instead of asserted.
//
// The one home is `@cratylus/runtime/bin-name` → `RUNTIME_BIN`. Every consumer
// interpolates it. This gate holds the four consumers to it, each by CAPTURE-AND-
// COMPARE — read back the name the artifact actually carries and compare it to the
// constant — so editing one without the other is red, in either direction:
//
//   (1) `@cratylus/invoke`'s `bin` MANIFEST KEY — the one irreducible second copy
//       (npm reads it with no TypeScript in the loop, so it cannot be computed).
//   (2) the runtime's cac BRANDING (`main.ts`) — read out of `--help`.
//   (3) the PROJECTED THIN SHIM's `spawnSync` target — the operative site, read out
//       of a real `scripts/<cap>.mjs` in a real render tree.
//   (4) the memory-nudge hook WORKER's `$MEMORY_BIN` default, in both the source
//       CELL and the committed `.sh` it regenerates.
//
// Plus a CENSUS: no file but `bin-name.ts` may spell the name as a quoted string
// literal — the shape of the defect this retires (a second `const BIN = '…'`).
//
// This gate does NOT decide the name. The brand anchor is cratylism-gated and has
// not converged; `RUNTIME_BIN` holds a placeholder. What is asserted is that
// flipping that ONE symbol flips the name everywhere it is operative.

import { readFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet, writeRenderTree } from '@cratylus/forge/project';
import { RUNTIME_BIN } from '@cratylus/runtime/bin-name';
import { runMain } from '@cratylus/runtime/main';
import { beforeAll, describe, expect, it } from 'vitest';
import { memoryConsolidationNudge } from '../src/hooks/memory-consolidation-nudge.js';
import canonPlugin from '../src/index.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(canonRoot, '..', '..');

/** A corpus cell that declares `runtime: {capability:'memory'}` — the shim carrier. */
const CELL = 'wake';
const CAPABILITY = 'memory';

/** Every source file that SPEAKS the bin name, and must therefore not SPELL it. */
const CONSUMERS = [
  'packages/runtime/src/main.ts',
  'packages/invoke/src/bin.ts',
  'packages/forge/src/project/runtime-shim.ts',
  'packages/canon/src/hooks/memory-consolidation-nudge.ts',
] as const;

const read = (rel: string): string =>
  readFileSync(join(repoRoot, rel), 'utf-8');

/** The committed hook worker — regenerated from the cell, never hand-edited. */
const workerPath = memoryConsolidationNudge.workers?.[0]?.targetPath ?? '';

// A REAL render tree, not a hand-rolled emitter call: the shim under test is the
// one that actually lands. V7 made the projector RETURN the artifact tree, so the
// caller is the one writer — project THEN write.
let projectedShim = '';

beforeAll(async () => {
  const out = await mkdtemp(join(tmpdir(), 'bin-name-single-home-'));
  const report = await projectPluginSet({
    plugins: [canonPlugin],
    adapter: adapterByName('claude'),
  });
  writeRenderTree(out, report.files);
  projectedShim = readFileSync(
    join(out, 'skills', CELL, 'scripts', `${CAPABILITY}.mjs`),
    'utf-8',
  );
}, 120_000);

describe('the bin name has exactly one home', () => {
  it('no consumer spells the name — only `bin-name.ts` declares it', () => {
    // The defect shape this retires: a SECOND `const BIN = 'runtime'`. The
    // home declares it once; nobody else may write it as a string literal.
    const home = read('packages/runtime/src/bin-name.ts');
    const decl = home.match(
      new RegExp(`export const RUNTIME_BIN = '${RUNTIME_BIN}';`, 'g'),
    );
    expect(decl).toHaveLength(1);

    for (const rel of CONSUMERS) {
      const src = read(rel);
      expect(
        { file: rel, spellsIt: src.includes(`'${RUNTIME_BIN}'`) },
        `${rel} must interpolate RUNTIME_BIN, not spell the bin name`,
      ).toEqual({ file: rel, spellsIt: false });
      expect(src).toContain('RUNTIME_BIN');
    }
  });

  it("invoke's `bin` manifest key agrees with RUNTIME_BIN", () => {
    // The one copy no compiler can reach. If a rename flips the constant and not
    // this key, the installed executable and everything that spawns it disagree —
    // and nothing but this assertion notices.
    const manifest = JSON.parse(read('packages/invoke/package.json')) as {
      bin: Record<string, string>;
    };
    expect(Object.keys(manifest.bin)).toEqual([RUNTIME_BIN]);
  });

  it("the runtime's cac branding is RUNTIME_BIN", async () => {
    // cac prints help through `console.log`, not `process.stdout.write`.
    const chunks: string[] = [];
    const log = console.log;
    console.log = (...args: unknown[]) => {
      chunks.push(args.map(String).join(' '));
    };
    try {
      await runMain(['--help']);
    } finally {
      console.log = log;
    }
    const help = chunks.join('\n');
    // Capture the brand cac printed, then compare — not `toContain`, which would
    // still pass if the help named a stale bin alongside the right one.
    expect(help.match(/^(\S+)\//)?.[1]).toBe(RUNTIME_BIN);
    expect(help.match(/^ {2}\$ (\S+) /m)?.[1]).toBe(RUNTIME_BIN);
  });

  it('the PROJECTED thin shim spawns RUNTIME_BIN — the operative site', () => {
    // THE FALSIFIER for the site that broke on a host. Capture whatever argv[0] the
    // emitted `scripts/<cap>.mjs` actually spawns and compare it to the constant, so
    // hardcoding a literal back into the emitter — or flipping the constant without
    // the emitter — is red here rather than at deploy time on someone's machine.
    expect(projectedShim, 'projection produced no shim').not.toBe('');
    const spawned = projectedShim.match(/spawnSync\('([^']+)',/)?.[1];
    expect(spawned).toBe(RUNTIME_BIN);
    expect(projectedShim).toContain(`['${CAPABILITY}',`);
  });

  it('the memory-nudge hook worker defaults $MEMORY_BIN to RUNTIME_BIN', () => {
    // Cell AND committed worker. The `workers[].content` is the byte-anchor the
    // `.sh` regenerates from, so both must be captured: editing the `.sh` alone is
    // already caught by the byte-lock, but flipping the constant without
    // regenerating would otherwise pass unseen.
    const cellContent = memoryConsolidationNudge.workers?.[0]?.content ?? '';
    const committed = read(workerPath);
    for (const [what, text] of [
      ['cell', cellContent],
      ['worker', committed],
    ] as const) {
      const fallback = text.match(/MEM="\$\{MEMORY_BIN:-([^}]+)\}"/)?.[1];
      expect(fallback, `${what} names a stale bin`).toBe(RUNTIME_BIN);
    }
    // The env override is the behaviour, not an accident of the default.
    expect(committed).toContain('MEMORY_BIN');
  });
});

// ── THE CONVICTING FIXTURES ─────────────────────────────────────────────────────
//
// A gate over a clean corpus is green whether it works or is DARK. Each assertion
// above is capture-and-compare; these feed the SAME comparison a corpus in which
// exactly one site was edited and the other was not — the half-landed rename — and
// assert it is rejected. Without them, "the bin name has one home" is a claim of the
// kind `install-parity` S4 already made and got wrong.

/** The three capture-and-compare predicates, isolated from their live inputs so a
 *  synthetic BAD corpus can be fed to the very same code the gate above runs. */
const spawnedBin = (shim: string): string | undefined =>
  shim.match(/spawnSync\('([^']+)',/)?.[1];
const memFallback = (sh: string): string | undefined =>
  sh.match(/MEM="\$\{MEMORY_BIN:-([^}]+)\}"/)?.[1];
const manifestBins = (json: string): string[] =>
  Object.keys((JSON.parse(json) as { bin: Record<string, string> }).bin);

describe('the single-home gate is non-vacuous', () => {
  const STALE = `${RUNTIME_BIN}-stale`;

  it('FAILS on a thin shim whose spawn target drifted from the constant', () => {
    const drifted = projectedShim.replace(
      `spawnSync('${RUNTIME_BIN}'`,
      `spawnSync('${STALE}'`,
    );
    expect(drifted).not.toBe(projectedShim); // the mutation actually landed
    expect(spawnedBin(projectedShim)).toBe(RUNTIME_BIN);
    expect(spawnedBin(drifted)).not.toBe(RUNTIME_BIN);
  });

  it('FAILS on a hook worker whose $MEMORY_BIN default drifted', () => {
    const good = read(workerPath);
    const drifted = good.replace(
      `MEMORY_BIN:-${RUNTIME_BIN}}`,
      `MEMORY_BIN:-${STALE}}`,
    );
    expect(drifted).not.toBe(good);
    expect(memFallback(good)).toBe(RUNTIME_BIN);
    expect(memFallback(drifted)).not.toBe(RUNTIME_BIN);
  });

  it('FAILS on a manifest whose `bin` key drifted from the constant', () => {
    const good = read('packages/invoke/package.json');
    const drifted = good.replace(`"${RUNTIME_BIN}":`, `"${STALE}":`);
    expect(drifted).not.toBe(good);
    expect(manifestBins(good)).toEqual([RUNTIME_BIN]);
    expect(manifestBins(drifted)).not.toEqual([RUNTIME_BIN]);
  });

  it('FLAGS a consumer that spells the bin name instead of importing it', () => {
    const clean = read('packages/forge/src/project/runtime-shim.ts');
    const regressed = clean.replace(
      "spawnSync('${RUNTIME_BIN}'",
      `spawnSync('${RUNTIME_BIN}'`,
    );
    expect(regressed).not.toBe(clean);
    expect(clean.includes(`'${RUNTIME_BIN}'`)).toBe(false);
    expect(regressed.includes(`'${RUNTIME_BIN}'`)).toBe(true);
  });
});
