// Black-box fixtures for the concept-journal examples. No runtime implementation is imported.
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';

export const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../..',
);
export const pinnedDesign = '24543f22';
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

interface SourceConcept {
  name: string;
  wording: string;
  builtFrom: string[];
  decisionId: string;
  context: string;
}
export interface SeedSource {
  directory: string;
  contexts: { name: string; subject: string; relation: string }[];
  concepts: SourceConcept[];
  decisions: Decision[];
  deliveryContracts: string[];
}
function section(text: string, heading: string): string {
  const found = new RegExp(
    `^## ${heading}\\r?\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`,
    'm',
  ).exec(text);
  if (!found) throw new Error(`Pinned source lacks section ${heading}`);
  return found[1]!.trim();
}
// Read the immutable source from git, not the files the one-time cutover removes.
export function extractSeedSource(sandbox: string): SeedSource {
  const directory = join(sandbox, 'pinned-design');
  const names = git(
    repositoryRoot,
    'ls-tree',
    '-r',
    '--name-only',
    pinnedDesign,
    '--',
    'design',
  )
    .trim()
    .split('\n')
    .filter((name) =>
      /^design\/(workflow\.md|delivery\.md|decisions\/\d{4}-[^/]+\.md)$/.test(
        name,
      ),
    );
  const texts = new Map<string, string>();
  for (const name of names) {
    const text = git(repositoryRoot, 'show', `${pinnedDesign}:${name}`);
    texts.set(name, text);
    const path = join(directory, name.slice('design/'.length));
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
  const workflow = texts.get('design/workflow.md');
  if (!workflow) throw new Error('Pinned workflow source missing');
  const contexts = [
    ...section(workflow, 'Context map').matchAll(
      /^\|\s*\*\*(.+?)\*\*\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/gm,
    ),
  ].map(([, name, subject, relation]) => ({
    name: name!,
    subject: subject!,
    relation: relation!,
  }));
  const delivery = texts.get('design/delivery.md');
  if (!delivery) throw new Error('Pinned delivery source missing');
  const deliveryContracts = section(delivery, 'Contracts with other contexts')
    .split(/(?=^- )/m)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) =>
      block
        .replace(/^- /, '')
        .replace(/\*\*/g, '')
        .replace(/\s*\n\s*/g, ' '),
    );
  const concepts: SourceConcept[] = [];
  for (const boundedContext of ['workflow', 'delivery']) {
    const text = texts.get(`design/${boundedContext}.md`);
    if (!text) throw new Error(`Pinned ${boundedContext} source missing`);
    const blocks = section(text, 'Concepts')
      .split(/(?=^- \*\*)/m)
      .map((block) => block.trim())
      .filter(Boolean);
    for (const block of blocks) {
      const unfolded = block.replace(/\s*\n\s*/g, ' ');
      const match =
        /^- \*\*(.+?)\*\* · (.+?) · (_primitive_|_built from:_ (.+?)) · _decided in:_ (\d{4})$/.exec(
          unfolded,
        );
      if (!match) throw new Error(`Cannot parse pinned concept: ${unfolded}`);
      concepts.push({
        name: match[1]!,
        wording: match[2]!,
        builtFrom: match[4]?.split(',').map((part) => part.trim()) ?? [],
        decisionId: match[5]!,
        context: boundedContext,
      });
    }
  }
  const decisions = [...texts.entries()]
    .filter(([name]) => name.startsWith('design/decisions/'))
    .map(([, text]): Decision => {
      const heading = /^# (\d{4}) · (.+)$/m.exec(text);
      if (!heading) throw new Error('Pinned decision has no heading');
      const owners = [
        ...new Set(
          concepts
            .filter((c) => c.decisionId === heading[1])
            .map((c) => c.context),
        ),
      ];
      if (owners.length > 1)
        throw new Error(`Ambiguous pinned decision context: ${heading[1]}`);
      return {
        id: heading[1]!,
        context: owners[0] ?? 'workflow',
        title: heading[2]!,
        situation: section(text, 'Context'),
        decision: section(text, 'Decision'),
        consequences: section(text, 'Consequences'),
        status: 'accepted',
        supersedes: null,
        supersededBy: [],
      };
    });
  expect(contexts.length).toBeGreaterThan(0);
  expect(concepts.length).toBeGreaterThan(0);
  expect(decisions.length).toBeGreaterThan(0);
  return { directory, contexts, concepts, decisions, deliveryContracts };
}
export function seed(cwd: string, source: SeedSource): CommandResult {
  return processResult(
    process.execPath,
    [
      join(repositoryRoot, 'scripts/seed-concept-journal.mjs'),
      '--from',
      source.directory,
    ],
    cwd,
  );
}
export function assertSeeded(cwd: string, source: SeedSource): void {
  const design = query(cwd, 'design');
  expect(design.contexts.map((c) => c.name).sort()).toEqual(
    source.contexts.map((c) => c.name).sort(),
  );
  for (const expected of source.contexts) {
    const actual = design.contexts.find((c) => c.name === expected.name)!;
    expect(actual).toMatchObject({
      name: expected.name,
      subject: expected.subject,
      competing: [],
      retired: [],
    });
    if (expected.relation !== 'this file')
      expect(actual.relation).toContain(expected.relation);
    if (expected.name === 'delivery') {
      for (const contract of source.deliveryContracts)
        expect(actual.relation.replace(/\*\*/g, '')).toContain(contract);
    }
    const concepts = source.concepts.filter((c) => c.context === expected.name);
    expect(actual.concepts.map((c) => c.name).sort()).toEqual(
      concepts.map((c) => c.name).sort(),
    );
    for (const concept of concepts) {
      const current = actual.concepts.find((c) => c.name === concept.name)!;
      expect(current).toMatchObject({
        name: concept.name,
        wording: concept.wording,
        builtFrom: concept.builtFrom,
      });
      expect(current.reason).toMatch(new RegExp(`\\b${concept.decisionId}\\b`));
      const past = query<History>(
        cwd,
        'history',
        concept.name,
        '--context',
        concept.context,
      );
      expect(past).toMatchObject({
        context: concept.context,
        name: concept.name,
      });
      expect(past.versions).toHaveLength(1);
      expect(past.versions[0]).toMatchObject({
        kind: 'define',
        wording: concept.wording,
        builtFrom: concept.builtFrom,
        reason: current.reason,
        supersedes: [],
      });
    }
  }
  const decisions = query<{ decisions: Decision[] }>(
    cwd,
    'decisions',
  ).decisions;
  expect(decisions.map((d) => d.id).sort()).toEqual(
    source.decisions.map((d) => d.id).sort(),
  );
  for (const expected of source.decisions)
    expect(decisions.find((d) => d.id === expected.id)).toMatchObject(expected);
  expect(
    query<{ decisions: Decision[] }>(cwd, 'decisions', '--open').decisions,
  ).toEqual([]);
  expect(Object.keys(snapshot(cwd))).toHaveLength(
    source.contexts.length + source.concepts.length + source.decisions.length,
  );
}
