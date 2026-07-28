// THE META-GATE — every gate ships a fixture that CONVICTS it.
//
// A corpus-scanning gate is green in two indistinguishable situations: the corpus
// is clean, or the gate is DARK. "No violation was ever reported" is evidence of
// the first only if the gate is known to be capable of reporting one. Every gate
// here therefore owes at least one test that feeds it a synthetic BAD input and
// asserts it rejects — the known-answer control that separates the two cases.
//
// WHEN A CONTROL IS NOT A CONTROL. A convicting fixture only separates clean-from-dark
// if the fixture itself can fail. Five ways it silently cannot, each observed while
// building the gates in this suite — not hypothetical:
//
//   1. THE INJECTION NEVER LANDED. A malformed edit (a bad regex, a quoting error)
//      leaves the artifact untouched and the suite green. Assert the defect is PRESENT
//      before reading the result; a green control is untested until you have proven the
//      defect was actually there.
//   2. THE CONTROL EXERCISES A DIFFERENT PATH. A control that succeeds by a mechanism
//      the test does not use proves only that the mechanism works. It must travel the
//      same path as the thing under test, or it is a demonstration, not a control.
//   3. THE CASE IS ALREADY EXEMPTED. Injecting a violation that the allowlist under test
//      already excuses cannot fire, however well-formed. Check the injected case is not
//      covered by the very registry being exercised.
//   4. THE HAYSTACK CONTAINS THE NEEDLE BY CONSTRUCTION. Where a payload embeds a copy
//      of what is being searched for — a judge prompt carrying the whole turn, a log
//      carrying the query — substring search is structurally incapable of answering.
//      Only record IDENTITY decides.
//   5. THE NEGATIVE WAS NEVER VERIFIED. A zero count from a hand-built pattern is a
//      claim about the PATTERN until proven otherwise. Verify a negative read exactly as
//      carefully as a positive one.
//
// The common shape: each produces a PASS that reads as evidence and carries none. A gate
// calibrated by such a control is dark with a certificate.
//
// DECLARED, NOT DETECTED. The classification below is an explicit registry rather
// than a heuristic over file contents, because a heuristic meta-gate is the very
// failure it exists to catch: it would pass when its own detector silently stopped
// matching. Every test file must appear here, so a new one cannot slip in
// unclassified, and a GATE without a fixture is visible DEBT rather than silence.
//
// ONE META-GATE, FOUR TEST DIRS. This file lived in agent-canon and enumerated
// agent-canon's test dir alone, so every gate in agent-memory, agent-runtime and
// agent-forge was unpoliced — the three that already carried convicting fixtures
// did so because their authors were told to, not because anything checked. The
// sibling dirs are now read BY PATH, the precedent this corpus already set for a
// cross-package test (`event-tap-cell.test.ts` and agent-memory's
// `cell-verb-roster.test.ts` both read sibling SOURCE by path rather than invent a
// package edge to carry a test). Per-package copies of this mechanism were the
// alternative, and duplicated gates drift.

import { readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testDir = dirname(fileURLToPath(import.meta.url));
const packages = join(testDir, '..', '..');

/** Every policed test dir, keyed by the package that owns it. A registry key is
 *  `<package>/<path-under-test>` — agent-forge nests its suites in subdirs. */
const TEST_ROOTS: Readonly<Record<string, string>> = {
  'agent-canon': testDir,
  'agent-forge': join(packages, 'agent-forge', 'test'),
  'agent-memory': join(packages, 'agent-memory', 'test'),
  'agent-runtime': join(packages, 'agent-runtime', 'test'),
};

/**
 * GATE — enumerates the LIVE corpus and asserts an invariant over it. Vacuously
 * green when the corpus is clean, so it owes a convicting fixture.
 * BEHAVIORAL — drives one unit with inputs it supplies itself. Its negative cases
 * ARE its fixtures; a separate convicting test would be ceremony.
 */
type Kind = 'GATE' | 'BEHAVIORAL';

const REGISTRY: Readonly<Record<string, Kind>> = {
  // ── agent-canon ────────────────────────────────────────────────────────────
  'agent-canon/bin-name-single-home.test.ts': 'GATE',
  'agent-canon/boundary-binding.test.ts': 'GATE',
  'agent-canon/cratylism.test.ts': 'GATE',
  'agent-canon/event-tap-cell.test.ts': 'GATE',
  'agent-canon/formal-block-self-sufficiency.test.ts': 'GATE',
  'agent-canon/gate-convicts.test.ts': 'GATE',
  'agent-canon/hook-rule-boundary.test.ts': 'GATE',
  'agent-canon/memory-nudge.test.ts': 'BEHAVIORAL',
  'agent-canon/null-dimension.test.ts': 'GATE',
  'agent-canon/plan-set.test.ts': 'GATE',
  'agent-canon/projection-stability.test.ts': 'GATE',
  'agent-canon/reader-density.test.ts': 'GATE',
  'agent-canon/reader-reach.test.ts': 'GATE',
  'agent-canon/runtime-shim.test.ts': 'BEHAVIORAL',
  'agent-canon/skill-shape.test.ts': 'GATE',
  // twin of memory-nudge: drives the guardrail worker with a broken judge it supplies
  // itself, and carries its own negative control (opted-out ⇒ silent).
  'agent-canon/stance-guardrail-dark.test.ts': 'BEHAVIORAL',
  'agent-canon/structural-parsimony.test.ts': 'GATE',
  'agent-canon/symbol-altitude.test.ts': 'GATE',
  'agent-canon/symbol-probe-gate.test.ts': 'GATE',
  'agent-canon/symbols.test.ts': 'GATE',

  // ── agent-forge ────────────────────────────────────────────────────────────
  'agent-forge/anatomy/enforcing.test.ts': 'BEHAVIORAL',
  'agent-forge/anatomy/project-human.test.ts': 'BEHAVIORAL',
  // reads agent-canon's live `src/dimensions` dir listing against the descriptor.
  'agent-forge/catalog/anatomy-descriptor.test.ts': 'GATE',
  'agent-forge/catalog/discover.test.ts': 'BEHAVIORAL',
  // enumerates the live canon catalog, asserting a shape invariant over EVERY value.
  'agent-forge/catalog/enumerate.test.ts': 'GATE',
  'agent-forge/cli/cli.test.ts': 'BEHAVIORAL',
  'agent-forge/cli/compose.test.ts': 'BEHAVIORAL',
  'agent-forge/cli/explain.test.ts': 'BEHAVIORAL',
  'agent-forge/config/loader.test.ts': 'BEHAVIORAL',
  'agent-forge/config/scaffold.test.ts': 'BEHAVIORAL',
  'agent-forge/core/runtime-shim-binding.test.ts': 'BEHAVIORAL',
  'agent-forge/deploy/cli.test.ts': 'BEHAVIORAL',
  'agent-forge/deploy/hooks.test.ts': 'BEHAVIORAL',
  'agent-forge/deploy/integrate-smoke.test.ts': 'BEHAVIORAL',
  'agent-forge/deploy/local.test.ts': 'BEHAVIORAL',
  'agent-forge/deploy/prune.test.ts': 'BEHAVIORAL',
  'agent-forge/project/bindings.test.ts': 'BEHAVIORAL',
  'agent-forge/project/refusal.test.ts': 'BEHAVIORAL',
  // asserts the unpatched fold is the identity over the real canon fragment corpus.
  'agent-forge/project/resolver-parity.test.ts': 'GATE',
  // asserts the live `src/project/index.ts` source performs no writes.
  'agent-forge/project/tree.test.ts': 'GATE',
  'agent-forge/resolve/provenance.test.ts': 'BEHAVIORAL',
  'agent-forge/resolve/resolve.test.ts': 'BEHAVIORAL',
  // the story meta-gates: scans the live E*/ suites for coverage + silencers.
  'agent-forge/stories/coverage.test.ts': 'GATE',
  'agent-forge/stories/E6/S1.accept-gate-manifest.test.ts': 'BEHAVIORAL',
  'agent-forge/stories/E6/S2.prose-to-skill-cell.test.ts': 'BEHAVIORAL',
  'agent-forge/stories/E6/S3.agent-elevation.test.ts': 'BEHAVIORAL',
  'agent-forge/stories/E6/S4.elicit-markers.test.ts': 'BEHAVIORAL',
  'agent-forge/stories/E6/S5.idempotence.test.ts': 'BEHAVIORAL',
  'agent-forge/stories/E6/S7.opt-in-lossless.test.ts': 'BEHAVIORAL',

  // ── agent-memory ───────────────────────────────────────────────────────────
  'agent-memory/audit.test.ts': 'BEHAVIORAL',
  'agent-memory/cell-verb-roster.test.ts': 'GATE',
  'agent-memory/cli.test.ts': 'BEHAVIORAL',
  'agent-memory/dream.test.ts': 'BEHAVIORAL',
  'agent-memory/liveness-read-drain.test.ts': 'BEHAVIORAL',
  'agent-memory/lock.test.ts': 'BEHAVIORAL',
  'agent-memory/migrate-memory.test.ts': 'BEHAVIORAL',
  'agent-memory/migrate.test.ts': 'BEHAVIORAL',
  'agent-memory/node.test.ts': 'BEHAVIORAL',
  'agent-memory/session-isolation-integration.test.ts': 'BEHAVIORAL',
  'agent-memory/session.test.ts': 'BEHAVIORAL',
  // pins a ceiling calibrated against the live store corpus — the reading that
  // makes it vacuously green if the calibration ever stops biting.
  'agent-memory/store-ceiling.test.ts': 'GATE',
  'agent-memory/store.test.ts': 'BEHAVIORAL',
  'agent-memory/strategy.test.ts': 'BEHAVIORAL',
  'agent-memory/ulid.test.ts': 'BEHAVIORAL',
  'agent-memory/verb-roster.test.ts': 'GATE',

  // ── agent-runtime ──────────────────────────────────────────────────────────
  'agent-runtime/brand-derived-literals.test.ts': 'GATE',
  // the DAG-guard leg scans every capability source file for a forge import.
  'agent-runtime/event-tap.test.ts': 'GATE',
  'agent-runtime/kernel.test.ts': 'BEHAVIORAL',
  // the "unregistered" leg scans loader/plugin/package/tsup for the placeholder.
  'agent-runtime/provisional-v9.test.ts': 'GATE',
  'agent-runtime/runtime-config.test.ts': 'BEHAVIORAL',
};

/** The vocabulary a convicting fixture announces itself in, as the corpus already
 *  writes it: `FAILS on …`, `FLAGS a …`, `is non-vacuous — …`, `REFUSES …`,
 *  `rejects …`, `… convicts it`. Widening this set is legitimate only for a form
 *  that genuinely feeds a BAD input and asserts rejection — widening it to silence
 *  a naked gate is the appeasement it exists to prevent. */
const CONVICTS =
  /it\([\s\n]*['"`][^'"`]*(non-vacuous|convicts|FAILS|FLAGS|REFUSES|rejects)/i;

/** Every `*.test.ts` under `dir`, recursively, as `/`-joined relative paths. */
function testFilesUnder(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const path = join(d, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.test.ts'))
        out.push(relative(dir, path).split(sep).join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

/** The live corpus: `<package>/<path>` → absolute path, across all four roots. */
function testFiles(): Map<string, string> {
  const found = new Map<string, string>();
  for (const [pkg, root] of Object.entries(TEST_ROOTS))
    for (const rel of testFilesUnder(root))
      found.set(`${pkg}/${rel}`, join(root, rel));
  return found;
}

describe('META-GATE — a gate without a convicting fixture is indistinguishable from a dark one', () => {
  it('reaches every policed test dir — a root that scanned empty is a DARK scan, not a clean one', () => {
    // Without this, a mistyped or moved root path would silently police nothing
    // and the three checks below would pass over files they never saw.
    const present = [...testFiles().keys()];
    for (const pkg of Object.keys(TEST_ROOTS))
      expect(
        present.filter((f) => f.startsWith(`${pkg}/`)).length,
        `no test file found under ${pkg} — the scan is DARK, not the dir empty`,
      ).toBeGreaterThan(0);
  });

  it('every test file is classified — a new one cannot slip in unclassified', () => {
    const unclassified = [...testFiles().keys()].filter(
      (f) => REGISTRY[f] === undefined,
    );
    expect(
      unclassified,
      `classify these in REGISTRY (GATE | BEHAVIORAL): ${unclassified.join(', ')}`,
    ).toEqual([]);
  });

  it('the registry names no file that no longer exists (shrink-only)', () => {
    const present = testFiles();
    const stale = Object.keys(REGISTRY).filter((f) => !present.has(f));
    expect(stale, `remove from REGISTRY: ${stale.join(', ')}`).toEqual([]);
  });

  it('every GATE ships at least one fixture that CONVICTS it', async () => {
    const present = testFiles();
    const naked: string[] = [];
    for (const [file, kind] of Object.entries(REGISTRY)) {
      if (kind !== 'GATE') continue;
      const path = present.get(file);
      if (path === undefined) continue; // the shrink-only check owns that failure
      const src = await readFile(path, 'utf8');
      if (!CONVICTS.test(src)) naked.push(file);
    }
    expect(
      naked,
      `GATEs with no convicting fixture — each is green whether the corpus is clean or the gate is dark:\n${naked.join('\n')}`,
    ).toEqual([]);
  });

  // The meta-gate's own convicting fixture. Without it this file would be the one
  // unpoliced gate in the suite — which is precisely the shape it exists to reject.
  it('is non-vacuous — the detector REFUSES a gate body with no convicting test', () => {
    const clean = `it('every cell conforms', () => { expect(bad).toEqual([]); });`;
    expect(CONVICTS.test(clean)).toBe(false);
    for (const form of [
      `it('FAILS on an injected violation', () => {});`,
      `it('FLAGS a \`--\` comment marker', () => {});`,
      `it('is non-vacuous — the predicate convicts it', () => {});`,
      `it('REFUSES a malformed cell', () => {});`,
    ])
      expect(CONVICTS.test(form), form).toBe(true);
  });
});
