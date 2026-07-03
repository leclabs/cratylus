/**
 * E7.S1 — AGENTS.md is the canonical rules projection (R1).
 * Ground truth: standards-compat-research.RETURN.md §3 R1, matrix [S1];
 * rule.schema `order`/`concat`.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect } from 'vitest';
import { type IR, compile } from '../../../src/core/index.js';
import { adapterById, makeTmpDir, story } from '../helpers.js';
import { manifest, orderedRules } from './fixtures.js';

/** The six AGENTS.md-native forge targets per §3 R1 / matrix [S1]. */
const NATIVE_SET = ['codex', 'copilot', 'cursor', 'opencode', 'crush', 'cline'];
/** The subset whose adapters project rules to a root AGENTS.md today. */
const ROOT_WRITERS = ['codex', 'copilot', 'cursor', 'opencode', 'crush'];

const dirs: string[] = [];
function tmp(): string {
  const d = makeTmpDir();
  dirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function adapters(ids: string[]) {
  return ids.map((id) => {
    const a = adapterById.get(id);
    if (!a) throw new Error(`no adapter '${id}'`);
    return a;
  });
}

describe('E7.S1 · AGENTS.md canonical rules projection', () => {
  story(
    'E7.S1',
    'one rules compile serves codex/copilot/cursor/opencode/crush via ONE shared root AGENTS.md (shared-artifact form declared) [S1]',
    async () => {
      const ir: IR = {
        manifest: manifest(ROOT_WRITERS),
        rules: orderedRules(),
      };

      // All five targets in one repo: they converge on the one root file.
      const shared = tmp();
      const report = await compile(
        ir,
        adapters(ROOT_WRITERS),
        'project',
        shared,
      );
      expect(report.results.filter((r) => r.error)).toEqual([]);
      const rootFile = join(shared, 'AGENTS.md');
      expect(existsSync(rootFile)).toBe(true);
      const sharedContent = readFileSync(rootFile, 'utf8');
      expect(sharedContent).toBe(
        'RULE-ALPHA: prefer parsimony.\n\nRULE-BRAVO: keep commits green.\n\nRULE-CHARLIE: cite sources.\n',
      );

      // Compiled separately, each target emits a byte-identical copy: no
      // per-target duplicate bodies, declared form = shared artifact at the
      // repo root (byte-identical when trees are split).
      for (const id of ROOT_WRITERS) {
        const solo = tmp();
        await compile(ir, adapters([id]), 'project', solo);
        expect(readFileSync(join(solo, 'AGENTS.md'), 'utf8')).toBe(
          sharedContent,
        );
      }
    },
  );

  story(
    'E7.S1',
    'rule.schema declares the order and concat fields the concatenation contract cites',
    () => {
      const schema = JSON.parse(
        readFileSync(
          join(
            dirname(fileURLToPath(import.meta.url)),
            '../../../src/core/schema/rule.schema.json',
          ),
          'utf8',
        ),
      ) as {
        properties: Record<string, { type?: string; default?: unknown }>;
      };
      expect(schema.properties.order).toBeDefined();
      expect(schema.properties.order?.type).toBe('number');
      expect(schema.properties.concat).toBeDefined();
      expect(schema.properties.concat?.default).toBe(true);
    },
  );

  story(
    'E7.S1',
    'root AGENTS.md concatenates rules by the rule.schema order field, not array order',
    async () => {
      // Array order deliberately disagrees with `order`: charlie, alpha, bravo.
      const [alpha, bravo, charlie] = orderedRules();
      const ir: IR = {
        manifest: manifest(['codex']),
        rules: [charlie, alpha, bravo],
      };
      const cwd = tmp();
      await compile(ir, adapters(['codex']), 'project', cwd);
      // Documented truth: lower `order` first (rule.schema). Adapters join in
      // array order today, so this asserts the sorted concatenation.
      expect(readFileSync(join(cwd, 'AGENTS.md'), 'utf8')).toBe(
        'RULE-ALPHA: prefer parsimony.\n\nRULE-BRAVO: keep commits green.\n\nRULE-CHARLIE: cite sources.\n',
      );
    },
  );

  story(
    'E7.S1',
    'cline (AGENTS.md-native per matrix [S1]/[S22]) is served by the same root AGENTS.md artifact',
    async () => {
      const ir: IR = { manifest: manifest(NATIVE_SET), rules: orderedRules() };
      const cwd = tmp();
      await compile(ir, adapters(['cline']), 'project', cwd);
      // A plain (non-glob) rule lands on the shared root AGENTS.md [S22].
      expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
      expect(readFileSync(join(cwd, 'AGENTS.md'), 'utf8')).toContain(
        'RULE-ALPHA',
      );
    },
  );
});
