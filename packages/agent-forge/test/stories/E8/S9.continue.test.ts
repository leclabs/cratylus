/**
 * E8.S9 · continue — MCP retarget, rules home, prompts on.
 * Ground truth: harness-landscape-research.RETURN.md §2/Continue, §3/continue d1–d3.
 * Refs [CT1][CT2][CT3][CT4].
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { continueAdapter } from '../../../src/adapters/continue/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';
import { fakeHome, makeTmpDir, story } from '../helpers.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['continue'],
});

const MCP_IR: IR = {
  manifest: manifest(),
  mcp_servers: [
    { name: 'github', transport: 'stdio', command: 'npx', args: ['-y', 'pkg'] },
  ],
};

describe('E8.S9 · continue', () => {
  let cwd: string;
  let home: { home: string; restore: () => void } | null = null;

  beforeEach(() => {
    cwd = makeTmpDir('af-e8s9-');
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
    home?.restore();
    home = null;
  });
  const useHome = (): string => {
    home = fakeHome();
    return home.home;
  };

  // --- MCP retarget [CT4][CT1] ---

  story.tracked(
    'E8.S9',
    'MCP emits to .continue/mcpServers/mcp.json or a valid LIST-form config.yaml [CT4][CT1]',
    async () => {
      await continueAdapter.write(MCP_IR, 'project', cwd, {});
      const foreignHome = existsSync(
        join(cwd, '.continue', 'mcpServers', 'mcp.json'),
      );
      let validYaml = false;
      const cfgFile = join(cwd, '.continue', 'config.yaml');
      if (existsSync(cfgFile)) {
        const cfg = (load(readFileSync(cfgFile, 'utf8')) ?? {}) as {
          name?: unknown;
          version?: unknown;
          schema?: unknown;
          mcpServers?: unknown;
        };
        validYaml =
          cfg.name !== undefined &&
          cfg.version !== undefined &&
          cfg.schema !== undefined &&
          Array.isArray(cfg.mcpServers);
      }
      expect(foreignHome || validYaml).toBe(true);
    },
  );

  story.tracked(
    'E8.S9',
    'an existing user config.yaml is never map-clobbered [CT1]',
    async () => {
      mkdirSync(join(cwd, '.continue'), { recursive: true });
      writeFileSync(
        join(cwd, '.continue', 'config.yaml'),
        'name: mine\nversion: 1.0.0\nschema: v1\nmodels: []\n',
        'utf8',
      );
      await continueAdapter.write(MCP_IR, 'project', cwd, {});
      const cfg = (load(
        readFileSync(join(cwd, '.continue', 'config.yaml'), 'utf8'),
      ) ?? {}) as { name?: unknown };
      expect(cfg.name).toBe('mine');
    },
  );

  story.tracked(
    'E8.S9',
    'LIST-form config.yaml mcpServers lifts on read [CT4]',
    async () => {
      mkdirSync(join(cwd, '.continue'), { recursive: true });
      writeFileSync(
        join(cwd, '.continue', 'config.yaml'),
        [
          'name: mine',
          'version: 1.0.0',
          'schema: v1',
          'mcpServers:',
          '  - name: github',
          '    command: npx',
          '    args: [-y, pkg]',
          '    type: stdio',
          '',
        ].join('\n'),
        'utf8',
      );
      const re = await continueAdapter.read('project', cwd);
      // The block's own name field must survive the lift (today the LIST is
      // treated as a map and the server surfaces under the phantom name '0').
      expect((re.mcp_servers ?? [])[0]?.name).toBe('github');
      // Amended acceptance [CT4]: servers are keyed by the block's `name`,
      // never by array index — an id that is a bare integer string = FAIL.
      for (const s of re.mcp_servers ?? []) {
        expect(s.name, `phantom index-keyed server id '${s.name}'`).not.toMatch(
          /^\d+$/,
        );
      }
    },
  );

  // --- Rules home [CT2] ---

  story.tracked(
    'E8.S9',
    'rules emit to .continue/rules/*.md [CT2]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'style', body: 'Use tabs.' }],
      };
      await continueAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, '.continue', 'rules', 'style.md'))).toBe(
        true,
      );
    },
  );

  story.tracked(
    'E8.S9',
    'the undocumented root AGENTS.md write is gone [CT2]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'style', body: 'Use tabs.' }],
      };
      await continueAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(false);
    },
  );

  story.tracked(
    'E8.S9',
    'the undocumented ~/.continue/AGENTS.md write is gone [CT2]',
    async () => {
      const h = useHome();
      const ir: IR = {
        manifest: manifest('user'),
        rules: [{ id: 'style', body: 'Use tabs.' }],
      };
      await continueAdapter.write(ir, 'user', cwd, {});
      expect(existsSync(join(h, '.continue', 'AGENTS.md'))).toBe(false);
    },
  );

  // --- Prompts on [CT3] ---

  story.tracked(
    'E8.S9',
    'commands emit as invokable prompts .continue/prompts/*.md [CT3]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        commands: [{ name: 'deploy', body: 'Deploy the app.' }],
      };
      await continueAdapter.write(ir, 'project', cwd, {});
      const promptFile = join(cwd, '.continue', 'prompts', 'deploy.md');
      expect(existsSync(promptFile)).toBe(true);
      expect(readFileSync(promptFile, 'utf8')).toContain('invokable: true');
    },
  );

  // --- Honest capability [CT1] ---

  story(
    'E8.S9',
    'hooks: none stays honest — Continue has no hooks [CT1]',
    () => {
      expect(continueAdapter.capabilities.resources.hooks).toBe('none');
    },
  );

  // --- Fabricated-shape import (E1.S3) ---

  story.tracked(
    'E8.S9',
    'fabricated-shape import: root AGENTS.md lifts zero phantom rules (E1.S3) [CT2]',
    async () => {
      writeFileSync(join(cwd, 'AGENTS.md'), 'Phantom rules.\n', 'utf8');
      const re = await continueAdapter.read('project', cwd);
      expect(re.rules ?? []).toEqual([]);
    },
  );
});
