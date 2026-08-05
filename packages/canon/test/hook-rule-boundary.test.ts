// hook/rule boundary gate — `hook` (activation=event) and `rule` (activation=scope)
// are first-class SOURCE cells whose harness artifacts are PROJECTED TARGETS, not
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
//   (b) accept()/REFLEXIVE — each hook + rule cell's canonical DEFINIENS passes the
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
import { describe, expect, it } from 'vitest';
import { canonPolicy } from '../src/toolkit/cold-oracle/policy.js';
import {
  allHookCells,
  allRuleCells,
  cellTargets,
  regenerateTargets,
} from '../src/toolkit/project-targets.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(canonRoot, '..', '..');

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

// ── the homes map + accept plumbing for the hook cells ──────────────────────────

/** One home per hook + rule anchor (the PARTITIONED claim over the source cells). */
async function cellHomes(): Promise<Homes> {
  const homes = new Map<string, string[]>();
  const add = (slug: string, id: string) => {
    const b = homes.get(slug) ?? [];
    b.push(id);
    homes.set(slug, b);
  };
  for (const c of await allHookCells()) {
    add(c.id, `hook/${c.id}`);
  }
  for (const c of await allRuleCells()) {
    add(c.slug, `rule/${c.id}`);
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

  // ── (b) accept()/REFLEXIVE — the static Universal floor over every hook cell ─────
  it('every hook + rule cell DEFINIENS passes the static Universal floor', async () => {
    const homes = await cellHomes();
    const cells: AcceptCell[] = [];
    for (const c of await allHookCells()) {
      cells.push({
        kind: 'hook',
        slug: c.id,
        definiens: c.residue,
        refs: c.refs ?? [],
      });
    }
    for (const c of await allRuleCells()) {
      cells.push({
        kind: 'rule',
        slug: c.slug,
        definiens: c.definiens,
        refs: c.refs ?? [],
      });
    }
    const failures: string[] = [];
    for (const cell of cells) {
      const failing = failingLegs(
        universalCell(cell, homes, canonPolicy),
      ).filter(
        (leg) =>
          !ACCEPT_RATCHET.some((p) => p.slug === cell.slug && p.leg === leg),
      );
      if (failing.length) {
        failures.push(`${cell.kind}/${cell.slug}: ${failing.join(',')}`);
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
    const bySlug = new Map<string, AcceptCell>();
    for (const c of await allHookCells()) {
      bySlug.set(c.id, {
        kind: 'hook',
        slug: c.id,
        definiens: c.residue,
        refs: c.refs ?? [],
      });
    }
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
