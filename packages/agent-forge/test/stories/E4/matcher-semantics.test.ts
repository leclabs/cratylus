/**
 * E4.S5 — matcher semantics translate or warn, never silently reinterpret.
 *
 * Documented reality: claude matchers are regex/literal [CC6], gemini regex
 * [GM4], cursor regex-class [CU2], crush regex [CR3]; cline has NO matcher
 * concept [CL2]. The shipped capability metadata says 'glob' (claude, gemini,
 * cursor) / 'none' (crush) — §3 cross-cutting divergence.
 */

import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';

import type { IR } from '../../../src/core/index.js';
import { adapterById, makeTmpDir, story } from '../helpers.js';
import { manifest } from './support.js';

const REGEX_MATCHER = '^Bash$';

const hookIR = (target: string): IR => ({
  manifest: manifest(target),
  hooks: [
    {
      id: 'guard',
      events: ['tool.use.pre'],
      matcher: REGEX_MATCHER,
      command: 'echo blocked',
    },
  ],
});

/** Native file each regex-dialect target emits its hooks into. */
const NATIVE_HOOK_FILE: Record<string, string> = {
  claude: '.claude/settings.json',
  gemini: '.gemini/settings.json',
  cursor: '.cursor/hooks.json',
};

const cleanups: string[] = [];
afterEach(() => {
  for (const dir of cleanups.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('E4.S5 · matcher semantics', () => {
  for (const [id, file] of Object.entries(NATIVE_HOOK_FILE)) {
    story(
      'E4.S5',
      `${id}: regex matcher reaches the native config verbatim`,
      async () => {
        const adapter = adapterById.get(id);
        if (!adapter) throw new Error(`unknown adapter '${id}'`);
        const cwd = makeTmpDir(`af-e4s5-${id}-`);
        cleanups.push(cwd);
        const report = await adapter.write(hookIR(id), 'project', cwd, {});
        expect(report.warnings).toEqual([]);
        const text = readFileSync(join(cwd, file), 'utf8');
        expect(text).toContain(REGEX_MATCHER);
      },
    );
  }

  story(
    'E4.S5',
    'regex-dialect targets declare matchers: regex — claude [CC6], gemini [GM4], cursor [CU2], crush [CR3]',
    () => {
      for (const id of ['claude', 'gemini', 'cursor', 'crush']) {
        const adapter = adapterById.get(id);
        if (!adapter) throw new Error(`unknown adapter '${id}'`);
        expect(
          adapter.capabilities.hooks.matchers as string,
          `${id} matcher semantics`,
        ).toBe('regex');
      }
    },
  );

  story(
    'E4.S5',
    'cline: matcher on a hook warns matcher-unsupported instead of silently emitting one [CL2]',
    async () => {
      const adapter = adapterById.get('cline');
      if (!adapter) throw new Error('unknown adapter cline');
      const cwd = makeTmpDir('af-e4s5-cline-');
      cleanups.push(cwd);
      const report = await adapter.write(hookIR('cline'), 'project', cwd, {});
      // Documented behavior: cline hooks are per-event executables with no
      // matcher concept — the adapter must surface the reinterpretation.
      expect(report.warnings.some((w) => /matcher/i.test(w))).toBe(true);
    },
  );
});
