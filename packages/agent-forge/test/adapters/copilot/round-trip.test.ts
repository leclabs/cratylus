import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { copilotAdapter } from '../../../src/adapters/copilot/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';

const manifest = (): Manifest => ({
  agentForge: 1,
  scope: 'project',
  targets: ['copilot'],
});

describe('copilotAdapter', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-copilot-'));
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('writes AGENTS.md, skills, MCP, and hooks to Copilot-readable locations [CP2][CP4][CP6]', async () => {
    const ir: IR = {
      manifest: manifest(),
      rules: [{ id: 'main', body: '# Rules\n\nBe terse.' }],
      skills: [{ name: 'review', description: 'Review code', body: '# steps' }],
      hooks: [
        {
          id: 'fmt',
          events: ['tool.use.post'],
          matcher: 'Edit',
          command: './fmt.sh',
          timeout: 15,
        },
      ],
      mcp_servers: [
        {
          name: 'github',
          transport: 'stdio',
          command: 'npx',
          args: ['-y', 'pkg'],
        },
      ],
    };
    const report = await copilotAdapter.write(ir, 'project', cwd, {});
    expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
    expect(
      existsSync(join(cwd, '.github', 'skills', 'review', 'SKILL.md')),
    ).toBe(true);
    expect(existsSync(join(cwd, '.vscode', 'mcp.json'))).toBe(true);
    const hooksDir = join(cwd, '.github', 'hooks');
    expect(existsSync(hooksDir)).toBe(true);

    const files = readdirSync(hooksDir).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);
    const envelope = JSON.parse(
      readFileSync(join(hooksDir, files[0] as string), 'utf8'),
    );
    expect(envelope.version).toBe(1);
    expect(envelope.hooks.postToolUse).toBeDefined();
    expect(report.warnings).toEqual([]);
  });

  it('drops hooks that have no Copilot event equivalent [CP4]', async () => {
    const ir: IR = {
      manifest: manifest(),
      hooks: [
        // file.edit.post has no documented Copilot event equivalent.
        { id: 'notify', events: ['file.edit.post'], command: 'echo' },
      ],
    };
    const report = await copilotAdapter.write(ir, 'project', cwd, {});
    expect(report.warnings.length).toBeGreaterThan(0);
    expect(report.skipped.length).toBeGreaterThan(0);
    expect(existsSync(join(cwd, '.github', 'hooks'))).toBe(false);
  });

  it('does not clobber a hand-authored hooks file in .github/hooks/ [CP4]', async () => {
    mkdirSync(join(cwd, '.github', 'hooks'), { recursive: true });
    writeFileSync(
      join(cwd, '.github', 'hooks', 'manual.json'),
      JSON.stringify({
        version: 1,
        hooks: { sessionStart: [{ type: 'command', bash: './manual.sh' }] },
      }),
      'utf8',
    );
    const ir: IR = {
      manifest: manifest(),
      hooks: [{ id: 'fmt', events: ['tool.use.post'], command: './fmt.sh' }],
    };
    await copilotAdapter.write(ir, 'project', cwd, {});
    const manual = JSON.parse(
      readFileSync(join(cwd, '.github', 'hooks', 'manual.json'), 'utf8'),
    );
    expect(manual.hooks.sessionStart).toBeDefined(); // untouched
    const managed = JSON.parse(
      readFileSync(join(cwd, '.github', 'hooks', 'agent-forge.json'), 'utf8'),
    );
    expect(managed.hooks.postToolUse).toBeDefined(); // newly added, own file
  });

  it('round-trips rules + skills + mcp', async () => {
    const ir: IR = {
      manifest: manifest(),
      rules: [{ id: 'main', body: 'Be terse.' }],
      skills: [{ name: 'review', description: 'Review code', body: '# steps' }],
      mcp_servers: [
        {
          name: 'github',
          transport: 'stdio',
          command: 'npx',
          args: ['-y', 'pkg'],
        },
      ],
    };
    await copilotAdapter.write(ir, 'project', cwd, {});
    const re = await copilotAdapter.read('project', cwd);
    expect(re.rules).toEqual(ir.rules);
    expect(re.skills).toEqual(ir.skills);
    expect(re.mcp_servers).toEqual(ir.mcp_servers);
  });

  it('round-trips agents + commands [CP1][CP5]', async () => {
    const ir: IR = {
      manifest: manifest(),
      agents: [{ name: 'helper', body: 'You help.', description: 'A helper' }],
      commands: [
        { name: 'deploy', body: 'Deploy the app.', description: 'Deploy' },
      ],
    };
    await copilotAdapter.write(ir, 'project', cwd, {});
    const re = await copilotAdapter.read('project', cwd);
    expect(re.agents).toEqual(ir.agents);
    expect(re.commands).toEqual(ir.commands);
  });

  it('warns about unsupported resource types (permissions/env) [CP4][CP13]', async () => {
    const ir: IR = {
      manifest: manifest(),
      permissions: { allow: ['Read(*)'] },
      env: { X: 'y' },
    };
    const report = await copilotAdapter.write(ir, 'project', cwd, {});
    expect(report.warnings.some((w) => w.includes('permissions'))).toBe(true);
    expect(report.warnings.some((w) => w.includes('env'))).toBe(true);
  });
});
