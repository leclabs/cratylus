// A practice is CLOSED under dispatch when every role an agent it places hands work
// to is held by an agent of the chosen set — or is an agent the harness supplies
// natively (`HarnessAdapter.nativeAgents`). And the projected tree reports each
// rendered agent's model routing (`agentModels`), keyed by agent name.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import type { HarnessAdapter } from '../../src/core/harness-adapter.js';
import {
  type ProjectablePlugin,
  projectPluginSet,
} from '../../src/project/index.js';
import {
  FIXTURE_DIMENSION_NAMES,
  FIXTURE_MANIFEST,
} from '../fixture-manifest.js';

const roots: string[] = [];
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

const EMPTY_FIELDS = FIXTURE_DIMENSION_NAMES.map(
  (d) => `  ${d.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())}: [],`,
).join('\n');

/** An agent module holding `holds`, dispatching `dispatches`, routed as given. */
function agentModule(
  name: string,
  holds: string,
  dispatches: readonly string[],
  routing?: { tier: string; effort: string },
): string {
  return [
    `export const ${name} = {`,
    `  name: '${name}',`,
    `  description: 'a fixture agent holding ${holds}',`,
    '  mark: null,',
    '  key: null,',
    `  holds: '${holds}',`,
    `  dispatches: ${JSON.stringify(dispatches)},`,
    ...(routing ? [`  routing: ${JSON.stringify(routing)},`] : []),
    EMPTY_FIELDS,
    '};',
    '',
  ].join('\n');
}

function plugin(): ProjectablePlugin {
  const root = mkdtempSync(join(tmpdir(), 'forge-practice-closure-'));
  roots.push(root);
  const agents = join(root, 'agents');
  mkdirSync(agents);
  writeFileSync(
    join(agents, 'chief.ts'),
    agentModule('chief', 'lead', ['worker', 'researcher'], {
      tier: 'frontier',
      effort: 'high',
    }),
  );
  writeFileSync(
    join(agents, 'hand.ts'),
    agentModule('hand', 'worker', [], { tier: 'fast', effort: 'low' }),
  );
  writeFileSync(join(agents, 'loose.ts'), agentModule('loose', 'loose', []));
  return {
    name: 'closure',
    manifest: FIXTURE_MANIFEST,
    agents,
    practices: [
      {
        name: 'team',
        description: 'a chief and its hand',
        agents: ['chief', 'hand'],
      },
      { name: 'alone', description: 'a chief alone', agents: ['chief'] },
    ],
  };
}

const omp = adapterByName('omp');
const withNative: HarnessAdapter = {
  ...omp,
  nativeAgents: { researcher: 'scout' },
};
const withoutNative: HarnessAdapter = { ...omp, nativeAgents: {} };

describe('practice closure under dispatch', () => {
  it('counts a handoff the harness supplies natively as closed', async () => {
    const tree = await projectPluginSet({
      plugins: [plugin()],
      adapter: withNative,
      practices: ['team'],
      warn: () => {},
    });
    expect(tree.agents).toBe(2);
  });

  it('refuses a handoff no chosen agent holds and the harness does not supply', async () => {
    await expect(
      projectPluginSet({
        plugins: [plugin()],
        adapter: withoutNative,
        practices: ['team'],
        warn: () => {},
      }),
    ).rejects.toThrow(
      "practice 'team' is not closed: agent 'chief' dispatches the role 'researcher', which no agent of the chosen set holds and the harness does not supply",
    );
    await expect(
      projectPluginSet({
        plugins: [plugin()],
        adapter: withNative,
        practices: ['alone'],
        warn: () => {},
      }),
    ).rejects.toThrow(/dispatches the role 'worker'/);
  });
});

describe('ProjectedTree.agentModels', () => {
  it('reports each routed agent by name, sorted, and no unrouted one', async () => {
    const tree = await projectPluginSet({
      plugins: [plugin()],
      adapter: withNative,
      warn: () => {},
    });
    expect(tree.agentModels).toEqual({
      chief: { tier: 'frontier', effort: 'high' },
      hand: { tier: 'fast', effort: 'low' },
    });
    expect(Object.keys(tree.agentModels)).toEqual(['chief', 'hand']);
  });
});
