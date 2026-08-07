// hook/rule boundary gate — the `hook` and `rule` source-cell FAMILIES are both
// `Kind ∋ rule` (`activation: rule ↦ scope`; MODEL declares no `hook` Kind and no
// `event` ActivationMode), and their harness artifacts are PROJECTED TARGETS, not
// hand-authored. `rule` now has ONE corpus instance: `src/rules/repo-preamble.ts`
// projects the repo-root `AGENTS.md`. This became legal when the `AGENTS.md@node`
// dream memory-sink route was RETIRED (`src/skills/dream.ts` routes no record to a
// node/plan `AGENTS.md`): the repo-root `AGENTS.md` is no longer SelfAuthored memory,
// so `SelfAuthored ∉ Target` no longer bars it (the earlier S4 conversion, reverted
// while the sink still existed, now holds). A per-NODE/per-PLAN `AGENTS.md` is a
// retired convention — none should be tracked except the curated root and any not-yet-
// swept plan-dir remnant (OUT-OF-SCOPE: not a rule target, awaiting plan retirement).
// Three falsifiers, held here:
//
//   (a) BEHAVIOR-IN-CELL — every in-scope shell hook is owned by a `.ts` source cell,
//       and the repo-root `AGENTS.md` by a `rule` cell; the committed artifact is a
//       deploy target. Enforced by the COVERAGE table (no silent cap): both hook
//       families converted, the root AGENTS.md CONVERTED, every other tracked AGENTS.md
//       classified OUT-OF-SCOPE (a retired-sink remnant no rule cell may target).
//   (b) accept()/REFLEXIVE — each hook + rule cell's canonical RESIDUE passes the
//       static Universal floor (`accept.ts`), and the cells' targets pass REGENERABLE.
//   (c) NO-DIVERGENCE — the committed target == the source cell's bytes, byte-for-
//       byte (`regenerateTargets --check` finds zero drift). A hand-edit fails here.
//
// The BLIND cold-oracle leg (SIGNIFIED/COLD-BLIND as a live decode) is Nico's canon
// review, gated off the hermetic floor exactly as in `reader-density.test.ts`.

import { execFileSync } from 'node:child_process';
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
  allRuleCells,
  cellTargets,
  regenerateTargets,
} from '../tooling/project-targets.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = requireRepoRoot(canonRoot);

// ── COVERAGE — the honest converted-vs-out-of-scope table (no silent cap) ────────
//
// Every convention AGENTS.md in the repo is classified here. `CONVERTED` = a `rule`
// cell owns it (its committed file is a deploy target): the repo-root `AGENTS.md`
// (`src/rules/repo-preamble.ts`). `RATCHET` = a deferred hand-authored rule target —
// EMPTY. `OUT_OF_SCOPE` = a retired-sink remnant a rule cell must NEVER target — every
// tracked NON-root `*AGENTS.md` (a not-yet-swept plan-dir file, awaiting plan
// retirement). A repo AGENTS.md matching none of these FAILS the suite (a new
// convention file cannot be silently un-owned), so the classification is exhaustive.

/** In-scope AGENTS.md a `rule` cell converts — the curated repo-root. */
const CONVERTED_RULE_TARGETS: ReadonlySet<string> = new Set(['AGENTS.md']);

/** Deferred hand-authored rule targets — EMPTY. */
const RATCHET_RULE_TARGETS: ReadonlySet<string> = new Set([]);

/**
 * A tracked NON-root `AGENTS.md` is a retired-sink remnant (a plan-dir file awaiting
 * plan retirement) — OUT-OF-SCOPE for rule conversion; a rule cell must never target
 * one. The repo-root `AGENTS.md` is the rule TARGET (CONVERTED), not out-of-scope.
 */
function isOutOfScope(rel: string): boolean {
  return rel.endsWith('AGENTS.md') && rel !== 'AGENTS.md';
}

/** Every TRACKED `AGENTS.md` (git-listed — no node_modules/dist/render, no untracked). */
function repoAgentsMd(): string[] {
  const out = execFileSync('git', ['ls-files', '--', '*AGENTS.md'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .filter((l) => l.endsWith('AGENTS.md'))
    .sort();
}

// ── the homes map + accept plumbing for the hook + rule cells ───────────────────
//
// ONE ROSTER, TWO KINDS. `hook` and `rule` cells used to be walked by two loops that
// differed in one thing only: the hook read `c.residue` and the rule read
// `c.definiens` — two signs for MODEL's one `residue(c)`, bridged nowhere but here.
// `RuleCell.residue` closed that, and the two loops collapsed into this roster.
//
// What SURVIVES is `definiens: c.residue`, and it is not a bridge: it is the honest
// lift `residue → D`. A cell's authored payload has already paid `∖ fired(α)`; the
// witness input `AcceptCell.definiens` is `D(c)`, the un-adjudicated text
// `parsimonious()` reads in order to re-decide the subtraction for itself. Feeding a
// residue in as D is the STRICTEST reading available — the leg must find nothing
// left to subtract.

// KIND ⊥ FAMILY, and conflating them is what put a fifth member in `AcceptCell`.
// `MODEL.md:10` — `Kind ≜ {fragment, agent, rule, skill}`. There is no `hook` Kind:
// `hook` is what a HARNESS calls its mechanism (`schema/src/hook-cell.ts:6-10`), and
// the cell it names is `Kind ∋ rule`, `activation: rule ↦ scope`. Both families
// therefore enter `accept()` as `kind:'rule'` — see the ground-conformance property
// on `AcceptCell` (`forge/src/validate/accept.ts`) and its gate
// (`ground-conformance.test.ts`). MODEL was NOT amended to admit `hook`.
//
// `family` is what survives the collapse, and it is NOT a Kind: it is the source
// MODULE the cell was walked from (`src/hooks/*.ts` vs `src/rules/*.ts`), and it
// names the HOME (`hook/<id>` vs `rule/<id>`). PARTITIONED quantifies over homes —
// `|home(c)|=1 ∧ disjoint(homes)` — so the two families must stay distinguishable
// there or a hook and a rule sharing an anchor would read as ONE home and the
// collision would go unconvicted. A home id names a module; a Kind names what a
// thing IS. Ground enumerates the second only.

/** A hook/rule source cell at the grain both the homes map and the accept lift read. */
interface SourceCell {
  /** MODEL's `class(c)`. BOTH families are `rule` — there is no `hook` Kind. */
  readonly kind: 'rule';
  /** The source-module family. A HOME namespace, ¬ a Kind (see above). */
  readonly family: 'hook' | 'rule';
  /** α(c) — the anchor the homes map is keyed by. */
  readonly slug: string;
  /** The home id (`<family>/<cell id>`). */
  readonly home: string;
  /** MODEL's `residue(c)` — the σ*-signified identity, post-subtraction. */
  readonly residue: string;
  readonly refs: readonly string[];
}

/** Every hook + rule source cell, family-tagged. The ONE walk over the corpus. */
async function sourceCells(): Promise<SourceCell[]> {
  return [
    ...(await allHookCells()).map(
      (c): SourceCell => ({
        kind: 'rule',
        family: 'hook',
        slug: c.id,
        home: `hook/${c.id}`,
        residue: c.residue,
        refs: c.refs ?? [],
      }),
    ),
    ...(await allRuleCells()).map(
      (c): SourceCell => ({
        kind: 'rule',
        family: 'rule',
        slug: c.slug,
        home: `rule/${c.id}`,
        residue: c.residue,
        refs: c.refs ?? [],
      }),
    ),
  ];
}

/** The accept grain: `residue → D`, the strictest lift (see above), not a bridge. */
function acceptCellOf(c: SourceCell): AcceptCell {
  return { kind: c.kind, slug: c.slug, definiens: c.residue, refs: c.refs };
}

/**
 * One home per hook + rule anchor (the PARTITIONED claim over the source cells).
 *
 * The `hook/<id>` home ids KEEP their prefix and it is not the deleted fifth Kind:
 * a home names the source MODULE that owns the anchor, and PARTITIONED
 * (`|home(c)|=1 ∧ disjoint(homes)`) can only convict a cross-family anchor
 * collision if the two families remain distinguishable in the key.
 */
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

describe('S4 hook/rule boundary — first-class source cells, projected targets', () => {
  it('every shell-hook family is a hook cell (behavior-in-cell)', async () => {
    const ids = (await allHookCells()).map((c) => c.id).sort();
    expect(ids).toEqual([
      'deploy-drift-notice',
      'memory-consolidation-nudge',
      'praxis-continuity',
      'resume-availability-notice',
      'stance-guardrail',
      'stance-guardrail-pre',
    ]);
  });

  it('the only AGENTS.md target is the repo-root rule; every other tracked AGENTS.md is out-of-scope', async () => {
    // an AGENTS.md target is legal ONLY as the repo-root rule (`repo-preamble`); a
    // NODE/PLAN AGENTS.md is a retired sink no cell may target.
    const agentsMdTargets = (await cellTargets())
      .map((t) => t.path)
      .filter((p) => p.endsWith('AGENTS.md'));
    expect(
      agentsMdTargets,
      `AGENTS.md targets (only the repo-root is legal): ${agentsMdTargets.join(', ')}`,
    ).toEqual(['AGENTS.md']);
    const notClassified = repoAgentsMd().filter(
      (rel) => !isOutOfScope(rel) && !CONVERTED_RULE_TARGETS.has(rel),
    );
    expect(
      notClassified,
      `tracked AGENTS.md neither rule-target nor out-of-scope: ${notClassified.join(', ')}`,
    ).toEqual([]);
  });

  // ── (c) NO-DIVERGENCE — committed target == cell bytes, byte-for-byte ──────────
  it('every committed hook + rule target is byte-identical to its source cell', async () => {
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
  it('every hook + rule cell RESIDUE passes the static Universal floor', async () => {
    const homes = await cellHomes();
    const failures: string[] = [];
    // walked as SOURCE cells, not accept cells: the accept `kind` is `rule` for
    // both families now, so the HOME is what still names which cell failed.
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

  // ── (a) COVERAGE — no silent cap; every repo AGENTS.md is classified ────────────
  it('every repo AGENTS.md is classified converted | ratcheted | out-of-scope', () => {
    const all = repoAgentsMd();
    const unclassified = all.filter(
      (rel) =>
        !CONVERTED_RULE_TARGETS.has(rel) &&
        !RATCHET_RULE_TARGETS.has(rel) &&
        !isOutOfScope(rel),
    );
    expect(
      unclassified,
      `unclassified AGENTS.md (classify converted/ratchet/out-of-scope): ${unclassified.join(', ')}`,
    ).toEqual([]);
    // the repo-root AGENTS.md is the sole CONVERTED rule target; ratchet is EMPTY.
    expect(CONVERTED_RULE_TARGETS.size).toBe(1);
    expect(RATCHET_RULE_TARGETS.size).toBe(0);
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
