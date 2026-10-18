// Installation scopes (decision 0311): install and uninstall act for the user, by
// default, or inside one project. A project installation lives wholly in the project —
// its owned root `<project>/.cratylus/omp`, and relative references in
// `<project>/.omp/plugins` a clone elsewhere resolves — writes nothing under the home,
// and leaves the user's installation as it is, as the user's leaves it.

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
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInstall } from '../../src/cli/commands/install.js';
import { runProject } from '../../src/cli/commands/project.js';
import { runUninstall } from '../../src/cli/commands/uninstall.js';
import { projectOf } from '../../src/deploy/install-scope.js';
import type { ProjectablePlugin } from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import {
  FIXTURE_PRACTICE,
  answers,
  fixtureAgentSource,
  fixturePractices,
  tmp,
} from './helpers.js';

// One agents directory for the whole file: a module once imported is not read again.
const agents = tmp('install-scope-agents-');
writeFileSync(
  join(agents, 'alpha.ts'),
  fixtureAgentSource('alpha', {
    routing: { tier: 'frontier', effort: 'high' },
  }),
);
const corpus: ProjectablePlugin = {
  name: 'scope-fixture',
  manifest: FIXTURE_MANIFEST,
  agents,
  practices: fixturePractices(['alpha']),
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
    modelRoles: 'default',
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
    expect(readFileSync(join(plugins(), '.gitignore'), 'utf8')).toBe(
      '!/node_modules/\n/node_modules/*\n!/node_modules/cratylus-omp\n',
    );
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

  it('binds model roles in the project settings, keeping and not asking a role that file binds', async () => {
    const homeConfig = join(home, '.omp', 'agent', 'config.yml');
    writeFileSync(homeConfig, 'theme: dark\n');
    expect(
      await install({ scope: 'project', modelRoles: 'frontier=prov/big' }),
    ).toBe(0);
    expect(readFileSync(join(repo, '.omp', 'config.yml'), 'utf8')).toBe(
      'modelRoles:\n  frontier: "prov/big"\n',
    );
    expect(readFileSync(homeConfig, 'utf8')).toBe('theme: dark\n');

    let asked: string[] = [];
    const prompts = answers({
      routes: async (questions) => {
        asked = questions.map((q) => q.role);
        return {};
      },
    });
    expect(
      await install({
        scope: 'project',
        interactive: true,
        modelRoles: undefined,
        prompts,
      }),
    ).toBe(0);
    expect(asked).not.toContain('frontier');
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

  it('keeps a host .gitignore and package.json byte for byte', async () => {
    mkdirSync(plugins(), { recursive: true });
    const ignore = '# mine\nlogs/'; // no final newline
    const manifest =
      '{\n  "name": "host",\n  "dependencies": {\n    "left-pad": "1.0.0"\n  }\n}\n';
    writeFileSync(join(plugins(), '.gitignore'), ignore);
    writeFileSync(join(plugins(), 'package.json'), manifest);
    expect(await install({ scope: 'project' })).toBe(0);
    expect(readFileSync(join(plugins(), '.gitignore'), 'utf8')).toBe(
      `${ignore}\n!/node_modules/\n/node_modules/*\n!/node_modules/cratylus-omp\n`,
    );
    expect(uninstall({ scope: 'project' })).toBe(0);
    expect(readFileSync(join(plugins(), '.gitignore'), 'utf8')).toBe(ignore);
    expect(readFileSync(join(plugins(), 'package.json'), 'utf8')).toBe(
      manifest,
    );
    expect(existsSync(join(plugins(), 'node_modules'))).toBe(false);
  });

  it('appends only the lines a host .gitignore lacks, and takes back only those', async () => {
    mkdirSync(plugins(), { recursive: true });
    const ignore = '/node_modules/*\n';
    writeFileSync(join(plugins(), '.gitignore'), ignore);
    expect(await install({ scope: 'project' })).toBe(0);
    expect(readFileSync(join(plugins(), '.gitignore'), 'utf8')).toBe(
      `${ignore}!/node_modules/\n!/node_modules/cratylus-omp\n`,
    );
    expect(uninstall({ scope: 'project' })).toBe(0);
    expect(readFileSync(join(plugins(), '.gitignore'), 'utf8')).toBe(ignore);
  });
});

describe('a project installation and an author’s render tree never share a directory', () => {
  it('install refuses a project root over a render tree, writing nothing', async () => {
    mkdirSync(join(projectRoot(), 'agents'), { recursive: true });
    writeFileSync(join(projectRoot(), 'agents', 'alpha.md'), '# rendered\n');
    const before = snapshot(repo);
    expect(await install({ scope: 'project' })).toBe(1);
    expect(out).toContain("it is an author's render tree");
    expect(snapshot(repo)).toEqual(before);
    expect(uninstall({ scope: 'project' })).toBe(1);
    expect(snapshot(repo)).toEqual(before);
  });

  it('project refuses to render into a directory holding an installation record', async () => {
    expect(await install({ scope: 'project' })).toBe(0);
    writeFileSync(join(repo, 'cratylus.config.ts'), 'export default {};\n');
    const before = snapshot(projectRoot());
    expect(await runProject({ cwd: repo })).toBe(1);
    expect(out).toContain('holds an installation (installation.json)');
    expect(snapshot(projectRoot())).toEqual(before);
  });
});
