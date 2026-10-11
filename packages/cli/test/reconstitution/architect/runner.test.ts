import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Recording, Scenario } from './check.js';
import {
  promptArgument,
  recordingDirectory,
  retainedSubject,
} from './runner.js';

const roots: string[] = [];
function directory() {
  const root = mkdtempSync(join(tmpdir(), 'architect-runner-test-'));
  roots.push(root);
  return root;
}
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

const scenario: Scenario = {
  number: 19,
  ref: 'workflow/19',
  title: 'transport control',
  role: 'architect',
  example: '',
  prompt: 'Design the film approval process.',
  files: {},
  commands: [],
  clauses: [],
};
function record(turn: number): Recording {
  return {
    messages: [{ role: 'assistant', content: `Turn ${turn}` }],
    report: `Report ${turn}`,
    snapshots: [{ phase: `before-${turn}` }, { phase: `after-${turn}` }],
    wiring: {
      agent: 'architect',
      declaration: 'Authored architect control',
      prompt: ['Authored architect control'],
      active: ['read'],
      tools: [
        {
          name: 'read',
          parameters: {
            type: 'object',
            properties: { path: { type: 'string' } },
            required: ['path'],
          },
        },
      ],
    },
    answers: {
      previous: { pass: true, evidence: 'Old judgment must not be reused.' },
    },
  };
}
function save(path: string, recording: Recording) {
  mkdirSync(path, { recursive: true });
  const filename = join(path, 'recording.json');
  writeFileSync(filename, JSON.stringify(recording));
  return filename;
}

describe('architect prompt transport and retained subjects', () => {
  it.each(['subject', 'rubric-judge'])(
    'keeps a long %s prompt out of argv without truncation',
    (role) => {
      const root = directory();
      const prompt = `${role}\n${'A large trace — with Unicode and newlines.\n'.repeat(20_000)}`;
      expect(Buffer.byteLength(prompt)).toBeGreaterThan(128 * 1024);
      const argument = promptArgument(prompt, root);
      expect(argument).toBe(`@${join(root, 'prompt.txt')}`);
      expect(Buffer.byteLength(argument)).toBeLessThan(1024);
      expect(readFileSync(argument.slice(1), 'utf8')).toBe(prompt);
    },
  );

  it('separates architect output from other suites, contexts and judgment cases', () => {
    const root = directory();
    const visible = recordingDirectory(root, scenario);
    expect(visible).toBe(join(root, 'architect/visible/workflow/19'));
    expect(visible).not.toBe(join(root, '19'));
    expect(recordingDirectory(root, { ...scenario, ref: 'agents/19' })).toBe(
      join(root, 'architect/visible/agents/19'),
    );
    expect(
      recordingDirectory(root, { ...scenario, ref: 'held-out workflow/19' }),
    ).toBe(join(root, 'architect/held-out/workflow/19'));
  });

  it('loads the retained architect turn instead of a collided top-level result and leaves both unchanged', () => {
    const root = directory();
    const subject = record(1);
    const turn = save(join(root, 'turn-1'), subject);
    const collision = save(root, {
      ...record(9),
      wiring: { ...subject.wiring, agent: 'lead' },
    });
    const before = [
      readFileSync(turn, 'utf8'),
      readFileSync(collision, 'utf8'),
    ];
    expect(retainedSubject(scenario, root)).toEqual({
      ...subject,
      answers: {},
    });
    expect([
      readFileSync(turn, 'utf8'),
      readFileSync(collision, 'utf8'),
    ]).toEqual(before);
  });

  it('reconstructs all retained turns in order without new sessions', () => {
    const root = directory();
    const records = [record(1), record(2), record(3)];
    records.forEach((recording, index) =>
      save(join(root, `turn-${index + 1}`), recording),
    );
    const loaded = retainedSubject(
      { ...scenario, turns: ['Second question', 'Third question'] },
      root,
    );
    expect(loaded.messages).toEqual(
      records.flatMap((recording) => recording.messages),
    );
    expect(loaded.snapshots).toEqual(
      records.flatMap((recording) => recording.snapshots),
    );
    expect(loaded.report).toBe('Report 3');
    expect(loaded.answers).toEqual({});
  });

  it('refuses incomplete multi-turn evidence instead of judging only the opening turn', () => {
    const root = directory();
    save(join(root, 'turn-1'), record(1));
    expect(() =>
      retainedSubject({ ...scenario, turns: ['Second question'] }, root),
    ).toThrow();
  });

  it('refuses another role at the retained subject path', () => {
    const root = directory();
    const wrong = record(1);
    wrong.wiring.agent = 'lead';
    save(join(root, 'turn-1'), wrong);
    expect(() => retainedSubject(scenario, root)).toThrow(
      'not a wired architect',
    );
  });

  it('loads the independently saved subject from new runs and discards old rubric answers', () => {
    const root = directory();
    const subject = record(3);
    writeFileSync(join(root, 'subject.json'), JSON.stringify(subject));
    expect(retainedSubject(scenario, root)).toEqual({
      ...subject,
      answers: {},
    });
  });
});
