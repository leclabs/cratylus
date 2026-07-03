/**
 * E2.S7 · the IR home is itself discoverable by walk-up.
 * Contract: test/stories/E2-ir-emission.md.
 */

import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { runCompile } from '../../../src/cli/commands/compile.js';
import { findIRRoot, writeIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';
import { captureConsole, hashTree } from './lib.js';

describe('E2.S7 · IR home discoverable by walk-up', () => {
  let root: string;
  let nested: string;

  beforeEach(async () => {
    root = makeTmpDir();
    await writeIR(
      {
        manifest: { agentForge: 1, scope: 'project', targets: ['claude'] },
        rules: [{ id: 'main', body: 'Walk-up rule.' }],
      },
      'project',
      root,
    );
    nested = join(root, 'packages', 'deep', 'nested');
    mkdirSync(nested, { recursive: true });
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  story(
    'E2.S7',
    'findIRRoot resolves the nearest project .agent-forge/ from a nested cwd',
    () => {
      expect(findIRRoot('project', nested)).toBe(join(root, '.agent-forge'));
    },
  );

  story(
    'E2.S7',
    'compile --dry-run from the nested cwd resolves the root IR, exits 0, writes nothing',
    async () => {
      const before = hashTree(root);
      const { result } = await captureConsole(() =>
        runCompile(
          { scope: 'project', cwd: nested, dryRun: true },
          ALL_ADAPTERS,
        ),
      );
      expect(result).toBe(0);
      expect(hashTree(root)).toEqual(before);
    },
  );

  story(
    'E2.S7',
    'the dry-run report names the resolved IR path (<root>/.agent-forge)',
    async () => {
      const { output } = await captureConsole(() =>
        runCompile(
          { scope: 'project', cwd: nested, dryRun: true },
          ALL_ADAPTERS,
        ),
      );
      expect(output).toContain(join(root, '.agent-forge'));
    },
  );
});
