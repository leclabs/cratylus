/**
 * E2.S1 · init bootstraps a valid IR home.
 * Contract: plans/interop-hardening/stories/E2-ir-emission.md.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { runInit } from '../../../src/cli/commands/init.js';
import { runLint } from '../../../src/cli/commands/lint.js';
import { type Manifest, validateManifest } from '../../../src/core/index.js';
import { ALL_ADAPTERS, fakeHome, makeTmpDir, story } from '../helpers.js';
import { captureConsole } from './lib.js';

const RESOURCE_DIRS = ['rules', 'skills', 'commands', 'agents', 'hooks', 'mcp'];

describe('E2.S1 · init bootstraps a valid IR home', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = makeTmpDir();
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  function readManifest(root: string): Manifest {
    return load(readFileSync(join(root, 'manifest.yaml'), 'utf8')) as Manifest;
  }

  story(
    'E2.S1',
    'project init creates .agent-forge/ with schema-valid manifest and resource folders',
    async () => {
      const code = await captureConsole(() =>
        runInit({ scope: 'project', cwd }),
      );
      expect(code.result).toBe(0);

      const root = join(cwd, '.agent-forge');
      const manifest = readManifest(root);
      expect(validateManifest(manifest)).toBe(true);
      expect(manifest.agentForge).toBe(1);
      expect(manifest.scope).toBe('project');
      expect(Array.isArray(manifest.targets)).toBe(true);

      for (const dir of RESOURCE_DIRS) {
        expect(existsSync(join(root, dir)), `missing ${dir}/`).toBe(true);
      }
    },
  );

  story('E2.S1', 'lint passes on the fresh project tree', async () => {
    await captureConsole(() => runInit({ scope: 'project', cwd }));
    const lint = await captureConsole(() =>
      runLint({ scope: 'project', cwd }, ALL_ADAPTERS),
    );
    expect(lint.result).toBe(0);
  });

  story(
    'E2.S1',
    '--scope user targets ~/.agent-forge/ with manifest scope user',
    async () => {
      const fh = fakeHome();
      try {
        const code = await captureConsole(() =>
          runInit({ scope: 'user', cwd }),
        );
        expect(code.result).toBe(0);

        const root = join(fh.home, '.agent-forge');
        expect(existsSync(join(root, 'manifest.yaml'))).toBe(true);
        const manifest = readManifest(root);
        expect(validateManifest(manifest)).toBe(true);
        expect(manifest.scope).toBe('user');

        const lint = await captureConsole(() =>
          runLint({ scope: 'user', cwd }, ALL_ADAPTERS),
        );
        expect(lint.result).toBe(0);
      } finally {
        fh.restore();
      }
    },
  );

  story(
    'E2.S1',
    '--scope local targets <root>/.agent-forge/local/ with manifest scope local',
    async () => {
      const code = await captureConsole(() => runInit({ scope: 'local', cwd }));
      expect(code.result).toBe(0);

      const root = join(cwd, '.agent-forge', 'local');
      expect(existsSync(join(root, 'manifest.yaml'))).toBe(true);
      const manifest = readManifest(root);
      expect(validateManifest(manifest)).toBe(true);
      expect(manifest.scope).toBe('local');

      const lint = await captureConsole(() =>
        runLint({ scope: 'local', cwd }, ALL_ADAPTERS),
      );
      expect(lint.result).toBe(0);
    },
  );
});
