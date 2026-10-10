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
import { type Fixture, fixture } from '../agent-launch/fixture.js';
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
export function project(scenario: Scenario): Fixture {
  const f = fixture();
  try {
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
    for (const line of scenario.files['design/concepts.md'].split('\n')) {
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
function declaration(f: Fixture, role: string): string {
  // The declaration is installed, never rewritten into a test-owned identity.
  const text = readFileSync(
    join(f.home, '.omp/agent/agents', `${role}.md`),
    'utf8',
  );
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
}
function launch(
  f: Fixture,
  role: string,
  prompt: string,
  output: string,
  inspect: boolean,
  judge = false,
) {
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
    '--agent',
    role,
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
    ...(judge ? ['--tools', ''] : []),
    prompt,
  ];
  const result = spawnSync('omp', args, {
    cwd: f.cwd,
    input: '',
    encoding: 'utf8',
    timeout: inspect ? 60_000 : 300_000,
    maxBuffer: 32 * 1024 * 1024,
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
    agent: role,
    declaration: declaration(f, role),
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
  if (judge) expect(wiring.prompt.join('\n')).toContain(wiring.declaration);
  else
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
export function preflight(scenario: Scenario, output?: string) {
  const f = project(scenario);
  try {
    return launch(
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
  // This is the sole opt-in read of the operator's home. Copy no configuration,
  // memory, declarations, extensions, skills, or other credentials.
  if (process.env.EXECUTION_LIVE !== '1')
    throw new Error('Requires EXECUTION_LIVE=1');
  for (const suffix of ['', '-wal', '-shm']) {
    const source = join(homedir(), '.omp/agent', `agent.db${suffix}`);
    if (existsSync(source))
      cpSync(source, join(f.home, '.omp/agent', `agent.db${suffix}`));
  }
}
export function liveRun(scenario: Scenario, output: string): Recording {
  if (process.env.EXECUTION_LIVE !== '1')
    throw new Error('Requires EXECUTION_LIVE=1');
  const f = project(scenario);
  try {
    launch(f, scenario.role, scenario.prompt, join(output, 'preflight'), true);
    credentials(f);
    const recording = launch(f, scenario.role, scenario.prompt, output, false);
    if (scenario.clauses.some((clause) => !clause.unchanged)) {
      // Separate installed assayer session, no conversation with the subject.
      const j = fixture();
      try {
        credentials(j);
        const prompt = rubricPrompt(scenario, recording);
        const judged = launch(
          j,
          'assayer',
          prompt,
          join(output, 'rubric'),
          false,
          true,
        );
        recording.answers = parseAnswers(judged.report, scenario);
        writeFileSync(join(output, 'rubric-prompt.txt'), prompt);
      } finally {
        j.dispose();
      }
    }
    writeFileSync(
      join(output, 'recording.json'),
      JSON.stringify(recording, null, 2),
    );
    return recording;
  } finally {
    f.dispose();
  }
}
