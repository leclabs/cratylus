// What the `design`, `plan` and `note` verb-surface tests share: temporary git
// repositories with real branch merges, a plan lifecycle in states invented
// here, and the contracts every refusal and every view keeps — domain words
// only, an identity only in its printed form beside a shared name, and no path
// to where the domains are kept.

import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, expect } from 'vitest';
import { RUNTIME_CONFIG_ENV } from '../src/runtime-config.js';

export const BY = [
  '--author',
  'test',
  '--reason',
  'a fixture',
  '--cause',
  'verb-surface',
];

/** A ULID, the form an identity takes. */
export const IDENTITY = /[0-9A-HJKMNP-TV-Z]{26}/g;

/** The words of the substrate beneath the domains, which no agent reads. */
const SUBSTRATE =
  /\b(heads?|records?|envelopes?|files?|entity|entities|ULID)\b/i;

const configDir = mkdtempSync(join(tmpdir(), 'verb-surface-config-'));
/** The host runtime config every test runs under, its states invented. */
export const CONFIG = join(configDir, 'runtime.json');

/** Point `$AGENT_RUNTIME_CONFIG` at a plan lifecycle of invented states for
 *  the calling test file, and restore it after. */
export function configured(): void {
  let prior: string | undefined;
  beforeAll(() => {
    prior = process.env[RUNTIME_CONFIG_ENV];
    writeFileSync(
      CONFIG,
      JSON.stringify({
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
}

/** Run `act` with `$AGENT_RUNTIME_CONFIG` at a config holding `config`, or at
 *  none when it is `undefined`. */
export function under<T>(config: unknown, act: () => T): T {
  const path = join(configDir, `${Math.random()}.json`);
  if (config !== undefined) writeFileSync(path, JSON.stringify(config));
  process.env[RUNTIME_CONFIG_ENV] = path;
  try {
    return act();
  } finally {
    process.env[RUNTIME_CONFIG_ENV] = CONFIG;
    rmSync(path, { force: true });
  }
}

export function git(cwd: string, ...args: string[]): string {
  return execFileSync(
    'git',
    [
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

/** A fresh repository with one commit. */
export function repository(): string {
  const dir = mkdtempSync(join(tmpdir(), 'verb-surface-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'root');
  return dir;
}

/** Commit what the working tree holds. */
export function commit(repo: string, message = 'commit'): void {
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '--allow-empty', '-m', message);
}

/** The files of `domain`'s directory under the records root. */
export function records(repo: string, domain: string): string[] {
  try {
    return readdirSync(join(repo, 'records', domain)).sort();
  } catch {
    return [];
  }
}

/** Every file under the records root, across domains. */
export function everyRecord(repo: string): string[] {
  return ['design', 'plan', 'unit', 'notebook'].flatMap((d) =>
    records(repo, d),
  );
}

/** One stored file of `domain`, parsed. */
export function stored(
  repo: string,
  domain: string,
  file: string,
): {
  envelope: { entity: string; operation: string };
  payload: Record<string, unknown> & { spec?: { name: string } };
} {
  return JSON.parse(readFileSync(join(repo, 'records', domain, file), 'utf8'));
}

/** The entities of `domain` whose first version `name` picks out as `value`,
 *  in the order they were written. */
export function entitiesNamed(
  repo: string,
  domain: string,
  name: (payload: ReturnType<typeof stored>['payload']) => unknown,
  value: string,
): string[] {
  return records(repo, domain)
    .map((f) => stored(repo, domain, f))
    .filter(
      (r) => r.envelope.operation === 'create' && name(r.payload) === value,
    )
    .map((r) => r.envelope.entity);
}

/** Commit what `main` holds, run `left` and `right` each on its own branch
 *  forked from it, merge both into `main`, and return the payloads each branch
 *  newly wrote into `domain`, as written. */
export function merge(
  repo: string,
  domain: string,
  left: () => void,
  right: () => void,
): { left: string[]; right: string[] } {
  commit(repo, 'base');
  const on = (name: string, write: () => void): string[] => {
    git(repo, 'checkout', '-q', '-b', name, 'main');
    const before = new Set(records(repo, domain));
    write();
    commit(repo, name);
    return records(repo, domain)
      .filter((f) => !before.has(f))
      .map((f) =>
        JSON.stringify(
          JSON.parse(readFileSync(join(repo, 'records', domain, f), 'utf8'))
            .payload,
        ),
      );
  };
  const written = { left: on('left', left), right: on('right', right) };
  git(repo, 'checkout', '-q', 'left');
  git(repo, 'merge', '-q', '--no-edit', 'right');
  git(repo, 'checkout', '-q', 'main');
  git(repo, 'merge', '-q', '--ff-only', 'left');
  git(repo, 'branch', '-q', '-D', 'left', 'right');
  return written;
}

/** Hold `text`, a view or a refusal, to what a reader may be shown: the
 *  domain's words, no path to the records, and an identity only in its printed
 *  form beside one of `shared`, the names held by more than one. */
export function spoken(
  repo: string,
  text: string,
  shared: readonly string[] = [],
): string {
  expect(text, `a substrate word reached the reader:\n${text}`).not.toMatch(
    SUBSTRATE,
  );
  expect(text).not.toContain(join(repo, 'records'));
  for (const match of text.matchAll(IDENTITY)) {
    const before = text.slice(0, match.index);
    expect(
      shared.some((n) => before.endsWith(`${n} (identity `)),
      `identity ${match[0]} printed beside no shared name:\n${text}`,
    ).toBe(true);
  }
  return text;
}

/** Run `verb` and return its refusal, held to `spoken`; fails when it does
 *  not refuse, and when a refused write wrote anything. */
export function refusal(
  repo: string,
  verb: () => unknown,
  shared: readonly string[] = [],
): string {
  const before = everyRecord(repo);
  try {
    verb();
  } catch (error) {
    expect(everyRecord(repo), 'a refused write wrote').toEqual(before);
    return spoken(repo, (error as Error).message, shared);
  }
  throw new Error('the verb did not refuse');
}
