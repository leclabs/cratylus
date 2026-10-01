// Shared deploy-test scaffolding: build a render tree in a temp dir.

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Practice } from '@cratylus/schema';
import type { InstallPrompts } from '../../src/cli/commands/install-prompts.js';

export function tmp(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/** The one practice a fixture corpus declares: every agent it has, preselected. A
 *  run that installs it takes the whole fixture, as a run without practices would. */
export const FIXTURE_PRACTICE = 'fixture';
export function fixturePractices(agents: readonly string[]): Practice[] {
  return [
    {
      name: FIXTURE_PRACTICE,
      description: 'every agent of the fixture',
      agents: [...agents],
      preselected: true,
    },
  ];
}

/** The prompts of a guided install, answering as an operator who accepts every
 *  default; `over` replaces the answers a case is about. */
export function answers(over: Partial<InstallPrompts> = {}): InstallPrompts {
  return {
    harness: async (found) => found[0],
    practices: async (_offered, initial) => [...initial],
    linkCommands: async () => false,
    routes: async () => ({}),
    confirm: async () => true,
    ...over,
  };
}

/** A minimal but representative render tree: two agents (mav, nico) and two
 *  skills (wake = SKILL-only, memory = dual-deploy skill dir). */
export function buildRenderTree(root: string): {
  agentsDir: string;
  skillsDir: string;
} {
  const agentsDir = join(root, 'agents');
  const skillsDir = join(root, 'skills');
  mkdirSync(agentsDir, { recursive: true });
  for (const name of ['mav', 'nico']) {
    writeFileSync(
      join(agentsDir, `${name}.md`),
      `---\nname: ${name}\n---\n# ${name} def (generated SOUL)\n`,
      'utf-8',
    );
  }
  // wake: plain skill dir (SKILL.md only).
  const wake = join(skillsDir, 'wake');
  mkdirSync(wake, { recursive: true });
  writeFileSync(join(wake, 'SKILL.md'), '# wake\n', 'utf-8');
  // memory: dual-deploy dir (SKILL.md only — the standalone `memory` tool ships
  // via its package `bin`, no longer staged into the skill dir).
  const memory = join(skillsDir, 'memory');
  mkdirSync(memory, { recursive: true });
  writeFileSync(join(memory, 'SKILL.md'), '# memory\n', 'utf-8');
  return { agentsDir, skillsDir };
}

/** A hooks render tree: `<root>/settings.json` (a `{hooks}` fragment with a
 *  Stop + SubagentStop command) + `<root>/hooks/stance-guardrail/<assets>`. */
export function buildHooksTree(root: string): { hooksDir: string } {
  const cmd = 'sh "$HOME/.claude/hooks/stance-guardrail/stance-guardrail.sh"';
  const settings = {
    hooks: {
      Stop: [{ hooks: [{ type: 'command', command: cmd, timeout: 60 }] }],
      SubagentStop: [
        { hooks: [{ type: 'command', command: cmd, timeout: 60 }] },
      ],
    },
  };
  writeFileSync(
    join(root, 'settings.json'),
    `${JSON.stringify(settings, null, 2)}\n`,
    'utf-8',
  );
  const hookDir = join(root, 'hooks', 'stance-guardrail');
  mkdirSync(hookDir, { recursive: true });
  for (const f of [
    'stance-guardrail.sh',
    'stance-judge.sh',
    'stance-judge-prompt.md',
  ]) {
    writeFileSync(join(hookDir, f), `# ${f}\n`, 'utf-8');
  }
  return { hooksDir: root };
}
