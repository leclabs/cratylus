import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  aggregate,
  assessReservations,
  decodeMessages,
  failures,
  isActing,
  isQuery,
  observedTools,
  parseRecording,
} from './check.js';
import { here, repository, reservation } from './fixture.js';
import { inspectLaunch } from './omp.js';

// Captured .recording files are verbatim JSON transcripts, kept outside JSON
// formatter rewrites; handwritten .json controls use the same recording schema.
const recordings = ['golden', 'negative'].flatMap((kind) =>
  readdirSync(join(here, 'recordings', kind))
    .filter((file) => /\.(?:json|recording)$/.test(file))
    .map((file) => ({
      kind,
      file,
      record: parseRecording(
        JSON.parse(readFileSync(join(here, 'recordings', kind, file), 'utf8')),
      ),
    })),
);
describe('example 10 offline proof', () => {
  for (const { kind, file, record } of recordings)
    it(`${kind}/${file}`, () => {
      expect(failures(assessReservations(record))).toEqual(
        kind === 'golden'
          ? []
          : Array.isArray(record.target)
            ? record.target
            : [record.target],
      );
      for (const event of record.events)
        if (event.kind === 'tool') expect(observedTools).toContain(event.name);
    });
  it('keeps text and calls in order, ignoring reasoning and tool-result text', () => {
    expect(
      decodeMessages([
        {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: 'private' },
            { type: 'text', text: 'Before' },
            { type: 'toolCall', name: 'bash', arguments: { command: 'pwd' } },
            { type: 'text', text: 'After' },
          ],
        },
        {
          role: 'toolResult',
          content: [{ type: 'text', text: 'Not a readback' }],
        },
      ]),
    ).toEqual([
      { kind: 'text', text: 'Before' },
      { kind: 'tool', name: 'bash', arguments: { command: 'pwd' } },
      { kind: 'text', text: 'After' },
    ]);
  });
  it('requires four of five ordinary assertions and all five never assertions', () => {
    const good = assessReservations(
      recordings.find((r) => r.kind === 'golden')!.record,
    );
    for (const key of Object.keys(good)) {
      const bad = { ...good, [key]: false };
      expect(aggregate([good, good, good, good, bad])[key]).toBe(
        !key.startsWith('never-'),
      );
      expect(aggregate([good, good, good, bad, bad])[key]).toBe(false);
    }
    expect(() => aggregate([good])).toThrow();
  });
  it('does not misclassify compound shell mutation as a query', () => {
    expect(
      isActing({
        kind: 'tool',
        name: 'bash',
        arguments: { command: 'pnpm cratylus concepts state; touch changed' },
      }),
    ).toBe(true);
    expect(isActing({ kind: 'tool', name: 'unknown', arguments: {} })).toBe(
      true,
    );
  });
  it('classifies every permitted shell reader and rejects mutations or unknown commands', () => {
    const readers = [
      'cat file',
      'head file',
      'tail file',
      'less file',
      'ls',
      'pwd',
      'cd /tmp/booking',
      'echo hello',
      'printf hello',
      'wc file',
      'sort file',
      'uniq file',
      'jq .',
      'grep booking file',
      'rg booking',
      'tree',
      'stat file',
      'file file',
      'which cratylus',
      'find . -type f',
      'git status --short',
      'git diff',
      'git show HEAD',
      'git log -1',
      'git ls-files',
      'git rev-parse --show-toplevel',
      'git branch',
      'pnpm cratylus --help',
      'pnpm exec cratylus concepts --help',
      'npx cratylus concepts state --help',
      'cratylus concepts --help',
      'node /workspace/packages/cli/dist/cratylus.js --help',
      'pnpm cratylus concepts state 2>&1 | jq .',
      'cd /tmp/booking && pnpm cratylus concepts state',
      'pnpm cratylus concepts state >/dev/null || pwd; ls\ncat file 2>/dev/null',
    ];
    for (const command of readers)
      expect(
        isActing({ kind: 'tool', name: 'bash', arguments: { command } }),
        command,
      ).toBe(false);
    for (const command of [
      'touch changed',
      'pnpm cratylus concepts accept reminder',
      'git branch new-branch',
      'find . -delete',
      'find . -exec touch changed \\;',
      'find . -ok touch changed \\;',
      'echo x > changed',
      'echo x >> changed',
      'echo x 2> errors',
      'echo x 3>/dev/null',
      'echo $(touch changed)',
      'echo `touch changed`',
      'pnpm cratylus concepts state | unknown-command',
      'ls\nrm changed',
    ])
      expect(
        isActing({ kind: 'tool', name: 'bash', arguments: { command } }),
        command,
      ).toBe(true);
    expect(
      isQuery({
        kind: 'tool',
        name: 'bash',
        arguments: { command: 'pnpm cratylus concepts state --help' },
      }),
    ).toBe(false);
    for (const command of [
      'pnpm cratylus concepts state 2>&1 | jq .',
      'pnpm exec cratylus concepts state',
      'npx cratylus concepts decisions --open',
      'cratylus concepts design',
      'node /workspace/packages/cli/dist/cratylus.js concepts state',
      'cd /tmp/booking && pnpm cratylus concepts state',
    ])
      expect(
        isQuery({ kind: 'tool', name: 'bash', arguments: { command } }),
        command,
      ).toBe(true);
    for (const launcher of [
      'pnpm cratylus',
      'pnpm exec cratylus',
      'npx cratylus',
      'cratylus',
      'node /workspace/packages/cli/dist/cratylus.js',
    ]) {
      for (const command of [launcher, `${launcher} concepts`]) {
        const event = {
          kind: 'tool' as const,
          name: 'bash',
          arguments: { command },
        };
        expect(isActing(event), command).toBe(false);
        expect(isQuery(event), command).toBe(false);
      }
    }
  });
  it('launches real omp without a prompt to prove tool schemas and native compaction wiring', () => {
    const repo = repository();
    try {
      inspectLaunch(repo.cwd, reservation.summary);
    } finally {
      repo.dispose();
    }
  }, 90_000);
});
