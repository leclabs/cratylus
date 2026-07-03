/**
 * E7.S4 — `.claude/skills/` mirror of the neutral tree (R3).
 * Ground truth: §3 R3 (author once in .agents/skills/, mirror for Claude
 * Code which ignores .agents/ [S8][S49]); drift guard via doctor. No mirror
 * mode exists today — both bullets tracked.
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import { runDoctor } from '../../../src/cli/commands/doctor.js';
import { type IR, compile } from '../../../src/core/index.js';
import { ALL_ADAPTERS, adapterById, makeTmpDir, story } from '../helpers.js';
import { manifest } from './fixtures.js';

const dirs: string[] = [];
function tmp(): string {
  const d = makeTmpDir();
  dirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('E7.S4 · .claude/skills mirror of .agents/skills', () => {
  story.tracked(
    'E7.S4',
    '.claude/skills resolves to the identical skill set: symlink (target verified) or byte-equal copy, authored once in .agents/skills [S8]',
    async () => {
      const cwd = tmp();
      const claude = adapterById.get('claude');
      const codex = adapterById.get('codex');
      if (!claude || !codex) throw new Error('adapter missing');
      const ir: IR = {
        manifest: manifest(['claude', 'codex']),
        skills: [
          { name: 'review', description: 'Review code.', body: '# steps' },
        ],
      };
      await compile(ir, [claude, codex], 'project', cwd);

      // Author-once direction: the neutral tree is the source…
      const source = join(cwd, '.agents', 'skills', 'review', 'SKILL.md');
      expect(existsSync(source)).toBe(true);

      // …and .claude/skills mirrors it: symlink with a verified target, or a
      // byte-equal copy on platforms without symlink.
      const mirrorDir = join(cwd, '.claude', 'skills', 'review');
      const stat = lstatSync(mirrorDir, { throwIfNoEntry: false });
      expect(stat).toBeDefined();
      if (stat?.isSymbolicLink()) {
        expect(readlinkSync(mirrorDir)).toContain(
          join('.agents', 'skills', 'review'),
        );
      } else {
        expect(readFileSync(join(mirrorDir, 'SKILL.md'), 'utf8')).toBe(
          readFileSync(source, 'utf8'),
        );
      }
    },
  );

  story.tracked(
    'E7.S4',
    'a mirror that diverges from its .agents/skills source fails agent-forge doctor (drift guard)',
    async () => {
      const cwd = tmp();
      // Hand-build a diverged mirror pair in the tmp repo.
      const srcDir = join(cwd, '.agents', 'skills', 'x');
      const mirDir = join(cwd, '.claude', 'skills', 'x');
      mkdirSync(srcDir, { recursive: true });
      mkdirSync(mirDir, { recursive: true });
      writeFileSync(
        join(srcDir, 'SKILL.md'),
        '---\nname: x\ndescription: d\n---\nsource body\n',
      );
      writeFileSync(
        join(mirDir, 'SKILL.md'),
        '---\nname: x\ndescription: d\n---\nDIVERGED body\n',
      );

      const lines: string[] = [];
      vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
        lines.push(args.join(' '));
      });
      vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        lines.push(args.join(' '));
      });
      const code = await runDoctor({ scope: 'project', cwd }, ALL_ADAPTERS);
      const out = lines.join('\n');

      // Documented truth: doctor reports the skills-mirror divergence and
      // exits non-zero. Today doctor has no mirror check at all.
      expect(out).toMatch(/mirror|diverg/i);
      expect(out).toContain('.agents/skills');
      expect(code).not.toBe(0);
    },
  );
});
