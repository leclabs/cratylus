import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { failures, meaningChange, openChoice } from './check.js';
import { here, host } from './fixture.js';
import { type IsolationWiring, assessIsolation } from './isolation.js';
import { inspectModelLaunch, seed } from './omp.js';

for (const file of readdirSync(join(here, 'recordings/isolation'))) {
  it(`isolation offline: ${file}`, () => {
    const recording: {
      expectedTools: string[];
      wiring: IsolationWiring;
      failures: string[];
    } = JSON.parse(
      readFileSync(join(here, 'recordings/isolation', file), 'utf8'),
    );
    expect(
      failures(assessIsolation(recording.wiring, recording.expectedTools)),
    ).toEqual(recording.failures);
  });
}

it('the cut-6 Given excludes work_package, including an inactive tool advertised in the prompt', () => {
  for (const scenario of [meaningChange, openChoice]) {
    expect(scenario.tools).not.toContain('work_package');
    const wiring: IsolationWiring = {
      systemPrompt: ['A plain session.'],
      active: [...scenario.tools],
      tools: scenario.tools.map((name) => ({
        name,
        description: 'A tool.',
        parameters: {},
      })),
      memory: { backend: 'off', active: false },
    };
    expect(failures(assessIsolation(wiring, scenario.tools))).toEqual([]);
    for (const leaked of [
      { ...wiring, active: [...wiring.active, 'work_package'] },
      {
        ...wiring,
        tools: [
          ...wiring.tools,
          { name: 'work_package', description: 'Manage work.', parameters: {} },
        ],
      },
      {
        ...wiring,
        systemPrompt: [
          ...wiring.systemPrompt,
          'Use xd://work_package for work.',
        ],
      },
    ]) {
      expect(failures(assessIsolation(leaked, scenario.tools))).toEqual([
        'only-requested-tools',
      ]);
    }
  }
});

// Opt-in because resolving the operator's real credentials is not a CI/default
// suite prerequisite. This flag permits inspection only, never a model turn.
it.runIf(process.env.CAPABILITY_PORT_AUTH_PREFLIGHT === '1')(
  'credential preflight: the live launch resolves auth with an isolated prompt and tool list',
  () => {
    const h = host();
    try {
      seed(h, openChoice);
      const output = join(
        process.env.CAPABILITY_PORT_RECORDINGS ??
          mkdtempSync(join(tmpdir(), 'capability-isolation-')),
        'credential-preflight',
      );
      const wiring = inspectModelLaunch(h, openChoice.tools, output);
      h.offered(wiring, openChoice.tools);
      console.info(`Isolation evidence: ${output}`);
    } finally {
      h.dispose();
    }
  },
);
