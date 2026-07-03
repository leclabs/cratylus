/**
 * E5.S2 — agents via plugin where file-config agents are absent: Amp.
 *
 * Documented truth: Amp has no agent *file* dialect (agents are built-ins +
 * the `amp.createAgent()` plugin API [AM1][AM9]); compile emits
 * `.amp/plugins/agent-forge-agents.ts` (project scope) default-exporting a
 * function calling `amp.createAgent()` once per IR agent with name + system
 * prompt mapped; IR fields Amp's API cannot carry are warned per the E4.S2
 * discipline.
 *
 * Graduated: the amp adapter ships at src/adapters/amp/ — both bodies
 * execute green against the shipped `pluginEmitters.agents`.
 */

import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import type { Adapter, IR } from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';

/** Resolve the (documented, not-yet-shipped) amp adapter at runtime. */
async function importAmpAdapter(): Promise<Adapter> {
  const home: string = '../../../src/adapters/amp/index.js';
  const mod = (await import(home)) as {
    ampAdapter?: Adapter;
    default?: Adapter;
  };
  const adapter = mod.ampAdapter ?? mod.default;
  expect(
    adapter,
    'amp adapter module resolved but exports no adapter',
  ).toBeDefined();
  return adapter as Adapter;
}

const irWithAgent: IR = {
  manifest: { agentForge: 1, scope: 'project', targets: ['amp'] },
  agents: [
    {
      name: 'scout',
      description: 'a read-only reconnaissance subagent',
      body: 'You are scout: reconnoiter, never mutate.',
    },
  ],
};

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E5.S2',
  'compile emits .amp/plugins/agent-forge-agents.ts default-exporting amp.createAgent calls per IR agent [AM1][AM9]',
  async () => {
    const amp = await importAmpAdapter();
    const report = await amp.write(irWithAgent, 'project', cwd, {});
    const artifact = report.written.find((p) =>
      p.endsWith(join('.amp', 'plugins', 'agent-forge-agents.ts')),
    );
    expect(
      artifact,
      `documented artifact .amp/plugins/agent-forge-agents.ts not in written: ${report.written.join(', ')}`,
    ).toBeDefined();
    const src = readFileSync(artifact as string, 'utf8');
    // Default-exports a function that calls amp.createAgent() once per agent,
    // with name + system prompt mapped.
    expect(src).toMatch(/export default/);
    expect(src).toContain('createAgent');
    expect(src).toContain('scout');
    expect(src).toContain('You are scout: reconnoiter, never mutate.');
  },
);

story(
  'E5.S2',
  'IR agent fields the amp.createAgent API cannot carry are warned per E4.S2 discipline',
  async () => {
    const amp = await importAmpAdapter();
    const ir: IR = {
      manifest: { agentForge: 1, scope: 'project', targets: ['amp'] },
      agents: [
        {
          name: 'scout',
          description: 'a reconnaissance subagent',
          body: 'You are scout.',
          // Fields with no verified amp.createAgent() mapping [AM2]: the
          // adapter must warn, never drop silently.
          model: 'sonnet',
          color: 'green',
          tools: ['read'],
        },
      ],
    };
    const report = await amp.write(ir, 'project', cwd, {});
    expect(
      report.warnings.some((w) => /scout/.test(w)),
      `expected a per-agent lossy-field warning; warnings: ${report.warnings.join(' | ')}`,
    ).toBe(true);
  },
);
