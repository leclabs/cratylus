// `capabilityCommands` — each capability the runtime ships reaches its own verb
// surface, and a verb it does not declare is refused in the one wording every
// dispatcher throws.
//
// Driven the way the bin drives it: argv in, stdout, stderr and the exit code out,
// in a scratch repository as the working directory. The help each capability and
// each verb prints is read off the same declarations the verbs are read against.

import { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';
import { CLI_BIN } from '../src/bin-name.js';
import { VERBS as CONCEPTS } from '../src/capabilities/concepts/dispatch.js';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';
import {
  VERBS as LEDGER,
  dispatchLedger,
} from '../src/capabilities/ledger/dispatch.js';
import {
  VERBS as VERSION_SKEW,
  dispatchVersionSkew,
} from '../src/capabilities/version-skew/index.js';
import {
  CAPABILITIES,
  CAPABILITY_SUMMARIES,
  type Capability,
} from '../src/capability.js';
import { capabilityCommands } from '../src/main.js';
import { type VerbFlags, refused } from '../src/verb-flags.js';
import { everyEntry, repository } from './verb-surface.js';

const repo = repository();

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
  concepts: CONCEPTS,
  ledger: LEDGER,
  versionSkew: VERSION_SKEW,
};

describe('the capability commands print their help from the declarations', () => {
  it.each(CAPABILITIES)(
    '%s --help names every verb and its purpose',
    async (c) => {
      const { code, out, err } = await run([c, '--help']);
      expect(err).toBe('');
      expect(code).toBe(0);
      expect(out).toContain(CAPABILITY_SUMMARIES[c]);
      for (const [verb, { purpose }] of Object.entries(SURFACES[c])) {
        const line = out.split('\n').find((l) => l.includes(purpose));
        expect(line, `${c} ${verb}`).toMatch(new RegExp(`^ +${verb}\\b`));
      }
    },
  );

  it.each([
    ['concepts', 'define', '<concept>'],
    ['ledger', 'story', '<name>'],
  ] as const)(
    '%s %s --help documents its positional and every flag',
    async (c, verb, positional) => {
      const declared = SURFACES[c][
        verb as keyof (typeof SURFACES)[typeof c]
      ] as VerbFlags[string];
      const { code, out, err } = await run([c, verb, '--help']);
      expect(err).toBe('');
      expect(code).toBe(0);
      expect(out).toContain(declared.purpose);
      if (positional !== null) {
        expect(out).toContain(positional);
        expect(out).toContain(declared.positional?.description);
      }
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
    const asked = await run(['concepts', 'define', '--help']);
    expect((await run(['concepts', 'define', '-h'])).out).toBe(asked.out);
    expect((await run(['concepts', '-h'])).out).toBe(
      (await run(['concepts', '--help'])).out,
    );
  });
});

describe('the capability commands answer an undeclared verb with what to do', () => {
  it('names the declared verbs and help for an unknown concepts verb', async () => {
    const { code, out, err } = await run(['concepts', 'frob']);
    expect(out).toBe('');
    expect(code).toBe(1);
    expect(err.trimEnd().split('\n')).toHaveLength(1);
    expect(err).toContain("'frob'");
    for (const verb of Object.keys(CONCEPTS)) expect(err).toContain(verb);
    expect(err).toContain('cratylus concepts --help');
  });

  const DISPATCHERS: {
    readonly [C in Capability]: (argv: string[]) => unknown;
  } = {
    concepts: dispatchConcepts,
    ledger: dispatchLedger,
    versionSkew: (argv) => dispatchVersionSkew(argv, {}),
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
    const before = everyEntry(repo);
    const { code, out, err } = await run([
      'concepts',
      'context',
      'x',
      '--subjec',
      'y',
    ]);
    expect(out).toBe('');
    expect(code).toBe(1);
    expect(err).toBe(
      `cratylus ${refused('concepts', 'context', ['--subjec'], CONCEPTS.context)}\n`,
    );
    expect(everyEntry(repo)).toEqual(before);
  });

  it('`-h` that is a flag’s value is that value, not a request for help', async () => {
    const recorded = await run([
      'concepts',
      'context',
      'dash-h',
      '--subject',
      '-h',
    ]);
    expect(recorded.err).toBe('');
    expect(recorded.code).toBe(0);
    const shown = await run(['concepts', 'design', '--context', 'dash-h']);
    expect(shown.code).toBe(0);
    expect(JSON.parse(shown.out).contexts[0].subject).toBe('-h');
  });

  it('`--help` after a flag that takes a value but is missing it is still a request for help', async () => {
    const { code, out } = await run([
      'concepts',
      'define',
      '--wording',
      '--help',
    ]);
    expect(code).toBe(0);
    expect(out).toContain('Usage: cratylus concepts define');
  });
});

describe('the capability commands refuse a word the verb does not take', () => {
  const cases: [Capability, string, string[]][] = [
    ['concepts', 'history', ['c', 'extra']],
    ['ledger', 'state', ['extra']],
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
    const before = everyEntry(repo);
    const { code, out, err } = await run([
      'concepts',
      'context',
      'a',
      'b',
      '--subject',
      's',
    ]);
    expect(out).toBe('');
    expect(code).toBe(1);
    expect(err).toBe(
      `cratylus ${refused('concepts', 'context', [], CONCEPTS.context, ['b'])}\n`,
    );
    expect(everyEntry(repo)).toEqual(before);
  });

  it('an untaken flag and a surplus word are refused together in the one line', async () => {
    const { code, out, err } = await run([
      'concepts',
      'history',
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
      `cratylus ${refused('concepts', 'history', ['--bogus'], CONCEPTS.history, ['extra'])}\n`,
    );
  });
});
