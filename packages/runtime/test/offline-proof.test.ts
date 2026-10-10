import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import * as os from 'node:os';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  type BehavioralCheck,
  type ProofRecordings,
  judgeBatch,
  proveOffline,
} from '../src/index.js';

type Text = { text: string };
const example = 'say “hello” to the customer, politely';
const recordings: ProofRecordings<Text> = {
  golden: [{ name: 'hello', recording: { text: 'hello' } }],
  negative: [{ name: 'silent', recording: { text: '' }, breaks: 'greets' }],
};
const checkReading = (read: () => unknown): BehavioralCheck<Text> => ({
  example,
  assertions: [{ id: 'greets', binds: ['say "Hello" to the customer'] }],
  judge: ({ text }) => {
    read();
    return { greets: text === 'hello' };
  },
});
const hostReads = async (read: () => unknown) =>
  (await proveOffline(checkReading(read), recordings)).findings
    .filter(({ kind }) => kind === 'host-read')
    .map(({ read }) => read);
const self = fileURLToPath(import.meta.url);

describe('binding words', () => {
  it('compares case, whitespace, punctuation and quote style insensitively', async () => {
    expect(
      await proveOffline(
        checkReading(() => {}),
        recordings,
      ),
    ).toEqual({
      proven: true,
      findings: [],
    });
  });

  it('reports a declared host read whose words the example does not name', async () => {
    const result = await proveOffline(
      {
        ...checkReading(() => {}),
        host: [{ read: 'env:LANG', binds: ['language'] }],
      },
      recordings,
    );
    expect(result.findings).toEqual([
      { kind: 'unbound', read: 'env:LANG' },
      { kind: 'binds-unfixed', read: 'env:LANG', words: ['language'] },
    ]);
  });
});

describe('judging recordings', () => {
  it('reports each other assertion a negative breaks', async () => {
    const result = await proveOffline<Text>(
      {
        example,
        assertions: [
          { id: 'greets', binds: ['say hello'] },
          { id: 'polite', binds: ['politely'] },
        ],
        judge: ({ text }) => ({
          greets: text === 'hello',
          polite: text !== '',
        }),
      },
      recordings,
    );
    expect(result.findings).toEqual([
      {
        kind: 'negative-breaks-other',
        assertion: 'polite',
        recording: 'silent',
      },
      { kind: 'never-seen-failing', assertion: 'polite' },
    ]);
  });

  it('treats a throwing judge as a finding against that recording', async () => {
    const result = await proveOffline<Text>(
      {
        ...checkReading(() => {}),
        judge: async ({ text }) => {
          await Promise.resolve();
          if (text === 'hello') throw new Error('broken judge');
          return { greets: false };
        },
      },
      recordings,
    );
    expect(result.findings).toEqual([
      { kind: 'golden-rejected', recording: 'hello' },
    ]);
  });
});

describe('host observation', () => {
  it('catches reads made through ESM named imports and namespaces', async () => {
    expect(await hostReads(() => readFileSync(self, 'utf8'))).toEqual([
      `file:${self}`,
    ]);
    expect(await hostReads(() => readFile(self))).toEqual([`file:${self}`]);
    expect(await hostReads(() => homedir())).toEqual(['home']);
    expect(await hostReads(() => os.homedir())).toEqual(['home']);
    expect(await hostReads(() => 'LANG' in process.env)).toEqual(['env:LANG']);
  });

  it('catches the clock but not a fixed date', async () => {
    expect(await hostReads(() => Date.now())).toEqual(['clock']);
    expect(await hostReads(() => new Date())).toEqual(['clock']);
    expect(await hostReads(() => Date())).toEqual(['clock']);
    expect(await hostReads(() => new Date(0).getTime())).toEqual([]);
  });

  it('catches reads after an await inside an async judge', async () => {
    const result = await proveOffline<Text>(
      {
        ...checkReading(() => {}),
        judge: async ({ text }) => {
          await Promise.resolve();
          void process.env.OFFLINE_PROOF_PROBE;
          return { greets: text === 'hello' };
        },
      },
      recordings,
    );
    expect(result.findings).toEqual([
      { kind: 'host-read', read: 'env:OFFLINE_PROOF_PROBE' },
    ]);
  });

  it('restores every global exactly, even when the judge throws', async () => {
    const before = {
      env: process.env,
      Date,
      now: Date.now,
      readFileSync,
      homedir,
      osHomedir: os.homedir,
    };
    await hostReads(() => {
      throw new Error('broken judge');
    });
    expect(process.env).toBe(before.env);
    expect(Date).toBe(before.Date);
    expect(Date.now).toBe(before.now);
    expect(readFileSync).toBe(before.readFileSync);
    expect(homedir).toBe(before.homedir);
    expect(os.homedir).toBe(before.osHomedir);
  });

  it('does not count the proof’s own work', async () => {
    expect(await hostReads(() => {})).toEqual([]);
  });
});

describe('judgeBatch', () => {
  it('refuses a threshold over a different number of runs', async () => {
    await expect(
      judgeBatch(
        checkReading(() => {}),
        [{ text: 'hello' }],
        { atLeast: 1, of: 2 },
      ),
    ).rejects.toThrow('of 2 runs, but 1 recordings');
  });
});
