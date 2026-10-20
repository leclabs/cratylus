// Installation scopes (decisions 0311, 0313): install and uninstall act for the user,
// by default, or inside one project. A project installation lives wholly in the
// project — its owned root `<project>/.cratylus/omp`, and relative references in
// `<project>/.omp/plugins` a clone elsewhere resolves — writes nothing under the home,
// writes no operator's own setting (a tier's model, how the session shows its agent),
// and leaves the user's installation as it is, as the user's leaves it.

import { execFileSync, spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ompHarnessAdapter } from '../../src/adapters/omp/index.js';
import { runInstall } from '../../src/cli/commands/install.js';
import { runUninstall } from '../../src/cli/commands/uninstall.js';
import { projectOf } from '../../src/deploy/install-scope.js';
import { sessionAgentHiding } from '../../src/deploy/read-settings.js';
import type { ProjectablePlugin } from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import {
  FIXTURE_PRACTICE,
  answers,
  fixtureAgentSource,
  fixturePractices,
  tmp,
} from './helpers.js';

/** The block a project installation keeps in `.omp/plugins/.gitignore`. */
const BLOCK =
  '# cratylus: commit the link to the project installation\n!/node_modules/\n/node_modules/*\n!/node_modules/cratylus-omp\n';

// One agents directory for the whole file: a module once imported is not read again.
const agents = tmp('install-scope-agents-');
for (const [name, tier] of [
  ['alpha', 'frontier'],
  ['beta', 'fast'],
  ['gamma', 'frontier-other-family'],
] as const)
  writeFileSync(
    join(agents, `${name}.ts`),
    fixtureAgentSource(name, { routing: { tier, effort: 'high' } }),
  );
const corpus: ProjectablePlugin = {
  name: 'scope-fixture',
  manifest: FIXTURE_MANIFEST,
  agents,
  practices: fixturePractices(['alpha', 'beta', 'gamma']),
};

let home: string;
let repo: string;
let cwd: string;
let out: string;
beforeEach(() => {
  const root = tmp('install-scope-');
  home = join(root, 'home');
  repo = join(root, 'repo');
  cwd = join(repo, 'src', 'deep');
  mkdirSync(join(home, '.omp', 'agent'), { recursive: true });
  mkdirSync(join(repo, '.git'), { recursive: true });
  mkdirSync(cwd, { recursive: true });
  out = '';
  for (const stream of [process.stdout, process.stderr])
    vi.spyOn(stream, 'write').mockImplementation((s) => {
      out += String(s);
      return true;
    });
});
afterEach(() => {
  vi.restoreAllMocks();
});

const install = (extra: Partial<Parameters<typeof runInstall>[0]> = {}) =>
  runInstall({
    harness: 'omp',
    home,
    cwd,
    corpus: corpus as never,
    practices: FIXTURE_PRACTICE,
    interactive: false,
    version: '1.0.0',
    ...extra,
  });
const uninstall = (extra: Partial<Parameters<typeof runUninstall>[0]> = {}) =>
  runUninstall({ harness: 'omp', home, cwd, ...extra });

const userRoot = () => join(home, '.cratylus', 'omp');
const projectRoot = (p = repo) => join(p, '.cratylus', 'omp');
const plugins = (p = repo) => join(p, '.omp', 'plugins');
const link = (p = repo) => join(plugins(p), 'node_modules', 'cratylus-omp');
const record = (root: string) =>
  JSON.parse(readFileSync(join(root, 'installation.json'), 'utf8')) as {
    scope?: string;
    version?: string;
  };

/** Every entry under `dir`, by its path: a file's bytes, a link's target, a
 *  directory as such. */
function snapshot(dir: string): Record<string, string> {
  const found: Record<string, string> = {};
  const walk = (at: string, rel: string): void => {
    for (const name of readdirSync(at)) {
      const abs = join(at, name);
      const path = join(rel, name);
      const stat = lstatSync(abs);
      if (stat.isSymbolicLink()) found[path] = `-> ${readlinkSync(abs)}`;
      else if (stat.isDirectory()) {
        found[path] = 'dir';
        walk(abs, path);
      } else found[path] = readFileSync(abs, 'utf8');
    }
  };
  if (existsSync(dir)) walk(dir, '');
  return found;
}

describe('the project of a working directory', () => {
  it('is the nearest ancestor holding .omp/ other than the home, else the nearest holding .git, else itself', () => {
    expect(projectOf(cwd, home)).toBe(repo);
    mkdirSync(join(repo, 'src', '.omp'));
    expect(projectOf(cwd, home)).toBe(join(repo, 'src'));
    const loose = join(home, 'loose');
    mkdirSync(loose);
    expect(projectOf(loose, home)).toBe(loose);
    expect(projectOf(home, home)).toBe(home);
  });
});

describe('install at user scope', () => {
  it('places the owned root in the home, refers to it absolutely, records the scope, and touches no project', async () => {
    expect(await install()).toBe(0);
    expect(
      readlinkSync(join(home, '.omp/plugins/node_modules/cratylus-omp')),
    ).toBe(userRoot());
    expect(record(userRoot()).scope).toBe('user');
    expect(existsSync(join(repo, '.cratylus'))).toBe(false);
    expect(existsSync(join(repo, '.omp'))).toBe(false);
    expect(out).toContain(
      `is installed in omp at user scope, under ${userRoot()}`,
    );
    expect(out).toContain('cratylus uninstall --harness omp\n');
  });

  it('takes user scope under --yes on a terminal, asking nothing', async () => {
    const asked: string[] = [];
    const prompts = answers({
      scope: async () => {
        asked.push('scope');
        return 'project';
      },
    });
    expect(await install({ interactive: true, yes: true, prompts })).toBe(0);
    expect(asked).toEqual([]);
    expect(existsSync(userRoot())).toBe(true);
    expect(existsSync(projectRoot())).toBe(false);
  });
});

describe('install at project scope', () => {
  it('places the root and three relative references in the project from a subdirectory, and writes nothing under the home', async () => {
    const before = snapshot(home);
    expect(await install({ scope: 'project' })).toBe(0);
    expect(snapshot(home)).toEqual(before);
    expect(existsSync(join(projectRoot(), 'package.json'))).toBe(true);
    expect(record(projectRoot()).scope).toBe('project');
    expect(readlinkSync(link())).toBe('../../../.cratylus/omp');
    expect(
      JSON.parse(readFileSync(join(plugins(), 'package.json'), 'utf8')),
    ).toEqual({ dependencies: { 'cratylus-omp': 'file:../../.cratylus/omp' } });
    expect(readFileSync(join(plugins(), '.gitignore'), 'utf8')).toBe(BLOCK);
    expect(out).toContain(
      `is installed in omp at project scope, under ${projectRoot()}`,
    );
    expect(out).toContain(
      `cratylus uninstall --harness omp --scope project, run in ${repo}`,
    );
  });

  it('resolves its link from a copy of the project moved elsewhere', async () => {
    expect(await install({ scope: 'project' })).toBe(0);
    const moved = join(tmp('install-scope-moved-'), 'clone');
    cpSync(repo, moved, { recursive: true, verbatimSymlinks: true });
    expect(realpathSync(link(moved))).toBe(realpathSync(projectRoot(moved)));
  });

  it('is asked on a terminal where the project is not the home, and placed as answered', async () => {
    let offered = '';
    const prompts = answers({
      scope: async (project) => {
        offered = project;
        return 'project';
      },
    });
    expect(await install({ interactive: true, prompts })).toBe(0);
    expect(offered).toBe(repo);
    expect(record(projectRoot()).scope).toBe('project');
    expect(existsSync(userRoot())).toBe(false);
  });

  it('is not asked at the home, and refused there when named', async () => {
    const asked: string[] = [];
    const prompts = answers({
      scope: async () => {
        asked.push('scope');
        return 'project';
      },
    });
    expect(await install({ cwd: home, interactive: true, prompts })).toBe(0);
    expect(asked).toEqual([]);
    expect(record(userRoot()).scope).toBe('user');

    out = '';
    expect(await install({ cwd: home, scope: 'project' })).toBe(1);
    expect(out).toContain(
      'cratylus install: --scope project: the project here is your home directory',
    );
    expect(uninstall({ cwd: home, scope: 'project' })).toBe(1);
    expect(existsSync(userRoot())).toBe(true);
  });

  it('leaves the user installation and ~/.omp untouched, and a user install leaves it', async () => {
    expect(await install()).toBe(0);
    const homeBefore = snapshot(home);
    expect(await install({ scope: 'project' })).toBe(0);
    expect(snapshot(home)).toEqual(homeBefore);

    const projectBefore = snapshot(repo);
    expect(await install({ version: '1.1.0' })).toBe(0);
    expect(record(userRoot()).version).toBe('1.1.0');
    expect(uninstall()).toBe(0);
    expect(existsSync(userRoot())).toBe(false);
    expect(snapshot(repo)).toEqual(projectBefore);
  });

  it('upgrades the project root alone on reinstall', async () => {
    expect(await install()).toBe(0);
    expect(await install({ scope: 'project' })).toBe(0);
    const homeBefore = snapshot(home);
    const referencesBefore = snapshot(plugins());
    expect(await install({ scope: 'project', version: '1.1.0' })).toBe(0);
    expect(record(projectRoot()).version).toBe('1.1.0');
    expect(record(userRoot()).version).toBe('1.0.0');
    expect(snapshot(home)).toEqual(homeBefore);
    expect(snapshot(plugins())).toEqual(referencesBefore);
  });

  it('binds no model role: asks no model question and writes no modelRoles, in the project or the home', async () => {
    const homeConfig = join(home, '.omp', 'agent', 'config.yml');
    writeFileSync(homeConfig, 'theme: dark\n');
    mkdirSync(join(repo, '.omp'));
    writeFileSync(join(repo, '.omp', 'config.yml'), 'theme: light\n');
    const homeBefore = snapshot(home);
    const asked: string[] = [];
    const prompts = answers({
      routes: async (questions) => {
        asked.push(...questions.map((q) => q.role));
        return { frontier: 'prov/big' };
      },
    });
    expect(
      await install({ scope: 'project', interactive: true, prompts }),
    ).toBe(0);
    expect(asked).toEqual([]);
    expect(readFileSync(join(repo, '.omp', 'config.yml'), 'utf8')).toBe(
      'theme: light\n',
    );
    expect(snapshot(home)).toEqual(homeBefore);
    expect(
      Object.values(snapshot(repo)).some((text) => text.includes('modelRoles')),
    ).toBe(false);
  });

  it('refuses --model-roles, naming the user scope, and writes nothing', async () => {
    for (const modelRoles of ['frontier=prov/big', 'default']) {
      const homeBefore = snapshot(home);
      const repoBefore = snapshot(repo);
      out = '';
      expect(await install({ scope: 'project', modelRoles })).toBe(1);
      expect(out).toContain(
        'cratylus install: --model-roles: a project installation binds no models',
      );
      expect(out).toContain(
        '`cratylus install --scope user --model-roles <role=model,…>`',
      );
      expect(snapshot(home)).toEqual(homeBefore);
      expect(snapshot(repo)).toEqual(repoBefore);
    }
  });

  /** A settings file binding `role` to `model`, in each layout omp reads. */
  const layouts: Record<string, (role: string, model: string) => string> = {
    'block YAML': (role, model) => `modelRoles:\n  ${role}: "${model}"\n`,
    'flow YAML': (role, model) => `modelRoles: { ${role}: "${model}" }\n`,
    JSON: (role, model) => `{ "modelRoles": { "${role}": "${model}" } }\n`,
  };

  it.each(Object.keys(layouts))(
    "names as next steps exactly the tiers neither the project's nor the user's settings bind, both in %s, to bind at user scope",
    async (layout) => {
      const write = layouts[layout] as (role: string, model: string) => string;
      const homeConfig = join(home, '.omp', 'agent', 'config.yml');
      const homeText = write('fast', 'prov/small');
      const projectText = write('frontier', 'prov/big');
      writeFileSync(homeConfig, homeText);
      mkdirSync(join(repo, '.omp'));
      writeFileSync(join(repo, '.omp', 'config.yml'), projectText);
      expect(await install({ scope: 'project' })).toBe(0);
      expect(out).toContain(
        `bind a model to the tier frontier-other-family in your own settings, under modelRoles in ${homeConfig} or with cratylus install --scope user --model-roles <tier=model,…>`,
      );
      expect(out).not.toMatch(/bind a model to [^\n]*\b(fast|frontier),/);
      expect(out).not.toMatch(/bind a model to the tier (fast|frontier) /);
      expect(readFileSync(homeConfig, 'utf8')).toBe(homeText);
      expect(readFileSync(join(repo, '.omp', 'config.yml'), 'utf8')).toBe(
        projectText,
      );
    },
  );

  it('leaves a user install asking for each unbound tier and binding the answer in the user settings', async () => {
    let asked: string[] = [];
    const prompts = answers({
      routes: async (questions) => {
        asked = questions.map((q) => q.role);
        return { frontier: 'prov/big' };
      },
    });
    expect(await install({ scope: 'user', interactive: true, prompts })).toBe(
      0,
    );
    expect(asked).toEqual(['fast', 'frontier', 'frontier-other-family']);
    expect(
      readFileSync(join(home, '.omp', 'agent', 'config.yml'), 'utf8'),
    ).toBe('modelRoles:\n  frontier: "prov/big"\n');
    expect(existsSync(join(repo, '.omp'))).toBe(false);
  });
});

describe('a project installation writes no status line choice', () => {
  const HIDDEN = 'statusLine:\n  showHookStatus: false\n';
  const homeConfig = () => join(home, '.omp', 'agent', 'config.yml');
  const projectConfig = () => join(repo, '.omp', 'config.yml');
  const settings = (user?: string, project?: string): void => {
    if (user !== undefined) writeFileSync(homeConfig(), user);
    if (project !== undefined) {
      mkdirSync(join(repo, '.omp'), { recursive: true });
      writeFileSync(projectConfig(), project);
    }
  };
  const SHOW_NEXT = 'cratylus install --scope user --agent-status show';
  const statusSegment = ompHarnessAdapter.statusSegment ?? {
    segment: 'status',
  };

  it('asks no status line question on a terminal and writes nothing about it, in the project or the home, nor records an answer', async () => {
    settings(HIDDEN, HIDDEN);
    const homeBefore = snapshot(home);
    const asked: string[] = [];
    const prompts = answers({
      agentStatus: async () => {
        asked.push('agentStatus');
        return true;
      },
    });
    expect(
      await install({ scope: 'project', interactive: true, prompts }),
    ).toBe(0);
    expect(asked).toEqual([]);
    expect(readFileSync(projectConfig(), 'utf8')).toBe(HIDDEN);
    expect(snapshot(home)).toEqual(homeBefore);
    expect(
      JSON.parse(
        readFileSync(join(projectRoot(), 'installation.json'), 'utf8'),
      ),
    ).not.toHaveProperty('answered');
  });

  it('refuses --agent-status, naming the user scope, and writes nothing', async () => {
    settings(HIDDEN);
    for (const agentStatus of ['show', 'hide']) {
      const homeBefore = snapshot(home);
      const repoBefore = snapshot(repo);
      out = '';
      expect(await install({ scope: 'project', agentStatus })).toBe(1);
      expect(out).toContain(
        'cratylus install: --agent-status: a project installation writes no status line choice',
      );
      expect(out).toContain(
        '`cratylus install --scope user --agent-status <show|hide>`',
      );
      expect(snapshot(home)).toEqual(homeBefore);
      expect(snapshot(repo)).toEqual(repoBefore);
    }
  });

  const USER_CUSTOM =
    'statusLine:\n  preset: custom\n  leftSegments: [model, status]\n  showHookStatus: false\n';
  it.each([
    ['the user’s settings alone hide it', HIDDEN, undefined, 'user'],
    [
      'the project’s settings, in JSON, hide it',
      undefined,
      '{ "statusLine": { "showHookStatus": false } }\n',
      ['statusLine.showHookStatus'],
    ],
    [
      'the project’s settings, in flow YAML, show the row the user’s hide',
      HIDDEN,
      'statusLine: { showHookStatus: true }\n',
      'none',
    ],
    [
      'the project’s custom layout lists the segment the user’s hide the row of',
      HIDDEN,
      'statusLine:\n  preset: custom\n  leftSegments: [model, status]\n',
      'none',
    ],
    [
      'the project’s other preset leaves the user’s hidden row hidden',
      HIDDEN,
      'statusLine:\n  preset: minimal\n',
      ['statusLine.preset'],
    ],
    [
      'the project’s custom list lacks the segment',
      HIDDEN,
      'statusLine:\n  preset: custom\n  leftSegments: [model]\n',
      ['statusLine.leftSegments'],
    ],
    [
      'the project’s null showHookStatus leaves the user’s hidden row',
      HIDDEN,
      'statusLine:\n  showHookStatus: null\n',
      'user',
    ],
    [
      'the project’s null preset leaves the user’s custom layout, which lists it',
      USER_CUSTOM,
      'statusLine:\n  preset: null\n',
      'none',
    ],
    [
      'the project’s null segment list leaves the user’s, which lists it',
      USER_CUSTOM,
      'statusLine:\n  preset: custom\n  leftSegments: null\n',
      'none',
    ],
    ['neither hides it', 'theme: dark\n', undefined, 'none'],
  ] as const)(
    'names showing the agent as a next step exactly where %s, and where it comes from',
    async (_case, user, project, named) => {
      settings(user, project);
      expect(await install({ scope: 'project' })).toBe(0);
      const next = out.split('next:')[1] ?? '';
      if (named === 'none')
        expect(next).not.toMatch(/agent-status|session's agent/);
      else if (named === 'user') expect(next).toContain(SHOW_NEXT);
      else {
        expect(next).toContain(
          `show the session's agent, which the project's settings hide by ${named.join(', ')} in ${projectConfig()}: that is the project's setting, to change there`,
        );
        expect(next).not.toContain('--agent-status');
      }
    },
  );

  it('names the user-scope remedy only where it shows the agent once run', async () => {
    settings(HIDDEN, 'theme: light\n');
    expect(await install({ scope: 'project' })).toBe(0);
    expect(out.split('next:')[1]).toContain(SHOW_NEXT);
    expect(
      sessionAgentHiding(homeConfig(), projectConfig(), statusSegment),
    ).toEqual({ projectKeys: [], userKeys: ['statusLine.showHookStatus'] });
    expect(await install({ scope: 'user', agentStatus: 'show' })).toBe(0);
    expect(
      sessionAgentHiding(homeConfig(), projectConfig(), statusSegment),
    ).toBeUndefined();
  });

  it('names the user’s own file and keys, and no command, where a user install recorded the answer', async () => {
    settings(HIDDEN);
    expect(await install({ scope: 'user', agentStatus: 'hide' })).toBe(0);
    expect(readFileSync(homeConfig(), 'utf8')).toBe(HIDDEN);
    out = '';
    expect(await install({ scope: 'project' })).toBe(0);
    const next = out.split('next:')[1] ?? '';
    expect(next).toContain(
      `show the session's agent, which your own settings hide by statusLine.showHookStatus in ${homeConfig()}: that is your own setting, answered at an earlier user install, to change there`,
    );
    expect(next).not.toContain('--agent-status');
  });

  it('leaves a user install asking where its settings hide the agent and writing the answer there', async () => {
    settings(HIDDEN);
    const asked: string[] = [];
    const prompts = answers({
      agentStatus: async () => {
        asked.push('agentStatus');
        return true;
      },
    });
    expect(await install({ scope: 'user', interactive: true, prompts })).toBe(
      0,
    );
    expect(asked).toEqual(['agentStatus']);
    expect(readFileSync(homeConfig(), 'utf8')).not.toBe(HIDDEN);
    expect(record(userRoot())).toHaveProperty('answered', ['agentStatus']);
    expect(existsSync(join(repo, '.omp'))).toBe(false);
  });
});

describe('uninstall at project scope', () => {
  it('removes the project root and exactly its references, and leaves the user installation', async () => {
    expect(await install()).toBe(0);
    expect(await install({ scope: 'project' })).toBe(0);
    const homeBefore = snapshot(home);
    expect(uninstall({ scope: 'project' })).toBe(0);
    expect(existsSync(join(repo, '.cratylus'))).toBe(false);
    expect(existsSync(plugins())).toBe(false);
    expect(snapshot(home)).toEqual(homeBefore);
    expect(record(userRoot()).scope).toBe('user');
  });

  it('removes the project’s .omp/ where install created it and it is left empty', async () => {
    expect(await install({ scope: 'project' })).toBe(0);
    expect(uninstall({ scope: 'project' })).toBe(0);
    expect(existsSync(join(repo, '.omp'))).toBe(false);
  });

  it('keeps a .omp/ that was there before install, and one install created that holds the host’s files', async () => {
    mkdirSync(join(repo, '.omp'));
    expect(await install({ scope: 'project' })).toBe(0);
    expect(await install({ scope: 'project', version: '1.1.0' })).toBe(0);
    expect(uninstall({ scope: 'project' })).toBe(0);
    expect(snapshot(join(repo, '.omp'))).toEqual({});
    expect(existsSync(join(repo, '.omp'))).toBe(true);

    const other = tmp('install-scope-other-');
    mkdirSync(join(other, '.git'));
    expect(await install({ scope: 'project', cwd: other })).toBe(0);
    writeFileSync(join(other, '.omp', 'config.yml'), 'theme: light\n');
    expect(uninstall({ scope: 'project', cwd: other })).toBe(0);
    expect(snapshot(join(other, '.omp'))).toEqual({
      'config.yml': 'theme: light\n',
    });
  });

  it('keeps a host .gitignore and package.json byte for byte', async () => {
    mkdirSync(plugins(), { recursive: true });
    const ignore = '# mine\nlogs/'; // no final newline
    const manifest =
      '{\n  "name": "host",\n  "dependencies": {\n    "left-pad": "1.0.0"\n  }\n}\n';
    writeFileSync(join(plugins(), '.gitignore'), ignore);
    writeFileSync(join(plugins(), 'package.json'), manifest);
    expect(await install({ scope: 'project' })).toBe(0);
    expect(readFileSync(join(plugins(), '.gitignore'), 'utf8')).toBe(
      `${ignore}\n${BLOCK}`,
    );
    expect(uninstall({ scope: 'project' })).toBe(0);
    expect(readFileSync(join(plugins(), '.gitignore'), 'utf8')).toBe(ignore);
    expect(readFileSync(join(plugins(), 'package.json'), 'utf8')).toBe(
      manifest,
    );
    expect(existsSync(join(plugins(), 'node_modules'))).toBe(false);
  });

  it('appends its whole block after host lines identical to its own, and takes back only the block', async () => {
    mkdirSync(plugins(), { recursive: true });
    const ignore =
      '!/node_modules/\n/node_modules/*\n!/node_modules/cratylus-omp\n';
    writeFileSync(join(plugins(), '.gitignore'), ignore);
    expect(await install({ scope: 'project' })).toBe(0);
    expect(readFileSync(join(plugins(), '.gitignore'), 'utf8')).toBe(
      `${ignore}${BLOCK}`,
    );
    expect(uninstall({ scope: 'project' })).toBe(0);
    expect(readFileSync(join(plugins(), '.gitignore'), 'utf8')).toBe(ignore);
  });

  it('leaves exactly the host’s bytes after host edits elsewhere and an upgrade', async () => {
    mkdirSync(plugins(), { recursive: true });
    writeFileSync(join(plugins(), '.gitignore'), 'logs/\n');
    expect(await install({ scope: 'project' })).toBe(0);
    const edited = `# top\nlogs/\n${BLOCK}tmp/\n`;
    writeFileSync(join(plugins(), '.gitignore'), edited);
    expect(await install({ scope: 'project', version: '1.1.0' })).toBe(0);
    expect(readFileSync(join(plugins(), '.gitignore'), 'utf8')).toBe(edited);
    expect(uninstall({ scope: 'project' })).toBe(0);
    expect(readFileSync(join(plugins(), '.gitignore'), 'utf8')).toBe(
      '# top\nlogs/\ntmp/\n',
    );
  });

  it('keeps the link committable where the host’s own lines would ignore it', async () => {
    const real = tmp('install-scope-git-');
    execFileSync('git', ['init', '-q'], { cwd: real });
    writeFileSync(join(real, '.gitignore'), 'node_modules\n');
    mkdirSync(plugins(real), { recursive: true });
    writeFileSync(
      join(plugins(real), '.gitignore'),
      '!/node_modules/cratylus-omp\n/node_modules/*\n',
    );
    expect(await install({ scope: 'project', cwd: real })).toBe(0);
    const ignored = spawnSync(
      'git',
      [
        'check-ignore',
        '-q',
        join('.omp', 'plugins', 'node_modules', 'cratylus-omp'),
      ],
      { cwd: real },
    );
    expect(ignored.status).toBe(1);
  });
});

describe('a project installation never takes over an earlier render tree', () => {
  it('install refuses a project root over a render tree, writing nothing', async () => {
    mkdirSync(join(projectRoot(), 'agents'), { recursive: true });
    writeFileSync(join(projectRoot(), 'agents', 'alpha.md'), '# rendered\n');
    const before = snapshot(repo);
    expect(await install({ scope: 'project' })).toBe(1);
    expect(out).toContain('it is an earlier render tree');
    expect(snapshot(repo)).toEqual(before);
    expect(uninstall({ scope: 'project' })).toBe(1);
    expect(snapshot(repo)).toEqual(before);
  });
});

describe('a hook-bearing installation runs its own workers', () => {
  /** The session module and its one worker, which logs the installation it was run
   *  from, placed under `root`. */
  function place(root: string): void {
    const command = ompHarnessAdapter.hookCommand('nudge', 'w.sh');
    const [module] =
      ompHarnessAdapter.scopeActivatedSurface?.(
        [{ id: 'nudge', events: ['session.start'], command }] as never,
        [],
      ) ?? [];
    if (module === undefined) throw new Error('no session module');
    const file = join(root, 'extensions', module.filename);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, module.content);
    const worker = join(root, 'hooks', 'nudge', 'w.sh');
    mkdirSync(dirname(worker), { recursive: true });
    writeFileSync(worker, 'echo "$CRATYLUS_INSTALLATION" >> "$HOOK_LOG"\n');
  }

  /** Load the session module under `root` and start a session with it. */
  async function start(root: string, module: string): Promise<void> {
    const handlers: ((event: unknown) => unknown)[] = [];
    const pi = {
      on: (name: string, fn: (event: unknown) => unknown) => {
        if (name === 'session_start') handlers.push(fn);
      },
      exec: async (command: string, args: string[]) => {
        const r = spawnSync(command, args, { encoding: 'utf8' });
        return {
          stdout: r.stdout,
          stderr: r.stderr,
          code: r.status,
          killed: false,
        };
      },
    };
    // The emitted module is written at test time into the installation under test.
    (await import(join(root, 'extensions', module))).default(pi);
    for (const fn of handlers) await fn({});
  }

  it('beside a user installation, and after the project is moved', async () => {
    const log = join(tmp('install-scope-log-'), 'hooks.log');
    vi.stubEnv('HOOK_LOG', log);
    try {
      place(userRoot());
      place(projectRoot());
      const module = readdirSync(join(userRoot(), 'extensions'))[0] as string;
      await start(projectRoot(), module);
      await start(userRoot(), module);
      const moved = join(tmp('install-scope-moved-'), 'clone');
      cpSync(repo, moved, { recursive: true });
      await start(projectRoot(moved), module);
      expect(readFileSync(log, 'utf8')).toBe(
        `${projectRoot()}\n${userRoot()}\n${projectRoot(moved)}\n`,
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
