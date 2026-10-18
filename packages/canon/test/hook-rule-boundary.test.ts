// hook boundary gate — `hook` source cells are `Kind ∋ rule` (`activation: rule ↦
// scope`; there is no `hook` Kind and no `event` ActivationMode), and their harness
// artifacts are PROJECTED TARGETS, not hand-authored. Three falsifiers, held here:
//
//   (a) BEHAVIOR-IN-CELL — every in-scope shell hook is owned by a `.ts` source cell;
//       the committed artifact is a deploy target.
//   (b) accept()/REFLEXIVE — each hook cell's canonical RESIDUE passes the static
//       Universal floor (`accept.ts`), and the cells' targets pass REGENERABLE.
//   (c) NO-DIVERGENCE — the committed target == the source cell's bytes, byte-for-
//       byte (`regenerateTargets --check` finds zero drift). A hand-edit fails here.
//
// The BLIND cold-oracle leg (SIGNIFIED/COLD-BLIND as a live decode, each cell read in the
// corpus context, `corpusContext`) is the architect's canon review, gated off the
// hermetic floor exactly as in `reader-density.test.ts`.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type AcceptCell,
  type Homes,
  type Leg,
  type Target,
  failingLegs,
  regenerable,
  universalCell,
} from '@cratylus/forge/validate';
import { requireRepoRoot } from '@cratylus/tooling/repo-root';
import { describe, expect, it } from 'vitest';
import { canonPolicy } from '../tooling/cold-oracle/policy.js';
import {
  allHookCells,
  cellTargets,
  regenerateTargets,
} from '../tooling/project-targets.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = requireRepoRoot(canonRoot);

// ── the homes map + accept plumbing for the hook cells ──────────────────────────
//
// `definiens: c.residue` is the honest lift `residue → D`. A cell's authored payload
// carries the workflow's residue and never restates what its anchor invokes; the
// witness input `AcceptCell.definiens` is `D(c)`, the un-adjudicated text
// `parsimonious()` reads in order to re-decide that for itself. Feeding a residue in
// as D is the STRICTEST reading available — the leg must find nothing of the anchor
// restated.
//
// There is no `hook` Kind: `hook` is what a HARNESS calls its mechanism
// (`schema/src/hook-cell.ts`), and the cell it names is `Kind ∋ rule`, so a hook
// cell enters `accept()` as `kind:'rule'` (`forge/src/validate/accept.ts`). Its HOME
// (`hook/<id>`) names the source module, which is a different thing from a Kind.

/** A hook source cell at the grain both the homes map and the accept lift read. */
interface SourceCell {
  /** `class(c)` — `rule`; there is no `hook` Kind. */
  readonly kind: 'rule';
  /** α(c) — the anchor the homes map is keyed by. */
  readonly slug: string;
  /** The home id (`hook/<cell id>`). */
  readonly home: string;
  /** `residue(c)` — the σ*-signified identity, the workflow's residue of its anchor. */
  readonly residue: string;
  readonly refs: readonly string[];
}

/** Every hook source cell. The ONE walk over the corpus. */
async function sourceCells(): Promise<SourceCell[]> {
  return (await allHookCells()).map(
    (c): SourceCell => ({
      kind: 'rule',
      slug: c.id,
      home: `hook/${c.id}`,
      residue: c.residue,
      refs: c.refs ?? [],
    }),
  );
}

/** The accept grain: `residue → D`, the strictest lift (see above), not a bridge. */
function acceptCellOf(c: SourceCell): AcceptCell {
  return { kind: c.kind, slug: c.slug, definiens: c.residue, refs: c.refs };
}

/** One home per hook anchor (the PARTITIONED claim over the source cells). */
async function cellHomes(): Promise<Homes> {
  const homes = new Map<string, string[]>();
  for (const c of await sourceCells()) {
    const b = homes.get(c.slug) ?? [];
    b.push(c.home);
    homes.set(c.slug, b);
  }
  return homes;
}

/** A cell's committed targets, lifted to the accept `Target` shape (REGENERABLE). */
function targetOf(path: string): Target {
  return { path, deployOwned: true, handEdited: false, selfAuthored: false };
}

// ── accept() ratchet — explicit, shrink-only (mirrors reader-density) ───────────
/** {slug, leg} pins for a cell knowingly failing a static leg. Empty ⇔ clean floor. */
const ACCEPT_RATCHET: ReadonlyArray<{ slug: string; leg: Leg }> = [];

describe('hook boundary — first-class source cells, projected targets', () => {
  it('every shell-hook family is a hook cell (behavior-in-cell)', async () => {
    const ids = (await allHookCells()).map((c) => c.id).sort();
    expect(ids).toEqual(['deploy-drift-notice']);
  });

  // ── (c) NO-DIVERGENCE — committed target == cell bytes, byte-for-byte ──────────
  it('every committed hook target is byte-identical to its source cell', async () => {
    for (const t of await cellTargets()) {
      const abs = join(repoRoot, t.path);
      expect(existsSync(abs), `${t.path} exists (${t.source})`).toBe(true);
      const committed = readFileSync(abs, 'utf8');
      expect(committed, `${t.path} == cell(${t.source}) byte-for-byte`).toBe(
        t.content,
      );
    }
  });

  it('is non-vacuous — the byte-identity predicate FAILS on one mutated character', async () => {
    // The gate above passes on a clean tree whether its comparison is real or has
    // silently become a no-op. Convict it by running THE SAME predicate over a
    // live target's own bytes, perturbed by a single trailing space.
    const identical = (committed: string, cell: string): boolean =>
      committed === cell;

    const targets = await cellTargets();
    expect(targets.length, 'a target to convict with').toBeGreaterThan(0);
    const t = targets[0] as { path: string; content: string };

    // the control: the real bytes must PASS, or the fixture proves nothing
    const real = readFileSync(join(repoRoot, t.path), 'utf8');
    expect(identical(real, t.content), `${t.path} control`).toBe(true);
    // the conviction: one character of drift must be caught
    expect(identical(`${real} `, t.content)).toBe(false);
  });

  it('regenerateTargets --check reports zero drift (deterministic projection)', async () => {
    const { drift } = await regenerateTargets({ check: true });
    expect(drift, `drifted targets: ${drift.join(', ')}`).toEqual([]);
  });

  // ── the byte-lock's NEW blind spot, closed ──────────────────────────────────────
  it('no committed target ships an unresolved `{{…}}` placeholder', async () => {
    // The byte-lock above compares the committed file to `cellTargets()`, and
    // `cellTargets()` now RESOLVES each worker template. That comparison is still
    // exact — but it is exact against whatever the resolver produced, so a template
    // and a target that carry the SAME literal `{{fact:…}}` agree perfectly and ship
    // a placeholder to a host.
    //
    // `resolveWorker` throws on an UNKNOWN placeholder, which covers a typo. What it
    // cannot cover is a fact added to a template while some emission path still
    // copies `cell.workers` raw — then the placeholder is known, the resolver is
    // never asked, and nothing upstream notices. This leg is that check, and it is
    // cheap: the grammar is closed, so `{{` in a committed target is never anything
    // but an escape.
    for (const t of await cellTargets()) {
      const abs = join(repoRoot, t.path);
      const committed = readFileSync(abs, 'utf8');
      expect(
        committed.includes('{{'),
        `${t.path} (${t.source}) ships an unresolved placeholder`,
      ).toBe(false);
    }
  });

  // ── (b) accept()/REFLEXIVE — the static Universal floor over every hook cell ─────
  it('every hook cell RESIDUE passes the static Universal floor', async () => {
    const homes = await cellHomes();
    const failures: string[] = [];
    // walked as SOURCE cells, not accept cells: the HOME is what names which cell
    // failed.
    for (const source of await sourceCells()) {
      const cell: AcceptCell = acceptCellOf(source);
      const failing = failingLegs(
        universalCell(cell, homes, canonPolicy),
      ).filter(
        (leg) =>
          !ACCEPT_RATCHET.some((p) => p.slug === cell.slug && p.leg === leg),
      );
      if (failing.length) {
        failures.push(`${source.home}: ${failing.join(',')}`);
      }
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('the cells’ deploy targets pass REGENERABLE (deploy-owned, ¬hand-edit)', async () => {
    const targets = (await cellTargets()).map((t) => targetOf(t.path));
    expect(failingLegs([regenerable(targets)])).toEqual([]);
  });

  it('the accept ratchet is explicit + shrink-only (empty ⇔ clean floor)', async () => {
    const homes = await cellHomes();
    const bySlug = new Map<string, AcceptCell>(
      (await sourceCells()).map((c) => [c.slug, acceptCellOf(c)]),
    );
    for (const pin of ACCEPT_RATCHET) {
      const cell = bySlug.get(pin.slug);
      expect(cell, `ratchet pin ${pin.slug} names a live cell`).toBeDefined();
      expect(
        failingLegs(universalCell(cell as AcceptCell, homes, canonPolicy)),
        `pin ${pin.slug} no longer fails ${pin.leg} — REMOVE it`,
      ).toContain(pin.leg);
    }
  });

  // ── projection stability — every hook cell imports + carries a payload ──────────
  it('every hook cell carries ≥1 worker with non-empty content', async () => {
    for (const c of await allHookCells()) {
      expect(c.workers.length, `${c.id} has workers`).toBeGreaterThan(0);
      for (const w of c.workers) {
        expect(w.content.length, `${c.id}/${w.filename}`).toBeGreaterThan(0);
        expect(relative(repoRoot, join(repoRoot, w.targetPath))).toBe(
          w.targetPath,
        );
      }
    }
  });
});
