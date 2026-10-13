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
// WHEN A VERDICT IS NOT ABOUT THE CORPUS. The five above are ways a FIXTURE fails to fail.
// These five are about the ASSERTION: each yields a verdict that is real and reproducible
// and is about something other than the corpus under test. Every one was paid for here, in
// the plan-shape gates this suite retired along with the plan they read — which is the
// reason they are written down at THIS seam. A law about how to build a gate cannot live in
// a gate scoped to one subject, because deleting the subject deletes the law; it lives with
// the meta-gate every gate author must already open to classify a new file.
//
//   A. THE VERDICT TRACKS THE GATE'S OWN SEARCH. A gate that compares the live artifact
//      against the best value a HEURISTIC SEARCH reached is ranking the corpus against
//      that search's luck. Measured: a slice-cut gate ran 40 seeded restarts of swap-based
//      local search and required the live cut to be no worse than the best restart. Adding
//      a plan node with `deps: []` — which cannot change the cross-edge count of ANY
//      assignment — flipped it green→red while the measured quantity stood still at 23,
//      because a 46th node gave the shuffler one more thing to permute. The repair it then
//      demanded was to re-label work that had already landed. Assert what is DECIDABLE and
//      exhaustive (here: no admissible swap improves the cut), never "beat what the search
//      found". A gate whose verdict moves while its subject does not will red on inputs a
//      previous run of the same gate passed.
//   B. A GATE THAT READS HISTORY CANNOT CONVICT THE COMMIT BEING AUTHORED. A scan over
//      `git log` cannot see a commit that does not exist yet, so a violation is convicted
//      on the NEXT run and never on the one that would have blocked it. That is not a
//      fixable oversight at that seam — it is what retrospective MEANS — but it has to be
//      STATED, because a green retrospective gate reads as a pre-commit guarantee and is
//      not one. Measured: `a619f8c9` landed with three under-declared shard-output arrays
//      while the gate that checks them was green; the red appeared only afterwards.
//   C. THE ASSERTION MUST CARRY EVERY GUARD THE LAW IT QUOTES CARRIES. A leg that PRINTS
//      `bound ∧ sharded ∧ ¬done ⇒ frontier ≠ ∅` and ASSERTS `frontier ≠ ∅` unconditionally
//      enforces a strictly stronger law than the one in the cell. That one turned red
//      permanently when the last item completed, and the only way back to green was to add
//      work — a gate that punishes a corpus for satisfying its own law teaches that the
//      terminal state is a failure state. The guarded branch is worth writing rather than
//      skipping, and worth reading twice: `done ⇒ frontier = ∅` is a TAUTOLOGY (`frontier`
//      is a subset of the open states), so what has content is that a corpus reporting DONE
//      LANDED its items rather than LOST them.
//   D. A RATCHET KEY MUST NOT BE POSITIONAL. A shrink-only allowlist keyed on `file:line`
//      breaks every pin below any edited line, so the gate convicts a document for being
//      EDITED. A pin identifies WHICH excused thing is excused; the line it sits on is
//      reporting detail, not identity. Key on the identity, report the position.
//   E. A GATE OVER GENERATED PROSE MUST ASSERT THE DATA, NOT THE FORMATTING. A derived fact
//      written as prose — a table, a list, a rendered summary — round-trips through a
//      formatter. A string compare against it FAILS on reflowed padding and PASSES on wrong
//      content: both directions wrong, and the false red trains the reader to re-baseline.
//      Parse the emitted artifact back to the data it encodes and compare THAT.
//
// AND THE TERMINAL STATE OF A SHRINK-ONLY RATCHET IS DELETION, NOT ∅. A list that has
// shrunk to zero entries is an exemption mechanism with no subject: its `every pin still
// FAILS` leg iterates nothing and reads green for having looked at nothing — hazard 5 with
// a registry instead of a count. Delete the list and its leg; the gate that hosted it gets
// strictly stronger, and a future subject rebuilds the mechanism with something to protect.
//
// DECLARED, NOT DETECTED. The classification below is an explicit registry rather
// than a heuristic over file contents, because a heuristic meta-gate is the very
// failure it exists to catch: it would pass when its own detector silently stopped
// matching. Every test file must appear here, so a new one cannot slip in
// unclassified, and a GATE without a fixture is visible DEBT rather than silence.
//
// ONE META-GATE, FOUR TEST DIRS. This file lived in canon and enumerated
// canon's test dir alone, so every gate in runtime and forge was
// unpoliced — the ones that already carried convicting fixtures
// did so because their authors were told to, not because anything checked. The
// sibling dirs are now read BY PATH, the precedent this corpus already set for a
// cross-package test (`capability-keyspace.test.ts` reads the runtime's
// `CAPABILITIES` as source text rather than invent a package edge to carry a
// test). Per-package
// copies of this mechanism were the alternative, and duplicated gates drift.

import { readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireRepoRoot } from '@cratylus/tooling/repo-root';
import { describe, expect, it } from 'vitest';

const testDir = dirname(fileURLToPath(import.meta.url));
const packages = join(requireRepoRoot(testDir), 'packages');

/** Every policed test dir, keyed by the package that owns it. A registry key is
 *  `<package>/<path-under-test>` — forge nests its suites in subdirs. */
const TEST_ROOTS: Readonly<Record<string, string>> = {
  canon: testDir,
  forge: join(packages, 'forge', 'test'),
  runtime: join(packages, 'runtime', 'test'),
  schema: join(packages, 'schema', 'test'),
};

/**
 * GATE — enumerates the LIVE corpus and asserts an invariant over it. Vacuously
 * green when the corpus is clean, so it owes a convicting fixture.
 * BEHAVIORAL — drives one unit with inputs it supplies itself. Its negative cases
 * ARE its fixtures; a separate convicting test would be ceremony.
 * FROZEN — a cut's frozen checks, registered as their folder (a key ending in `/`
 * classifies every test file under it): only the cut's architect changes them, so
 * this gate classifies them and demands nothing of their bodies.
 */
type Kind = 'GATE' | 'BEHAVIORAL' | 'FROZEN';

const REGISTRY: Readonly<Record<string, Kind>> = {
  // ── canon ────────────────────────────────────────────────────────────
  'canon/architecture.test.ts': 'GATE',
  // scans every tracked authored file's BYTES for a control byte outside tab/newline/CR
  // and for undecodable UTF-8 — the two ways a file stops being text and every text tool
  // goes silently dark on it. Its convicting fixtures drive the same two pure predicates
  // over a planted NUL (built with `String.fromCharCode`, never typed — the harness
  // `Bash` tool refuses a literal one), over every byte in 0x00–0x1F plus DEL, and over a
  // lone UTF-8 continuation byte that carries no control byte at all.
  'canon/authored-source-is-text.test.ts': 'GATE',
  'canon/bin-name-single-home.test.ts': 'GATE',
  'canon/boundary-binding.test.ts': 'GATE',
  // reads the LIVE runtime keyspace, port modules, plugin sites and skill cells;
  // its convicting fixture drives the same three pure predicates over synthetic
  // corpora — including the un-prefixed port module a second hand-written
  // exception would be, which the biconditional has no allowlist to absorb.
  'canon/capability-keyspace.test.ts': 'GATE',
  // censuses the LIVE `*Cell` interfaces in `@cratylus/schema` for one-gloss-one-sign;
  // its convicting fixtures drive the same two pure predicates over the exact source
  // text of the `RuleCell.definiens` / `HookCell.residue` collision it was built from.
  'canon/cell-gloss-census.test.ts': 'GATE',
  // BEHAVIORAL: drives `holder`/`persona` with the role cells and residues it states
  // itself; its refused composition (a persona removing `none`) is its own negative case.
  'canon/compose.test.ts': 'BEHAVIORAL',
  'canon/cratylism.test.ts': 'GATE',
  // BEHAVIORAL: it builds a corpus, a render tree and a deployed `.omp` itself and
  // drives the committed session worker over both, so its negative cases ARE its
  // fixtures. Every SILENT leg is paired with a one-byte mutation of the same host
  // that must make the same worker speak — the control that separates a working
  // in-sync check from one that compared nothing.
  'canon/deploy-drift-notice.test.ts': 'BEHAVIORAL',
  'canon/formal-block-self-sufficiency.test.ts': 'GATE',
  'canon/gate-convicts.test.ts': 'GATE',
  // parses `Kind ≜ {…}` out of the LIVE `MODEL.md` and `AcceptCell.kind` out of the
  // LIVE `accept.ts`, asserting S ⊆ G (never =, so refinement stays legal). Neither
  // side is transcribed — a copy of a ground enumeration is the same defect one
  // level up. Its convicting fixtures drive the same pure property over S∪{widget}
  // and over the exact fifth Kind (`hook`) the gate was built from.
  'canon/ground-conformance.test.ts': 'GATE',
  'canon/hook-rule-boundary.test.ts': 'GATE',
  'canon/projection-stability.test.ts': 'GATE',
  'canon/reader-density.test.ts': 'GATE',
  'canon/reader-reach.test.ts': 'GATE',
  'canon/positional-path.test.ts': 'GATE',
  'canon/version-single-home.test.ts': 'GATE',
  // BEHAVIORAL, not GATE: it exercises a helper's four resolution cases. It polices no
  // property of the corpus — the law that no path is built from a hop COUNT is a gate
  // this plan still owes, and it is a different file.
  'canon/repo-root.test.ts': 'BEHAVIORAL',
  'canon/runtime-shim.test.ts': 'BEHAVIORAL',
  'canon/skill-shape.test.ts': 'GATE',
  'canon/symbol-altitude.test.ts': 'GATE',
  'canon/symbol-probe-gate.test.ts': 'GATE',
  'canon/symbols.test.ts': 'GATE',
  // The simplification cut's frozen checks (decisions 0142-0145), the whole folder.
  'canon/simplification/': 'FROZEN',

  // ── forge ────────────────────────────────────────────────────────────
  // Drives the omp adapter with bindings and agents it supplies itself; its
  // negative cases are its own fixtures (an unrealizable event, an absent
  // mechanism, a non-blocking event that must not claim to block).
  'forge/adapters/omp.test.ts': 'BEHAVIORAL',
  // drives `agentBody` over a small catalog and agents it supplies itself; its refused
  // vector (a text factor that is not a list of entries) is its own negative case.
  'forge/core/agent-body.test.ts': 'BEHAVIORAL',
  // the projection half of the old `anatomy/enforcing.test.ts` — drives `agentBody`
  // with an enforcing value it supplies itself. Its shape half went to schema.
  'forge/core/agent-body-enforcing.test.ts': 'BEHAVIORAL',
  // drives the slots-dimension reader over vectors it builds itself, an optional slot left unfilled.
  'forge/core/vector-slots.test.ts': 'BEHAVIORAL',
  // reads the FIXTURE corpus's own dimension dir listing against its descriptor.
  'forge/catalog/manifest-descriptor.test.ts': 'GATE',
  'forge/catalog/discover.test.ts': 'BEHAVIORAL',
  // enumerates the FIXTURE corpus, asserting a shape invariant over EVERY value.
  'forge/catalog/enumerate.test.ts': 'GATE',
  // walks the LIVE tree outside the notebook's records for owed-signification markers in
  // ANY form.
  // Built after a census anchored on one punctuation variant reported "exactly one" and
  // missed a second marker four lines away — so its two convicting fixtures plant BOTH
  // historical forms, and the em-dash one additionally asserts the census's own
  // colon-anchored pattern reads that planted file as clean.
  'forge/catalog/signify-marker-class.test.ts': 'GATE',
  // drives `runCatalog` against a tmpdir corpus it writes itself (zero-config path).
  'forge/cli/catalog.test.ts': 'BEHAVIORAL',
  'forge/cli/cli.test.ts': 'BEHAVIORAL',
  'forge/cli/compose.test.ts': 'BEHAVIORAL',
  'forge/cli/explain.test.ts': 'BEHAVIORAL',
  'forge/config/loader.test.ts': 'BEHAVIORAL',
  'forge/config/scaffold.test.ts': 'BEHAVIORAL',
  'forge/core/runtime-shim-binding.test.ts': 'BEHAVIORAL',
  // builds a DRIFTED host and a SYNCED one itself and drives `auditLocal` over both; it
  // also carries an encoded control — the pre-existing machinery fed the same drifted host
  // and asserted SILENT, which is the defect held green in perpetuity.
  'forge/deploy/check.test.ts': 'BEHAVIORAL',
  'forge/deploy/cli.test.ts': 'BEHAVIORAL',
  // drives `addModelRoles` and install/uninstall over host configs it writes itself,
  // including a document it must refuse and a `--model-roles` name no agent has.
  'forge/deploy/model-roles.test.ts': 'BEHAVIORAL',
  // links and relinks the owned root into a temp host's plugin directory, leaving the
  // reference places the host holds otherwise.
  'forge/deploy/owned-root.test.ts': 'BEHAVIORAL',
  // exercises the OMP status-line config editor and install path, including byte-preserving
  // edits, custom layouts, host-owned settings, and dry-run behavior.
  'forge/deploy/status-line.test.ts': 'BEHAVIORAL',
  // covers generic manifest line-edit behavior without depending on a harness
  // integration or the deleted workflow artifacts.
  'forge/deploy/uninstall.test.ts': 'BEHAVIORAL',
  // drives install and uninstall over a fixture home holding an earlier install's
  // persona launcher, overlay, badge and linked command, and asserts each is removed.
  'forge/deploy/retired-launch.test.ts': 'BEHAVIORAL',
  // drives scaffoldProject with a supplied OMP harness home and asserts its `.omp` path.
  'forge/deploy/init-harness-home.test.ts': 'BEHAVIORAL',
  // drives `probeRuntimeBin`/`assertShimsResolvable` against stranded and live host
  // fixtures it builds itself, with the real shim bytes.
  'forge/deploy/runtime-bin-resolvable.test.ts': 'BEHAVIORAL',
  'forge/deploy/local.test.ts': 'BEHAVIORAL',
  'forge/deploy/prune.test.ts': 'BEHAVIORAL',
  'forge/project/realization.test.ts': 'BEHAVIORAL',
  // projects fixture plugins it writes itself; its refusals (an unclosed handoff, a
  // module named by file, duplicate names, a module exporting no Agent) are its fixtures.
  'forge/project/practice-closure.test.ts': 'BEHAVIORAL',
  'forge/project/skill-closure.test.ts': 'BEHAVIORAL',
  // OMP keeps oversized skills available without a main-session hook.
  'forge/project/skill-hook-cap.test.ts': 'BEHAVIORAL',
  // asserts the unpatched fold is the identity over the real canon fragment corpus.
  'forge/project/resolver-parity.test.ts': 'GATE',
  // asserts the live `src/project/index.ts` source performs no writes.
  // drives `writeRenderTree` against trees it builds itself, including a hand-edited
  // record with an escaping path — the prune's negative half, which a positive-only
  // control would leave open.
  'forge/project/write-prune.test.ts': 'BEHAVIORAL',
  'forge/project/tree.test.ts': 'GATE',
  // BEHAVIORAL: it projects a fixture plugin it owns under OMP and reads the emitted
  // worker bytes back. Its derivation half is convicted the same way — `binNameOf`
  // is fed synthetic manifests, including the two it must refuse.
  'forge/project/projection-facts.test.ts': 'BEHAVIORAL',
  'forge/validate/enforced.test.ts': 'BEHAVIORAL',
  'forge/resolve/provenance.test.ts': 'BEHAVIORAL',
  'forge/resolve/resolve.test.ts': 'BEHAVIORAL',
  // the story meta-gates: scans the live E*/ suites for coverage + silencers.
  'forge/stories/coverage.test.ts': 'GATE',
  'forge/stories/E6/S1.accept-gate-manifest.test.ts': 'BEHAVIORAL',
  'forge/stories/E6/S2.prose-to-skill-cell.test.ts': 'BEHAVIORAL',
  'forge/stories/E6/S3.agent-elevation.test.ts': 'BEHAVIORAL',
  'forge/stories/E6/S4.elicit-markers.test.ts': 'BEHAVIORAL',
  'forge/stories/E6/S5.idempotence.test.ts': 'BEHAVIORAL',
  'forge/stories/E6/S7.opt-in-lossless.test.ts': 'BEHAVIORAL',

  // ── runtime ──────────────────────────────────────────────────────────
  // Checks execution/output/rubric examples plus held-out secrecy and
  // capability-protected red-first freeze behavior using fixtures it supplies.
  'runtime/example-substrate.test.ts': 'BEHAVIORAL',
  'runtime/brand-derived-literals.test.ts': 'GATE',
  // drives `dispatchConcepts` over scratch git repositories it builds itself; its
  // refusals (a flag given twice, a journal entry that is not one, a directory
  // outside git) ARE its fixtures.
  'runtime/concepts.test.ts': 'BEHAVIORAL',
  // asserts over the live concept journal declaration and cratylus's own live design:
  // each verb's concept is a live concept, its help says what it explains, and what
  // it calls required is refused without. A verb whose concept the design retired,
  // in a scratch journal, convicts it.
  'runtime/explanation.test.ts': 'GATE',
  // runs the leakage detector over text it supplies and the journal verbs in scratch git
  // repositories it builds itself; its leaking and plain passages ARE its fixtures.
  'runtime/leakage.test.ts': 'BEHAVIORAL',
  // reads cuts' phases over ledgers it builds itself and over the repository's own
  // ledger, which it reads and never writes: integration settles a cut's phase.
  'runtime/ledger/checks.test.ts': 'BEHAVIORAL',
  // runs the pure ledger fold over entries it builds itself: statuses, approval by two
  // distinct assayers, failing and disputed packages, phase, ready, figures, report.
  'runtime/ledger/fold.test.ts': 'BEHAVIORAL',
  // runs the ledger store, lifecycle, open, integrate and completion check in
  // throwaway git repos; its refused repeated transitions and integration by a
  // non-architect, and its warnings, ARE its fixtures.
  'runtime/ledger/ledger.test.ts': 'BEHAVIORAL',
  // runs the pure context overview over designs, decisions and cuts it builds itself:
  // whole before parts, named cycles, and the account told in that order.
  'runtime/overview/overview.test.ts': 'BEHAVIORAL',
  // drives `runCli` in a temporary git repository it builds itself; its refusals (a
  // capability's, a first word that is no capability) ARE its fixtures.
  'runtime/main.test.ts': 'BEHAVIORAL',
  // races producers and drainers against a store in temp dirs it makes itself.
  'runtime/provisional-mailbox.test.ts': 'BEHAVIORAL',
  // writes, folds and merges records in temp repositories it builds itself; its
  // refusals (an existing record id, another entity's version) ARE its fixtures.
  'runtime/record-store.test.ts': 'BEHAVIORAL',
  'runtime/runtime-config.test.ts': 'BEHAVIORAL',
  // reads and appends to concept journals it writes itself in scratch repositories;
  // its unknown-kind and unreadable entries ARE its fixtures.
  'runtime/tolerant-reader.test.ts': 'BEHAVIORAL',
  'runtime/ulid.test.ts': 'BEHAVIORAL',
  // the live capabilities' verbs are each checked for a summary, a positional and a
  // description of every flag; a verb and a flag it leaves unsaid are its fixtures.
  'runtime/verb-descriptions.test.ts': 'GATE',
  // drives `dispatchWorkPackage` over scratch git repositories it builds itself;
  // its refusals (an overlapping output, an unowned need, a commit git refuses)
  // and its warning (a commit outside the package's outputs) ARE its fixtures.
  'runtime/work-package.test.ts': 'BEHAVIORAL',

  // ── schema ───────────────────────────────────────────────────────────
  // drives `enforcing`/`bodyOf`/`withBody`/`isDimensionValue` with values it
  // supplies itself; its negative cases ARE its fixtures.
  'schema/enforcing.test.ts': 'BEHAVIORAL',
  // drives `checkAssignment`/`assignmentIn` with schemas and assignments it supplies;
  // its missing and ill-typed assignments ARE its fixtures.
  'schema/contract.test.ts': 'BEHAVIORAL',
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

/** A test file's kind: its own entry, else the entry of the registered folder
 *  holding it. */
function kindOf(file: string): Kind | undefined {
  return (
    REGISTRY[file] ??
    Object.entries(REGISTRY).find(
      ([key]) => key.endsWith('/') && file.startsWith(key),
    )?.[1]
  );
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
      (f) => kindOf(f) === undefined,
    );
    expect(
      unclassified,
      `classify these in REGISTRY (GATE | BEHAVIORAL): ${unclassified.join(', ')}`,
    ).toEqual([]);
  });

  it('the registry names no file that no longer exists, nor a folder holding none (shrink-only)', () => {
    const present = [...testFiles().keys()];
    const stale = Object.keys(REGISTRY).filter((key) =>
      key.endsWith('/')
        ? !present.some((f) => f.startsWith(key))
        : !present.includes(key),
    );
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
