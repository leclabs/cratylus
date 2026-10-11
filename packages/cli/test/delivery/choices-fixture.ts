import { cpSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import { expect, vi } from 'vitest';
import {
  type InstallCmdOpts,
  runInstall,
} from '../../../forge/src/cli/commands/install.js';
import { fixtureAgentSource } from '../../../forge/test/deploy/helpers.js';
import { FIXTURE_MANIFEST } from '../../../forge/test/fixture-manifest.js';
import type { Host } from '../capability-port/fixture.js';
import { run, success } from '../capability-port/fixture.js';
import { here, owned, put, settings } from './fixture.js';

export const hiddenStatus = {
  preset: 'custom',
  leftSegments: ['model'],
  rightSegments: ['cwd'],
  showHookStatus: false,
};
export const chosen = {
  frontier: 'fixture/frontier',
  fast: 'fixture/fast',
  'delivery-persona': 'fixture/persona',
};
export const choices = Object.entries(chosen)
  .map(([k, v]) => `${k}=${v}`)
  .join(',');
export function configure(
  h: Host,
  modelRoles: Record<string, string> = {},
  statusLine = hiddenStatus,
) {
  put(
    join(h.home, '.omp/agent/config.yml'),
    `${JSON.stringify({ modelRoles: { default: 'fixture/base', ...modelRoles }, statusLine }, null, 2)}\n`,
  );
}
export function choiceCorpus(h: Host, four = false) {
  const agents = join(h.root, 'choice-agents');
  const tiers = [
    'frontier',
    'fast',
    ...(four ? ['frontier-other-family', 'smol'] : []),
  ];
  for (const [i, tier] of tiers.entries())
    put(
      join(agents, `delivery-${i}.ts`),
      fixtureAgentSource(`delivery-${i}`, {
        routing: { tier, effort: 'medium' },
      }),
    );
  put(
    join(agents, 'delivery-persona.ts'),
    fixtureAgentSource('delivery-persona', {
      mark: { emoji: '+', description: 'Fixture persona' },
      routing: { tier: 'frontier', effort: 'medium' },
    }),
  );
  const skills = join(h.root, 'choice-skills');
  put(
    join(skills, 'choice/skill.ts'),
    'export const choice = {name:"choice", description:"Choice fixture skill", formalBlock:"Read the host choices.", composition:()=>[]};',
  );
  return {
    name: 'delivery-choices',
    manifest: FIXTURE_MANIFEST,
    agents,
    skills,
  };
}

export async function guided(
  h: Host,
  options: Partial<InstallCmdOpts> & { agentStatus?: 'show' | 'hide' } = {},
  answers: {
    models?: Record<string, string>;
    show?: boolean;
    four?: boolean;
  } = {},
) {
  const asked: string[] = [];
  let output = '';
  const writes = [process.stdout, process.stderr].map((stream) =>
    vi.spyOn(stream, 'write').mockImplementation((text) => {
      output += String(text);
      return true;
    }),
  );
  try {
    const prompts = {
      harness: async () => {
        asked.push('harness');
        return 'omp';
      },
      practices: async () => {
        asked.push('practices');
        return [];
      },
      routes: async (questions: readonly { role: string }[]) => {
        asked.push(...questions.map((q) => `model:${q.role}`));
        return answers.models ?? {};
      },
      agentStatus: async () => {
        asked.push('agent-status');
        expect(
          settings(h).statusLine,
          'display has not changed before its answer',
        ).toEqual(hiddenStatus);
        return answers.show ?? true;
      },
      confirm: async () => {
        asked.push('confirm');
        return true;
      },
    };
    const rc = await runInstall({
      harness: 'omp',
      home: h.home,
      cwd: h.cwd,
      corpus: choiceCorpus(h, answers.four) as never,
      version: '2.4.0',
      all: true,
      interactive: true,
      prompts,
      ...options,
    });
    expect(rc, output).toBe(0);
  } finally {
    for (const spy of writes) spy.mockRestore();
  }
  return { asked, output };
}
export function hostOwned(h: Host) {
  const record = readFileSync(join(owned(h), 'installation.json'), 'utf8');
  expect(
    record,
    'display choice is not a reversible installation edit',
  ).not.toContain('showHookStatus');
  expect(record, 'host model answers are not owned').not.toMatch(
    /fixture\/(?:frontier|fast|persona|changed)/,
  );
}
export function observeChoice(h: Host, agent: string) {
  put(
    join(h.home, '.omp/agent/models.yml'),
    JSON.stringify({
      providers: {
        fixture: {
          api: 'openai-completions',
          baseUrl: 'http://127.0.0.1:1/v1',
          apiKey: 'not-a-credential',
          models: ['base', 'frontier', 'fast', 'persona', 'changed'].map(
            (id) => ({
              id,
              name: id,
              reasoning: true,
              input: ['text'],
              contextWindow: 128000,
              maxTokens: 2048,
              compat: { supportsReasoningEffort: true },
            }),
          ),
        },
      },
    }),
  );
  const observer = join(h.root, 'observe-choice.ts');
  const output = join(h.root, `choice-${agent}.json`);
  cpSync(join(here, 'observe-choice.ts'), observer);
  const quote = (s: string) => `'${s.replaceAll("'", "'\\''")}'`;
  const args = [
    'omp',
    '--agent',
    agent,
    '--no-rules',
    '--no-lsp',
    '--no-title',
    '--no-pty',
    '--extension',
    observer,
  ];
  const result = run(
    'script',
    ['-q', '-e', '-c', args.map(quote).join(' '), '/dev/null'],
    h.cwd,
    {
      HOME: h.home,
      PATH: h.env.PATH,
      TERM: 'xterm-256color',
      LANG: 'C.UTF-8',
      DELIVERY_CHOICE_OBSERVATION: output,
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: '/dev/null',
    },
  );
  success(result);
  expect(existsSync(output), result.stdout + result.stderr).toBe(true);
  return {
    model: JSON.parse(readFileSync(output, 'utf8')).model as {
      provider: string;
      id: string;
    },
    rendered: stripVTControlCharacters(result.stdout),
  };
}
