// `runCli` — each capability the runtime ships reaches its own verb surface, and a
// first word that is none of them is refused, naming them all.
//
// Driven the way the bin drives it: argv in, stdout, stderr and the exit code out,
// in a scratch repository as the working directory, under a host config carrying
// what each capability reads — the vocabulary and Claude's names for the event
// tap, the plan lifecycle for `plan`. The help each capability and each verb
// prints is read off the same declarations the verbs are read against.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { VERBS as DESIGN } from '../src/capabilities/design/dispatch.js';
import { VERBS as EVENT_TAP } from '../src/capabilities/event-tap/dispatch.js';
import { VERBS as NOTE } from '../src/capabilities/note/dispatch.js';
import { VERBS as PLAN } from '../src/capabilities/plan/dispatch.js';
import {
  CAPABILITIES,
  CAPABILITY_SUMMARIES,
  type Capability,
} from '../src/capability.js';
import { runCli } from '../src/main.js';
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
      harnesses: { claude: { native: { 'turn.end': 'Stop' } } },
      configuration: {
        plan: {
          plan: {
            states: ['p-draft', 'p-held', 'p-over'],
            exclusive: 'p-held',
            final: 'p-over',
          },
          unit: {
            states: ['u-new', 'u-mid', 'u-done', 'u-past'],
            satisfies: 'u-done',
          },
        },
      },
    }),
  );
  process.env[RUNTIME_CONFIG_ENV] = CONFIG;
});
afterAll(() => {
  if (prior === undefined) delete process.env[RUNTIME_CONFIG_ENV];
  else process.env[RUNTIME_CONFIG_ENV] = prior;
});

// This suite drives the CLAUDE tap. The event tap reads which harness invoked it
// from the environment, so a run launched from inside an omp session would be
// refused; the run states the harness it means instead of inheriting the runner's.
beforeAll(() => {
  vi.stubEnv('OMPCODE', '');
});
afterAll(() => {
  vi.unstubAllEnvs();
});

/** Run `runCli(argv)` in the scratch repository; what it printed and its code. */
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
    await runCli(argv);
    code = process.exitCode as number | undefined;
  } finally {
    process.chdir(cwd);
    process.exitCode = exitCode;
    stdout.mockRestore();
    stderr.mockRestore();
  }
  return { code, out: out.join(''), err: err.join('') };
}

/** One call per capability, and what only that capability's surface prints for it.
 *  Typed over `Capability`, so a capability without a leg here does not compile. */
const ROUTED: {
  readonly [C in Capability]: {
    readonly argv: string[];
    readonly says: RegExp;
  };
} = {
  eventTap: {
    argv: ['status', '--settings', join(repo, 'settings.json')],
    says: /^\{\n {2}"verb": "status",\n {2}"status": \{/,
  },
  design: { argv: ['show'], says: /^design at / },
  plan: { argv: ['show'], says: /^no plan at / },
  note: { argv: ['show'], says: /^notebook at / },
};

describe('runCli routes each capability to its own verb surface', () => {
  it.each(CAPABILITIES)('%s', async (capability) => {
    const { argv, says } = ROUTED[capability];
    const { code, out, err } = await run([capability, ...argv]);
    expect(err).toBe('');
    expect(code).toBe(0);
    expect(out).toMatch(says);
  });

  it("a capability's refusal exits 1 as `cratylus: <message>`", async () => {
    const { code, out, err } = await run(['eventTap', 'frobnicate']);
    expect(out).toBe('');
    expect(code).toBe(1);
    expect(err).toMatch(/^cratylus: eventTap: unknown verb 'frobnicate'/);
  });
});

describe('runCli refuses a first word that is no capability', () => {
  // The kebab register and the rejected abbreviation of `eventTap`, and a stranger.
  it.each(['event-tap', 'tap', 'frob'])('%s', async (word) => {
    const { code, out, err } = await run([word, 'status']);
    expect(out).toBe('');
    expect(code).toBe(1);
    expect(err).toMatch(new RegExp(`^cratylus: unknown capability '${word}'`));
    for (const capability of ['eventTap', 'design', 'plan', 'note'])
      expect(err).toContain(capability);
  });
});

const SURFACES: { readonly [C in Capability]: VerbFlags } = {
  eventTap: EVENT_TAP,
  design: DESIGN,
  plan: PLAN,
  note: NOTE,
};

describe('runCli prints a capability’s help from its declarations', () => {
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

  it('a capability’s help holds no blank spacer line', async () => {
    const { out } = await run(['plan', '--help']);
    expect(out.split('\n').slice(0, -1)).not.toContain('');
  });

  it.each([
    ['plan', 'add', '<unit>'],
    ['eventTap', 'install', null],
    ['note', 'capture', '<title>'],
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
    const asked = await run(['plan', 'add', '--help']);
    expect((await run(['plan', 'add', '-h'])).out).toBe(asked.out);
    expect((await run(['plan', '-h'])).out).toBe(
      (await run(['plan', '--help'])).out,
    );
  });
});

describe('runCli answers a missing or unknown verb with what to do', () => {
  it('no verb prints the capability’s help on stderr and exits 1', async () => {
    const { code, out, err } = await run(['plan']);
    expect(out).toBe('');
    expect(code).toBe(1);
    for (const { summary } of Object.values(PLAN))
      expect(err).toContain(summary);
  });

  it('an unknown verb is one line naming it, the verbs and the help to ask for', async () => {
    const { code, out, err } = await run(['plan', 'frob']);
    expect(out).toBe('');
    expect(code).toBe(1);
    expect(err.trimEnd().split('\n')).toHaveLength(1);
    expect(err).toContain("'frob'");
    for (const verb of Object.keys(PLAN)) expect(err).toContain(verb);
    expect(err).toContain('cratylus plan --help');
  });
});

describe('runCli leaves a verb’s flags to the verb’s own reader', () => {
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
      `cratylus: ${refused('design', 'define', ['--glos'], DESIGN.define)}\n`,
    );
    expect(everyRecord(repo)).toEqual(before);
  });

  it('`-h` that is a flag’s value is that value, not a request for help', async () => {
    const captured = await run([
      'note',
      'capture',
      'dash-h',
      '--kind',
      'idea',
      '--topic',
      'x',
      '--body',
      '-h',
      ...BY,
    ]);
    expect(captured.err).toBe('');
    expect(captured.code).toBe(0);
    const shown = await run(['note', 'show', 'dash-h']);
    expect(shown.code).toBe(0);
    expect(shown.out).toMatch(/^ *body: -h$/m);
  });

  it('`--help` after a flag that takes no value in its place is still a request for help', async () => {
    const { code, out } = await run(['note', 'capture', '--body', '--help']);
    expect(code).toBe(0);
    expect(out).toContain('Usage: cratylus note capture');
  });
});
