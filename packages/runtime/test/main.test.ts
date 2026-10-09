// `capabilityCommands` — each capability the runtime ships reaches its own verb
// surface, and a verb it does not declare is refused in the one wording every
// dispatcher throws.
//
// Driven the way the bin drives it: argv in, stdout, stderr and the exit code out,
// in a scratch repository as the working directory, under a host config carrying
// the event vocabulary. The help each capability and each verb prints is read off
// the same declarations the verbs are read against.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Command } from 'commander';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { CLI_BIN } from '../src/bin-name.js';
import { VERBS as DESIGN } from '../src/capabilities/design/dispatch.js';
import { dispatchDesign } from '../src/capabilities/design/index.js';
import { VERBS as EVENT_TAP } from '../src/capabilities/event-tap/dispatch.js';
import { dispatchEventTap } from '../src/capabilities/event-tap/index.js';
import {
  CAPABILITIES,
  CAPABILITY_SUMMARIES,
  type Capability,
} from '../src/capability.js';
import { capabilityCommands } from '../src/main.js';
import { RUNTIME_CONFIG_ENV } from '../src/runtime-config.js';
import { type VerbFlags, refused } from '../src/verb-flags.js';
import { BY, CONFIG, everyRecord, repository } from './verb-surface.js';

const repo = repository();

let prior: string | undefined;
beforeAll(() => {
  prior = process.env[RUNTIME_CONFIG_ENV];
  writeFileSync(
    CONFIG,
    JSON.stringify({
      events: { vocabulary: ['turn.end'] },
      harnesses: { omp: { native: { 'turn.end': 'session_stop' } } },
    }),
  );
  process.env[RUNTIME_CONFIG_ENV] = CONFIG;
});
afterAll(() => {
  if (prior === undefined) delete process.env[RUNTIME_CONFIG_ENV];
  else process.env[RUNTIME_CONFIG_ENV] = prior;
});

// Keep the event-tap test invocation explicitly OMP-scoped rather than inheriting
// the environment of whichever harness launched the test runner.
beforeAll(() => vi.stubEnv('OMPCODE', '1'));
afterAll(() => vi.unstubAllEnvs());

/** The commands in a program that stops reading options at its first command, as
 *  the program that owns the bin holds them. */
function program(): Command {
  const host = new Command(CLI_BIN).enablePositionalOptions();
  for (const command of capabilityCommands()) host.addCommand(command);
  return host;
}

/** Run `argv` through the commands in the scratch repository; what they printed
 *  and the code they left. */
async function run(
  argv: readonly string[],
): Promise<{ code: number | undefined; out: string; err: string }> {
  const out: string[] = [];
  const err: string[] = [];
  const capture = (into: string[]) => (s: string | Uint8Array) => {
    into.push(String(s));
    return true;
  };
  const stdout = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation(capture(out));
  const stderr = vi
    .spyOn(process.stderr, 'write')
    .mockImplementation(capture(err));
  const cwd = process.cwd();
  const exitCode = process.exitCode;
  let code: number | undefined;
  try {
    process.chdir(repo);
    await program().parseAsync(argv, { from: 'user' });
    code = process.exitCode as number | undefined;
  } finally {
    process.chdir(cwd);
    process.exitCode = exitCode;
    stdout.mockRestore();
    stderr.mockRestore();
  }
  return { code, out: out.join(''), err: err.join('') };
}

const SURFACES: { readonly [C in Capability]: VerbFlags } = {
  eventTap: EVENT_TAP,
  design: DESIGN,
};

describe('the capability commands print their help from the declarations', () => {
  it.each(CAPABILITIES)(
    '%s --help names every verb and its summary',
    async (c) => {
      const { code, out, err } = await run([c, '--help']);
      expect(err).toBe('');
      expect(code).toBe(0);
      expect(out).toContain(CAPABILITY_SUMMARIES[c]);
      for (const [verb, { summary }] of Object.entries(SURFACES[c])) {
        const line = out.split('\n').find((l) => l.includes(summary));
        expect(line, `${c} ${verb}`).toMatch(new RegExp(`^ +${verb}\\b`));
      }
    },
  );

  it.each([
    ['design', 'define', '<concept>'],
    ['eventTap', 'install', null],
  ] as const)(
    '%s %s --help documents its positional and every flag',
    async (c, verb, positional) => {
      const declared = SURFACES[c][
        verb as keyof (typeof SURFACES)[typeof c]
      ] as VerbFlags[string];
      const { code, out, err } = await run([c, verb, '--help']);
      expect(err).toBe('');
      expect(code).toBe(0);
      expect(out).toContain(declared.summary);
      if (positional !== null) expect(out).toContain(positional);
      expect(Object.keys(declared.flags).length).toBeGreaterThan(0);
      for (const [flag, { description, takes }] of Object.entries(
        declared.flags,
      )) {
        const line = out.split('\n').find((l) => l.includes(`--${flag}`));
        expect(line, flag).toContain(description);
        expect(line?.includes('<value>'), flag).toBe(takes === 'value');
      }
    },
  );

  it('`-h` after a verb asks for the same help as `--help`', async () => {
    const asked = await run(['design', 'define', '--help']);
    expect((await run(['design', 'define', '-h'])).out).toBe(asked.out);
    expect((await run(['design', '-h'])).out).toBe(
      (await run(['design', '--help'])).out,
    );
  });
});

describe('the capability commands answer an undeclared verb with what to do', () => {
  it('names the declared verbs and help for an unknown design verb', async () => {
    const { code, out, err } = await run(['design', 'frob']);
    expect(out).toBe('');
    expect(code).toBe(1);
    expect(err.trimEnd().split('\n')).toHaveLength(1);
    expect(err).toContain("'frob'");
    for (const verb of Object.keys(DESIGN)) expect(err).toContain(verb);
    expect(err).toContain('cratylus design --help');
  });

  const DISPATCHERS: {
    readonly [C in Capability]: (argv: string[]) => unknown;
  } = {
    eventTap: dispatchEventTap,
    design: dispatchDesign,
  };

  it.each(CAPABILITIES)(
    '%s refuses in the very words its dispatcher throws when called as a library',
    async (c) => {
      let thrown: unknown;
      try {
        DISPATCHERS[c](['frob']);
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeInstanceOf(Error);
      const { err } = await run([c, 'frob']);
      expect(err).toBe(`${CLI_BIN} ${(thrown as Error).message}\n`);
    },
  );
});

describe('the capability commands leave a verb’s flags to the verb’s own reader', () => {
  it('a flag the verb does not take is refused as `refused` words it, and nothing is written', async () => {
    const before = everyRecord(repo);
    const { code, out, err } = await run([
      'design',
      'define',
      'x',
      '--glos',
      'y',
      ...BY,
    ]);
    expect(out).toBe('');
    expect(code).toBe(1);
    expect(err).toBe(
      `cratylus ${refused('design', 'define', ['--glos'], DESIGN.define)}\n`,
    );
    expect(everyRecord(repo)).toEqual(before);
  });

  it('`-h` that is a flag’s value is that value, not a request for help', async () => {
    const captured = await run([
      'design',
      'define',
      'dash-h',
      '--gloss',
      '-h',
      '--factors',
      '',
      ...BY,
    ]);
    expect(captured.err).toBe('');
    expect(captured.code).toBe(0);
    const shown = await run(['design', 'show', 'dash-h']);
    expect(shown.code).toBe(0);
    expect(shown.out).toMatch(/^ *gloss: -h$/m);
  });

  it('`--help` after a flag that takes a value but is missing it is still a request for help', async () => {
    const { code, out } = await run(['design', 'define', '--gloss', '--help']);
    expect(code).toBe(0);
    expect(out).toContain('Usage: cratylus design define');
  });
});

describe('the capability commands refuse a word the verb does not take', () => {
  const cases: [Capability, string, string[]][] = [
    ['design', 'show', ['plan', 'extra']],
    ['eventTap', 'status', ['extra']],
  ];

  it.each(cases)(
    '%s %s given a surplus word exits 1 with one line naming it and the verb’s --help',
    async (capability, verb, words) => {
      const { code, out, err } = await run([capability, verb, ...words]);
      expect(out).toBe('');
      expect(code).toBe(1);
      expect(err.trimEnd().split('\n')).toHaveLength(1);
      expect(err).toMatch(new RegExp(`^cratylus ${capability} ${verb}: `));
      expect(err).toContain("'extra'");
      expect(err.trimEnd()).toMatch(
        new RegExp(`cratylus ${capability} ${verb} --help\\.$`),
      );
    },
  );

  it('a write given a surplus word writes nothing', async () => {
    const before = everyRecord(repo);
    const { code, out, err } = await run([
      'design',
      'define',
      'a',
      'b',
      '--gloss',
      'g',
      ...BY,
    ]);
    expect(out).toBe('');
    expect(code).toBe(1);
    expect(err).toBe(
      `cratylus ${refused('design', 'define', [], DESIGN.define, ['b'])}\n`,
    );
    expect(everyRecord(repo)).toEqual(before);
  });

  it('an untaken flag and a surplus word are refused together in the one line', async () => {
    const { code, out, err } = await run([
      'design',
      'show',
      't',
      'extra',
      '--bogus',
    ]);
    expect(out).toBe('');
    expect(code).toBe(1);
    expect(err.trimEnd().split('\n')).toHaveLength(1);
    expect(err).toContain('--bogus');
    expect(err).toContain("'extra'");
    expect(err).toBe(
      `cratylus ${refused('design', 'show', ['--bogus'], DESIGN.show, ['extra'])}\n`,
    );
  });
});
