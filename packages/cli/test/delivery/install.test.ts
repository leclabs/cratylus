import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
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

it('delivery/install: installs every agent and skill unattended', () => {
  h = emptyHome();
  // No terminal: `run` hands the command an empty stdin pipe and pipes its output.
  const r = h.command(['install', '--harness', 'omp']);
  expect(r.code, said(r)).toBe(0);
  expect(offeredAgents(h.home)).toEqual(INDUSTRY_ROLES);
  const skills = canonSkills();
  expect(skills.length, 'the canon ships skills').toBeGreaterThan(0);
  expect(offeredSkills(h.home)).toEqual(skills);
});

it('delivery/install: offers a ruleset added since the recorded choice', async () => {
  const sets = canon.rulesets ?? [];
  const added = sets.find((set) => set.name === 'context-engineering');
  const kept = sets.find((set) => set.name === 'behaviour-driven-development');
  expect(added, 'the canon offers context-engineering').toBeDefined();
  expect(kept, 'the earlier choice is still offered').toBeDefined();
  const newRules = added!.rules.map((rule) => rule.name);
  const keptRules = kept!.rules.map((rule) => rule.name);
  const offeredRules = sets.flatMap((set) =>
    set.rules.map((rule) => rule.name),
  );
  const formerlyOffered = offeredRules.filter(
    (name) => !newRules.includes(name),
  );
  const args = [
    'install',
    '--harness',
    'omp',
    '--scope',
    'user',
    '--model-roles',
    'default',
    '--agent-status',
    'hide',
  ];

  for (const terminal of [true, false]) {
    h = emptyHome();
    const first = h.command([...args, '--rules', kept!.name]);
    expect(first.code, said(first)).toBe(0);
    const root = join(h.home, '.cratylus/omp');
    const recordPath = join(root, 'installation.json');
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    expect(record.rules).toEqual(keptRules);
    // This installation was written before context-engineering existed. Other
    // rulesets were offered and declined: they must not be asked about again.
    record.offeredRules = formerlyOffered;
    writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
    expect(entries(join(root, 'rules'))).toEqual(
      keptRules.map((name) => `${name}.md`).sort(),
    );

    let result: CommandResult;
    if (terminal) {
      // As in the industry-roles example, util-linux script supplies a real
      // terminal to the installed command. Answer only after clack renders the
      // question: down + enter chooses the whole added ruleset; enter confirms.
      let resolve!: (result: CommandResult) => void;
      let reject!: (reason: unknown) => void;
      const promise = new Promise<CommandResult>((onResolve, onReject) => {
        resolve = onResolve;
        reject = onReject;
      });
      const child = spawn(
        'script',
        [
          '--quiet',
          '--return',
          '--command',
          `stty cols 200 rows 50; cratylus ${args.join(' ')}`,
          '/dev/null',
        ],
        {
          cwd: h.cwd,
          env: h.env,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 30_000,
        },
      );
      let stdout = '';
      let stderr = '';
      let chose = false;
      let confirmed = false;
      child.stdout.on('data', (chunk) => {
        stdout += String(chunk);
        const output = stripVTControlCharacters(stdout);
        if (
          !chose &&
          output.includes('Rules: context-engineering') &&
          output.includes('rule by rule')
        ) {
          chose = true;
          child.stdin.write('\x1b[B\r');
        }
        if (!confirmed && output.includes('Install this?')) {
          confirmed = true;
          child.stdin.write('\r');
        }
      });
      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });
      child.on('error', reject);
      child.on('close', (code) => resolve({ code, stdout, stderr }));
      result = await promise;
    } else {
      // h.command pipes stdin/stdout: there is no terminal and no --rules.
      result = h.command(args);
    }

    const output = stripVTControlCharacters(said(result));
    const after = JSON.parse(readFileSync(recordPath, 'utf8'));
    // Soft assertions exercise both halves even while the behaviour is missing.
    expect.soft(result.code, output).toBe(0);
    const chosen = terminal ? [...keptRules, ...newRules] : keptRules;
    expect
      .soft(entries(join(root, 'rules')), output)
      .toEqual(chosen.map((name) => `${name}.md`).sort());
    expect.soft(after.rules, output).toEqual(chosen);
    expect
      .soft(after.offeredRules, output)
      .toEqual(terminal ? offeredRules : formerlyOffered);
    if (terminal) {
      const asked = [...output.matchAll(/Rules: ([\w-]+) —/g)].map(
        (match) => match[1],
      );
      expect.soft([...new Set(asked)], output).toEqual(['context-engineering']);
      expect.soft(output).toContain('Install this?');
    } else {
      const summary =
        output.split('\n').find((line) => /^\s*rules:/.test(line)) ?? '';
      for (const name of [...keptRules, ...newRules])
        expect.soft(summary, output).toContain(name);
      expect.soft(summary, output).toMatch(/terminal/i);
      expect.soft(summary, output).toContain('--rules');
      expect.soft(output).not.toContain('Rules: context-engineering');
    }
    h.dispose();
    h = undefined;
  }
});
