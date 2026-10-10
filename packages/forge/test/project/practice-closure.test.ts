// A practice is CLOSED under dispatch when every role an agent it places hands work
// to is held by an agent of the chosen set — or is an agent the harness supplies
// natively (`HarnessAdapter.nativeAgents`). And the projected tree reports each
// rendered agent's model routing (`agentModels`), keyed by agent name. An agent is
// identified by its DECLARED name, never by the file name of its module.

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

/** An agent module exporting `exported`, declaring `name`, holding `holds`, dispatching
 *  `dispatches`, routed as given. */
function agentModule(
  name: string,
  holds: string,
  dispatches: readonly string[],
  routing?: { tier: string; effort: string },
  exported: string = name,
): string {
  return [
    `export const ${exported} = {`,
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

/** A plugin whose agents are the given modules, by file name, offering `practices`. */
function pluginOf(
  name: string,
  modules: Readonly<Record<string, string>>,
  practices: ProjectablePlugin['practices'] = [],
): ProjectablePlugin {
  const root = mkdtempSync(join(tmpdir(), 'forge-agent-identity-'));
  roots.push(root);
  const agents = join(root, 'agents');
  mkdirSync(agents);
  for (const [file, content] of Object.entries(modules)) {
    writeFileSync(join(agents, `${file}.ts`), content);
  }
  return { name, manifest: FIXTURE_MANIFEST, agents, practices };
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

describe('an agent is identified by its declared name', () => {
  const consumer = (): ProjectablePlugin =>
    pluginOf(
      'consumer',
      {
        whatever: agentModule(
          'production-x',
          'producer',
          [],
          { tier: 'fast', effort: 'low' },
          'whatever',
        ),
      },
      [
        {
          name: 'production',
          description: 'the production persona',
          agents: ['production-x'],
        },
      ],
    );

  it('selects, renders and routes a module under its declared name, not its file name', async () => {
    const tree = await projectPluginSet({
      plugins: [consumer()],
      adapter: withNative,
      practices: ['production'],
      warn: () => {},
    });
    expect(tree.agents).toBe(1);
    const paths = tree.files.map((f) => f.path);
    expect(paths).toContain(join('agents', 'production-x.md'));
    expect(paths).not.toContain(join('agents', 'whatever.md'));
    expect(tree.agentModels).toEqual({
      'production-x': { tier: 'fast', effort: 'low' },
    });
  });

  it('refuses a practice naming the module file instead of the agent', async () => {
    const named = pluginOf(
      'consumer',
      {
        whatever: agentModule(
          'production-x',
          'producer',
          [],
          undefined,
          'whatever',
        ),
      },
      [{ name: 'by-file', description: 'by file', agents: ['whatever'] }],
    );
    await expect(
      projectPluginSet({
        plugins: [named],
        adapter: withNative,
        practices: ['by-file'],
        warn: () => {},
      }),
    ).rejects.toThrow(
      "practice 'by-file' names the agent 'whatever', which is no agent of the plugin set (agents: production-x)",
    );
  });

  it('lets a later plugin override an agent of the same declared name', async () => {
    const earlier = pluginOf('earlier', {
      'production-x': agentModule(
        'production-x',
        'producer',
        [],
        { tier: 'frontier', effort: 'high' },
        'productionX',
      ),
    });
    const lines: string[] = [];
    const tree = await projectPluginSet({
      plugins: [earlier, consumer()],
      adapter: withNative,
      practices: ['production'],
      warn: () => {},
      log: (line) => lines.push(line),
    });
    expect(tree.agentModels).toEqual({
      'production-x': { tier: 'fast', effort: 'low' },
    });
    expect(lines).toContain(
      '  override agent production-x: earlier → consumer',
    );
  });

  it('refuses two modules of one plugin declaring the same name, naming both', async () => {
    const twins = pluginOf('twins', {
      one: agentModule('same', 'a', [], undefined, 'one'),
      two: agentModule('same', 'b', [], undefined, 'two'),
    });
    await expect(
      projectPluginSet({
        plugins: [twins],
        adapter: withNative,
        warn: () => {},
      }),
    ).rejects.toThrow(
      /plugin 'twins' declares the agent 'same' twice: in .*one\.ts and in .*two\.ts/,
    );
  });

  it('refuses an agent module exporting no Agent, naming it', async () => {
    const empty = pluginOf('empty', {
      hollow: 'export const hollow = 42;\n',
    });
    await expect(
      projectPluginSet({
        plugins: [empty],
        adapter: withNative,
        warn: () => {},
      }),
    ).rejects.toThrow(/agent module .*hollow\.ts exports no Agent/);
  });
});
