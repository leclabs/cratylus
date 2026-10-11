import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';
import { type Fixture, fixture } from '../../agent-launch/fixture.js';
import { files } from '../../capability-port/fixture.js';
import { snapshot } from '../../execution-roles/snapshot.js';
import { judgeSubject, runSession, subjectModels } from '../../rubric-judge.js';
export { judgeRuns } from '../../rubric-judge.js';
import {
  type Recording,
  type Scenario,
  parseAnswers,
  rubricPrompt,
} from './check.js';

import { randomUUID } from 'node:crypto';
import { wiringHolds } from '../../execution-roles/check.js';

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
    command(f, 'git', ['init', '-q', '-b', 'feature/film']);
    command(f, 'git', ['config', 'user.email', 'fixture@example.invalid']);
    command(f, 'git', ['config', 'user.name', 'Execution fixture']);
    for (const [path, content] of Object.entries(scenario.files)) {
      mkdirSync(dirname(join(f.cwd, path)), { recursive: true });
      writeFileSync(join(f.cwd, path), content);
    }
    for (const args of scenario.commands) command(f, 'cratylus', args);
    command(f, 'git', ['add', '--', '.']);
    command(f, 'git', ['commit', '-qm', 'Fixture Given']);
    return f;
  } catch (error) {
    f.dispose();
    throw error;
  }
}
function declaration(f: Fixture, role: string): string {
  // The declaration is installed, never rewritten into a test-owned identity.
  const text = readFileSync(
    join(
      f.home,
      role === 'rubric-judge' ? '.omp/agent/agents' : '.cratylus/omp/agents',
      `${role}.md`,
    ),
    'utf8',
  );
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
}

// omp expands @files as prompt input; only the short filename enters argv.
export function promptArgument(prompt: string, output: string): string {
  const path = resolve(output, 'prompt.txt');
  writeFileSync(path, prompt);
  return `@${path}`;
}

export function recordingDirectory(root: string, scenario: Scenario): string {
  const heldOut = scenario.ref.startsWith('held-out ');
  const ref = scenario.ref.replace(/^held-out /, '');
  return join(root, 'architect', heldOut ? 'held-out' : 'visible', ref);
}

// Old runs saved each turn before attempting judgment. Read those, never the
// collided top-level recording.json that another suite may have overwritten.
export function retainedSubject(scenario: Scenario, input: string): Recording {
  const subject = join(input, 'subject.json');
  const records: Recording[] = existsSync(subject)
    ? [JSON.parse(readFileSync(subject, 'utf8'))]
    : [scenario.prompt, ...(scenario.turns ?? [])].map((_, index) =>
        JSON.parse(
          readFileSync(
            join(input, `turn-${index + 1}`, 'recording.json'),
            'utf8',
          ),
        ),
      );
  for (const record of records)
    if (!wiringHolds(record, scenario.role))
      throw new Error(
        `Retained subject is not a wired ${scenario.role}: ${input}`,
      );
  return {
    ...records.at(-1)!,
    messages: records.flatMap((record) => record.messages),
    snapshots: records.flatMap((record) => record.snapshots),
    answers: {},
  };
}
async function launch(
  f: Fixture,
  role: string,
  prompt: string,
  output: string,
  inspect: boolean,
  judge = false,
  session?: string,
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
  const extensions = judge
    ? [f.extension] // Registers --agent; session hooks stay subject-only.
    : files(join(f.home, '.cratylus/omp/extensions')).filter((path) =>
        /\.(?:[cm]?js|ts)$/.test(path),
      );
  const args = [
    '--print',
    '--mode',
    'json',
    '--agent',
    role,
    ...(session ? ['--resume', session] : ['--no-session']),
    '--no-rules',
    '--no-lsp',
    '--no-title',
    '--no-pty',
    '--no-extensions',
    ...extensions.flatMap((path) => ['--extension', path]),
    ...(judge ? [] : ['--extension', join(here, 'delegate-stand-in.ts')]),
    '--extension',
    join(here, '../../execution-roles/observe.ts'),
    '--extension',
    join(here, 'handoff-observe.ts'),
    '--config',
    config,
    ...(judge ? ['--tools', ''] : []),
    promptArgument(prompt, output),
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
    agent: role,
    declaration: declaration(f, role),
    extensions,
  };
  wiring.sessionModuleObserved = wiring.prompt.some((part: string) =>
    part.includes('# Session start: reconstitution'),
  );
  if (
    inspect &&
    !session &&
    extensions.some((path) => path.endsWith('/cratylus-session.ts')) &&
    /^- \*\*reconstitution\*\*/m.test(wiring.declaration)
  )
    expect(
      wiring.sessionModuleObserved,
      'installed session module contributed its first-turn reconstitution note',
    ).toBe(true);
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
export async function preflight(scenario: Scenario, output?: string) {
  const f = project(scenario);
  try {
    const directory = output ?? join(f.root, 'inspection');
    const continuing = Boolean(scenario.history?.length || scenario.compacted);
    const inspection = await launch(
      f,
      scenario.role,
      scenario.prompt,
      continuing ? join(directory, 'initial') : directory,
      true,
    );
    if (!continuing) return inspection;
    const session = sessionFile(f, scenario, inspection);
    const resumed = await launch(
      f,
      scenario.role,
      scenario.prompt,
      directory,
      true,
      false,
      session,
    );
    cpSync(session, join(directory, 'session.jsonl'));
    return resumed;
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
// A native session is resumed for every turn: later prompts see the actual earlier
// model answers, never test-authored replacements. Compaction is a native entry.
function sessionFile(
  f: Fixture,
  scenario: Scenario,
  inspection: Recording,
): string {
  // Observe omp's own resolution of the installed declaration, including role
  // aliases and auth fallback. A --model inspection override would mask it.
  const model: unknown = Reflect.get(inspection.wiring, 'model');
  if (
    !model ||
    typeof model !== 'object' ||
    !('provider' in model) ||
    typeof model.provider !== 'string' ||
    !model.provider ||
    !('id' in model) ||
    typeof model.id !== 'string' ||
    !model.id ||
    !('api' in model) ||
    typeof model.api !== 'string' ||
    !model.api
  )
    throw new Error('History requires the resolved architect model');
  const file = join(f.root, 'architect-session.jsonl');
  const timestamp = new Date().toISOString();
  let parentId = randomUUID().slice(0, 8);
  const entries: Record<string, unknown>[] = [
    { type: 'session', version: 3, id: randomUUID(), timestamp, cwd: f.cwd },
    {
      type: 'model_change',
      id: parentId,
      parentId: null,
      timestamp,
      model: `${model.provider}/${model.id}`,
      resolvedModelIsFallback: false,
    },
  ];
  for (const turn of scenario.history ?? []) {
    for (const [role, text] of [
      ['user', turn.user],
      ['assistant', turn.assistant],
    ]) {
      const id = randomUUID().slice(0, 8);
      entries.push({
        type: 'message',
        id,
        parentId,
        timestamp,
        message: {
          role,
          content: [{ type: 'text', text }],
          timestamp: Date.now(),
          ...(role === 'assistant'
            ? {
                provider: model.provider,
                model: model.id,
                api: model.api,
                stopReason: 'stop',
                // These are authored setup turns, not charged generations.
                usage: {
                  input: 0,
                  output: 0,
                  cacheRead: 0,
                  cacheWrite: 0,
                  totalTokens: 0,
                  cost: {
                    input: 0,
                    output: 0,
                    cacheRead: 0,
                    cacheWrite: 0,
                    total: 0,
                  },
                },
              }
            : {}),
        },
      });
      parentId = id;
    }
  }
  if (scenario.compacted) {
    const kept = randomUUID().slice(0, 8);
    entries.push({
      type: 'message',
      id: kept,
      parentId,
      timestamp,
      message: {
        role: 'user',
        content: [{ type: 'text', text: 'Continue after compaction.' }],
        timestamp: Date.now(),
      },
    });
    entries.push({
      type: 'compaction',
      id: randomUUID().slice(0, 8),
      parentId: kept,
      timestamp,
      summary: scenario.compacted,
      firstKeptEntryId: kept,
      tokensBefore: 24000,
    });
  }
  writeFileSync(
    file,
    `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
  );
  return file;
}

export async function judgeRecording(
  scenario: Scenario,
  recording: Recording,
  output: string,
  signal?: AbortSignal,
): Promise<Recording> {
  if (process.env.EXECUTION_LIVE !== '1')
    throw new Error('Requires EXECUTION_LIVE=1');
  return judgeSubject(
    recording,
    output,
    subjectModels(recording),
    async (model, attemptOutput) => {
      // A separate untyped evaluator, not the workflow assayer.
      const j = fixture();
      try {
        credentials(j);
        j.declaration({
          name: 'rubric-judge',
          body: 'Judge supplied evidence against the fixed rubric. Return only the requested JSON.',
          model,
          effort: 'high',
        });
        const prompt = rubricPrompt(scenario, recording);
        writeFileSync(join(output, 'rubric-prompt.txt'), prompt);
        const judged = await launch(
          j,
          'rubric-judge',
          prompt,
          attemptOutput,
          false,
          true,
          undefined,
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
    credentials(f);
    const inspection = await launch(
      f,
      scenario.role,
      scenario.prompt,
      join(output, 'preflight'),
      true,
      false,
      undefined,
      signal,
    );
    const session = sessionFile(f, scenario, inspection);
    const records: Recording[] = [];
    // Turns share one session and must stay sequential; batches run in parallel.
    for (const [index, prompt] of [
      scenario.prompt,
      ...(scenario.turns ?? []),
    ].entries())
      records.push(
        await launch(
          f,
          scenario.role,
          prompt,
          join(output, `turn-${index + 1}`),
          false,
          false,
          session,
          signal,
        ),
      );
    const recording: Recording = {
      ...records.at(-1)!,
      messages: records.flatMap((record) => record.messages),
      snapshots: records.flatMap((record) => record.snapshots),
    };
    // Preserve the subject independently of judgment, including when the judge
    // fails. Re-judgment never needs another architect session.
    writeFileSync(
      join(output, 'subject.json'),
      JSON.stringify(recording, null, 2),
    );
    writeFileSync(join(output, 'session.jsonl'), readFileSync(session));
    return await judgeRecording(scenario, recording, output, signal);
  } finally {
    f.dispose();
  }
}
