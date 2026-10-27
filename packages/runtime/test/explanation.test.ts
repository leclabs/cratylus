// A capability explains itself: `<capability> --explain` gives the whole
// capability and `<capability> <verb> --explain` one verb, as JSON, read out of the
// same declarations its help prints and its calls are read against. These hold
// the explanation's shape and that the help says what it says.

import { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';
import { CLI_BIN } from '../src/bin-name.js';
import { VERSION_SKEW } from '../src/capabilities/version-skew/index.js';
import { CAPABILITY_SUMMARIES } from '../src/capability.js';
import {
  type Explanation,
  type VerbExplanation,
  explain,
} from '../src/explanation.js';
import { capabilityCommands } from '../src/main.js';

/** Run `argv` through the capability commands as the bin's program holds them. */
async function run(
  argv: readonly string[],
): Promise<{ code: number | undefined; out: string; err: string }> {
  const out: string[] = [];
  const err: string[] = [];
  const capture = (into: string[]) => (s: string | Uint8Array) => {
    into.push(String(s));
    return true;
  };
  vi.spyOn(process.stdout, 'write').mockImplementation(capture(out));
  vi.spyOn(process.stderr, 'write').mockImplementation(capture(err));
  const exitCode = process.exitCode;
  let code: number | undefined;
  try {
    const host = new Command(CLI_BIN).enablePositionalOptions();
    for (const command of capabilityCommands()) host.addCommand(command);
    await host.parseAsync(argv, { from: 'user' });
    code = process.exitCode as number | undefined;
  } finally {
    process.exitCode = exitCode;
    vi.restoreAllMocks();
  }
  return { code, out: out.join(''), err: err.join('') };
}

describe('versionSkew --explain', () => {
  it('prints the whole capability as one JSON object, its verbs in order', async () => {
    const { code, out, err } = await run(['versionSkew', '--explain']);
    expect(err).toBe('');
    expect(code).toBe(0);
    const explanation = JSON.parse(out) as Explanation;
    expect(explanation).toEqual(explain(VERSION_SKEW));
    expect(Object.keys(explanation)).toEqual([
      'name',
      'purpose',
      'when',
      'verbs',
    ]);
    expect(explanation.name).toBe('version skew');
    expect(explanation.purpose).toBe(CAPABILITY_SUMMARIES.versionSkew);
    expect(explanation.when.trim()).not.toBe('');
    expect(explanation.verbs.map((v) => v.name)).toEqual(['report']);
  });

  it('versionSkew report --explain prints that verb as the whole explanation holds it', async () => {
    const { code, out, err } = await run([
      'versionSkew',
      'report',
      '--explain',
    ]);
    expect(err).toBe('');
    expect(code).toBe(0);
    const explained = JSON.parse(out) as VerbExplanation;
    expect(explained).toEqual(explain(VERSION_SKEW).verbs[0]);
    expect(Object.keys(explained)).toEqual([
      'name',
      'concept',
      'purpose',
      'when',
      'effect',
      'parameters',
    ]);
    expect(explained.effect).toBe('reads');
    expect(explained.parameters).toEqual([]);
  });

  it('refuses a verb the capability does not declare, as without --explain', async () => {
    const { code, out, err } = await run(['versionSkew', 'frob', '--explain']);
    expect(code).toBe(1);
    expect(out).toBe('');
    expect(err.trimEnd().split('\n')).toEqual([
      `${CLI_BIN} versionSkew: unknown verb 'frob'; the verbs are report; run ${CLI_BIN} versionSkew --help`,
    ]);
  });
});

describe('the help says what the explanation says', () => {
  it('versionSkew --help holds the capability’s purpose and when, and every verb’s purpose', async () => {
    const explanation = explain(VERSION_SKEW);
    const { out } = await run(['versionSkew', '--help']);
    for (const text of [
      explanation.purpose,
      explanation.when,
      ...explanation.verbs.map((v) => v.purpose),
    ])
      expect(out).toContain(text);
  });

  it('versionSkew report --help holds its purpose, when, concept and effect', async () => {
    const explained = explain(VERSION_SKEW).verbs[0] as VerbExplanation;
    const { code, out } = await run(['versionSkew', 'report', '--help']);
    expect(code).toBe(0);
    for (const text of [
      explained.purpose,
      explained.when,
      explained.concept,
      explained.effect,
    ])
      expect(out).toContain(text);
  });
});
