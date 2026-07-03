/**
 * E2.S2 · IR write is canonical and idempotent.
 * Contract: plans/interop-hardening/stories/E2-ir-emission.md.
 */

import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';

import { type IR, readIR, writeIR } from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';
import { hashTree, walkFiles } from './lib.js';

/** One resource of every type — exercises every layout rule at once. */
const fullIR = (): IR => ({
  manifest: { agentForge: 1, scope: 'project', targets: ['claude'] },
  rules: [
    { id: 'main', body: '# Project rules\n\nBe terse.', order: 1 },
    { id: 'style', body: 'Two-space indent.' },
  ],
  skills: [
    {
      name: 'review',
      description: 'Review code',
      body: '# Review steps\n\n1. read\n2. comment',
      allowed_tools: ['Read'],
    },
  ],
  commands: [
    { name: 'plan', body: 'Make a plan.', description: 'Trigger planning' },
  ],
  agents: [
    {
      name: 'planner',
      body: 'You are the planner.',
      model: 'claude-sonnet-4-6',
    },
  ],
  hooks: [
    {
      id: 'fmt-on-edit',
      events: ['tool.use.post'],
      matcher: 'Edit|Write',
      command: './scripts/fmt.sh',
      timeout: 30,
    },
  ],
  mcp_servers: [
    {
      name: 'github',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
    },
  ],
  permissions: { allow: ['Read(*)'], deny: ['Bash(rm -rf:*)'] },
  env: { DEBUG: 'true' },
});

describe('E2.S2 · IR write is canonical and idempotent', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = makeTmpDir();
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  story(
    'E2.S2',
    'writeIR → readIR → writeIR produces a byte-identical tree (second write = no diff)',
    async () => {
      await writeIR(fullIR(), 'project', cwd);
      const root = join(cwd, '.agent-forge');
      const first = hashTree(root);

      const reread = await readIR('project', cwd);
      await writeIR(reread, 'project', cwd);
      const second = hashTree(root);

      expect(second).toEqual(first);
    },
  );

  story(
    'E2.S2',
    'every emitted file sits at the path the documented layout rule derives (resource type → folder, one file per resource, name = id/name)',
    async () => {
      await writeIR(fullIR(), 'project', cwd);
      const root = join(cwd, '.agent-forge');

      // The blind-reader prediction: derived purely from the IR contents.
      const predicted = [
        'manifest.yaml',
        'rules/main.md',
        'rules/style.md',
        'skills/review/SKILL.md',
        'commands/plan.md',
        'agents/planner.md',
        'hooks/fmt-on-edit.yaml',
        'mcp/servers.yaml',
        'permissions.yaml',
        'env.yaml',
      ].sort();

      expect(walkFiles(root)).toEqual(predicted);
    },
  );

  story(
    'E2.S2',
    'the round-read of the canonical tree is value-identical to the source IR',
    async () => {
      const ir = fullIR();
      await writeIR(ir, 'project', cwd);
      const reread = await readIR('project', cwd);
      expect(reread).toEqual(ir);
    },
  );
});
