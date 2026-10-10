import * as childProcess from 'node:child_process';
import { exec, execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import * as os from 'node:os';
import { homedir, hostname, userInfo } from 'node:os';
import { resolve } from 'node:path';
import { env } from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it, vi } from 'vitest';
import {
  type BehavioralCheck,
  type Example,
  type ProofRecordings,
  checkExample,
  createExampleLedger,
  judgeBatch,
  proveOffline,
  validateExample,
} from '../src/index.js';

type Text = { text: string };
const example = 'say “hello” to the customer, politely';
const recordings: ProofRecordings<Text> = {
  golden: [
    { name: 'hello', recording: { text: 'hello' } },
    { name: 'hello-capital', recording: { text: 'Hello' } },
  ],
  negative: [{ name: 'silent', recording: { text: '' }, breaks: 'greets' }],
};
const checkReading = (read: () => unknown): BehavioralCheck<Text> => ({
  example,
  assertions: [{ id: 'greets', binds: ['say "Hello" to the customer'] }],
  judge: ({ text }) => {
    read();
    return { greets: text.toLowerCase() === 'hello' };
  },
});
const hostReads = async (read: () => unknown) =>
  (await proveOffline(checkReading(read), recordings)).findings
    .filter(({ kind }) => kind === 'host-read')
    .map(({ read }) => read)
    .sort();
const self = fileURLToPath(import.meta.url);
const temporalNow: unknown = Reflect.get(
  Reflect.get(globalThis, 'Temporal') ?? {},
  'Now',
);

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
          greets: text.toLowerCase() === 'hello',
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
          return { greets: text === 'Hello' };
        },
      },
      recordings,
    );
    expect(result.findings).toEqual([
      { kind: 'golden-rejected', recording: 'hello' },
    ]);
  });

  it('does not prove without goldens, or with goldens that do not differ', async () => {
    const check = checkReading(() => {});
    expect(
      (await proveOffline(check, { ...recordings, golden: [] })).findings,
    ).toEqual([
      { kind: 'never-seen-passing', assertion: 'greets' },
      { kind: 'goldens-not-varied' },
    ]);
    const [first] = recordings.golden;
    expect(
      (
        await proveOffline(check, {
          ...recordings,
          golden: [first!, { ...first!, name: 'copy' }],
        })
      ).findings,
    ).toEqual([{ kind: 'goldens-not-varied' }]);
  });

  it('reports a verdict for an assertion the check does not declare', async () => {
    const result = await proveOffline<Text>(
      {
        ...checkReading(() => {}),
        judge: ({ text }) => ({
          greets: text.toLowerCase() === 'hello',
          extra: true,
        }),
      },
      recordings,
    );
    expect(result.findings).toEqual([
      { kind: 'undeclared', assertion: 'extra' },
    ]);
  });

  it('ties never-assertions to never-phrases both ways', async () => {
    const neverExample = 'never disclose the secret; say hello; do not shout';
    const judge = () => ({ secret: true, greets: true, shout: true });
    const result = await proveOffline(
      {
        example: neverExample,
        assertions: [
          { id: 'secret', binds: ['never disclose the secret'] },
          { id: 'greets', binds: ['say hello'], never: true },
          { id: 'shout', binds: ['do not shout'], never: true },
        ],
        judge,
      },
      recordings,
    );
    expect(
      result.findings.filter(({ kind }) => kind === 'never-mismatch'),
    ).toEqual([
      { kind: 'never-mismatch', assertion: 'secret' },
      { kind: 'never-mismatch', assertion: 'greets' },
    ]);
  });
});

describe('host observation', () => {
  it('catches file reads through ESM named imports and namespaces', async () => {
    expect(await hostReads(() => readFileSync(self, 'utf8'))).toEqual([
      `file:${self}`,
    ]);
    expect(await hostReads(() => readFile(self))).toEqual([`file:${self}`]);
    expect(await hostReads(() => existsSync('package.json'))).toEqual([
      'cwd',
      `file:${resolve('package.json')}`,
    ]);
  });

  it('catches child processes, sync and async', async () => {
    expect(await hostReads(() => execFileSync('true'))).toEqual([
      'process:true',
    ]);
    expect(await hostReads(() => childProcess.spawnSync('true'))).toEqual([
      'process:true',
    ]);
    expect(await hostReads(() => promisify(exec)('true --quiet'))).toEqual([
      'process:true',
    ]);
  });

  it('catches os facts, named and namespaced', async () => {
    expect(await hostReads(() => homedir())).toEqual(['home']);
    expect(await hostReads(() => os.homedir())).toEqual(['home']);
    expect(await hostReads(() => userInfo())).toEqual(['user']);
    expect(await hostReads(() => hostname())).toEqual(['hostname']);
    expect(await hostReads(() => os.tmpdir())).toEqual(['tmpdir']);
    expect(await hostReads(() => os.networkInterfaces())).toEqual([
      'networkInterfaces',
    ]);
    expect(await hostReads(() => [os.cpus(), os.totalmem()])).toEqual([
      'cpus',
      'totalmem',
    ]);
  });

  it('catches the working directory, directly and through path.resolve', async () => {
    expect(await hostReads(() => process.cwd())).toEqual(['cwd']);
    expect(await hostReads(() => resolve('relative'))).toEqual(['cwd']);
    expect(await hostReads(() => resolve('/absolute'))).toEqual([]);
  });

  it('catches environment reads and enumeration', async () => {
    expect(await hostReads(() => 'LANG' in process.env)).toEqual(['env:LANG']);
    expect(await hostReads(() => env.LANG)).toEqual(['env:LANG']);
    expect(await hostReads(() => Object.keys(process.env))).toEqual(['env']);
    expect(await hostReads(() => ({ ...process.env }))).toEqual(['env']);
    expect(
      await hostReads(() => {
        for (const name in process.env) void name;
      }),
    ).toEqual(['env']);
    expect(
      await hostReads(() =>
        Object.getOwnPropertyDescriptor(process.env, 'LANG'),
      ),
    ).toEqual(['env:LANG']);
  });

  it('catches the clock but not a fixed date', async () => {
    const utc = { timeZone: 'UTC' };
    for (const read of [
      () => Date.now(),
      () => new Date(),
      () => performance.now(),
      () => performance.timeOrigin,
      () => process.hrtime(),
      () => process.hrtime.bigint(),
      () => process.uptime(),
      () => new Intl.DateTimeFormat('en', utc).format(),
      () => new Intl.DateTimeFormat('en', utc).formatToParts(),
    ])
      expect(await hostReads(read)).toEqual(['clock']);
    expect(await hostReads(() => Date())).toEqual(['clock', 'timezone']);
    expect(await hostReads(() => new Date(0).getTime())).toEqual([]);
    expect(await hostReads(() => new Date('2020-01-01'))).toEqual([]);
    expect(
      await hostReads(() => new Intl.DateTimeFormat('en', utc).format(0)),
    ).toEqual([]);
  });

  it.runIf(typeof temporalNow === 'object')(
    'catches the clock and zone through Temporal.Now',
    async () => {
      const now = temporalNow as {
        instant: () => unknown;
        plainDateISO: (zone?: string) => unknown;
      };
      expect(await hostReads(() => now.instant())).toEqual(['clock']);
      expect(await hostReads(() => now.plainDateISO())).toEqual([
        'clock',
        'timezone',
      ]);
      expect(await hostReads(() => now.plainDateISO('UTC'))).toEqual(['clock']);
    },
  );

  it('catches the host time zone through local-time methods', async () => {
    const date = new Date(0);
    for (const read of [
      () => date.getHours(),
      () => date.getTimezoneOffset(),
      () => date.toString(),
      () => `${date}`,
      () => date.toLocaleString('en'),
      () => new Date(2020, 0, 1),
      () => new Date('2020-01-01T10:00'),
      () => new Intl.DateTimeFormat('en'),
    ])
      expect(await hostReads(read)).toEqual(['timezone']);
    expect(
      await hostReads(() => date.toLocaleString('en', { timeZone: 'UTC' })),
    ).toEqual([]);
    expect(await hostReads(() => date.getUTCHours())).toEqual([]);
  });

  it('catches reads after an await inside an async judge', async () => {
    const result = await proveOffline<Text>(
      {
        ...checkReading(() => {}),
        judge: async ({ text }) => {
          await Promise.resolve();
          void process.env.OFFLINE_PROOF_PROBE;
          return { greets: text.toLowerCase() === 'hello' };
        },
      },
      recordings,
    );
    expect(result.findings).toEqual([
      { kind: 'host-read', read: 'env:OFFLINE_PROOF_PROBE' },
    ]);
  });

  it('charges each read to the proof whose judge made it', async () => {
    let open = () => {};
    const gate = new Promise<void>((resolve) => {
      open = resolve;
    });
    const first = proveOffline<Text>(
      {
        ...checkReading(() => {}),
        judge: async ({ text }) => {
          await gate;
          void process.env.FIRST_PROBE;
          return { greets: text.toLowerCase() === 'hello' };
        },
      },
      recordings,
    );
    const second = proveOffline(
      checkReading(() => {
        void process.env.SECOND_PROBE;
        open();
      }),
      recordings,
    );
    // Not inside any judge: charged to neither proof.
    void process.env.OUTSIDE_PROBE;
    expect((await first).findings).toEqual([
      { kind: 'host-read', read: 'env:FIRST_PROBE' },
    ]);
    expect((await second).findings).toEqual([
      { kind: 'host-read', read: 'env:SECOND_PROBE' },
    ]);
  });

  it('restores every global exactly, even when the judge throws', async () => {
    const before = {
      env: process.env,
      Date,
      now: Date.now,
      getHours: Date.prototype.getHours,
      DateTimeFormat: Intl.DateTimeFormat,
      cwd: process.cwd,
      hrtime: process.hrtime,
      readFileSync,
      execFileSync,
      homedir,
      osHomedir: os.homedir,
    };
    await hostReads(() => {
      throw new Error('broken judge');
    });
    expect({
      env: process.env,
      Date,
      now: Date.now,
      getHours: Date.prototype.getHours,
      DateTimeFormat: Intl.DateTimeFormat,
      cwd: process.cwd,
      hrtime: process.hrtime,
      readFileSync,
      execFileSync,
      homedir,
      osHomedir: os.homedir,
    }).toStrictEqual(before);
    expect(process.env).toBe(before.env);
    expect(Date).toBe(before.Date);
    expect(readFileSync).toBe(before.readFileSync);
    expect(homedir).toBe(before.homedir);
    expect(Object.hasOwn(performance, 'now')).toBe(false);
    expect(Object.hasOwn(performance, 'timeOrigin')).toBe(false);
  });

  it('does not count the proof’s own work', async () => {
    expect(await hostReads(() => {})).toEqual([]);
  });
});

describe('declared host reads', () => {
  const greeting = (
    exampleWords: string,
    host: BehavioralCheck<Text>['host'],
    read: () => unknown,
  ): BehavioralCheck<Text> => ({
    example: exampleWords,
    assertions: [{ id: 'greets', binds: ['say hello'] }],
    host,
    judge: ({ text }) => {
      read();
      return { greets: text.toLowerCase() === 'hello' };
    },
  });

  it('excuses a read only when the example words bound to it name it', async () => {
    const userExample = 'say hello by the name in their USER setting';
    const named = await proveOffline(
      greeting(
        userExample,
        [{ read: 'env:USER', binds: ['USER setting'] }],
        () => process.env.USER,
      ),
      recordings,
    );
    expect(named.findings).toEqual([]);
    const unnamed = await proveOffline(
      greeting(
        userExample,
        [{ read: 'env:USER', binds: ['say hello'] }],
        () => process.env.USER,
      ),
      recordings,
    );
    expect(unnamed.findings).toEqual([{ kind: 'host-read', read: 'env:USER' }]);
  });

  it('names files by path or final segment, and the clock by a time word', async () => {
    const ledger = resolve('/srv/ledger.json');
    const file = await proveOffline(
      greeting(
        'say hello with the total from ledger.json',
        [{ read: `file:${ledger}`, binds: ['ledger.json'] }],
        () => existsSync(ledger),
      ),
      recordings,
    );
    expect(file.findings).toEqual([]);
    const clock = await proveOffline(
      greeting(
        'say hello and mention today’s date',
        [{ read: 'clock', binds: ['today’s date'] }],
        () => Date.now(),
      ),
      recordings,
    );
    expect(clock.findings).toEqual([]);
    const home = await proveOffline(
      greeting(
        'say hello and mention the operator',
        [{ read: 'home', binds: ['the operator'] }],
        () => homedir(),
      ),
      recordings,
    );
    expect(home.findings).toEqual([{ kind: 'host-read', read: 'home' }]);
  });
});

describe('a check given as a loader', () => {
  it('is observed while it loads, module scope included', async () => {
    // Fresh modules, so the module loader reads their sources while the proof observes it.
    const pure = await proveOffline(
      async () => (await import('./offline-proof-module-pure.js')).check,
      recordings,
    );
    expect(pure).toEqual({ proven: true, findings: [] });
    const loaded = await proveOffline(
      async () => (await import('./offline-proof-module.js')).check,
      recordings,
    );
    expect(loaded.findings).toEqual([{ kind: 'host-read', read: 'home' }]);
    const builtin = await proveOffline(async () => {
      const { homedir } = await import('node:os');
      homedir();
      return checkReading(() => {});
    }, recordings);
    expect(builtin.findings).toEqual([{ kind: 'host-read', read: 'home' }]);
    const synchronous = await proveOffline(() => {
      void process.env.LOADER_PROBE;
      return checkReading(() => {});
    }, recordings);
    expect(synchronous.findings).toEqual([
      { kind: 'host-read', read: 'env:LOADER_PROBE' },
    ]);
  });

  it('is judged by judgeBatch', async () => {
    const result = await judgeBatch(
      () => checkReading(() => {}),
      [{ text: 'hello' }],
      { atLeast: 1, of: 1 },
    );
    expect(result.passed).toBe(true);
  });
});

describe('judgeBatch', () => {
  it('refuses a threshold over a different number of runs', async () => {
    await expect(
      judgeBatch(
        checkReading(() => {}),
        [{ text: 'hello' }],
        {
          atLeast: 1,
          of: 2,
        },
      ),
    ).rejects.toThrow('of 2 runs, but 1 recordings');
  });
});

describe('a behavioral example', () => {
  const behavioral = (
    runner: (run: number) => Promise<unknown>,
    threshold = { atLeast: 2, of: 3 },
  ): Example => ({
    id: 'greeting',
    concept: 'offline proof',
    situation: 'a customer arrives',
    trigger: 'the customer speaks',
    outcome: example,
    check: {
      kind: 'behavioral',
      check: checkReading(() => {}),
      recordings,
      threshold,
      runner,
    },
  });

  it('is checked by running the runner `of` times and judging the batch', async () => {
    const runner = vi.fn(async (run: number) => ({
      text: run === 1 ? '' : 'hello',
    }));
    expect(await checkExample(behavioral(runner))).toMatchObject({
      status: 'pass',
      runs: 3,
    });
    expect(runner.mock.calls).toEqual([[1], [2], [3]]);
    expect(
      await checkExample(behavioral(async () => ({ text: '' }))),
    ).toMatchObject({
      status: 'fail',
      shortfall: expect.stringContaining('greets'),
    });
  });

  it('refuses a threshold that is not from 0 to a positive number of runs', () => {
    expect(() =>
      validateExample(behavioral(async () => ({}), { atLeast: 4, of: 3 })),
    ).toThrow('unspecified outcome');
    expect(() =>
      validateExample(behavioral(async () => ({}), { atLeast: 0, of: 0 })),
    ).toThrow('unspecified outcome');
  });

  it('is refrozen only when its changed check proves offline', async () => {
    // The ledger freezes the example, runner included, so count runs without a spy.
    let runs = 0;
    const runner = async () => {
      runs += 1;
      return { text: 'hello' };
    };
    const ledger = createExampleLedger([behavioral(runner)], 'meaning-holder');
    await ledger.meaningHolder.confirm('greeting');
    const unvaried = ledger.meaningHolder.approveChange('greeting', 'narrow', {
      check: {
        kind: 'behavioral',
        check: checkReading(() => {}),
        recordings: { ...recordings, golden: [recordings.golden[0]!] },
        threshold: { atLeast: 1, of: 1 },
        runner,
      },
    });
    await expect(ledger.meaningHolder.refreeze(unvaried)).rejects.toThrow(
      'offline proof did not succeed',
    );
    expect(runs).toBe(0);
  });
});
