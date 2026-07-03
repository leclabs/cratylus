/**
 * E9.S3 — hook capability metadata tells the truth per dialect.
 *
 * Ground truth per RETURN §2/§3 cross-cutting: `payload: 'claude-json'` is
 * true only for claude (+codex hooks.json); copilot/gemini/cline have native
 * shapes; matcher semantics are regex for gemini/cursor/crush/copilot/claude
 * and none for cline [CC6][GM4][CU2][CR3][CP4][CL2].
 *
 * Cells RETURN does not classify (codex/opencode matcher semantics) are left
 * out of the table rather than guessed.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';

import { adapterById, story } from '../helpers.js';

interface TruthCell {
  payload?: string;
  matchers?: string;
  ref: string;
}

const GROUND_TRUTH: Record<string, TruthCell> = {
  claude: { payload: 'claude-json', matchers: 'regex', ref: '[CC6]' },
  codex: { payload: 'claude-json', ref: '[CX4]' },
  copilot: { payload: 'native', matchers: 'regex', ref: '[CP4]' },
  cursor: { payload: 'native', matchers: 'regex', ref: '[CU2]' },
  gemini: { payload: 'native', matchers: 'regex', ref: '[GM4]' },
  cline: { payload: 'native', matchers: 'none', ref: '[CL2][CL3]' },
  crush: { payload: 'native', matchers: 'regex', ref: '[CR3]' },
  opencode: { payload: 'shim', ref: '[OC5]' },
  aider: { payload: 'native', matchers: 'none', ref: '[AI4]' },
  continue: { payload: 'native', matchers: 'none', ref: '[CT1]' },
};

/** Cells the shipped declarations get wrong today. cursor/matchers graduated
 * with the cursor-adapter-truth fix (E4.S5/E9.S3, [CU2]) — regex declared.
 * cline/payload + cline/matchers graduated with the cline-adapter-truth fix
 * — native/none declared, matching [CL2][CL3]. */
const FALSE_TODAY = new Set([
  'claude/matchers', // glob, should be regex
  'copilot/payload', // claude-json, native shape documented [CP4]
  'copilot/matchers', // glob, should be regex
  'gemini/payload', // claude-json, own envelope [GM4]
  'gemini/matchers', // glob, should be regex
  'crush/matchers', // none (whole hook surface undeclared), should be regex
]);

function mismatches(onlyFalseToday: boolean): string[] {
  const out: string[] = [];
  for (const [id, truth] of Object.entries(GROUND_TRUTH)) {
    const adapter = adapterById.get(id);
    if (!adapter) throw new Error(`unknown adapter '${id}'`);
    const declared = adapter.capabilities.hooks;
    for (const facet of ['payload', 'matchers'] as const) {
      const expected = truth[facet];
      if (expected === undefined) continue;
      const isFalseCell = FALSE_TODAY.has(`${id}/${facet}`);
      if (isFalseCell !== onlyFalseToday) continue;
      if ((declared[facet] as string) !== expected) {
        out.push(
          `${id}.${facet}: declared '${declared[facet]}', documented '${expected}' ${truth.ref}`,
        );
      }
    }
  }
  return out;
}

describe('E9.S3 · hook capability declarations vs documented dialects', () => {
  story('E9.S3', 'ground truth covers all 10 adapters', () => {
    expect(Object.keys(GROUND_TRUTH)).toHaveLength(10);
    for (const id of Object.keys(GROUND_TRUTH)) {
      expect(adapterById.has(id), id).toBe(true);
    }
  });

  story(
    'E9.S3',
    'currently-true cells stay true (payload: claude/codex claude-json, cursor/crush/aider/continue native, opencode shim; matchers: aider/continue none)',
    () => {
      expect(mismatches(false)).toEqual([]);
    },
  );

  story.tracked(
    'E9.S3',
    'declaration table ≡ ground truth for every classified cell (regex matchers + native payloads still shipped wrong)',
    () => {
      expect(mismatches(true)).toEqual([]);
    },
  );

  story(
    'E9.S3',
    'events --client derives from the adapter eventMap — one home, no second table (DRY)',
    () => {
      const here = dirname(fileURLToPath(import.meta.url));
      const source = readFileSync(
        join(here, '../../../src/cli/commands/events.ts'),
        'utf8',
      );
      // The per-client table must come from the published eventMap…
      expect(source).toMatch(/adapter\.eventMap/);
      // …and the command must not hardcode any adapter's native event names.
      for (const nativeName of [
        'PreToolUse',
        'BeforeTool',
        'sessionStart',
        'tool.execute.before',
        'TaskStart',
      ]) {
        expect(source, `hardcoded native name ${nativeName}`).not.toContain(
          nativeName,
        );
      }
    },
  );
});
