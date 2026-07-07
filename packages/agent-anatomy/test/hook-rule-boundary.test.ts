// hook/rule boundary gate (S4, corrected) — establishes `hook` (activation=event)
// as a first-class SOURCE cell whose harness artifacts are PROJECTED TARGETS, not
// hand-authored. `rule` (activation=scope) stays a live KIND (MODEL's 5 Kinds) with
// ZERO corpus instances: an `AGENTS.md` at a node is NOT a rule deploy target — the
// `src/skills/dream.ts` law is verbatim "An `AGENTS.md` at a node IS the semantic
// organ at that scope; writing it is consolidation", so EVERY tracked AGENTS.md is a
// dream-written SelfAuthored memory sink, exempt from REGENERABLE (MODEL
// `SelfAuthored ∉ Target`) and OUT-OF-SCOPE for rule conversion. The S4 conversion of
// repo-root AGENTS.md to a `rule` cell COLLIDED with that law (the first dream routing
// a repo-scoped fact reds the byte-lock, a deploy clobbers the memory) and was
// reverted. Three falsifiers, held here:
//
//   (a) BEHAVIOR-IN-CELL — every in-scope shell hook is owned by a `.ts` source cell;
//       the committed artifact is a deploy target. Enforced by the COVERAGE table
//       (no silent cap): both hook families are converted, and every tracked AGENTS.md
//       is classified OUT-OF-SCOPE (a memory sink no rule cell may target).
//   (b) accept()/REFLEXIVE — each hook cell's canonical DEFINIENS passes the static
//       Universal floor (`accept.ts`), and the cell's targets pass REGENERABLE.
//   (c) NO-DIVERGENCE — the committed target == the source cell's bytes, byte-for-
//       byte (`regenerateTargets --check` finds zero drift). A hand-edit fails here.
//
// The BLIND cold-oracle leg (SIGNIFIED/COLD-BLIND as a live decode) is Nico's canon
// review, gated off the hermetic floor exactly as in `reader-density.test.ts`.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  type AcceptCell,
  type Homes,
  type Leg,
  type Target,
  failingLegs,
  regenerable,
  universalCell,
} from '../src/toolkit/cold-oracle/accept.js';
import {
  allHookCells,
  cellTargets,
  regenerateTargets,
} from '../src/toolkit/project-targets.js';

const anatomyRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(anatomyRoot, '..', '..');

// ── COVERAGE — the honest converted-vs-out-of-scope table (no silent cap) ────────
//
// Every convention AGENTS.md in the repo is classified here. `CONVERTED` = a `rule`
// cell owns it (its committed file is a deploy target) — now EMPTY: an AGENTS.md is a
// memory sink, never a rule target. `RATCHET` = a deferred hand-authored rule target —
// also EMPTY (nothing was ever a legitimate rule target). `OUT_OF_SCOPE` = a
// SelfAuthored node-scoped memory sink exempt from REGENERABLE (the dream-cell law),
// which a rule cell must NEVER target — this covers EVERY tracked `*AGENTS.md`. A repo
// AGENTS.md matching none of these FAILS the suite (a new convention file cannot be
// silently un-owned) — but by the law, every AGENTS.md is out-of-scope, so the set is
// exhaustive by construction.

/** In-scope AGENTS.md a `rule` cell converts — EMPTY (AGENTS.md are memory sinks). */
const CONVERTED_RULE_TARGETS: ReadonlySet<string> = new Set([]);

/** Deferred hand-authored rule targets — EMPTY (no AGENTS.md is a legit rule target). */
const RATCHET_RULE_TARGETS: ReadonlySet<string> = new Set([]);

/**
 * Every tracked `AGENTS.md` is a SelfAuthored node-scoped memory sink (the
 * `src/skills/dream.ts` law) — OUT-OF-SCOPE for rule conversion; a rule cell must
 * never target one.
 */
function isOutOfScope(rel: string): boolean {
  return rel.endsWith('AGENTS.md');
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

/** One home per hook anchor (the PARTITIONED claim over the source cells). */
async function hookHomes(): Promise<Homes> {
  const homes = new Map<string, string[]>();
  const add = (slug: string, id: string) => {
    const b = homes.get(slug) ?? [];
    b.push(id);
    homes.set(slug, b);
  };
  for (const c of await allHookCells()) {
    add(c.id, `hook/${c.id}`);
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
  it('both shell-hook families are converted to hook cells (behavior-in-cell)', async () => {
    const ids = (await allHookCells()).map((c) => c.id).sort();
    expect(ids).toEqual(['praxis-continuity', 'stance-guardrail']);
  });

  it('no cell target is an AGENTS.md ∧ every tracked AGENTS.md is out-of-scope', async () => {
    // the coverage invariant, INVERTED: AGENTS.md are memory sinks, so NO projected
    // target may be one, and EVERY tracked AGENTS.md classifies out-of-scope.
    const agentsMdTargets = (await cellTargets())
      .map((t) => t.path)
      .filter((p) => p.endsWith('AGENTS.md'));
    expect(
      agentsMdTargets,
      `a projected target is an AGENTS.md (memory sink): ${agentsMdTargets.join(', ')}`,
    ).toEqual([]);
    const notOutOfScope = repoAgentsMd().filter((rel) => !isOutOfScope(rel));
    expect(
      notOutOfScope,
      `tracked AGENTS.md not out-of-scope: ${notOutOfScope.join(', ')}`,
    ).toEqual([]);
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

  it('regenerateTargets --check reports zero drift (deterministic projection)', async () => {
    const { drift } = await regenerateTargets({ check: true });
    expect(drift, `drifted targets: ${drift.join(', ')}`).toEqual([]);
  });

  // ── (b) accept()/REFLEXIVE — the static Universal floor over every hook cell ─────
  it('every hook cell DEFINIENS passes the static Universal floor', async () => {
    const homes = await hookHomes();
    const cells: AcceptCell[] = [];
    for (const c of await allHookCells()) {
      cells.push({
        kind: 'hook',
        slug: c.id,
        definiens: c.residue,
        refs: c.refs ?? [],
      });
    }
    const failures: string[] = [];
    for (const cell of cells) {
      const failing = failingLegs(universalCell(cell, homes)).filter(
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
    const homes = await hookHomes();
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
        failingLegs(universalCell(cell as AcceptCell, homes)),
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
    // the converted + ratchet sets are EMPTY — every AGENTS.md is a memory sink.
    expect(CONVERTED_RULE_TARGETS.size).toBe(0);
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
