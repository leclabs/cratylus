// Black-box fixtures for the concept-journal tests. No runtime implementation is imported.
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';

export const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../..',
);
export interface CommandResult {
  code: number | null;
  stdout: string;
  stderr: string;
  json: unknown;
}
export interface TemporaryRepository {
  root: string;
  sandbox: string;
  dispose(): void;
}
export interface Concept {
  name: string;
  wording: string;
  builtFrom: string[];
  reason: string;
}
export interface Decision {
  id: string;
  context: string;
  title: string;
  situation: string;
  decision: string;
  consequences: string;
  status: 'open' | 'accepted' | 'superseded';
  supersedes: string | null;
  supersededBy: string[];
}
export interface Context {
  name: string;
  subject: string;
  relation: string;
  concepts: Concept[];
  competing: { name: string; versions: Omit<Concept, 'name'>[] }[];
  retired: { name: string; reason: string }[];
  decisions?: { accepted: Decision[]; open: Decision[] };
}
export interface Design {
  contexts: Context[];
}
export interface History {
  context: string;
  name: string;
  versions: {
    id: string;
    at: string;
    kind: 'define' | 'supersede' | 'retire';
    wording?: string;
    builtFrom?: string[];
    reason: string;
    supersedes: string[];
  }[];
}
export type Snapshot = Record<string, string>;

function processResult(
  executable: string,
  args: string[],
  cwd: string,
): CommandResult {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 16 * 1024 * 1024,
    env: {
      ...process.env,
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_TERMINAL_PROMPT: '0',
    },
  });
  if (result.error) throw result.error;
  let json: unknown;
  try {
    json = JSON.parse(result.stdout);
  } catch {
    /* Refusals and git need not emit JSON. */
  }
  return {
    code: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    json,
  };
}
export function successful(result: CommandResult, operation: string): void {
  expect(
    result.code,
    `${operation}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
  ).toBe(0);
}
export function git(cwd: string, ...args: string[]): string {
  const result = processResult('git', args, cwd);
  successful(result, `git ${args.join(' ')}`);
  return result.stdout;
}
export function runConcepts(cwd: string, ...args: string[]): CommandResult {
  return processResult(
    process.execPath,
    [
      join(repositoryRoot, 'packages/cli/dist/cratylus.js'),
      'concepts',
      ...args,
    ],
    cwd,
  );
}
export function snapshot(cwd: string): Snapshot {
  const root = join(cwd, 'design/journal');
  const files: Snapshot = {};
  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else files[relative(root, path)] = readFileSync(path).toString('base64');
    }
  }
  if (existsSync(root)) visit(root);
  return files;
}
export function unchangedFiles(before: Snapshot, after: Snapshot): void {
  for (const [path, bytes] of Object.entries(before))
    expect(after[path], path).toBe(bytes);
}
export function append(cwd: string, ...args: string[]): unknown {
  const before = snapshot(cwd);
  const result = runConcepts(cwd, ...args);
  successful(result, `concepts ${args.join(' ')}`);
  expect(result.json).toBeDefined();
  for (const flag of ['--wording', '--reason']) {
    const at = args.indexOf(flag);
    if (at !== -1)
      expect(JSON.stringify(result.json)).toContain(
        JSON.stringify(args[at + 1]),
      );
  }
  const after = snapshot(cwd);
  unchangedFiles(before, after);
  const added = Object.keys(after).filter((path) => !(path in before));
  expect(added).toHaveLength(1);
  expect(added[0]).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}(?:\.[^/]+)?$/);
  return result.json;
}
export function query<T = Design>(cwd: string, ...args: string[]): T {
  const before = snapshot(cwd);
  const result = runConcepts(cwd, ...args);
  successful(result, `concepts ${args.join(' ')}`);
  expect(result.json).toBeDefined();
  expect(snapshot(cwd)).toEqual(before);
  return result.json as T;
}
export function refuse(cwd: string, ...args: string[]): void {
  const before = snapshot(cwd);
  const result = runConcepts(cwd, ...args);
  expect(result.code, `concepts ${args.join(' ')}`).toBe(1);
  expect(snapshot(cwd)).toEqual(before);
}
export function temporaryRepository(): TemporaryRepository {
  const sandbox = mkdtempSync(join(tmpdir(), 'cratylus-concept-journal-'));
  const root = join(sandbox, 'project');
  mkdirSync(root);
  git(root, 'init', '--initial-branch=journal');
  git(root, 'config', 'user.name', 'Concept journal check');
  git(root, 'config', 'user.email', 'concept-journal@example.test');
  git(root, 'config', 'commit.gpgsign', 'false');
  git(root, 'config', 'core.hooksPath', '/dev/null');
  return {
    root,
    sandbox,
    dispose: () => rmSync(sandbox, { recursive: true, force: true }),
  };
}
export function context(cwd: string, name = 'workflow'): void {
  append(cwd, 'context', name, '--subject', `The ${name} subject.`);
}
export function define(
  cwd: string,
  name = 'reservation',
  wording = 'A reservation expires after ten minutes.',
  reason = 'Allow time to finish.',
): void {
  append(
    cwd,
    'define',
    name,
    '--context',
    'workflow',
    '--wording',
    wording,
    '--reason',
    reason,
  );
}
export function decisionArgs(
  id: string,
  status = 'open',
  supersedes?: string,
): string[] {
  return [
    'decide',
    id,
    '--context',
    'workflow',
    '--title',
    `Choice ${id}`,
    '--situation',
    `Situation ${id}.`,
    '--decision',
    `Decision ${id}.`,
    '--consequences',
    `Consequences ${id}.`,
    '--status',
    status,
    ...(supersedes ? ['--supersedes', supersedes] : []),
  ];
}
export function expectedDecision(
  id: string,
  status: Decision['status'] = 'open',
  supersedes: string | null = null,
  supersededBy: string[] = [],
): Decision {
  return {
    id,
    context: 'workflow',
    title: `Choice ${id}`,
    situation: `Situation ${id}.`,
    decision: `Decision ${id}.`,
    consequences: `Consequences ${id}.`,
    status,
    supersedes,
    supersededBy,
  };
}
export function history(cwd: string, name = 'reservation'): History {
  const result = query<History>(cwd, 'history', name, '--context', 'workflow');
  expect(result).toMatchObject({ context: 'workflow', name });
  for (const version of result.versions) {
    expect(version.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(typeof version.at).toBe('string');
    expect(Number.isNaN(Date.parse(version.at))).toBe(false);
  }
  expect(result.versions.map((v) => v.id)).toEqual(
    result.versions.map((v) => v.id).sort(),
  );
  return result;
}
