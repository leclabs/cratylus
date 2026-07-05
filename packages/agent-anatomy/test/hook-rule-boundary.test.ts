// hook/rule boundary gate (S4) — establishes `rule` (activation=scope) and `hook`
// (activation=event) as first-class SOURCE cells whose harness artifacts are
// PROJECTED TARGETS, not hand-authored. Three falsifiers, held here:
//
//   (a) BEHAVIOR-IN-CELL — every in-scope shell hook + witnessed AGENTS.md is
//       owned by a `.ts` source cell; the committed artifact is a deploy target.
//       Enforced by the COVERAGE table (no silent cap: every repo AGENTS.md is
//       classified converted | ratcheted | out-of-scope, and both hook families
//       are converted).
//   (b) accept()/REFLEXIVE — each rule/hook cell's canonical DEFINIENS passes the
//       static Universal floor (`accept.ts`), and the cell's targets pass REGENERABLE.
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
  allRuleCells,
  cellTargets,
  regenerateTargets,
} from '../src/toolkit/project-targets.js';

const anatomyRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(anatomyRoot, '..', '..');

// ── COVERAGE — the honest converted-vs-ratcheted table (no silent cap) ──────────
//
// Every convention AGENTS.md in scope for S4 is classified here. `CONVERTED` = a
// `rule` cell owns it (its committed file is a deploy target). `RATCHET` = still
// hand-authored, deferred (witness-one + ratchet — the operator-facing bodies are
// densified in a later lane, not force-converted here). `OUT_OF_SCOPE` = a
// SelfAuthored memory sink exempt from REGENERABLE (`plans/**`, `ideas/`), which a
// rule cell must NEVER target. A repo AGENTS.md matching none of these FAILS the
// suite — a new convention file cannot be silently un-owned.

/** In-scope AGENTS.md that a `rule` cell converts (deploy target). */
const CONVERTED_RULE_TARGETS: ReadonlySet<string> = new Set(['AGENTS.md']);

/** In-scope AGENTS.md still hand-authored — deferred, shrink-only ratchet. */
const RATCHET_RULE_TARGETS: ReadonlySet<string> = new Set([
  'packages/agent-anatomy/AGENTS.md',
  'packages/agent-forge/AGENTS.md',
  'packages/agent-memory/AGENTS.md',
  'packages/agent-anatomy/src/toolkit/AGENTS.md',
]);

/** SelfAuthored sinks (`plans/**`, `ideas/`) — a rule cell must never target these. */
function isOutOfScope(rel: string): boolean {
  return (
    rel.startsWith('plans/') ||
    rel.includes('/ideas/') ||
    rel.startsWith('ideas/')
  );
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

// ── the homes map + accept plumbing for the new cells ───────────────────────────

/** One home per rule/hook anchor (the PARTITIONED claim over the new cells). */
async function ruleHookHomes(): Promise<Homes> {
  const homes = new Map<string, string[]>();
  const add = (slug: string, id: string) => {
    const b = homes.get(slug) ?? [];
    b.push(id);
    homes.set(slug, b);
  };
  for (const c of await allHookCells()) {
    add(c.slug, `hook/${c.id}`);
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
  it('both shell-hook families are converted to hook cells (behavior-in-cell)', async () => {
    const ids = (await allHookCells()).map((c) => c.id).sort();
    expect(ids).toEqual(['praxis-continuity', 'stance-guardrail']);
  });

  it('≥1 rule cell witnesses an AGENTS.md target', async () => {
    const rules = await allRuleCells();
    expect(rules.length).toBeGreaterThanOrEqual(1);
    for (const r of rules) {
      expect(r.targetPath, `${r.id} names its scoped AGENTS.md`).toMatch(
        /AGENTS\.md$/,
      );
    }
  });

  // ── (c) NO-DIVERGENCE — committed target == cell bytes, byte-for-byte ──────────
  it('every committed hook/rule target is byte-identical to its source cell', async () => {
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

  // ── (b) accept()/REFLEXIVE — the static Universal floor over every new cell ─────
  it('every rule/hook cell DEFINIENS passes the static Universal floor', async () => {
    const homes = await ruleHookHomes();
    const cells: AcceptCell[] = [];
    for (const c of await allHookCells()) {
      cells.push({
        kind: 'hook',
        slug: c.slug,
        definiens: c.definiens,
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
    const homes = await ruleHookHomes();
    const bySlug = new Map<string, AcceptCell>();
    for (const c of await allHookCells()) {
      bySlug.set(c.slug, {
        kind: 'hook',
        slug: c.slug,
        definiens: c.definiens,
        refs: c.refs ?? [],
      });
    }
    for (const c of await allRuleCells()) {
      bySlug.set(c.slug, {
        kind: 'rule',
        slug: c.slug,
        definiens: c.definiens,
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
  });

  it('every CONVERTED target is owned by exactly one rule cell', async () => {
    const owned = new Map<string, number>();
    for (const r of await allRuleCells()) {
      owned.set(r.targetPath, (owned.get(r.targetPath) ?? 0) + 1);
    }
    for (const path of CONVERTED_RULE_TARGETS) {
      expect(owned.get(path), `${path} owned by one rule cell`).toBe(1);
    }
  });

  it('no rule cell targets an out-of-scope SelfAuthored sink (plans/** · ideas/)', async () => {
    for (const r of await allRuleCells()) {
      expect(
        isOutOfScope(r.targetPath),
        `rule ${r.id} targets out-of-scope ${r.targetPath}`,
      ).toBe(false);
    }
  });

  it('every RATCHET target still exists as a hand-authored file (shrink-only)', () => {
    for (const rel of RATCHET_RULE_TARGETS) {
      expect(existsSync(join(repoRoot, rel)), `${rel} present`).toBe(true);
    }
  });

  // ── projection stability — every hook/rule cell imports + carries a payload ─────
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

  it('every rule cell carries a non-empty body', async () => {
    for (const c of await allRuleCells()) {
      expect(c.body.length, `${c.id} body`).toBeGreaterThan(0);
    }
  });
});
