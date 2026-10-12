import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as canonExports from '@cratylus/canon';
import { expect, inject } from 'vitest';
import type { ExpectedEntry, Vector } from './master.js';
import {
  Meaning,
  agentFactors,
  agentNames,
  anchorOf,
  camel,
  deliverableSections,
  factors,
  personaProtocol,
  requireDefined,
} from './master.js';
export const repo = fileURLToPath(new URL('../../../..', import.meta.url));
// The namespace import lets a missing public export fail its example, not suite collection.
export const canon = canonExports as unknown as {
  MANIFEST: Record<string, unknown>;
  holder(cell: unknown): Record<string, unknown>;
  persona(cell: unknown, residue: unknown): Record<string, unknown>;
  CompositionRefusal: new (...args: never[]) => Error;
  [name: string]: unknown;
};
export function composedRole(name: string) {
  expect(canon.holder, 'canon exports holder').toBeTypeOf('function');
  const cell = canon[`${camel(name)}Role`];
  expect(cell, `canon exports ${camel(name)}Role`).toBeDefined();
  return canon.holder(cell);
}
interface ActualEntry extends Omit<ExpectedEntry, 'value'> {
  value: string | { body: string };
}
export function vectorOf(agent: Record<string, unknown>): Vector {
  return Object.fromEntries(
    agentFactors.map((factor) => {
      const field = camel(factor);
      expect(
        Array.isArray(agent[field]),
        `${agent.name}.${field} is an Entry[]`,
      ).toBe(true);
      return [
        field,
        (agent[field] as ActualEntry[]).map((entry) => ({
          value:
            typeof entry.value === 'string' ? entry.value : entry.value.body,
          level: entry.level,
          ...(entry.slot === undefined ? {} : { slot: entry.slot }),
          ...(entry.note === undefined ? {} : { note: entry.note }),
        })),
      ];
    }),
  );
}
export interface Declaration {
  front: Record<string, unknown>;
  body: string;
}
export const hostModelRoles = {
  default: 'anthropic/fixture-frontier:low',
  smol: 'anthropic/fixture-small:medium',
  sameFamily: 'anthropic/fixture-second:high',
  alternate: 'openai/fixture-other:max',
};
export interface CompositionResult {
  agent?: Record<string, unknown>;
  refusal?: boolean;
  name?: string;
  message?: string;
}
export function consumer(
  candidateSource?: string,
  candidateName = 'candidate',
) {
  const root = mkdtempSync(join(tmpdir(), 'catalog-recut-'));
  const home = join(root, 'home');
  const project = join(root, 'project');
  const out = join(root, 'projected');
  const prefix = inject('capabilityPrefix');
  const require = createRequire(join(prefix, 'package.json'));
  mkdirSync(join(home, '.omp/agent'), { recursive: true });
  mkdirSync(project);
  symlinkSync(
    join(prefix, 'node_modules'),
    join(project, 'node_modules'),
    'dir',
  );
  writeFileSync(
    join(project, 'package.json'),
    JSON.stringify({ type: 'module' }),
  );
  const configFile = join(home, '.omp/agent/config.yml');
  writeFileSync(configFile, JSON.stringify({ modelRoles: hostModelRoles }));
  if (candidateSource) {
    mkdirSync(join(project, 'agents'));
    writeFileSync(join(project, 'agents/candidate.ts'), candidateSource);
  }
  writeFileSync(
    join(project, 'cratylus.config.ts'),
    `
import canon from '@cratylus/canon';
import { defineConfig } from 'cratylus';
export default defineConfig({ extends: [canon${
      candidateSource
        ? `, {
  name: 'consumer-catalog', agents: './agents',
  practices: [{ name: 'consumer-catalog', description: 'Consumer composition', preselected: true,
    agents: ${JSON.stringify([...agentNames, candidateName])} }]
}`
        : ''
    }], patches: [] });
`,
  );
  const cliPackage = require('cratylus/package.json') as {
    bin: Record<string, string>;
  };
  const cli = join(
    dirname(require.resolve('cratylus/package.json')),
    requireDefined(cliPackage.bin.cratylus, 'cratylus binary'),
  );
  // No host credentials, agent configuration or extension discovery enters the fixture.
  const env = {
    HOME: home,
    PWD: project,
    PATH: `${join(prefix, 'node_modules/.bin')}:${dirname(process.execPath)}:${process.env.PATH}`,
    LANG: 'C.UTF-8',
    TERM: 'dumb',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null',
  };
  function parseYaml(text: string): Record<string, unknown> {
    // Reuse agent-launch's parser: Bun is the runtime of the installed omp harness.
    const parsed = spawnSync(
      'bun',
      [
        '-e',
        'console.log(JSON.stringify(Bun.YAML.parse(await Bun.stdin.text())))',
      ],
      {
        cwd: project,
        env,
        input: text,
        encoding: 'utf8',
        timeout: 10_000,
      },
    );
    if (parsed.error) throw parsed.error;
    expect(parsed.status, parsed.stderr).toBe(0);
    return JSON.parse(parsed.stdout);
  }
  function run(args: string[]) {
    const result = spawnSync(process.execPath, [cli, ...args], {
      cwd: project,
      env,
      encoding: 'utf8',
      timeout: 60_000,
    });
    if (result.error) throw result.error;
    expect(result.status, result.stderr + result.stdout).toBe(0);
    return result.stdout + result.stderr;
  }
  function declaration(name: string, installed = false): Declaration {
    const file = join(
      installed ? join(home, '.cratylus/omp') : out,
      'agents',
      `${name}.md`,
    );
    const text = readFileSync(file, 'utf8');
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
    expect(match, `${name} has YAML front matter`).not.toBeNull();
    return {
      front: parseYaml(requireDefined(match?.[1], `${name} front matter`)),
      body: requireDefined(match?.[2], `${name} body`),
    };
  }
  return {
    root,
    project,
    home,
    out,
    run,
    declaration,
    projectCanon() {
      run(['project', '--harness', 'omp', '--out', out]);
    },
    install() {
      return run(['install', '--harness', 'omp', '--all', '--yes']);
    },
    modelRoles() {
      return parseYaml(readFileSync(configFile, 'utf8')).modelRoles as Record<
        string,
        string
      >;
    },
    names(installed = false) {
      return readdirSync(
        join(installed ? join(home, '.cratylus/omp') : out, 'agents'),
      )
        .filter((name) => name.endsWith('.md'))
        .map((name) => name.slice(0, -3))
        .sort();
    },
    // Compose the consumer's actual module in the consumer's package environment.
    // A caught refusal remains distinguishable from an import/syntax error.
    // Dynamic import is intentional: this test catches module-initialization refusals.
    compose() {
      const script = `
import * as canon from '@cratylus/canon';
try {
  const { candidate } = await import('./agents/candidate.ts');
  console.log(JSON.stringify({ agent: candidate }));
} catch (error) {
  console.log(JSON.stringify({ refusal: typeof canon.CompositionRefusal === 'function' && error instanceof canon.CompositionRefusal, name: error.name, message: error.message }));
}`;
      const result = spawnSync(
        process.execPath,
        ['--input-type=module', '--eval', script],
        { cwd: project, env, encoding: 'utf8', timeout: 60_000 },
      );
      if (result.error) throw result.error;
      expect(result.status, result.stderr).toBe(0);
      return JSON.parse(result.stdout) as CompositionResult;
    },
    dispose() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}
export function candidateSource(role: string, residue: unknown) {
  return `import { persona, ${camel(role)}Role } from '@cratylus/canon';\nexport const candidate = persona(${camel(role)}Role, ${JSON.stringify(residue)});\n`;
}
export function expectRefusal(result: CompositionResult, ...names: string[]) {
  expect(
    result,
    'composition throws the public CompositionRefusal, not a loader error',
  ).toMatchObject({ refusal: true, name: 'CompositionRefusal' });
  expect(result.agent).toBeUndefined();
  for (const name of names) expect(result.message).toContain(name);
}
export function expectProjection(
  declaration: Declaration,
  name: string,
  description: string,
  vector: Vector,
  mark?: string,
) {
  expect(declaration.front.name).toBe(name);
  expect(declaration.front.description).toBe(description);
  if (mark) expect(declaration.front.mark).toBe(mark);
  else expect(declaration.front).not.toHaveProperty('mark');
  const lines: (string | Meaning)[] = [
    `# ${mark ? `${mark} ` : ''}${name}`,
    description,
  ];
  let group = '';
  for (const factor of agentFactors) {
    const meta = factors[factor];
    if (meta.projection === 'binding') continue;
    if (meta.group !== group) {
      group = meta.group;
      lines.push(`## ${group}`);
    }
    lines.push(`### ${factor}`);
    const entries = requireDefined(vector[camel(factor)], `${name}.${factor}`);
    if (entries.length === 0) lines.push('- (none)');
    for (const entry of entries) {
      const anchor = anchorOf(entry.value);
      const slotMeta =
        'slots' in meta
          ? meta.slots.find((slot) => slot.name === entry.slot)
          : undefined;
      const slotGloss =
        slotMeta && 'gloss' in slotMeta ? slotMeta.gloss : undefined;
      const slot = entry.slot
        ? `${entry.slot}${slotGloss ? ` (${slotGloss})` : ''}: `
        : '';
      const prefix = `- ${slot}**${anchor}**${entry.note ? ` (${entry.note})` : ''} — `;
      const suffix = entry.level === 'fixed' ? ' (fixed)' : '';
      lines.push(
        entry.value instanceof Meaning
          ? entry.value.framed(prefix, suffix)
          : `${prefix}${entry.value.split(' ≜ ')[1]}${suffix}`,
      );
    }
  }
  const deliverable = anchorOf(
    requireDefined(vector.deliverable?.[0], `${name}.deliverable`).value,
  );
  lines.push(
    ...requireDefined(
      deliverableSections[
        requireDefined(deliverable, `${name} deliverable anchor`)
      ],
      `${name} deliverable section`,
    )
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );
  lines.push(...personaProtocol.split('\n').filter(Boolean));
  // Blank lines and line endings are formatting; ordered headings and entry meaning are not.
  expect(
    declaration.body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  ).toEqual(lines);
}
