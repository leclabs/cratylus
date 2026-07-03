/**
 * E3.S1 · own-format round-read is the identity.
 * Contract: plans/interop-hardening/stories/E3-reimport.md.
 */

import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { runImport } from '../../../src/cli/commands/import.js';
import { runLint } from '../../../src/cli/commands/lint.js';
import { type IR, readIR, writeIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';
import { captureConsole, hashTree } from './lib.js';

const fullIR = (): IR => ({
  manifest: { agentForge: 1, scope: 'project', targets: ['claude'] },
  rules: [{ id: 'main', body: '# Rules\n\nBe terse.' }],
  skills: [
    { name: 'review', description: 'Review code', body: '# Review\n\n1. read' },
  ],
  commands: [{ name: 'plan', body: 'Make a plan.', description: 'Planning' }],
  agents: [{ name: 'one', body: 'You are one.', description: 'Agent one' }],
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
    { name: 'github', transport: 'stdio', command: 'npx', args: ['-y', 'srv'] },
  ],
  permissions: { allow: ['Read(*)'] },
  env: { DEBUG: 'true' },
});

describe('E3.S1 · own-format round-read is the identity', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = makeTmpDir();
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  story(
    'E3.S1',
    'readIR(writeIR(ir)) ≡ ir on all resource collections + manifest',
    async () => {
      const ir = fullIR();
      await writeIR(ir, 'project', cwd);
      const reread = await readIR('project', cwd);
      expect(reread).toEqual(ir);
    },
  );

  story.tracked(
    'E3.S1',
    'import --from <otherRepo>/.agent-forge copies the foreign IR into the local home; lint passes; source unchanged',
    async () => {
      // No own-format import verb exists today: no adapter has id 'agent-forge',
      // so runImport rejects it as an unknown client.
      const otherRepo = makeTmpDir();
      try {
        await writeIR(fullIR(), 'project', otherRepo);
        const sourceBefore = hashTree(otherRepo);

        const { result } = await captureConsole(() =>
          runImport(
            {
              client: 'agent-forge',
              scope: 'project',
              cwd,
              from: join(otherRepo, '.agent-forge'),
            },
            ALL_ADAPTERS,
          ),
        );
        expect(result).toBe(0);
        expect(existsSync(join(cwd, '.agent-forge', 'rules', 'main.md'))).toBe(
          true,
        );

        const lint = await captureConsole(() =>
          runLint({ scope: 'project', cwd }, ALL_ADAPTERS),
        );
        expect(lint.result).toBe(0);
        expect(hashTree(otherRepo)).toEqual(sourceBefore);
      } finally {
        rmSync(otherRepo, { recursive: true, force: true });
      }
    },
  );
});
