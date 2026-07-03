/**
 * E7.S5 — CLAUDE.md as a pure projection of AGENTS.md (R4).
 * Ground truth: Anthropic's own documented shim — `@AGENTS.md` import [S7];
 * §3 claude d5 (adapter concatenates rule bodies destructively). Both
 * bullets tracked.
 */

import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { type IR, compile } from '../../../src/core/index.js';
import { adapterById, makeTmpDir, story } from '../helpers.js';
import { manifest, orderedRules } from './fixtures.js';

const dirs: string[] = [];
function tmp(): string {
  const d = makeTmpDir();
  dirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function claude() {
  const a = adapterById.get('claude');
  if (!a) throw new Error('claude adapter missing');
  return a;
}

describe('E7.S5 · CLAUDE.md = @AGENTS.md projection', () => {
  story.tracked(
    'E7.S5',
    'emitted CLAUDE.md body is exactly the @AGENTS.md import (+ at most a fixed managed header), rule bodies absent [S7]',
    async () => {
      const cwd = tmp();
      const ir: IR = { manifest: manifest(['claude']), rules: orderedRules() };
      await compile(ir, [claude()], 'project', cwd);

      const text = readFileSync(join(cwd, 'CLAUDE.md'), 'utf8');
      // The instruction layer is authored once: CLAUDE.md carries the import…
      expect(text).toContain('@AGENTS.md');
      // …and nothing else beyond an optional managed-region header.
      const stripped = text
        .split('\n')
        .filter((l) => !/^<!--.*-->$/.test(l.trim()) && l.trim() !== '')
        .join('\n');
      expect(stripped.trim()).toBe('@AGENTS.md');
      // No duplicated rule text (grep: rule body strings absent) [S7].
      for (const rule of orderedRules()) {
        expect(text).not.toContain(rule.body);
      }
    },
  );

  story.tracked(
    'E7.S5',
    'a pre-existing hand-maintained CLAUDE.md is preserved through compile (E3.S5 foreign-content bullet; §3 claude d5)',
    async () => {
      const cwd = tmp();
      const sentinel = 'HAND-CONTENT: keep me — not agent-forge managed.';
      writeFileSync(join(cwd, 'CLAUDE.md'), `${sentinel}\n`);

      const ir: IR = { manifest: manifest(['claude']), rules: orderedRules() };
      await compile(ir, [claude()], 'project', cwd);

      // Documented truth: foreign content survives; the adapter overwrites
      // the file wholesale today (§3 claude d5).
      expect(readFileSync(join(cwd, 'CLAUDE.md'), 'utf8')).toContain(sentinel);
    },
  );
});
