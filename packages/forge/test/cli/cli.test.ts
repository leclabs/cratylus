import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runAdd } from '../../src/cli/commands/add.js';
import { runInit } from '../../src/cli/commands/init.js';
import { runOptimize } from '../../src/cli/commands/optimize.js';
import { runProject } from '../../src/cli/commands/project.js';
import {
  CONFIG_PACKAGE,
  DEFAULT_PLUGIN_PACKAGE,
  resolveConfig,
} from '../../src/config/index.js';
import type { AgentPlugin } from '../../src/resolve/plugin.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import { capture } from './streams.js';

/** The real canon corpus dimensions dir — the default plugin's fragment source. */
const CANON_DIMENSIONS = fileURLToPath(
  new URL('../../../canon/src/dimensions', import.meta.url),
);

describe('CLI commands (integration)', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'forge-cli-'));
    // `init` reports on stdout; these cases are about what it wrote.
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(cwd, { recursive: true, force: true });
  });

  it('init scaffolds a project from the default plugin, resolvable through resolve()', async () => {
    // (1) init on an empty dir scaffolds the config-is-code home whose zero-config
    // default `extends: [canon]` — the default is A PACKAGE, not a baked template.
    //
    // AMENDED: the literal '@cratylus/canon' used to be
    // asserted here as the corpus `init` could only ever scaffold. It is read off
    // `DEFAULT_PLUGIN_PACKAGE` now, because the scaffold takes an override
    // (`scaffoldConfig(cwd, { plugin })`); the default value itself stays
    // gated in test/config/scaffold.test.ts, where the override is also proven.
    // What this line pins is unchanged: what `init` with no arguments produces.
    const code = await runInit({ cwd });
    expect(code).toBe(0);
    const configSrc = readFileSync(join(cwd, 'cratylus.config.ts'), 'utf8');
    expect(configSrc).toContain(
      `import canon from '${DEFAULT_PLUGIN_PACKAGE}'`,
    );
    expect(configSrc).toMatch(/extends:\s*\[canon\]/);
    expect(configSrc).toMatch(/patches:\s*\[\]/);

    // (2) that default plugin resolves through the NORMAL resolve() with empty
    // patches → the canon default fragment set: the defaults ARE a package, reached
    // like any other plugin rather than baked into the CLI. The
    // canon plugin self-locates its dirs at runtime; the test supplies the same
    // dir directly (forge cannot bare-import the peer package).
    const canon: AgentPlugin = {
      name: 'canon',
      manifest: FIXTURE_MANIFEST,
      fragments: CANON_DIMENSIONS,
    };
    const resolved = await resolveConfig({
      extends: [canon],
      patches: [],
    });
    expect(resolved.fragments.size).toBeGreaterThan(100);
    const byId = new Map(
      [...resolved.fragments.values()].map((r) => [r.fragment.id, r.value]),
    );
    expect(byId.get('canon:objective/parsimony')).toBe('parsimony');
  });

  it('init is idempotent: an existing cratylus.config.ts is left untouched', async () => {
    // The old `init` refused a second run because `.forge/` already
    // existed. With the IR home gone, `init` is exactly the config scaffold,
    // and the scaffold is idempotent rather than refusing.
    expect(await runInit({ cwd })).toBe(0);
    const first = readFileSync(join(cwd, 'cratylus.config.ts'), 'utf8');
    expect(await runInit({ cwd })).toBe(0);
    expect(readFileSync(join(cwd, 'cratylus.config.ts'), 'utf8')).toBe(first);
  });

  it('init writes no .forge/ IR home', async () => {
    expect(await runInit({ cwd })).toBe(0);
    expect(existsSync(join(cwd, '.forge'))).toBe(false);
  });
});

describe('init and add say what to do next', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'forge-cli-next-'));
  });
  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  it('init names the packages the scaffolded config needs installed', async () => {
    const { rc, out, err } = await capture(() => runInit({ cwd }));
    expect(rc).toBe(0);
    expect(err).toEqual([]);
    expect(out).toEqual([
      `scaffolded ${join(cwd, 'cratylus.config.ts')} (extends: ${DEFAULT_PLUGIN_PACKAGE})`,
      `next: npm i -D ${CONFIG_PACKAGE} ${DEFAULT_PLUGIN_PACKAGE}, then cratylus compose`,
    ]);
  });

  it('init installs the plugin it was told to extend, not the default', async () => {
    const { out } = await capture(() =>
      runInit({ cwd, plugin: '@acme/corpus' }),
    );
    expect(out.at(-1)).toContain(`npm i -D ${CONFIG_PACKAGE} @acme/corpus`);
    expect(out.at(-1)).not.toContain(DEFAULT_PLUGIN_PACKAGE);
  });

  it('init refuses an unusable --plugin as one stderr line', async () => {
    const { rc, out, err } = await capture(() => runInit({ cwd, plugin: ' ' }));
    expect(rc).toBe(1);
    expect(out).toEqual([]);
    expect(err).toHaveLength(1);
    expect(err[0]).toMatch(/^cratylus init: /);
  });

  it('add points at compose, a flag-free command, as its next step', async () => {
    await capture(() => runInit({ cwd }));
    const { rc, out } = await capture(() => runAdd({ cwd, plugin: '@acme/x' }));
    expect(rc).toBe(0);
    expect(out).toHaveLength(2);
    expect(out[1]).toMatch(/^next: npm i @acme\/x /);
    expect(out[1]).toMatch(/then cratylus compose$/);
    expect(out.join('\n')).not.toContain('--dry-run');
  });

  it('add without a config fails with one stderr line that names init', async () => {
    const { rc, out, err } = await capture(() =>
      runAdd({ cwd, plugin: '@acme/x' }),
    );
    expect(rc).toBe(1);
    expect(out).toEqual([]);
    expect(err).toHaveLength(1);
    expect(err[0]).toMatch(
      /^cratylus add: no cratylus\.config\.ts at .*cratylus init/,
    );
  });
});

describe('project writes the tree deploy reads, and says little', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'forge-cli-project-'));
    const fixtures = fileURLToPath(
      new URL('../project/fixtures', import.meta.url),
    );
    writeFileSync(
      join(cwd, 'cratylus.config.ts'),
      [
        `const plugin = { name: 'fixture', manifest: ${JSON.stringify(FIXTURE_MANIFEST)}, agents: ${JSON.stringify(join(fixtures, 'agents'))}, skills: ${JSON.stringify(join(fixtures, 'skills'))} };`,
        'export default { extends: [plugin], patches: [] };',
        '',
      ].join('\n'),
    );
  });
  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  it('defaults the render root to .cratylus/<harness> and prints a summary and the next step', async () => {
    const { rc, out, err } = await capture(() => runProject({ cwd }));
    expect(rc).toBe(0);
    expect(err).toEqual([]);
    expect(existsSync(join(cwd, '.cratylus', 'claude', 'agents'))).toBe(true);
    expect(existsSync(join(cwd, '.render'))).toBe(false);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatch(/^projected 1 agent\(s\) \+ 1 skill\(s\)/);
    expect(out[0]).toContain(join(cwd, '.cratylus', 'claude'));
    expect(out[1]).toBe('ship it with: cratylus deploy');
  });

  it('prints one EMIT line per file only under --verbose', async () => {
    const quiet = await capture(() => runProject({ cwd }));
    expect(quiet.out.some((l) => l.startsWith('EMIT'))).toBe(false);
    const verbose = await capture(() =>
      runProject({ cwd, out: join(cwd, 'r'), verbose: true }),
    );
    expect(verbose.out).toContain('EMIT agent probe');
    expect(verbose.out.some((l) => l.startsWith('EMIT skill '))).toBe(true);
  });

  it('points deploy at a render root it did not write to the default', async () => {
    const { out } = await capture(() =>
      runProject({ cwd, out: join(cwd, 'r') }),
    );
    expect(out.at(-1)).toBe(
      `ship it with: cratylus deploy --from ${join(cwd, 'r')}`,
    );
  });

  it('reports a harness it does not know as one stderr line, not a stack', async () => {
    const { rc, out, err } = await capture(() =>
      runProject({ cwd, harness: 'no-such-harness' }),
    );
    expect(rc).toBe(1);
    expect(out).toEqual([]);
    expect(err).toHaveLength(1);
    expect(err[0]).toMatch(
      /^cratylus project: unknown harness adapter 'no-such-harness'/,
    );
  });

  it('fails with one stderr line when the config extends nothing', async () => {
    writeFileSync(
      join(cwd, 'cratylus.config.ts'),
      'export default { extends: [], patches: [] };\n',
    );
    const { rc, out, err } = await capture(() => runProject({ cwd }));
    expect(rc).toBe(1);
    expect(out).toEqual([]);
    expect(err).toHaveLength(1);
    expect(err[0]).toMatch(
      /^cratylus project: .*cratylus\.config\.ts extends no plugins/,
    );
    expect(err[0]).toContain('cratylus add <package>');
  });
});

describe('optimize fails in the register', () => {
  it('refuses a missing --plan as one stderr line', async () => {
    const { rc, out, err } = await capture(() =>
      runOptimize({ source: 'anything' }),
    );
    expect(rc).toBe(1);
    expect(out).toEqual([]);
    expect(err).toHaveLength(1);
    expect(err[0]).toMatch(/^cratylus optimize: --plan is required/);
    expect(err[0]).toContain('--plan <file>');
  });
});

// The built command, in a plain `node` — where a missing package is node's own
// ERR_MODULE_NOT_FOUND and not vitest's resolver.
describe('the built command, in a project directory', () => {
  const BIN = fileURLToPath(
    new URL('../../../cli/dist/cratylus.js', import.meta.url),
  );
  const WORKSPACE = fileURLToPath(new URL('../../../', import.meta.url));
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'forge-cli-bin-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const cratylus = (...args: string[]) =>
    spawnSync(process.execPath, [BIN, ...args], { cwd: dir, encoding: 'utf8' });

  it.each(['compose', 'project', 'explain', 'catalog'])(
    '%s reports a package the config imports and does not have, in one line',
    (command) => {
      writeFileSync(
        join(dir, 'cratylus.config.ts'),
        "import x from 'not-installed-corpus';\nexport default { extends: [x], patches: [] };\n",
      );
      const run = cratylus(command);
      expect(run.status).toBe(1);
      expect(run.stdout).toBe('');
      const lines = run.stderr.split('\n').filter((l) => l !== '');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(new RegExp(`^cratylus ${command}: `));
      expect(lines[0]).toContain("'not-installed-corpus'");
      expect(lines[0]).toContain('npm i -D not-installed-corpus');
      expect(lines[0]).not.toContain('file://');
    },
  );

  it.each(['compose', 'project', 'explain', 'catalog'])(
    '%s names the file, line and column of a config that does not parse',
    (command) => {
      writeFileSync(
        join(dir, 'cratylus.config.ts'),
        'export default {\n  extends: [],\n  patches: { a: 1 b: 2 },\n};\n',
      );
      const run = cratylus(command);
      expect(run.status).toBe(1);
      expect(run.stdout).toBe('');
      const lines = run.stderr.split('\n').filter((l) => l !== '');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(new RegExp(`^cratylus ${command}: `));
      expect(lines[0]).toContain(`${join(dir, 'cratylus.config.ts')}:3:`);
      expect(lines[0]).toContain('does not parse');
      expect(lines[0]).toContain('fix the syntax');
    },
  );

  it.each(['compose', 'project', 'explain', 'catalog'])(
    '%s tells a config that extends nothing to add a plugin',
    (command) => {
      writeFileSync(
        join(dir, 'cratylus.config.ts'),
        'export default { extends: [], patches: [] };\n',
      );
      const run = cratylus(command);
      expect(run.status).toBe(1);
      expect(run.stdout).toBe('');
      const lines = run.stderr.split('\n').filter((l) => l !== '');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(new RegExp(`^cratylus ${command}: `));
      expect(lines[0]).toContain('extends no plugins');
      expect(lines[0]).toContain('cratylus add <package>');
    },
  );

  it('composes the config init scaffolded once the packages it names resolve', () => {
    expect(cratylus('init').status).toBe(0);
    // Without the packages, compose says which to install.
    const before = cratylus('compose');
    expect(before.status).toBe(1);
    expect(before.stderr).toContain(`npm i -D ${CONFIG_PACKAGE}`);
    // With them resolvable from the directory — what `npm i -D` would leave —
    // the scaffold composes.
    mkdirSync(join(dir, 'node_modules', '@cratylus'), { recursive: true });
    symlinkSync(
      join(WORKSPACE, 'cli'),
      join(dir, 'node_modules', CONFIG_PACKAGE),
    );
    symlinkSync(
      join(WORKSPACE, 'canon'),
      join(dir, 'node_modules', DEFAULT_PLUGIN_PACKAGE),
    );
    const after = cratylus('compose');
    expect(after.stderr).toBe('');
    expect(after.status).toBe(0);
    expect(
      after.stdout.split('\n').filter((l) => l !== '').length,
    ).toBeGreaterThan(100);
  });
});
