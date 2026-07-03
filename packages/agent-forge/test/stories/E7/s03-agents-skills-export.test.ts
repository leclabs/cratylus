/**
 * E7.S3 — `.agents/` as an EXPORT surface: Agent Skills to `.agents/skills/`,
 * spec-strict core (R2). Ground truth: Agent Skills field table [S3], neutral
 * discovery home [S60]; §3 codex d1 (adapters emit vendor skill dirs only —
 * `.agents/skills/` is never written today).
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { type IR, compile, parseFrontmatter } from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';
import { SPEC_SKILL_FIELDS, manifest, walkFiles } from './fixtures.js';

const SKILL_NAME = 'review';

function skillIR(): IR {
  return {
    manifest: manifest(ALL_ADAPTERS.map((a) => a.id)),
    skills: [
      {
        name: SKILL_NAME,
        description: 'Review code for correctness.',
        body: '# steps\n\nRead the diff, then judge it.',
        allowed_tools: ['Read', 'Grep'],
      },
    ],
  };
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

describe('E7.S3 · .agents/skills export surface', () => {
  story(
    'E7.S3',
    'compile emits .agents/skills/<name>/SKILL.md with ONLY spec fields, name = parent dir [S3][S60] (adapters emit vendor dirs only, §3 codex d1)',
    async () => {
      const cwd = tmp();
      await compile(skillIR(), ALL_ADAPTERS, 'project', cwd);

      const skillFile = join(cwd, '.agents', 'skills', SKILL_NAME, 'SKILL.md');
      expect(existsSync(skillFile)).toBe(true);

      const { frontmatter } = parseFrontmatter<Record<string, unknown>>(
        readFileSync(skillFile, 'utf8'),
      );
      // Shared-core mode: ONLY the spec's frontmatter fields [S3].
      const allowed = new Set<string>(SPEC_SKILL_FIELDS);
      for (const key of Object.keys(frontmatter)) {
        expect(allowed.has(key), `non-spec frontmatter field '${key}'`).toBe(
          true,
        );
      }
      // name must equal the parent directory name [S3].
      expect(frontmatter.name).toBe(SKILL_NAME);
    },
  );

  story(
    'E7.S3',
    'standing guard: no IR-format file under .agents/, no harness-specific extras in the neutral tree [S3]',
    async () => {
      const cwd = tmp();
      const report = await compile(skillIR(), ALL_ADAPTERS, 'project', cwd);
      expect(report.results.filter((r) => r.error)).toEqual([]);

      const files = walkFiles(cwd);
      const underAgents = files.filter((f) => f.startsWith('.agents/'));

      // .agents/ is compile-produced export, never IR home: no manifest, no
      // IR resource folders (rules/, hooks/, *.yaml) may appear under it.
      const irFormat = underAgents.filter(
        (f) =>
          /(^|\/)manifest\.ya?ml$/.test(f) ||
          f.startsWith('.agents/rules/') ||
          f.startsWith('.agents/hooks/') ||
          f.endsWith('.yaml') ||
          f.endsWith('.yml'),
      );
      expect(irFormat).toEqual([]);

      // Harness-specific extras never land in the neutral tree: every
      // SKILL.md under .agents/skills/ carries spec fields only. (Vacuously
      // green until .agents/skills/ emission lands; bites the day it does.)
      const allowed = new Set<string>(SPEC_SKILL_FIELDS);
      for (const f of underAgents.filter((p) => p.endsWith('/SKILL.md'))) {
        const { frontmatter } = parseFrontmatter<Record<string, unknown>>(
          readFileSync(join(cwd, f), 'utf8'),
        );
        for (const key of Object.keys(frontmatter)) {
          expect(allowed.has(key), `${f}: harness extra '${key}'`).toBe(true);
        }
      }
    },
  );
});
