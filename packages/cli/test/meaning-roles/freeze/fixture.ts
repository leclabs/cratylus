import '../../reconstitution/binding/omp-mocks.js';
import { spawnSync } from 'node:child_process';
import { readFileSync, watch } from 'node:fs';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { expect } from 'vitest';
import { type Fixture, fixture } from '../../agent-launch/fixture.js';
import {
  type History,
  snapshot,
  unchangedFiles,
} from '../../concept-journal/fixture.js';
import {
  type HookResult,
  type LoadedExtension,
  git,
  load,
  task,
  write,
} from '../../reconstitution/binding/fixture.js';

export { snapshot, write };
export const architect = 'architect';
export const outsiders = [
  'lead',
  'builder',
  'check-writer',
  'illustrator',
  'assayer',
];
export const original = 'A patron extends a loan without staff intervention.';
export const corrected =
  'A patron extends an eligible loan without staff intervention.';
export const reason = 'Clarify eligibility, not who may renew.';
export const examplePath = 'design/examples/library/renewal.md';
export const checkPath = 'checks/renewal.test.ts';
export const checkFolder = 'checks/renewal/';
export const paths = [
  examplePath,
  checkPath,
  `${checkFolder}unaided.test.ts`,
  'design/judgment/library/renewal.md',
  'design/judgment/library/renewal/edge.ts',
];
export type Result = { code: number | null; stdout: string; stderr: string };
export type Verb = 'supersede' | 'retire';

export function command(
  f: Fixture,
  agent: string | undefined,
  ...args: string[]
): Result {
  const env = { ...f.env };
  if (agent !== undefined) env.CRATYLUS_AGENT = agent;
  const r = spawnSync('cratylus', args, {
    cwd: f.cwd,
    env,
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (r.error) throw r.error;
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}
export function ok(r: Result) {
  expect(r.code, r.stderr + r.stdout).toBe(0);
  return JSON.parse(r.stdout);
}
export function query(f: Fixture, ...args: string[]) {
  return ok(command(f, architect, ...args));
}
export function define(
  f: Fixture,
  context: string,
  name: string,
  wording = original,
) {
  query(
    f,
    'concepts',
    'define',
    name,
    '--context',
    context,
    '--wording',
    wording,
    '--reason',
    'Patrons need self-service.',
  );
}
export function context(f: Fixture, name: string) {
  query(f, 'concepts', 'context', name, '--subject', `The ${name} subject.`);
}
export function open(
  f: Fixture,
  cut = 'renewal',
  context = 'library',
  concept = 'renewal',
) {
  write(
    f,
    `design/examples/${context}/${cut}.md`,
    `1. (${concept}) **Given** a patron's eligible loan, **when** they renew, **then** no staff intervention is needed.\n`,
  );
  query(
    f,
    'workPackage',
    'open',
    '--cut',
    cut,
    '--branch',
    'feature/renewal',
    '--architect',
    `${context}=${architect}`,
  );
}
export function setup() {
  const f = fixture();
  git(f, 'init', '-q', '--initial-branch=feature/renewal');
  git(f, 'config', 'user.name', 'Freeze check');
  git(f, 'config', 'user.email', 'freeze@example.invalid');
  git(f, 'config', 'commit.gpgsign', 'false');
  git(f, 'config', 'core.hooksPath', '/dev/null');
  context(f, 'library');
  define(f, 'library', 'renewal');
  for (const path of paths) {
    write(
      f,
      path,
      path.endsWith('.md')
        ? '1. (renewal) A patron renews unaided.\n'
        : "import { strict as assert } from 'node:assert';\nassert.equal(process.env.RENEWAL_ACCESS, 'patron', 'patrons renew without staff intervention');\n",
    );
  }
  git(f, 'add', '--', 'design', 'checks');
  git(f, 'commit', '-qm', 'test: establish renewal');
  open(f);
  return f;
}
export function freezeChecks(f: Fixture) {
  for (const path of [checkPath, `${checkFolder}unaided.test.ts`]) {
    const check = readFileSync(join(f.cwd, path), 'utf8');
    for (const access of ['staff', 'patron']) {
      const result = spawnSync(
        process.execPath,
        ['--input-type=module', '-e', check],
        {
          cwd: f.cwd,
          env: { ...f.env, RENEWAL_ACCESS: access },
          encoding: 'utf8',
        },
      );
      expect(
        result.status,
        `Given: ${path} rejects staff-only work and accepts unaided renewal`,
      ).toBe(access === 'staff' ? 1 : 0);
    }
  }
  query(
    f,
    'workPackage',
    'freeze',
    '--cut',
    'renewal',
    '--check',
    checkPath,
    '--check',
    checkFolder,
  );
}
export function integrate(f: Fixture, cut = 'renewal', agent = architect) {
  return command(f, agent, 'workPackage', 'integrate', '--cut', cut);
}
export function change(
  f: Fixture,
  agent: string | undefined,
  verb: Verb,
  context = 'library',
  concept = 'renewal',
  wording = corrected,
) {
  return command(
    f,
    agent,
    'concepts',
    verb,
    concept,
    '--context',
    context,
    ...(verb === 'supersede' ? ['--wording', wording] : []),
    '--reason',
    reason,
  );
}
export function assertRefused(
  result: Result,
  verb: Verb,
  concept: string,
  cuts: string[],
) {
  expect(result.code, 'a warning or a successful append is not refusal').toBe(
    1,
  );
  const text = (result.stderr || result.stdout).trim();
  expect(text.split('\n'), 'one-line journal refusal').toHaveLength(1);
  expect(text).toMatch(new RegExp(`^concepts ${verb}:`));
  for (const word of [concept, architect, ...cuts])
    expect(text).toContain(word);
}
export async function refusedChange(
  f: Fixture,
  agent: string | undefined,
  verb: Verb,
  context = 'library',
  concept = 'renewal',
  cuts = ['renewal'],
) {
  const before = snapshot(f.cwd);
  const history = query(
    f,
    'concepts',
    'history',
    concept,
    '--context',
    context,
  );
  const design = query(f, 'concepts', 'design', '--context', context);
  const touched: string[] = [];
  const watcher = watch(join(f.cwd, 'design/journal'), (event, file) =>
    touched.push(`${event}:${file}`),
  );
  try {
    const result = change(
      f,
      agent,
      verb,
      context,
      concept,
      'Staff-only renewal is sufficient.',
    );
    await setTimeout(20); // Drain the OS events from the completed child, including append-then-delete.
    assertRefused(result, verb, concept, cuts);
    expect(
      touched,
      'refusal precedes any write; compensation is not refusal',
    ).toEqual([]);
    expect(snapshot(f.cwd)).toEqual(before);
    expect(
      query(f, 'concepts', 'history', concept, '--context', context),
    ).toEqual(history);
    expect(query(f, 'concepts', 'design', '--context', context)).toEqual(
      design,
    );
  } finally {
    watcher.close();
  }
}
export function allowedChange(
  f: Fixture,
  agent: string,
  verb: Verb,
  context = 'library',
  concept = 'renewal',
) {
  const before = snapshot(f.cwd);
  const history = query(
    f,
    'concepts',
    'history',
    concept,
    '--context',
    context,
  ) as History;
  const result = change(f, agent, verb, context, concept);
  // Opt-in proof: the same acceptance assertion rejects an over-broad freeze.
  if (process.env.MEANING_FREEZE_RED === 'overfreeze') result.code = 1;
  ok(result);
  const after = snapshot(f.cwd);
  unchangedFiles(before, after);
  expect(Object.keys(after).length - Object.keys(before).length).toBe(1);
  const now = query(
    f,
    'concepts',
    'history',
    concept,
    '--context',
    context,
  ) as History;
  expect(now.versions.slice(0, -1)).toEqual(history.versions);
  expect(now.versions.at(-1)).toMatchObject({
    kind: verb,
    reason,
    ...(verb === 'supersede' ? { wording: corrected } : {}),
  });
  const design = query(f, 'concepts', 'design', '--context', context);
  const current = design.contexts.find(
    (c: { name: string }) => c.name === context,
  );
  if (verb === 'supersede')
    expect(current.concepts).toContainEqual(
      expect.objectContaining({ name: concept, wording: corrected, reason }),
    );
  else {
    expect(current.concepts.map((c: { name: string }) => c.name)).not.toContain(
      concept,
    );
    expect(current.retired).toContainEqual(
      expect.objectContaining({ name: concept, reason }),
    );
  }
}
export async function session(
  f: Fixture,
  agent: string,
  kind: 'main' | 'sub' = 'sub',
) {
  const extension = await load(f, { role: agent, kind });
  if (kind === 'main') {
    // A continued session has already reconstituted; do not confuse that independent gate with freeze.
    Object.assign(extension.ctx.sessionManager, {
      getBranch: () => [
        {
          type: 'message',
          message: { role: 'assistant', content: 'Design read back.' },
        },
      ],
    });
    await extension.fire('session_switch');
  }
  return extension;
}
export function assertGate(answer: HookResult | undefined, blocked: boolean) {
  if (blocked) {
    expect(answer?.block, 'must refuse before the host executes the tool').toBe(
      true,
    );
    expect(answer?.reason).toContain('renewal');
    expect(answer?.reason).toContain(architect);
  } else expect(answer?.block, answer?.reason).not.toBe(true);
}
export async function editPath(
  f: Fixture,
  extension: LoadedExtension,
  path: string,
  blocked: boolean,
  tool = 'write',
) {
  const absolute = join(f.cwd, path);
  const before = readFileSync(absolute, 'utf8');
  const content = path.endsWith('.ts')
    ? "import { strict as assert } from 'node:assert';\nassert.equal(process.env.RENEWAL_ACCESS, 'staff', 'staff-only renewal is sufficient');\n"
    : 'Staff-only renewal is sufficient.\n';
  const input =
    tool === 'bash'
      ? {
          command: `printf '%s' 'Staff-only renewal is sufficient.' > '${absolute}'`,
        }
      : { path: absolute, content };
  let answer = await extension.fire('tool_call', {
    type: 'tool_call',
    toolName: tool,
    toolCallId: `change-${path}`,
    input,
  });
  expect(
    readFileSync(absolute, 'utf8'),
    'the pre-call hook itself never changes the target',
  ).toBe(before);
  if (process.env.MEANING_FREEZE_RED === 'overfreeze' && !blocked)
    answer = { block: true, reason: 'renewal: only architect' };
  // Host boundary: exactly as omp, execute only after the pre-call handlers allow it.
  if (!answer?.block) write(f, path, content);
  assertGate(answer, blocked);
  expect(readFileSync(absolute, 'utf8')).toBe(blocked ? before : content);
}
export async function phase(
  f: Fixture,
  extension: LoadedExtension,
  stage:
    | 'building'
    | 'returned'
    | 'judging'
    | 'finding'
    | 'rebuild'
    | 'complete',
) {
  query(
    f,
    'workPackage',
    'submit',
    'renewal-work',
    '--cut',
    'renewal',
    '--output',
    'renewal.txt',
    '--concept',
    'renewal',
  );
  async function dispatch(role: string, assignment: unknown, id: string) {
    const result = await extension.fire(
      'tool_call',
      task(role, assignment, id),
    );
    expect(result?.block, result?.reason).not.toBe(true);
  }
  async function returned(id: string, data: unknown) {
    await extension.fire('tool_result', {
      toolName: 'task',
      toolCallId: id,
      details: {
        results: [
          {
            index: 0,
            id: `${id}/one`,
            structuredOutput: { data },
            tokens: { input: 12, output: 7 },
          },
        ],
      },
    });
  }
  const builder = {
    cut: 'renewal',
    workPackage: 'renewal-work',
    outputs: ['renewal.txt'],
    concepts: ['renewal'],
    examples: ['library/1'],
  };
  await dispatch('builder', builder, 'build');
  if (stage === 'building') {
    expect(
      query(f, 'workPackage', 'state', '--cut', 'renewal').workPackages[0]
        .status,
    ).toBe('dispatched');
    return;
  }
  await returned('build', {
    cut: 'renewal',
    workPackage: 'renewal-work',
    done: true,
  });
  query(f, 'workPackage', 'check', '--cut', 'renewal');
  const state = () => query(f, 'workPackage', 'state', '--cut', 'renewal');
  expect(state().workPackages[0].status).toBe('returned');
  if (stage === 'returned') return;
  const assignment = {
    cut: 'renewal',
    workPackages: ['renewal-work'],
    examples: ['library/1'],
    decisions: [],
  };
  await dispatch('assayer', assignment, 'assayer-a');
  if (stage === 'judging') return;
  const passes = stage === 'complete';
  const verdict = {
    cut: 'renewal',
    verdicts: [
      {
        workPackage: 'renewal-work',
        concept: 'renewal',
        passes,
        evidence: passes
          ? 'Patrons renew unaided.'
          : 'Work requires staff intervention.',
      },
    ],
    hardeningNotes: [],
  };
  await returned('assayer-a', verdict);
  if (!passes) {
    expect(state().workPackages[0].status).not.toBe('approved');
    if (stage === 'rebuild') {
      await dispatch('builder', builder, 'rebuild');
      expect(state().workPackages[0].status).toBe('dispatched');
    }
    return;
  }
  await dispatch('assayer', assignment, 'assayer-b');
  await returned('assayer-b', verdict);
  expect(state().workPackages[0].status).toBe('approved');
  expect(state().phase).toBe('complete');
}
