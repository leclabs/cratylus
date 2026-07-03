/**
 * E7.S7 — vendor rules dirs only where activation semantics demand (R6).
 * Ground truth: §3 R6 — plain rules never buy a vendor dir; glob-scoped
 * activation compiles to `.cursor/rules/*.mdc` [S19], `.github/instructions/
 * *.instructions.md` applyTo [S57], `.clinerules/*.md` paths: [S22].
 * Activation metadata is not expressible in the Rule schema today.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import {
  type IR,
  type Rule,
  compile,
  parseFrontmatter,
  validateIR,
} from '../../../src/core/index.js';
import { adapterById, makeTmpDir, story } from '../helpers.js';
import { manifest } from './fixtures.js';

const RULE_A: Rule = { id: 'a', body: 'PLAIN-RULE-ALPHA guidance.' };
/** Glob-activated rule; the activation fields are the documented intent —
 *  pinned via cast because the Rule schema cannot carry them yet. */
const RULE_B = {
  id: 'b',
  body: 'GLOB-RULE-BETA guidance for src only.',
  globs: ['src/**'],
  alwaysApply: false,
} as unknown as Rule;

const dirs: string[] = [];
function tmp(): string {
  const d = makeTmpDir();
  dirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function adapter(id: string) {
  const a = adapterById.get(id);
  if (!a) throw new Error(`no adapter '${id}'`);
  return a;
}

describe('E7.S7 · vendor rules dirs only where activation demands', () => {
  story(
    'E7.S7',
    'plain rule compiles to AGENTS.md-class output only: zero .cursor/rules or .github/instructions files (R6)',
    async () => {
      const cwd = tmp();
      const ir: IR = {
        manifest: manifest(['cursor', 'copilot']),
        rules: [RULE_A],
      };
      const report = await compile(
        ir,
        [adapter('cursor'), adapter('copilot')],
        'project',
        cwd,
      );
      expect(report.results.filter((r) => r.error)).toEqual([]);

      expect(readFileSync(join(cwd, 'AGENTS.md'), 'utf8')).toContain(
        'PLAIN-RULE-ALPHA',
      );
      expect(existsSync(join(cwd, '.cursor', 'rules'))).toBe(false);
      expect(existsSync(join(cwd, '.github', 'instructions'))).toBe(false);
    },
  );

  story.tracked(
    'E7.S7',
    'cline: plain rule lands in root AGENTS.md (native reader [S22]), not as a .clinerules file',
    async () => {
      const cwd = tmp();
      const ir: IR = { manifest: manifest(['cline']), rules: [RULE_A] };
      await compile(ir, [adapter('cline')], 'project', cwd);

      // Documented truth: rule A appears only in AGENTS.md-class outputs.
      // The cline adapter writes .clinerules/a.md and no AGENTS.md today.
      expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
      expect(existsSync(join(cwd, '.clinerules', 'a.md'))).toBe(false);
    },
  );

  story.tracked(
    'E7.S7',
    'IR Rule carries activation metadata (globs/alwaysApply) so vendor dirs are compilable — schema rejects it today (E9 gap)',
    () => {
      const ir: IR = { manifest: manifest(['cursor']), rules: [RULE_B] };
      // Documented truth: one IR Rule with activation metadata compiles to
      // all vendor dialects (§3 R6). rule.schema is additionalProperties:
      // false with no activation fields, so validation refuses it.
      expect(validateIR(ir), JSON.stringify(validateIR.errors)).toBe(true);
    },
  );

  story.tracked(
    'E7.S7',
    'glob rule emits .cursor/rules/<id>.mdc with description/globs/alwaysApply frontmatter [S19]',
    async () => {
      const cwd = tmp();
      const ir: IR = {
        manifest: manifest(['cursor']),
        rules: [RULE_A, RULE_B],
      };
      await compile(ir, [adapter('cursor')], 'project', cwd);

      const mdc = join(cwd, '.cursor', 'rules', 'b.mdc');
      expect(existsSync(mdc)).toBe(true);
      const { frontmatter } = parseFrontmatter<Record<string, unknown>>(
        readFileSync(mdc, 'utf8'),
      );
      expect(frontmatter.globs).toBeDefined();
      expect(frontmatter.alwaysApply).toBe(false);
    },
  );

  story.tracked(
    'E7.S7',
    'glob rule emits .github/instructions/<id>.instructions.md with applyTo frontmatter [S57]',
    async () => {
      const cwd = tmp();
      const ir: IR = {
        manifest: manifest(['copilot']),
        rules: [RULE_A, RULE_B],
      };
      await compile(ir, [adapter('copilot')], 'project', cwd);

      const file = join(cwd, '.github', 'instructions', 'b.instructions.md');
      expect(existsSync(file)).toBe(true);
      const { frontmatter } = parseFrontmatter<Record<string, unknown>>(
        readFileSync(file, 'utf8'),
      );
      expect(frontmatter.applyTo).toBe('src/**');
    },
  );

  story.tracked(
    'E7.S7',
    'glob rule emits .clinerules/<id>.md with paths: frontmatter preserving activation [S22]',
    async () => {
      const cwd = tmp();
      const ir: IR = { manifest: manifest(['cline']), rules: [RULE_B] };
      await compile(ir, [adapter('cline')], 'project', cwd);

      const file = join(cwd, '.clinerules', 'b.md');
      expect(existsSync(file)).toBe(true);
      const { frontmatter } = parseFrontmatter<Record<string, unknown>>(
        readFileSync(file, 'utf8'),
      );
      // Activation semantics preserved per-dialect: cline's key is `paths:`.
      expect(frontmatter.paths).toEqual(['src/**']);
    },
  );
});
