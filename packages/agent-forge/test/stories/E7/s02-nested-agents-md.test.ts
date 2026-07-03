/**
 * E7.S2 — nested AGENTS.md are self-sufficient (caution iii).
 * Ground truth: FAQ closest-wins replacement [S1] vs Codex root→cwd
 * concatenation [S9]; emitted nested files must stand alone, never
 * delta-encoded. Dir-scoping rides the Rule `dir` field (landed by
 * ir-schema-expressiveness, wave 4) + the engine's nested-rules routing
 * (standards-surfaces, `core/engine/nested-rules.ts`): a `dir`-scoped rule
 * never reaches an adapter's own rules writer — it lands straight in
 * `<dir>/AGENTS.md`, adapter-agnostic.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { type IR, type Rule, compile } from '../../../src/core/index.js';
import { adapterById, makeTmpDir, story } from '../helpers.js';
import { manifest } from './fixtures.js';

/**
 * Pinned anaphora denylist: phrases/imports that make a nested AGENTS.md
 * depend on out-of-file context (forbidden under replacement semantics [S1]).
 */
const ANAPHORA_DENYLIST: readonly (string | RegExp)[] = [
  'in addition to the root',
  'as above',
  /@\.\.\//, // upward @-import
  /@\/[^\s]*AGENTS\.md/, // absolute-path @-import out of the subtree
];

const ROOT_BODY = 'ROOT-RULE: repo-wide invariants.';
const SUBTREE_BODY = 'PKG-A-RULE: complete guidance for packages/a.';

function scopedIR(targets: string[]): IR {
  const scoped: Rule = {
    id: 'pkg-a',
    body: SUBTREE_BODY,
    dir: 'packages/a',
  };
  return {
    manifest: manifest(targets),
    rules: [{ id: 'root', body: ROOT_BODY }, scoped],
  };
}

function expectSelfSufficient(text: string): void {
  for (const banned of ANAPHORA_DENYLIST) {
    if (typeof banned === 'string') expect(text).not.toContain(banned);
    else expect(text).not.toMatch(banned);
  }
  expect(text).toContain(SUBTREE_BODY);
}

const dirs: string[] = [];
function tmp(): string {
  const d = makeTmpDir();
  dirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('E7.S2 · nested AGENTS.md self-sufficiency', () => {
  story(
    'E7.S2',
    'packages/a-scoped rule emits a self-sufficient packages/a/AGENTS.md (anaphora denylist pinned; E9.S2 dep)',
    async () => {
      const cwd = tmp();
      const codex = adapterById.get('codex');
      if (!codex) throw new Error('codex adapter missing');
      await compile(scopedIR(['codex']), [codex], 'project', cwd);

      const nested = join(cwd, 'packages', 'a', 'AGENTS.md');
      expect(existsSync(nested)).toBe(true);
      const text = readFileSync(nested, 'utf8');
      expectSelfSufficient(text);
      // Blind-read key: the subtree's complete guidance is in the ONE file.
      expect(text).toContain(SUBTREE_BODY);
      // The root file keeps the root rule; the scoped rule is not duplicated
      // into it as the only copy.
      expect(readFileSync(join(cwd, 'AGENTS.md'), 'utf8')).toContain(ROOT_BODY);
    },
  );

  story(
    'E7.S2',
    'same IR is correct under closest-wins replacement [S1] AND Codex root-to-cwd concatenation [S9] (truth table)',
    async () => {
      // Replacement-semantics target (agents.md FAQ model [S1]): cursor.
      const replacementCwd = tmp();
      const cursor = adapterById.get('cursor');
      if (!cursor) throw new Error('cursor adapter missing');
      await compile(scopedIR(['cursor']), [cursor], 'project', replacementCwd);

      // Concat-semantics target (Codex walk-down [S9]): codex.
      const concatCwd = tmp();
      const codex = adapterById.get('codex');
      if (!codex) throw new Error('codex adapter missing');
      await compile(scopedIR(['codex']), [codex], 'project', concatCwd);

      // Truth table for a file edited under packages/a/:
      //   replacement: effective = nested only  ⇒ nested ⊇ subtree guidance
      //   concat:      effective = root + nested ⇒ nested still self-contained
      for (const cwd of [replacementCwd, concatCwd]) {
        const nested = join(cwd, 'packages', 'a', 'AGENTS.md');
        expect(existsSync(nested)).toBe(true);
        expectSelfSufficient(readFileSync(nested, 'utf8'));
      }
      // Under concat semantics the root file must still carry the root rule
      // (root + nested is the effective set, blank-line joined [S9]).
      expect(readFileSync(join(concatCwd, 'AGENTS.md'), 'utf8')).toContain(
        ROOT_BODY,
      );
    },
  );
});
