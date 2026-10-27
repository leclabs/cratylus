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
import {
  VERBS as MODEL,
  dispatchModel,
} from '../src/capabilities/model/index.js';
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
import type { Verbs } from '../src/verb-flags.js';
import { repository } from './verb-surface.js';

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

const SURFACES: { readonly [C in Capability]: Verbs } = {
  model: MODEL,
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

  it('`-h` asks for the same help as `--help`', async () => {
    const asked = await run(['versionSkew', 'report', '--help']);
    expect(asked.out).toContain(VERSION_SKEW.report.purpose);
    expect((await run(['versionSkew', 'report', '-h'])).out).toBe(asked.out);
    expect((await run(['versionSkew', '-h'])).out).toBe(
      (await run(['versionSkew', '--help'])).out,
    );
  });
});

describe('the capability commands answer an undeclared verb with what to do', () => {
  it('names the declared verbs and help for an unknown verb', async () => {
    const { code, out, err } = await run(['versionSkew', 'frob']);
    expect(out).toBe('');
    expect(code).toBe(1);
    expect(err.trimEnd().split('\n')).toHaveLength(1);
    expect(err).toContain("'frob'");
    for (const verb of Object.keys(VERSION_SKEW)) expect(err).toContain(verb);
    expect(err).toContain('cratylus versionSkew --help');
  });

  const DISPATCHERS: {
    readonly [C in Capability]: (argv: string[]) => unknown;
  } = {
    model: (argv) => dispatchModel(argv),
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

describe('the capability commands refuse any token after the verb', () => {
  it.each([[['extra']], [['--bogus']], [['extra', '--bogus']]])(
    'versionSkew report %j exits 1 with one line naming each token and the verb’s --help',
    async (tokens) => {
      const { code, out, err } = await run([
        'versionSkew',
        'report',
        ...tokens,
      ]);
      expect(out).toBe('');
      expect(code).toBe(1);
      expect(err.trimEnd().split('\n')).toHaveLength(1);
      expect(err).toMatch(
        /^cratylus versionSkew report: it takes no arguments/,
      );
      for (const token of tokens) expect(err).toContain(`'${token}'`);
      expect(err.trimEnd()).toMatch(/cratylus versionSkew report --help$/);
    },
  );

  it('refuses in the very words its dispatcher throws when called as a library', async () => {
    expect(() => dispatchVersionSkew(['report', 'extra'], {})).toThrow(
      (await run(['versionSkew', 'report', 'extra'])).err
        .trimEnd()
        .replace(`${CLI_BIN} `, ''),
    );
  });

  it('reads `--help`, `-h` or `--explain` as any token after the verb', async () => {
    const help = (await run(['versionSkew', 'report', '--help'])).out;
    expect((await run(['versionSkew', 'report', 'extra', '-h'])).out).toBe(
      help,
    );
    const explained = await run([
      'versionSkew',
      'report',
      '--bogus',
      '--explain',
    ]);
    expect(explained.code).toBe(0);
    expect(JSON.parse(explained.out)).toMatchObject({ name: 'report' });
  });
});
