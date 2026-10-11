import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect } from 'vitest';
import { fixture } from '../agent-launch/fixture.js';
import { type Recording, decodeMessages, observedTools } from './check.js';
import { here } from './fixture.js';

// This instruction is test-owned, not a claim about the operator's architect
// text. It binds reconstitution's “querying the concept journal ... before acting”.
export const architectBody =
  'You are the architect. Before acting, query the concept journal with `pnpm cratylus concepts state`. Read back the current design of the contexts the work touches, their decisions and what is open. Recover the design from the journal, not from the compacted summary.';
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
export function launchArgs(
  session: string,
  packageRoot: string,
  model = 'fixture/base',
  agent: string | null = 'architect',
) {
  return [
    '--print',
    '--mode',
    'json',
    '--model',
    model,
    '--thinking',
    'medium',
    ...(agent === null ? [] : ['--agent', agent]),
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
    packageRoot,
    '--extension',
    join(here, 'observe-omp.ts'),
  ];
}
export function inspectLaunch(cwd: string, summary: string) {
  const f = fixture();
  try {
    f.declaration({ name: 'architect', body: architectBody });
    const session = compactedSession(cwd, summary);
    // Supply a turn so the observer sees the effective prompt AFTER the
    // installed extension's override; exit there, before any provider request.
    const record = (agent: string | null) => {
      const wiring = join(f.root, `${agent ?? 'plain'}-wiring.json`);
      const result = spawnSync(
        'omp',
        [
          ...launchArgs(
            session,
            join(f.home, '.cratylus/omp'),
            'fixture/base',
            agent,
          ),
          'Continue the work.',
        ],
        {
          cwd,
          input: '',
          encoding: 'utf8',
          timeout: 60_000,
          env: {
            ...f.env,
            PWD: cwd,
            CONCEPT_INSPECT_ONLY: '1',
            CONCEPT_WIRING_FILE: wiring,
          },
        },
      );
      if (result.error) throw result.error;
      expect(result.status, result.stderr + result.stdout).toBe(0);
      expect(
        existsSync(wiring),
        'real omp must emit its active tool schemas',
      ).toBe(true);
      return JSON.parse(readFileSync(wiring, 'utf8'));
    };
    const plain = record(null);
    const observed = record('architect');
    // Reconstitution needs the scenario tools below, not a literal --tools
    // roster. Any additional active tools must be ones plain omp also grants
    // with the same flags; admitting its extension tools is not a defect.
    for (const name of observed.active)
      expect(plain.active, `plain omp also grants ${name}`).toContain(name);
    for (const name of observedTools) {
      expect(observed.active, `scenario offers ${name}`).toContain(name);
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
      if (parameter)
        expect(tool.parameters.properties).toHaveProperty(parameter);
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
    // The instruction must be in the prompt actually held at the turn, not
    // merely in a file on disk or session_start's unmodified base prompt.
    expect(observed.systemPrompt.join('\n')).toContain(architectBody);
    return observed;
  } finally {
    f.dispose();
  }
}
export function liveRun(
  cwd: string,
  summary: string,
  outputDirectory: string,
  index: number,
): Recording {
  if (process.env.CONCEPT_JOURNAL_LIVE !== '1')
    throw new Error('Live runs require CONCEPT_JOURNAL_LIVE=1');
  const f = fixture();
  try {
    const model = 'anthropic/claude-opus-5-5';
    f.declaration({
      name: 'architect',
      body: architectBody,
      model,
      effort: 'medium',
    });
    // Only the explicitly opted-in live path may read the credential store.
    // No roles, model config, memory, rules or extensions are copied.
    for (const suffix of ['', '-wal', '-shm']) {
      const source = join(homedir(), '.omp/agent', `agent.db${suffix}`);
      if (existsSync(source))
        cpSync(source, join(f.home, '.omp/agent', `agent.db${suffix}`));
    }
    const config = join(f.root, 'live-config.json');
    writeFileSync(config, JSON.stringify({ memory: { backend: 'off' } }));
    const session = compactedSession(cwd, summary);
    mkdirSync(outputDirectory, { recursive: true });
    const output = resolve(outputDirectory, `run-${index}`);
    const transcript = `${output}.messages.jsonl`;
    writeFileSync(transcript, '');
    const args = [
      ...launchArgs(session, join(f.home, '.cratylus/omp'), model),
      '--config',
      config,
      'Continue the work.',
    ];
    const result = spawnSync('omp', args, {
      cwd,
      input: '',
      encoding: 'utf8',
      timeout: 300_000,
      maxBuffer: 32 * 1024 * 1024,
      env: {
        ...f.env,
        PWD: cwd,
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
  } finally {
    f.dispose();
  }
}
