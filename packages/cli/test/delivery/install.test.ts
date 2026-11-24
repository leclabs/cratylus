import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import canon from '@cratylus/canon';
import { afterEach, expect, it } from 'vitest';
import {
  type CommandResult,
  type Host,
  files,
  host,
} from '../capability-port/fixture.js';
import { onTerminal } from '../terminal.js';
import { parseYaml } from '../yaml.js';
import { earlier, put } from './fixture.js';

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

// The skills omp offers from its user directories and installed packages.
function offeredSkills(home: string): string[] {
  return [
    join(home, '.agents/skills'),
    join(home, '.omp/agent/skills'),
    ...pluginPackages(home).map((p) => join(p, 'skills')),
  ]
    .flatMap((dir) =>
      entries(dir).filter((name) => existsSync(join(dir, name, 'SKILL.md'))),
    )
    .sort();
}

const releasedSkills = [
  'conceptualize',
  'elicit',
  'exemplify',
  'formalize',
  'materialize',
  'probe',
  'signify',
];

// Reconstruct the skill-bearing subset of a published cratylus 0.26.0
// `install --harness omp --model-roles default` in an empty home.
function seedReleasedSkills(home: string): string {
  const version = '0.26.0';
  const root = join(home, '.cratylus/omp');
  const plugins = join(home, '.omp/plugins');
  const name = 'cratylus-omp';
  put(join(root, 'package.json'), JSON.stringify({ name, version }));
  put(
    join(root, 'installation.json'),
    JSON.stringify({
      version,
      scope: 'user',
      references: [
        { kind: 'link', path: `plugins/node_modules/${name}` },
        {
          kind: 'dependency',
          path: 'plugins/package.json',
          name,
          created: true,
        },
      ],
    }),
  );
  put(
    join(plugins, 'package.json'),
    JSON.stringify({ dependencies: { [name]: pathToFileURL(root).href } }),
  );
  const modules = join(plugins, 'node_modules');
  mkdirSync(modules);
  symlinkSync(root, join(modules, name), 'dir');
  const skills = join(root, 'skills');
  for (const skill of releasedSkills)
    put(
      join(skills, skill, 'SKILL.md'),
      `---\nname: ${skill}\ndescription: Earlier cratylus skill\n---\n`,
    );
  return skills;
}

const said = (r: CommandResult) => `${r.stdout}\n${r.stderr}`;
const skillReports = (r: CommandResult) =>
  stripVTControlCharacters(said(r))
    .split('\n')
    .filter((line) => /^\s*skills:/.test(line));

it('delivery/install: installs the industry roles', async () => {
  h = emptyHome();
  // On a terminal, deciding nothing: whatever install may ask, `--yes` takes its
  // default, so the agents offered are the ones every user installation places.
  // (The run without a terminal is bound by the next example.)
  const r = await onTerminal(
    'cratylus install --harness omp --scope user --yes',
    h,
  );
  expect(r.code, said(r)).toBe(0);
  expect(offeredAgents(h.home)).toEqual(INDUSTRY_ROLES);
});

it('delivery/install: installs every agent unattended', () => {
  h = emptyHome();
  // No terminal: `run` hands the command an empty stdin pipe and pipes its output.
  const r = h.command(['install', '--harness', 'omp']);
  expect(r.code, said(r)).toBe(0);
  expect(offeredAgents(h.home)).toEqual(INDUSTRY_ROLES);
  expect(offeredSkills(h.home)).toEqual([]);
  expect(skillReports(r), said(r)).toEqual([]);
});

it('delivery/install: removes a skill an earlier installation placed', () => {
  h = emptyHome();
  const skills = seedReleasedSkills(h.home);
  expect(offeredSkills(h.home)).toEqual(releasedSkills);
  const args = ['install', '--harness', 'omp'];
  const preview = h.command([...args, '--dry-run']);
  expect(preview.code, said(preview)).toBe(0);
  expect
    .soft(skillReports(preview), said(preview))
    .toEqual([
      `  skills: would remove ${releasedSkills.join(', ')}, no longer installed`,
    ]);
  expect(offeredSkills(h.home)).toEqual(releasedSkills);

  const installed = h.command(args);
  expect(installed.code, said(installed)).toBe(0);
  expect
    .soft(existsSync(skills), 'the earlier owned skills directory')
    .toBe(false);
  expect.soft(offeredSkills(h.home)).toEqual([]);
  expect.soft(offeredAgents(h.home)).toEqual(INDUSTRY_ROLES);
  expect
    .soft(skillReports(installed), said(installed))
    .toEqual([
      `  skills: removed ${releasedSkills.join(', ')}, no longer installed`,
    ]);
});

it('reports each removed skill once across the owned root and earlier deploy record', () => {
  h = emptyHome();
  earlier(h);
  const legacy = join(h.home, '.agents/skills');
  const legacyFiles = files(legacy);
  const ownedSkills = seedReleasedSkills(h.home);
  const offered = offeredSkills(h.home);
  const names = [...new Set(offered)];
  expect(names).toContain('event-tap');
  expect(offered.length).toBeGreaterThan(names.length);

  const installed = h.command(['install', '--harness', 'omp']);
  expect(installed.code, said(installed)).toBe(0);
  expect.soft(existsSync(ownedSkills), ownedSkills).toBe(false);
  for (const file of legacyFiles)
    expect.soft(existsSync(file), file).toBe(false);
  expect.soft(offeredSkills(h.home)).toEqual([]);
  expect
    .soft(skillReports(installed), said(installed))
    .toEqual([`  skills: removed ${names.join(', ')}, no longer installed`]);
});

it('keeps an earlier skill whose file the host edited, and does not name it as removed', () => {
  h = emptyHome();
  earlier(h);
  const edited = join(h.home, '.agents/skills/event-tap/SKILL.md');
  put(edited, 'Mira edited this skill');
  const names = offeredSkills(h.home).filter((name) => name !== 'event-tap');
  expect(names.length).toBeGreaterThan(0);
  const args = ['install', '--harness', 'omp'];

  const preview = h.command([...args, '--dry-run']);
  expect(preview.code, said(preview)).toBe(0);
  expect(skillReports(preview), said(preview)).toEqual([
    `  skills: would remove ${names.join(', ')}, no longer installed`,
  ]);
  expect(readFileSync(edited, 'utf8')).toBe('Mira edited this skill');

  const installed = h.command(args);
  expect(installed.code, said(installed)).toBe(0);
  expect(skillReports(installed), said(installed)).toEqual([
    `  skills: removed ${names.join(', ')}, no longer installed`,
  ]);
  expect(readFileSync(edited, 'utf8')).toBe('Mira edited this skill');
  expect(stripVTControlCharacters(said(installed))).toContain(edited);
});

it('names an earlier skill whose SKILL.md is removed though the host edited its helper script', () => {
  h = emptyHome();
  earlier(h);
  const helper = join(h.home, '.agents/skills/event-tap/scripts/eventTap.mjs');
  const skill = join(h.home, '.agents/skills/event-tap/SKILL.md');
  put(helper, 'Mira edited this helper');
  const names = [...new Set(offeredSkills(h.home))];
  expect(names).toContain('event-tap');
  const args = ['install', '--harness', 'omp'];

  const preview = h.command([...args, '--dry-run']);
  expect(preview.code, said(preview)).toBe(0);
  expect(skillReports(preview), said(preview)).toEqual([
    `  skills: would remove ${names.join(', ')}, no longer installed`,
  ]);
  expect(existsSync(skill)).toBe(true);

  const installed = h.command(args);
  expect(installed.code, said(installed)).toBe(0);
  expect(skillReports(installed), said(installed)).toEqual([
    `  skills: removed ${names.join(', ')}, no longer installed`,
  ]);
  expect(existsSync(skill), 'the skill file').toBe(false);
  expect(readFileSync(helper, 'utf8')).toBe('Mira edited this helper');
});

it('does not name a skill of the owned root while an edited SKILL.md of its name stays', () => {
  h = emptyHome();
  earlier(h);
  const edited = join(h.home, '.agents/skills/event-tap/SKILL.md');
  put(edited, 'Mira edited this skill');
  const ownedSkills = seedReleasedSkills(h.home);
  put(join(ownedSkills, 'event-tap/SKILL.md'), '---\nname: event-tap\n---\n');
  const names = [...new Set(offeredSkills(h.home))].filter(
    (name) => name !== 'event-tap',
  );
  const args = ['install', '--harness', 'omp'];

  const preview = h.command([...args, '--dry-run']);
  expect(preview.code, said(preview)).toBe(0);
  expect(skillReports(preview), said(preview)).toEqual([
    `  skills: would remove ${names.join(', ')}, no longer installed`,
  ]);

  const installed = h.command(args);
  expect(installed.code, said(installed)).toBe(0);
  expect(skillReports(installed), said(installed)).toEqual([
    `  skills: removed ${names.join(', ')}, no longer installed`,
  ]);
  expect(existsSync(ownedSkills), 'the owned skills directory').toBe(false);
  expect(readFileSync(edited, 'utf8')).toBe('Mira edited this skill');
});

it('does not name an earlier skill that is only in the record, its SKILL.md already absent', () => {
  const args = ['install', '--harness', 'omp'];
  // Every legacy skill file gone: nothing to remove, so no skills line.
  h = emptyHome();
  earlier(h);
  rmSync(join(h.home, '.agents/skills'), { recursive: true, force: true });
  for (const argv of [[...args, '--dry-run'], args]) {
    const r = h.command(argv);
    expect(r.code, said(r)).toBe(0);
    expect(skillReports(r), said(r)).toEqual([]);
  }
  h.dispose();

  // One of them gone: the others are named, it is not.
  h = emptyHome();
  earlier(h);
  rmSync(join(h.home, '.agents/skills/probe'), { recursive: true });
  const names = [...new Set(offeredSkills(h.home))];
  expect(names).not.toContain('probe');
  expect(names.length).toBeGreaterThan(0);
  const preview = h.command([...args, '--dry-run']);
  expect(preview.code, said(preview)).toBe(0);
  expect(skillReports(preview), said(preview)).toEqual([
    `  skills: would remove ${names.join(', ')}, no longer installed`,
  ]);
  const installed = h.command(args);
  expect(installed.code, said(installed)).toBe(0);
  expect(skillReports(installed), said(installed)).toEqual([
    `  skills: removed ${names.join(', ')}, no longer installed`,
  ]);
});

it('replaces an owned root whose `skills` is a file, and names only the skill directories', () => {
  h = emptyHome();
  const skills = seedReleasedSkills(h.home);
  rmSync(skills, { recursive: true });
  put(skills, 'not a directory');
  const first = h.command(['install', '--harness', 'omp']);
  expect(first.code, said(first)).toBe(0);
  expect(skillReports(first), said(first)).toEqual([]);
  expect(existsSync(skills), 'the earlier file').toBe(false);

  put(join(skills, 'README.md'), 'a file among the skills');
  put(join(skills, 'tides/SKILL.md'), '---\nname: tides\n---\n');
  const second = h.command(['install', '--harness', 'omp']);
  expect(second.code, said(second)).toBe(0);
  expect(skillReports(second), said(second)).toEqual([
    '  skills: removed tides, no longer installed',
  ]);
  expect(existsSync(skills), 'the earlier skills directory').toBe(false);
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
      // As in the industry-roles example, a pseudo-terminal of its own runs the
      // installed command. Answer only after clack renders the question:
      // down + enter chooses the whole added ruleset; enter confirms.
      let chose = false;
      let confirmed = false;
      result = await onTerminal(`cratylus ${args.join(' ')}`, {
        ...h,
        answer: (output) => {
          let keys = '';
          if (
            !chose &&
            output.includes('Rules: context-engineering') &&
            output.includes('rule by rule')
          ) {
            chose = true;
            keys += '\x1b[B\r';
          }
          if (!confirmed && output.includes('Install this?')) {
            confirmed = true;
            keys += '\r';
          }
          return keys;
        },
      });
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

it('delivery/install: offers green-field and clean-cutover apart', () => {
  h = emptyHome();
  const offered = h.command(['install', '--harness', 'omp']);
  expect(offered.code, said(offered)).toBe(0);
  const hint = /rulesets: ([^)]+)\)/.exec(said(offered));
  expect(hint, 'install names the offered rulesets').not.toBeNull();
  const sets = hint![1]!.split(', ');
  for (const name of ['green-field', 'clean-cutover']) {
    expect.soft(sets).toContain(name);
    expect
      .soft(
        canon.rulesets
          ?.find((set) => set.name === name)
          ?.rules.map((rule) => rule.name),
      )
      .toEqual([name]);

    const chosen = h.command(['install', '--harness', 'omp', '--rules', name]);
    expect.soft(chosen.code, said(chosen)).toBe(0);
    expect
      .soft(entries(join(h.home, '.cratylus/omp/rules')))
      .toEqual([`${name}.md`]);
  }
});

it('delivery/install: drops a recorded rule no longer offered', async () => {
  const obsolete = 'green-field-declared-constraints';
  const newRules = ['green-field', 'clean-cutover'];
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
  const kept = canon.rulesets!.find(
    (set) => set.name === 'behaviour-driven-development',
  )!;
  const keptRules = kept.rules.map((rule) => rule.name);
  for (const terminal of [true, false]) {
    h = emptyHome();
    const first = h.command([...args, '--rules', kept.name]);
    expect(first.code, said(first)).toBe(0);
    const root = join(h.home, '.cratylus/omp');
    const recordPath = join(root, 'installation.json');
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    record.rules = [...keptRules, obsolete];
    record.offeredRules = [
      ...canon
        .rulesets!.flatMap((set) => set.rules.map((rule) => rule.name))
        .filter((name) => !newRules.includes(name)),
      obsolete,
    ];
    writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
    writeFileSync(join(root, 'rules', `${obsolete}.md`), '# Earlier rule\n');

    let result: CommandResult;
    if (terminal) {
      const answered = new Set<string>();
      let confirmed = false;
      result = await onTerminal(`cratylus ${args.join(' ')}`, {
        ...h,
        answer: (output) => {
          let keys = '';
          for (const name of newRules) {
            const prompt = output.lastIndexOf(`Rules: ${name} —`);
            if (
              !answered.has(name) &&
              prompt !== -1 &&
              output.indexOf('rule by rule', prompt) !== -1
            ) {
              answered.add(name);
              keys += '\x1b[B\r';
            }
          }
          if (!confirmed && output.includes('Install this?')) {
            confirmed = true;
            keys += '\r';
          }
          return keys;
        },
      });
    } else {
      result = h.command(args);
    }
    const output = stripVTControlCharacters(said(result));
    const after = JSON.parse(readFileSync(recordPath, 'utf8'));
    expect.soft(result.code, output).toBe(0);
    const chosen = terminal ? [...keptRules, ...newRules] : keptRules;
    expect.soft(after.rules, output).toEqual(chosen);
    expect
      .soft(entries(join(root, 'rules')), output)
      .toEqual(chosen.map((name) => `${name}.md`).sort());
    // The last rules: line is the summary of what was placed; on a terminal the
    // preview before it says what would be.
    const summary =
      output
        .split('\n')
        .filter((line) => /^\s*rules:/.test(line))
        .at(-1) ?? '';
    expect
      .soft(summary, output)
      .toContain(`dropped ${obsolete}, no longer offered`);
    const asked = [
      ...new Set(
        [...output.matchAll(/Rules: ([\w-]+) —/g)].map((match) => match[1]),
      ),
    ];
    expect.soft(asked, output).toEqual(terminal ? newRules : []);
    if (!terminal) {
      expect
        .soft(summary, output)
        .toContain(`offered since your choice: ${newRules.join(', ')}`);
    }
    h.dispose();
    h = undefined;
  }
});
