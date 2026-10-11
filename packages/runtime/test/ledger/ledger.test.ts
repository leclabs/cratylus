// The ledger over scratch git repositories: one exclusively created file per
// entry in ULID order, a repeated transition refused even when delivered at
// once by two processes, the lifecycle shape, the cut's record, and the
// completion check.

import { execFileSync, spawn } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { dispatchWorkPackage } from '../../src/capabilities/work-package/index.js';
import { LEDGER_DIR } from '../../src/capabilities/work-package/ledger.js';
import { completionCheck } from '../../src/completion-check/index.js';
import { appendLifecycle } from '../../src/lifecycle/index.js';

const scratch: string[] = [];
afterAll(() => {
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
});
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();

/** A repository whose cut `film` has the examples `text` in each of
 *  `contexts`. */
function repository(
  contexts: string[] = ['workflow'],
  text = '1. (shoot) **Given** a shoot.\n\n2. (edit) **Given** takes.\n',
): string {
  const repo = mkdtempSync(join(tmpdir(), 'ledger-'));
  scratch.push(repo);
  git(repo, 'init', '-q', '-b', 'main');
  git(repo, 'config', 'user.name', 'test');
  git(repo, 'config', 'user.email', 'test@example.com');
  git(repo, 'config', 'commit.gpgsign', 'false');
  git(repo, 'config', 'core.hooksPath', '/dev/null');
  for (const context of contexts) {
    mkdirSync(join(repo, 'design/examples', context), { recursive: true });
    writeFileSync(join(repo, `design/examples/${context}/film.md`), text);
  }
  return repo;
}
const wp = (repo: string, verb: string, ...args: string[]) =>
  dispatchWorkPackage([verb, '--cut', 'film', ...args], { from: repo });
const refusal = (act: () => unknown): string => {
  try {
    act();
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error('not refused');
};
const files = (repo: string) => {
  try {
    return readdirSync(join(repo, LEDGER_DIR)).sort();
  } catch {
    return [];
  }
};
const event = (transition: string) => ({
  kind: 'dispatched',
  transition,
  cut: 'film',
  role: 'lead',
  run: transition,
});

describe('the ledger store', () => {
  it('writes one file per entry, named by its ULID, in append order', () => {
    const repo = repository();
    for (const t of ['a', 'b', 'c']) appendLifecycle(repo, event(t));
    const names = files(repo);
    expect(names).toHaveLength(3);
    expect(names.every((n) => /^[0-9A-HJKMNP-TV-Z]{26}\.json$/.test(n))).toBe(
      true,
    );
    expect(
      names.map(
        (n) =>
          JSON.parse(readFileSync(join(repo, LEDGER_DIR, n), 'utf8'))
            .transition,
      ),
    ).toEqual(['a', 'b', 'c']);
  });

  it('REFUSES a repeated transition, naming it, writing nothing', () => {
    const repo = repository();
    appendLifecycle(repo, event('once'));
    const before = files(repo);
    expect(refusal(() => appendLifecycle(repo, event('once')))).toContain(
      "'once'",
    );
    expect(files(repo)).toEqual(before);
  });

  it('records the same transition once when two processes deliver it at once', async () => {
    const repo = repository();
    const module = fileURLToPath(
      new URL('../../src/lifecycle/index.ts', import.meta.url),
    );
    const script = `import { appendLifecycle } from ${JSON.stringify(module)};
try { appendLifecycle(process.cwd(), ${JSON.stringify(event('raced'))}); process.exit(0); }
catch { process.exit(1); }`;
    const codes = await Promise.all(
      [1, 2, 3, 4].map(
        () =>
          new Promise<number | null>((resolve, reject) => {
            const child = spawn(
              process.execPath,
              [
                '--import',
                pathToFileURL(createRequire(import.meta.url).resolve('tsx/esm'))
                  .href,
                '--input-type=module',
                '-e',
                script,
              ],
              { cwd: repo, stdio: 'ignore' },
            );
            child.on('error', reject);
            child.on('close', resolve);
          }),
      ),
    );
    expect(codes.filter((c) => c === 0)).toHaveLength(1);
    expect(files(repo)).toHaveLength(1);
  }, 30_000);
});

describe('the lifecycle command’s event', () => {
  it('REFUSES another kind and names each missing or ill-typed field', () => {
    const repo = repository();
    expect(
      refusal(() => appendLifecycle(repo, { ...event('k'), kind: 'finish' })),
    ).toContain('dispatched, returned, verdict, reported');
    const message = refusal(() =>
      appendLifecycle(repo, {
        kind: 'returned',
        transition: 'r',
        cut: 'film',
        tokens: -1,
      }),
    );
    for (const field of ['run', 'role', 'tokens'])
      expect(message).toContain(field);
    expect(
      refusal(() =>
        appendLifecycle(repo, {
          kind: 'verdict',
          transition: 'v',
          cut: 'film',
          assayer: 'a',
          run: 'a',
          verdicts: [{ workPackage: 'shoot' }],
        }),
      ),
    ).toMatch(/verdicts, hardeningNotes/);
    expect(files(repo)).toEqual([]);
  });
});

describe('the cut', () => {
  it('is named alone; a concept its contexts share is given as <context>/<name>', () => {
    const repo = repository(['workflow', 'agents']);
    expect(wp(repo, 'state')).toMatchObject({
      cut: 'film',
      contexts: ['agents', 'workflow'],
    });
    expect(
      refusal(() =>
        dispatchWorkPackage(['state', '--cut', 'workflow/film'], {
          from: repo,
        }),
      ),
    ).toContain('is not a cut name');
    expect(
      refusal(() =>
        wp(repo, 'submit', 'shoot', '--output', 's/', '--concept', 'shoot'),
      ),
    ).toContain('give it as <context>/shoot');
    wp(repo, 'submit', 'shoot', '--output', 's/', '--concept', 'agents/shoot');
    expect(wp(repo, 'inventory')).toMatchObject({
      unserved: ['agents/edit', 'workflow/shoot', 'workflow/edit'],
      unowned: ['agents/2', 'workflow/1', 'workflow/2'],
    });
  });

  it('opens once, with every context’s one shared architect', () => {
    const repo = repository(['workflow', 'agents']);
    const architects = ['--architect', 'workflow=lex'];
    expect(
      refusal(() =>
        wp(repo, 'open', '--branch', 'feature/film', ...architects),
      ),
    ).toContain("'agents'");
    wp(
      repo,
      'open',
      '--branch',
      'feature/film',
      ...architects,
      '--architect',
      'agents=lex',
    );
    expect(wp(repo, 'state')).toMatchObject({
      branch: 'feature/film',
      contexts: ['agents', 'workflow'],
      architects: { workflow: 'lex', agents: 'lex' },
      phase: 'open',
    });
    expect(
      refusal(() =>
        wp(
          repo,
          'open',
          '--branch',
          'x',
          ...architects,
          '--architect',
          'agents=lex',
        ),
      ),
    ).toContain('already recorded');
  });
});

describe('the completion check', () => {
  const commit = (repo: string, message: string) =>
    git(repo, 'commit', '-q', '--allow-empty', '-m', message);

  it('is silent outside feat(cut:<id>): and for a complete cut', () => {
    const repo = repository();
    for (const message of ['fix: finish the cut', 'feat(film): done']) {
      commit(repo, message);
      expect(completionCheck(repo)).toBeUndefined();
    }
  });

  it('warns of an incomplete cut, naming its phase and only its unapproved packages, writing nothing', () => {
    const repo = repository();
    wp(repo, 'submit', 'shoot', '--output', 's/', '--concept', 'shoot');
    commit(repo, 'feat(cut:film): deliver the film');
    const before = files(repo);
    const warning = completionCheck(repo) as string;
    expect(warning).toContain("'film'");
    expect(warning).toContain('open');
    expect(warning).toContain('shoot (submitted)');
    expect(warning).toMatch(/report[\s\S]*defect[\s\S]*harness/i);
    expect(files(repo)).toEqual(before);
  });

  it('warns, never throws, for a cut with no examples', () => {
    const repo = repository();
    commit(repo, 'feat(cut:ghost): deliver');
    expect(completionCheck(repo)).toContain("'ghost'");
  });
});
