import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';
import canon from '@cratylus/canon';
import { afterEach, expect, it } from 'vitest';
import {
  type CommandResult,
  type Host,
  host,
  run,
} from '../capability-port/fixture.js';
import { parseYaml } from '../yaml.js';

const INDUSTRY_ROLES = [
  'business-analyst',
  'code-reviewer',
  'kino',
  'mav',
  'nico',
  'software-engineer',
  'tech-lead',
  'test-engineer',
];

let h: Host | undefined;
afterEach(() => {
  h?.dispose();
  h = undefined;
});

// A packed cratylus on PATH and a HOME of its own, with nothing installed yet.
function emptyHome(): Host {
  const fresh = host();
  rmSync(fresh.home, { recursive: true, force: true });
  mkdirSync(fresh.home);
  return fresh;
}

const entries = (dir: string) =>
  existsSync(dir) ? readdirSync(dir).sort() : [];

// The extension packages omp loads for the user: each one its user plugin
// manifest links under `~/.omp/plugins/node_modules`, followed to where it lives.
function pluginPackages(home: string): string[] {
  const modules = join(home, '.omp/plugins/node_modules');
  return entries(modules).map((name) => realpathSync(join(modules, name)));
}

function frontMatterName(file: string): unknown {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(readFileSync(file, 'utf8'));
  expect(match, `${file} opens with front-matter`).not.toBeNull();
  const front = parseYaml(match![1]!);
  return front !== null && typeof front === 'object' && 'name' in front
    ? front.name
    : undefined;
}

// The agents omp offers the user: the definitions in its user agent dir and in the
// `agents/` of every extension package, each by the name its front-matter declares.
function offeredAgents(home: string): string[] {
  const dirs = [
    join(home, '.omp/agent/agents'),
    ...pluginPackages(home).map((p) => join(p, 'agents')),
  ];
  return dirs
    .flatMap((dir) =>
      entries(dir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => {
          const name = frontMatterName(join(dir, f));
          expect(name, `${dir}/${f} is named for its file`).toBe(
            f.slice(0, -'.md'.length),
          );
          return String(name);
        }),
    )
    .sort();
}

// The skills omp offers the user: each `skills/<name>/SKILL.md` of an extension package.
function offeredSkills(home: string): string[] {
  return pluginPackages(home)
    .flatMap((p) =>
      entries(join(p, 'skills')).filter((s) =>
        existsSync(join(p, 'skills', s, 'SKILL.md')),
      ),
    )
    .sort();
}

// Every skill the canon ships: one directory per skill under its skill dir.
function canonSkills(): string[] {
  const dir = canon.skills;
  expect(dir, 'the canon declares a skill dir').toBeTypeOf('string');
  return entries(dir!)
    .filter((s) => statSync(join(dir!, s)).isDirectory())
    .sort();
}

const said = (r: CommandResult) => `${r.stdout}\n${r.stderr}`;

it('delivery/install: installs the industry roles', () => {
  h = emptyHome();
  // On a terminal, deciding nothing: whatever install may ask, `--yes` takes its
  // default, so the agents offered are the ones every user installation places.
  // (The run without a terminal is bound by the next example.)
  const r = run(
    'script',
    [
      '--quiet',
      '--return',
      '--command',
      'cratylus install --harness omp --scope user --yes',
      '/dev/null',
    ],
    h.cwd,
    h.env,
  );
  expect(r.code, said(r)).toBe(0);
  expect(offeredAgents(h.home)).toEqual(INDUSTRY_ROLES);
});

it('delivery/install: asks nothing about practices', () => {
  h = emptyHome();
  // No terminal: `run` hands the command an empty stdin pipe and pipes its output.
  const r = h.command(['install', '--harness', 'omp']);
  expect(r.code, said(r)).toBe(0);
  expect(said(r), 'install neither asks nor demands practices').not.toMatch(
    /--practices|which practices|no practice/i,
  );
  expect(offeredAgents(h.home)).toEqual(INDUSTRY_ROLES);
  const skills = canonSkills();
  expect(skills.length, 'the canon ships skills').toBeGreaterThan(0);
  expect(offeredSkills(h.home)).toEqual(skills);
});
