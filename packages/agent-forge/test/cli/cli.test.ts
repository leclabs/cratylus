import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { claudeAdapter } from '../../src/adapters/claude/index.js';
import { opencodeAdapter } from '../../src/adapters/opencode/index.js';
import { runCompile } from '../../src/cli/commands/compile.js';
import { runImport } from '../../src/cli/commands/import.js';
import { runInit } from '../../src/cli/commands/init.js';
import { runLint } from '../../src/cli/commands/lint.js';
import { resolveAgentsConfig } from '../../src/config/index.js';
import type { AgentPlugin } from '../../src/resolve/plugin.js';

const adapters = [claudeAdapter, opencodeAdapter];

/** The real anatomy corpus dimensions dir — the default plugin's fragment source. */
const ANATOMY_DIMENSIONS = fileURLToPath(
  new URL('../../../agent-anatomy/src/dimensions', import.meta.url),
);

function buildClaudeFixture(cwd: string): void {
  writeFileSync(join(cwd, 'CLAUDE.md'), '# Project rules\n\nBe terse.', 'utf8');
  const claude = join(cwd, '.claude');
  mkdirSync(claude, { recursive: true });
  writeFileSync(
    join(claude, 'settings.json'),
    JSON.stringify(
      {
        hooks: {
          PostToolUse: [
            {
              matcher: 'Edit',
              hooks: [{ type: 'command', command: './fmt.sh', timeout: 30 }],
            },
          ],
        },
        permissions: { allow: ['Read(*)'] },
      },
      null,
      2,
    ),
    'utf8',
  );
}

describe('CLI commands (integration)', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-cli-'));
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('init creates .agent-forge/ with manifest and resource dirs', async () => {
    const code = await runInit({ scope: 'project', cwd });
    expect(code).toBe(0);
    expect(existsSync(join(cwd, '.agent-forge', 'manifest.yaml'))).toBe(true);
    expect(existsSync(join(cwd, '.agent-forge', 'rules'))).toBe(true);
    expect(existsSync(join(cwd, '.agent-forge', 'hooks'))).toBe(true);
  });

  it('init refuses to overwrite an existing .agent-forge/', async () => {
    await runInit({ scope: 'project', cwd });
    const code = await runInit({ scope: 'project', cwd });
    expect(code).toBe(1);
  });

  it('init appends to an existing .gitignore on project scope', async () => {
    writeFileSync(join(cwd, '.gitignore'), 'node_modules/\n', 'utf8');
    await runInit({ scope: 'project', cwd });
    expect(readFileSync(join(cwd, '.gitignore'), 'utf8')).toContain(
      '.agent-forge/local/',
    );
  });

  it('init scaffolds a project from the default plugin, resolvable through resolve()', async () => {
    // (1) init on an empty dir scaffolds the config-is-code home whose zero-config
    // default `extends: [anatomy]` — the default is A PACKAGE, not a baked template.
    const code = await runInit({ scope: 'project', cwd });
    expect(code).toBe(0);
    const configSrc = readFileSync(join(cwd, 'agents.config.ts'), 'utf8');
    expect(configSrc).toContain("import anatomy from '@leclabs/agent-anatomy'");
    expect(configSrc).toMatch(/extends:\s*\[anatomy\]/);
    expect(configSrc).toMatch(/patches:\s*\[\]/);

    // (2) that default plugin resolves through the NORMAL resolve() with empty
    // patches → the anatomy default fragment set (defaults-are-a-package, §2). The
    // anatomy plugin self-locates its dirs at runtime; the test supplies the same
    // dir directly (forge cannot bare-import the peer package).
    const anatomy: AgentPlugin = {
      name: 'anatomy',
      fragments: ANATOMY_DIMENSIONS,
    };
    const resolved = await resolveAgentsConfig({
      extends: [anatomy],
      patches: [],
    });
    expect(resolved.fragments.size).toBeGreaterThan(100);
    const byId = new Map(
      [...resolved.fragments.values()].map((r) => [r.fragment.id, r.value]),
    );
    expect(byId.get('anatomy:objective/parsimony')).toBe('parsimony');
  });

  it('import claude lifts a real .claude/ tree into the IR', async () => {
    buildClaudeFixture(cwd);
    await runInit({ scope: 'project', cwd });
    const code = await runImport(
      { client: 'claude', scope: 'project', cwd },
      adapters,
    );
    expect(code).toBe(0);
    expect(existsSync(join(cwd, '.agent-forge', 'rules', 'main.md'))).toBe(
      true,
    );
    expect(existsSync(join(cwd, '.agent-forge', 'hooks'))).toBe(true);
    expect(existsSync(join(cwd, '.agent-forge', 'permissions.yaml'))).toBe(
      true,
    );
  });

  it('full flow: init → import claude → compile opencode produces opencode files', async () => {
    buildClaudeFixture(cwd);
    await runInit({ scope: 'project', cwd });
    await runImport({ client: 'claude', scope: 'project', cwd }, adapters);

    // Add opencode to manifest targets so default compile picks it up.
    const manifestPath = join(cwd, '.agent-forge', 'manifest.yaml');
    const text = readFileSync(manifestPath, 'utf8');
    writeFileSync(
      manifestPath,
      text.replace(
        'targets:\n  - claude',
        'targets:\n  - claude\n  - opencode',
      ),
      'utf8',
    );

    const code = await runCompile({ scope: 'project', cwd }, adapters);
    expect(code).toBe(0);
    expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
    expect(
      existsSync(join(cwd, '.opencode', 'plugins', 'agent-forge-hooks.yaml')),
    ).toBe(true);
    expect(
      existsSync(join(cwd, '.opencode', 'plugins', 'agent-forge-hooks.ts')),
    ).toBe(true);
  });

  it('lint reports unsupported resource per declared target', async () => {
    buildClaudeFixture(cwd);
    await runInit({ scope: 'project', cwd });
    await runImport({ client: 'claude', scope: 'project', cwd }, adapters);
    // Add a command (which opencode does not support) and add opencode to targets
    const cmdDir = join(cwd, '.agent-forge', 'commands');
    mkdirSync(cmdDir, { recursive: true });
    writeFileSync(
      join(cmdDir, 'review.md'),
      '---\ndescription: Review code\n---\nReview the diff.',
      'utf8',
    );
    const manifestPath = join(cwd, '.agent-forge', 'manifest.yaml');
    const text = readFileSync(manifestPath, 'utf8');
    writeFileSync(
      manifestPath,
      text.replace(
        'targets:\n  - claude',
        'targets:\n  - claude\n  - opencode',
      ),
      'utf8',
    );

    // Capture stdout
    const messages: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => {
      messages.push(args.join(' '));
    };
    try {
      const code = await runLint({ scope: 'project', cwd }, adapters);
      expect(code).toBe(0);
      expect(
        messages.some((m) => m.includes('opencode') && m.includes('commands')),
      ).toBe(true);
    } finally {
      console.log = origLog;
    }
  });
});
