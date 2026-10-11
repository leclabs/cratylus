import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';
import { OMP_ASSIGNMENT_KEY } from '../../../forge/src/adapters/omp/index.js';
// The schema package's own contract check, the one every handoff runs: a dispatch
// through the extension, a launch, and this preparation alike.
import {
  type JsonSchema,
  assignmentIn,
  checkAssignment,
} from '../../../schema/src/contract.js';
import { type Fixture, fixture } from '../agent-launch/fixture.js';
import { judgeSubject, runSession, subjectModels } from '../rubric-judge.js';
import {
  type Recording,
  type Scenario,
  parseAnswers,
  rubricPrompt,
  wiringHolds,
} from './check.js';
import { snapshot } from './snapshot.js';

const here = dirname(fileURLToPath(import.meta.url));
function command(f: Fixture, binary: string, args: string[]) {
  const result = spawnSync(binary, args, {
    cwd: f.cwd,
    env: f.env,
    encoding: 'utf8',
    timeout: 60_000,
  });
  if (result.error) throw result.error;
  expect(result.status, result.stdout + result.stderr).toBe(0);
  return result;
}
/** The installed declaration's front matter and body, as written by install. */
function installed(f: Fixture, role: string) {
  // The declaration is installed, never rewritten into a test-owned identity.
  const text = readFileSync(
    join(f.home, '.omp/agent/agents', `${role}.md`),
    'utf8',
  );
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  return { frontmatter: match?.[1] ?? '', body: text.slice(match?.[0].length) };
}
/** The assignment schema the installed declaration carries, when it carries one:
 *  one line of JSON under its key, as projection writes it. */
function assignmentSchema(f: Fixture, role: string): JsonSchema | undefined {
  const line = new RegExp(`^${OMP_ASSIGNMENT_KEY}: (.*)$`, 'm').exec(
    installed(f, role).frontmatter,
  );
  return line ? (JSON.parse(line[1]!) as JsonSchema) : undefined;
}
/**
 * The scenario's project, prepared through the same assignment contract a
 * dispatch runs: a scenario whose role declares an assignment and whose prompt
 * carries no fitting block is rejected here, before any live run, naming the
 * missing fields. A lead's cut brief opens its cut as the architect would, on the
 * branch checked out.
 */
export function project(scenario: Scenario): Fixture {
  const f = fixture();
  try {
    const schema = assignmentSchema(f, scenario.role);
    const assignment = assignmentIn(scenario.prompt);
    if (schema !== undefined) {
      const { reason } = checkAssignment(scenario.role, schema, assignment);
      if (reason !== undefined)
        throw new Error(
          `Example ${scenario.number} is not prepared: ${reason}`,
        );
    }
    command(f, 'git', ['init', '-q']);
    command(f, 'git', ['config', 'user.email', 'fixture@example.invalid']);
    command(f, 'git', ['config', 'user.name', 'Execution fixture']);
    for (const [path, content] of Object.entries(scenario.files)) {
      mkdirSync(dirname(join(f.cwd, path)), { recursive: true });
      writeFileSync(join(f.cwd, path), content);
    }
    command(f, 'cratylus', [
      'concepts',
      'context',
      'booking',
      '--subject',
      'Booking reservations and cancellation.',
    ]);
    for (const line of scenario.files['design/concepts.md']!.split('\n')) {
      const boundary = line.indexOf(': ');
      if (boundary < 0) continue;
      command(f, 'cratylus', [
        'concepts',
        'define',
        line.slice(0, boundary),
        '--context',
        'booking',
        '--wording',
        line.slice(boundary + 2),
        '--reason',
        'Fixed scenario Given.',
      ]);
    }
    command(f, 'git', ['add', '--', '.']);
    command(f, 'git', ['commit', '-qm', 'Fixture Given']);
    const cut = (assignment as { cut?: unknown } | undefined)?.cut;
    if (scenario.role === 'lead' && typeof cut === 'string') {
      // The typed lead cut: its record names the branch checked out and the
      // architect holding each of its contexts.
      const contexts = Object.keys(scenario.files).flatMap((path) => {
        const at = /^design\/examples\/([^/]+)\/([^/]+)\.md$/.exec(path);
        return at?.[2] === cut ? [at[1]!] : [];
      });
      const branch = command(f, 'git', [
        'rev-parse',
        '--abbrev-ref',
        'HEAD',
      ]).stdout.trim();
      command(f, 'cratylus', [
        'workPackage',
        'open',
        '--cut',
        cut,
        '--branch',
        branch,
        ...contexts.flatMap((context) => [
          '--architect',
          `${context}=operator`,
        ]),
      ]);
      command(f, 'git', ['add', '--', 'design']);
      command(f, 'git', ['commit', '-qm', 'Fixture cut record']);
    }
    // Establish the Given by actual execution, not just the scenario's prose.
    for (const path of ['checks/reservation.mjs', 'checks/cancellation.mjs']) {
      const result = spawnSync(process.execPath, [path], {
        cwd: f.cwd,
        env: f.env,
        encoding: 'utf8',
      });
      if (result.error) throw result.error;
      const broken =
        scenario.files[
          path
            .replace('checks/', 'src/')
            .replace('reservation', 'reserve')
            .replace('cancellation', 'cancel')
        ]?.includes('return false');
      expect(result.status, `Given: ${path}`).toBe(broken ? 1 : 0);
    }
    return f;
  } catch (error) {
    f.dispose();
    throw error;
  }
}
/**
 * One omp session: as the installed agent `role`, or, with none, the untyped
 * rubric judge — a plain session with no tools, which takes no assignment.
 */
async function launch(
  f: Fixture,
  role: string | undefined,
  prompt: string,
  output: string,
  inspect: boolean,
  model?: string,
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  mkdirSync(output, { recursive: true });
  const wiringPath = join(output, 'wiring.json');
  const messagesPath = join(output, 'messages.jsonl');
  const snapshotsPath = join(output, 'snapshots.jsonl');
  writeFileSync(messagesPath, '');
  writeFileSync(snapshotsPath, `${JSON.stringify(snapshot(f.cwd))}\n`);
  const config = join(f.root, 'session-config.json');
  writeFileSync(config, JSON.stringify({ memory: { backend: 'off' } }));
  const args = [
    '--print',
    '--mode',
    'json',
    ...(role === undefined ? ['--tools', ''] : ['--agent', role]),
    '--no-session',
    '--no-rules',
    '--no-lsp',
    '--no-title',
    '--no-pty',
    '--no-extensions',
    '--extension',
    f.extension,
    '--extension',
    join(here, 'observe.ts'),
    '--config',
    config,
    ...(inspect ? ['--model', 'fixture/base'] : []),
    ...(model ? ['--model', model] : []),
    prompt,
  ];
  const result = await runSession('omp', args, {
    cwd: f.cwd,
    timeout: inspect ? 60_000 : 300_000,
    signal,
    env: {
      ...f.env,
      EXECUTION_INSPECT: inspect ? '1' : '0',
      EXECUTION_WIRING: wiringPath,
      EXECUTION_MESSAGES: messagesPath,
      EXECUTION_SNAPSHOTS: snapshotsPath,
      EXECUTION_PROJECT: f.cwd,
    },
  });
  writeFileSync(join(output, 'stdout'), result.stdout ?? '');
  writeFileSync(join(output, 'stderr'), result.stderr ?? '');
  writeFileSync(
    join(output, 'launch.json'),
    JSON.stringify({ args, cwd: f.cwd }, null, 2),
  );
  if (result.error) throw result.error;
  expect(result.status, result.stdout + result.stderr).toBe(0);
  const wiring = {
    ...JSON.parse(readFileSync(wiringPath, 'utf8')),
    agent: role ?? 'rubric judge',
    declaration: role === undefined ? '' : installed(f, role).body.trim(),
  };
  const messages = readFileSync(messagesPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const assistant = messages.filter((message) => message.role === 'assistant');
  const last = assistant.at(-1);
  const report =
    typeof last?.content === 'string'
      ? last.content
      : (last?.content ?? [])
          .filter((block: { type: string }) => block.type === 'text')
          .map((block: { text: string }) => block.text)
          .join('\n');
  const snapshots = readFileSync(snapshotsPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  snapshots.push(snapshot(f.cwd));
  const recording: Recording = {
    messages,
    report,
    snapshots,
    wiring,
    answers: {},
  };
  if (role !== undefined)
    expect(
      wiringHolds(recording, role),
      'installed declaration and active tool schemas reach the turn',
    ).toBe(true);
  writeFileSync(
    join(output, 'recording.json'),
    JSON.stringify(recording, null, 2),
  );
  return recording;
}
export async function preflight(scenario: Scenario, output?: string) {
  const f = project(scenario);
  try {
    return await launch(
      f,
      scenario.role,
      scenario.prompt,
      output ?? join(f.root, 'inspection'),
      true,
    );
  } finally {
    f.dispose();
  }
}
function credentials(f: Fixture) {
  // Opt-in host reads are limited to credentials and the judge's model role;
  // never copy host configuration, memory, declarations, or extensions.
  if (process.env.EXECUTION_LIVE !== '1')
    throw new Error('Requires EXECUTION_LIVE=1');
  for (const suffix of ['', '-wal', '-shm']) {
    const source = join(homedir(), '.omp/agent', `agent.db${suffix}`);
    if (existsSync(source))
      cpSync(source, join(f.home, '.omp/agent', `agent.db${suffix}`));
  }
}
export async function liveRun(
  scenario: Scenario,
  output: string,
  signal?: AbortSignal,
): Promise<Recording> {
  if (process.env.EXECUTION_LIVE !== '1')
    throw new Error('Requires EXECUTION_LIVE=1');
  signal?.throwIfAborted();
  const f = project(scenario);
  try {
    await launch(
      f,
      scenario.role,
      scenario.prompt,
      join(output, 'preflight'),
      true,
      undefined,
      signal,
    );
    credentials(f);
    const recording = await launch(
      f,
      scenario.role,
      scenario.prompt,
      output,
      false,
      undefined,
      signal,
    );
    if (scenario.clauses.some((clause) => !clause.unchanged)) {
      return await judgeSubject(
        recording,
        output,
        subjectModels(recording),
        async (model, attemptOutput) => {
          const j = fixture();
          try {
            credentials(j);
            const prompt = rubricPrompt(scenario, recording);
            writeFileSync(join(output, 'rubric-prompt.txt'), prompt);
            const judged = await launch(
              j,
              undefined,
              prompt,
              attemptOutput,
              false,
              model,
              signal,
            );
            return parseAnswers(judged.report, scenario);
          } finally {
            j.dispose();
          }
        },
        signal,
      );
    }
    // No rubric criteria: all judgments are mechanical.
    const result = {
      ...recording,
      judgment: { status: 'judged', model: null, attempts: [] },
    };
    writeFileSync(
      join(output, 'recording.json'),
      JSON.stringify(result, null, 2),
    );
    return result;
  } finally {
    f.dispose();
  }
}
