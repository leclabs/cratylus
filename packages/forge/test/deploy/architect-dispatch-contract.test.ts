import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireRepoRoot } from '@cratylus/tooling/repo-root';
import { afterEach, describe, expect, it } from 'vitest';
import { runDeploy } from '../../src/cli/commands/deploy.js';

const root = requireRepoRoot(dirname(fileURLToPath(import.meta.url)));
const homes: string[] = [];
afterEach(() => {
  for (const home of homes.splice(0))
    rmSync(home, { recursive: true, force: true });
});

function put(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

describe('architect dispatch clean user-scope projection cutover', () => {
  it('replaces the manual POC while preserving unrelated agents and host configuration', async () => {
    const home = mkdtempSync(join(tmpdir(), 'architect-dispatch-deploy-'));
    homes.push(home);
    const claude = join(home, '.claude');
    const omp = join(home, '.omp');
    const neutral = join(home, '.agents');
    const userSettings = `${JSON.stringify({ theme: 'dark', permissions: { allow: ['Bash(ls:*)'] } }, null, 2)}\n`;
    const ompConfig =
      'modelRoles:\n  default: anthropic/claude-opus-5-5:high\ntheme: dark\n';
    put(join(claude, 'settings.json'), userSettings);
    put(join(omp, 'agent/config.yml'), ompConfig);
    put(join(claude, 'agents/host-owned.md'), 'host-owned Claude agent\n');
    put(join(omp, 'agent/agents/host-owned.md'), 'host-owned omp agent\n');
    for (const harness of ['claude', 'omp'] as const) {
      const tree = join(root, '.cratylus', harness);
      const hostAgents =
        harness === 'claude'
          ? join(claude, 'agents')
          : join(omp, 'agent/agents');
      for (const name of ['architect', 'nico', 'kino', 'mav']) {
        put(
          join(hostAgents, `${name}.md`),
          `---\nname: ${name}\noutput: { schema: manual }\n---\nmanual POC schema defaults\n`,
        );
      }
      for (const name of ['implementer', 'assayer', 'planner', 'integrator']) {
        put(
          join(hostAgents, `${name}.md`),
          `---\nname: ${name}\noutput: { schema: manual }\n---\nmanual output default\n`,
        );
      }
      const oldSkillRoot =
        harness === 'claude' ? join(claude, 'skills') : join(neutral, 'skills');
      put(
        join(oldSkillRoot, 'dispatch/SKILL.md'),
        'manual dispatch POC schema catalog\n',
      );
      expect(
        await runDeploy({
          agentsDir: join(tree, 'agents'),
          skillsDir: join(tree, 'skills'),
          hooksDir: tree,
          kind: 'all',
          scope: 'user',
          harness,
          home,
          config: join(root, 'cratylus.config.ts'),
          log: () => {},
          warn: () => {},
        }),
      ).toBe(0);
    }

    for (const harness of ['claude', 'omp'] as const) {
      const tree = join(root, '.cratylus', harness);
      const hostAgents =
        harness === 'claude'
          ? join(claude, 'agents')
          : join(omp, 'agent/agents');
      for (const name of ['architect', 'nico', 'kino', 'mav']) {
        expect(readFileSync(join(hostAgents, `${name}.md`), 'utf8')).toBe(
          readFileSync(join(tree, 'agents', `${name}.md`), 'utf8'),
        );
      }
      for (const name of ['implementer', 'assayer', 'planner', 'integrator']) {
        expect(
          readFileSync(join(hostAgents, `${name}.md`), 'utf8'),
        ).not.toMatch(/^output:/m);
      }
      expect(readFileSync(join(hostAgents, 'host-owned.md'), 'utf8')).toBe(
        `host-owned ${harness === 'claude' ? 'Claude' : 'omp'} agent\n`,
      );
    }
    expect(readFileSync(join(claude, 'settings.json'), 'utf8')).toContain(
      '"theme": "dark"',
    );
    expect(readFileSync(join(claude, 'settings.json'), 'utf8')).toContain(
      '"Bash(ls:*)"',
    );
    expect(readFileSync(join(omp, 'agent/config.yml'), 'utf8')).toBe(ompConfig);
    expect(existsSync(join(neutral, 'skills/dispatch/SKILL.md'))).toBe(true);
    expect(readFileSync(join(claude, 'skills/dispatch/SKILL.md'), 'utf8')).toBe(
      readFileSync(
        join(root, '.cratylus/claude/skills/dispatch/SKILL.md'),
        'utf8',
      ),
    );
    expect(
      readFileSync(join(neutral, 'skills/dispatch/SKILL.md'), 'utf8'),
    ).toBe(
      readFileSync(
        join(root, '.cratylus/omp/skills/dispatch/SKILL.md'),
        'utf8',
      ),
    );
  });
});
