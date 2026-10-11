// Contract-bound black-box fixtures: lifecycle is the harness channel, not an agent verb.
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import { repositoryRoot } from '../../concept-journal/fixture.js';
import {
  type ExecutionFixture,
  fixture,
  git,
  run,
  write,
} from '../../execution/fixture.js';
export { fixture, git, run, write, type ExecutionFixture };
export const cli = join(repositoryRoot, 'packages/cli/dist/cratylus.js');
export interface State {
  cut: string;
  branch: string;
  contexts: string[];
  architects: Record<string, string>;
  phase: 'open' | 'in flight' | 'complete';
  workPackages: { name: string; status: string; dependsOn: string[] }[];
  ready: string[];
  report: unknown;
}
export function ok(f: ExecutionFixture, ...args: string[]) {
  const result = run(f, ...args);
  expect(
    result.code,
    `Missing or failing capability ${args.join(' ')}\n${result.stderr}${result.stdout}`,
  ).toBe(0);
  return result.stdout;
}
export function wp<T = unknown>(
  f: ExecutionFixture,
  cut: string,
  verb: string,
  ...args: string[]
): T {
  return JSON.parse(ok(f, 'workPackage', verb, '--cut', cut, ...args)) as T;
}
export function examples(
  f: ExecutionFixture,
  cut = 'film',
  contexts = ['workflow'],
) {
  for (const context of contexts)
    write(
      f,
      `design/examples/${context}/${cut}.md`,
      '1. (shoot) **Given** a shoot, **when** it returns, **then** its takes exist.\n\n2. (edit) **Given** takes, **when** edited, **then** a film exists.\n',
    );
}
export function open(
  f: ExecutionFixture,
  cut = 'film',
  contexts = ['workflow'],
) {
  examples(f, cut, contexts);
  return wp(
    f,
    cut,
    'open',
    '--branch',
    'feature/film',
    ...contexts.flatMap((context) => ['--architect', `${context}=creative`]),
  );
}
export function pair(f: ExecutionFixture, cut = 'film') {
  open(f, cut);
  wp(
    f,
    cut,
    'submit',
    'shoot',
    '--output',
    `${cut}/shoot.txt`,
    '--concept',
    'shoot',
  );
  wp(
    f,
    cut,
    'submit',
    'edit',
    '--output',
    `${cut}/edit.txt`,
    '--concept',
    'edit',
    '--depends-on',
    'shoot',
  );
}
export function lifecycle(f: ExecutionFixture, event: Record<string, unknown>) {
  return ok(f, 'lifecycle', JSON.stringify(event));
}
export function builder(
  f: ExecutionFixture,
  workPackage: string,
  kind: 'dispatched' | 'returned',
  cut = 'film',
  runId = `${cut}-${workPackage}`,
) {
  lifecycle(f, {
    kind,
    transition: `${runId}-${kind}`,
    cut,
    workPackage,
    role: 'builder',
    run: runId,
  });
}
export function returnedPair(f: ExecutionFixture, cut = 'film') {
  pair(f, cut);
  for (const name of ['shoot', 'edit']) {
    builder(f, name, 'dispatched', cut);
    builder(f, name, 'returned', cut);
  }
}
export function verdict(
  f: ExecutionFixture,
  assayer: string,
  results: Record<string, boolean>,
  cut = 'film',
  runId = `${cut}-${assayer}`,
) {
  lifecycle(f, {
    kind: 'dispatched',
    transition: `${runId}-dispatched`,
    cut,
    role: 'assayer',
    run: runId,
  });
  lifecycle(f, {
    kind: 'returned',
    transition: `${runId}-returned`,
    cut,
    role: 'assayer',
    run: runId,
  });
  lifecycle(f, {
    kind: 'verdict',
    transition: `${runId}-verdict`,
    cut,
    assayer,
    run: runId,
    verdicts: Object.entries(results).map(([workPackage, passes]) => ({
      workPackage,
      concept: workPackage,
      passes,
      evidence: `${workPackage}'s example checked`,
      ...(passes ? {} : { finding: `${workPackage}'s example fails` }),
    })),
    hardeningNotes: [],
  });
}
export function state(f: ExecutionFixture, cut = 'film'): State {
  return wp<State>(f, cut, 'state');
}
export function statuses(answer: State) {
  return Object.fromEntries(answer.workPackages.map((p) => [p.name, p.status]));
}
export function ledger(f: ExecutionFixture): Record<string, string> {
  const directory = join(f.root, 'design/ledger');
  return existsSync(directory)
    ? Object.fromEntries(
        readdirSync(directory)
          .sort()
          .map((name) => [name, readFileSync(join(directory, name), 'utf8')]),
      )
    : {};
}
export function entries(f: ExecutionFixture): Record<string, unknown>[] {
  return Object.values(ledger(f)).map(
    (bytes) => JSON.parse(bytes) as Record<string, unknown>,
  );
}
export function completionHook(f: ExecutionFixture) {
  const path = '.git/hooks/post-commit';
  write(
    f,
    path,
    `#!/bin/sh\nexec '${process.execPath.replaceAll("'", "'\\''")}' '${cli.replaceAll("'", "'\\''")}' completion-check\n`,
  );
  chmodSync(join(f.root, path), 0o755);
  git(f.root, 'config', 'core.hooksPath', '.git/hooks');
}
export function commit(f: ExecutionFixture, message: string) {
  const result = spawnSync('git', ['commit', '--allow-empty', '-m', message], {
    cwd: f.root,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: f.home,
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: '/dev/null',
    },
  });
  if (result.error) throw result.error;
  expect(result.status, 'the commit is never refused').toBe(0);
  expect(
    git(f.root, 'log', '-1', '--format=%s').trim(),
    'a real commit is made',
  ).toBe(message);
  return result.stderr;
}
export function concurrentLifecycle(
  f: ExecutionFixture,
  event: Record<string, unknown>,
) {
  return new Promise<{ code: number | null; stderr: string }>(
    (resolve, reject) => {
      const child = spawn(
        process.execPath,
        [cli, 'lifecycle', JSON.stringify(event)],
        { cwd: f.root, env: { ...process.env, HOME: f.home } },
      );
      let stderr = '';
      child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
        stderr += chunk;
      });
      child.stdout.resume();
      child.on('error', reject);
      child.on('close', (code) => resolve({ code, stderr }));
    },
  );
}
