/**
 * E10.S1 · Amp adapter — new-adapter contract probes.
 * Ground truth: harness-landscape-research.RETURN.md §2/Amp sheet.
 * Refs [AM1][AM2][AM3][AM4]. Graduated: the adapter ships at
 * src/adapters/amp/ — the dynamic import resolves and every contract
 * assertion executes green.
 */

import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import type { IR, Manifest } from '../../../src/core/index.js';
import { adapterById, makeTmpDir, story } from '../helpers.js';
import { importAdapter } from './probe.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['amp'],
});

describe('E10.S1 · amp', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = makeTmpDir('af-e10s1-');
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  story('E10.S1', 'amp is on the adapter roster (new-adapter contract)', () => {
    expect(adapterById.has('amp')).toBe(true);
  });

  story(
    'E10.S1',
    'settings: flat amp.* keys in .amp/settings.json with MCP under amp.mcpServers [AM1]',
    async () => {
      const amp = await importAdapter('amp');
      const ir: IR = {
        manifest: manifest(),
        mcp_servers: [
          { name: 'github', transport: 'stdio', command: 'npx', args: ['-y'] },
        ],
      };
      await amp.write(ir, 'project', cwd, {});
      const settingsFile = join(cwd, '.amp', 'settings.json');
      expect(existsSync(settingsFile)).toBe(true);
      const settings = JSON.parse(readFileSync(settingsFile, 'utf8')) as Record<
        string,
        unknown
      >;
      const mcp = settings['amp.mcpServers'] as
        | Record<string, unknown>
        | undefined;
      expect(mcp?.github).toBeDefined();
      // Flat dialect: no fabricated nested "amp" object, no bare mcpServers key.
      expect('mcpServers' in settings).toBe(false);
    },
  );

  story(
    'E10.S1',
    'skills emit to the natively-read .agents/skills/ — no bespoke dir [AM4]',
    async () => {
      const amp = await importAdapter('amp');
      const ir: IR = {
        manifest: manifest(),
        skills: [
          { name: 'review', description: 'Review code', body: '# steps' },
        ],
      };
      await amp.write(ir, 'project', cwd, {});
      expect(
        existsSync(join(cwd, '.agents', 'skills', 'review', 'SKILL.md')),
      ).toBe(true);
      expect(existsSync(join(cwd, '.amp', 'skills'))).toBe(false);
    },
  );

  story(
    'E10.S1',
    'agents+commands+hooks ship via the plugin emitter; legacy amp.hooks never emitted [AM2][AM3]',
    async () => {
      const amp = await importAdapter('amp');
      const ir: IR = {
        manifest: manifest(),
        hooks: [
          { id: 'guard', events: ['tool.use.pre'], command: './check.sh' },
        ],
        agents: [{ name: 'helper', body: 'You help.' }],
        commands: [{ name: 'deploy', body: 'Deploy.' }],
      };
      await amp.write(ir, 'project', cwd, {});
      const pluginsDir = join(cwd, '.amp', 'plugins');
      expect(existsSync(pluginsDir)).toBe(true);
      expect(readdirSync(pluginsDir).some((f) => f.endsWith('.ts'))).toBe(true);
      const settingsFile = join(cwd, '.amp', 'settings.json');
      if (existsSync(settingsFile)) {
        const settings = JSON.parse(
          readFileSync(settingsFile, 'utf8'),
        ) as Record<string, unknown>;
        expect('amp.hooks' in settings).toBe(false);
      }
    },
  );

  story(
    'E10.S1',
    'rules: AGENTS.md emitted and lifted on read (cwd→$HOME chain, @-imports) [AM1]',
    async () => {
      const amp = await importAdapter('amp');
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'main', body: 'Be terse.' }],
      };
      await amp.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
      const re = await amp.read('project', cwd);
      expect(re.rules).toEqual(ir.rules);
    },
  );
});
