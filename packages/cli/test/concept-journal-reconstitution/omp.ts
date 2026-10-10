import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect } from 'vitest';
import { type Recording, decodeMessages, observedTools } from './check.js';
import { here } from './fixture.js';

export function compactedSession(cwd: string, summary: string) {
  const file = join(cwd, 'compacted.jsonl');
  const timestamp = new Date().toISOString();
  // Native v3 tree, not a user message impersonating compaction. No model is
  // needed to manufacture the historical fixture; --resume reconstitutes it.
  const entries = [
    { type: 'session', version: 3, id: randomUUID(), timestamp, cwd },
    {
      type: 'message',
      id: '11111111',
      parentId: null,
      timestamp,
      message: {
        role: 'user',
        content: [{ type: 'text', text: 'Design the booking context.' }],
        timestamp: Date.now(),
      },
    },
    {
      type: 'message',
      id: '22222222',
      parentId: '11111111',
      timestamp,
      message: {
        role: 'user',
        content: [{ type: 'text', text: 'We will continue after compaction.' }],
        timestamp: Date.now(),
      },
    },
    {
      type: 'compaction',
      id: '33333333',
      parentId: '22222222',
      timestamp,
      summary,
      firstKeptEntryId: '22222222',
      tokensBefore: 24000,
    },
  ];
  writeFileSync(
    file,
    `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`,
  );
  return file;
}
export function launchArgs(session: string) {
  return [
    '--print',
    '--mode',
    'json',
    '--model',
    'anthropic/claude-opus-5-5',
    '--thinking',
    'medium',
    '--append-system-prompt',
    join(homedir(), '.omp/agent/roles/architect.md'),
    '--resume',
    session,
    '--tools',
    observedTools.join(','),
    '--no-extensions',
    '--no-skills',
    '--no-rules',
    '--no-lsp',
    '--no-title',
    '--no-pty',
    '--extension',
    join(here, 'observe-omp.ts'),
  ];
}
export function inspectLaunch(cwd: string, summary: string) {
  const session = compactedSession(cwd, summary);
  const wiring = join(cwd, 'wiring.json');
  // No prompt, closed stdin, and an early-exit observer: never a model run.
  const result = spawnSync('omp', launchArgs(session), {
    cwd,
    input: '',
    encoding: 'utf8',
    timeout: 60_000,
    env: {
      ...process.env,
      CONCEPT_INSPECT_ONLY: '1',
      CONCEPT_WIRING_FILE: wiring,
    },
  });
  if (result.error) throw result.error;
  expect(result.status, result.stderr + result.stdout).toBe(0);
  expect(existsSync(wiring), 'real omp must emit its active tool schemas').toBe(
    true,
  );
  const observed = JSON.parse(readFileSync(wiring, 'utf8'));
  expect(observed.active.slice().sort()).toEqual([...observedTools].sort());
  for (const name of observedTools) {
    const tool = observed.tools.find(
      (item: { name: string }) => item.name === name,
    );
    expect(tool, `real launch offers ${name}`).toBeDefined();
    expect(tool.parameters.type).toBe('object');
    expect(
      Object.keys(tool.parameters.properties ?? {}).length,
      `${name} has declared parameters, not z.record(z.unknown())`,
    ).toBeGreaterThan(0);
    const parameter =
      name === 'bash'
        ? 'command'
        : name === 'grep'
          ? 'pattern'
          : name === 'edit'
            ? null
            : 'path';
    if (parameter) expect(tool.parameters.properties).toHaveProperty(parameter);
  }
  expect(observed.entries).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'compaction',
        summary,
        firstKeptEntryId: '22222222',
      }),
    ]),
  );
  expect(JSON.stringify(observed.context)).toContain(summary);
  expect(
    readFileSync(join(homedir(), '.omp/agent/roles/architect.md'), 'utf8'),
  ).toContain('pnpm cratylus concepts');
  return observed;
}
export function liveRun(
  cwd: string,
  summary: string,
  outputDirectory: string,
  index: number,
): Recording {
  if (process.env.CONCEPT_JOURNAL_LIVE !== '1')
    throw new Error('Live runs require CONCEPT_JOURNAL_LIVE=1');
  const session = compactedSession(cwd, summary);
  mkdirSync(outputDirectory, { recursive: true });
  const output = resolve(outputDirectory, `run-${index}`);
  const transcript = `${output}.messages.jsonl`;
  writeFileSync(transcript, '');
  const args = [...launchArgs(session), 'Continue the work.'];
  const result = spawnSync('omp', args, {
    cwd,
    input: '',
    encoding: 'utf8',
    timeout: 300_000,
    maxBuffer: 32 * 1024 * 1024,
    env: {
      ...process.env,
      CONCEPT_INSPECT_ONLY: '0',
      CONCEPT_WIRING_FILE: `${output}.wiring.json`,
      CONCEPT_TRANSCRIPT_FILE: transcript,
    },
  });
  // Preserve the raw stream and native session even if omp fails.
  writeFileSync(`${output}.stdout`, result.stdout ?? '');
  writeFileSync(`${output}.stderr`, result.stderr ?? '');
  writeFileSync(`${output}.session.jsonl`, readFileSync(session));
  if (result.error) throw result.error;
  expect(result.status, result.stderr).toBe(0);
  const messages: unknown[] = readFileSync(transcript, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const record = { name: `live-${index}`, events: decodeMessages(messages) };
  expect(
    record.events.length,
    'a successful launch must record assistant behavior',
  ).toBeGreaterThan(0);
  for (const event of record.events)
    if (event.kind === 'tool') expect(observedTools).toContain(event.name);
  writeFileSync(`${output}.json`, JSON.stringify(record, null, 2));
  return record;
}
