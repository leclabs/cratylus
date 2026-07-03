/**
 * E2.S4 · user-scope compile lands in each harness's user-level home.
 * Contract: test/stories/E2-ir-emission.md.
 * Documented user homes per RETURN §2: ~/.claude/ [CC8], ~/.codex/ [CX6],
 * ~/.cursor/ [CU2], ~/.copilot/ [CP8] (NOT ~/.config/github-copilot/),
 * ~/.gemini/ [GM1], ~/.config/opencode/ [OC1], ~/Documents/Cline/Rules [CL1]
 * (NOT ~/.cline/rules), ~/.config/crush/ [CR1], ~/.continue/ [CT5],
 * ~/.aider.conf.yml [AI1].
 */

import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { compile, writeIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, fakeHome, makeTmpDir, story } from '../helpers.js';
import { compileFixtureIR, hashTree } from './lib.js';

const ALL_IDS = ALL_ADAPTERS.map((a) => a.id);

describe('E2.S4 · user-scope compile lands in each documented user home', () => {
  let proj: string;
  let home: string;
  let restoreHome: () => void;
  let projTouched: string[];

  beforeEach(async () => {
    proj = makeTmpDir();
    const fh = fakeHome();
    home = fh.home;
    restoreHome = fh.restore;

    const ir = compileFixtureIR('user', ALL_IDS);
    await writeIR(ir, 'user', proj); // lands in fake ~/.agent-forge
    const before = hashTree(proj);
    await compile(ir, [...ALL_ADAPTERS], 'user', proj, {});
    const after = hashTree(proj);
    projTouched = Object.keys(after).filter(
      (rel) => after[rel] !== before[rel],
    );
  });
  afterEach(() => {
    restoreHome();
    rmSync(proj, { recursive: true, force: true });
  });

  story(
    'E2.S4',
    'claude/codex/cursor/gemini/opencode/crush/continue write into their documented user homes',
    () => {
      const expected = [
        '.claude/CLAUDE.md', // [CC1][CC8]
        '.claude/skills/review/SKILL.md', // [CC3]
        '.codex/AGENTS.md', // [CX3]
        '.codex/config.toml', // [CX6]
        '.codex/agents/one.toml', // [CX1]
        '.cursor/skills/review/SKILL.md', // [CU4]
        '.cursor/mcp.json', // [CU5]
        '.gemini/agents/one.md', // [GM2]
        '.gemini/settings.json', // [GM1]
        join('.config', 'opencode', 'skills', 'review', 'SKILL.md'), // [OC6]
        join('.config', 'crush', 'skills', 'review', 'SKILL.md'), // [CR1]
        '.continue/config.yaml', // [CT1]
      ];
      for (const rel of expected) {
        expect(existsSync(join(home, rel)), `expected ~/${rel}`).toBe(true);
      }
    },
  );

  story(
    'E2.S4',
    'user-scope compile makes zero writes under the project root',
    () => {
      expect(projTouched).toEqual([]);
    },
  );

  story(
    'E2.S4',
    'copilot user surface is ~/.copilot/ — NOT ~/.config/github-copilot/ [CP8]',
    () => {
      // §3 copilot #2: user scope fabricated at ~/.config/github-copilot/.
      expect(
        existsSync(join(home, '.copilot', 'skills', 'review', 'SKILL.md')),
      ).toBe(true);
      expect(existsSync(join(home, '.config', 'github-copilot'))).toBe(false);
    },
  );

  story(
    'E2.S4',
    'cline global rules land under ~/Documents/Cline/Rules — NOT ~/.cline/rules [CL1]',
    () => {
      // §3 cline #1: global rules path wrong (~/.cline/rules).
      expect(
        existsSync(join(home, 'Documents', 'Cline', 'Rules', 'main.md')),
      ).toBe(true);
      expect(existsSync(join(home, '.cline', 'rules'))).toBe(false);
    },
  );

  story(
    'E2.S4',
    'aider user scope emits ~/.aider.conf.yml — a bare ~/AGENTS.md is inert [AI1][AI2]',
    () => {
      // §3 aider #1: aider auto-discovers no conventions file; ~/AGENTS.md is fabricated.
      expect(existsSync(join(home, '.aider.conf.yml'))).toBe(true);
      expect(existsSync(join(home, 'AGENTS.md'))).toBe(false);
    },
  );
});
