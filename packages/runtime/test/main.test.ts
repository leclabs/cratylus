// `runCli` — each capability the runtime ships reaches its own verb surface, and a
// first word that is none of them is refused, naming them all.
//
// Driven the way the bin drives it: argv in, stdout, stderr and the exit code out,
// in a scratch repository as the working directory, under a host config carrying
// what each capability reads — the vocabulary and Claude's names for the event
// tap, the plan lifecycle for `plan`.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { CAPABILITIES, type Capability } from '../src/capability.js';
import { runCli } from '../src/main.js';
import { RUNTIME_CONFIG_ENV } from '../src/runtime-config.js';
import { CONFIG, repository } from './verb-surface.js';

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
