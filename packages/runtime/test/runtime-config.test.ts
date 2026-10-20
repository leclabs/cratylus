// The host runtime config — what the projection told this host: each capability's
// configuration. A config carrying none says nothing.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { dispatchVersionSkew } from '../src/capabilities/version-skew/index.js';
import {
  NoInstallationError,
  deliveredContexts,
  installationRoot,
  installationScope,
  loadRuntimeConfig,
} from '../src/runtime-config.js';

const ENV = 'AGENT_RUNTIME_CONFIG';
afterEach(() => {
  delete process.env[ENV];
  vi.unstubAllEnvs();
});

const scratch: string[] = [];
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), 'rt-cfg-'));
  scratch.push(d);
  return d;
}
afterAll(() => {
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
});

describe('the host runtime config', () => {
  it('an absent config reads as null', () => {
    process.env[ENV] = join(tmpdir(), 'definitely-absent-runtime.json');
    expect(loadRuntimeConfig()).toBeNull();
  });

  it('a configuration block is a real config, each capability’s entry intact', () => {
    // Corpus meaning a capability acts on arrives as its configuration entry.
    const root = tmp();
    const cfg = join(root, 'runtime.json');
    const entry = { lifecycle: { states: ['a', 'b'], final: 'b' } };
    writeFileSync(cfg, JSON.stringify({ configuration: { someCap: entry } }));
    process.env[ENV] = cfg;

    const loaded = loadRuntimeConfig();
    expect(loaded).toEqual({ configuration: { someCap: entry } });
  });

  it('a malformed or empty configuration block says nothing, without wedging the load', () => {
    const root = tmp();
    const cfg = join(root, 'runtime.json');
    process.env[ENV] = cfg;
    for (const malformed of [['someCap'], 'someCap', 7, null, {}]) {
      writeFileSync(cfg, JSON.stringify({ configuration: malformed }));
      expect(loadRuntimeConfig()).toBeNull();
    }
  });

  it('a malformed config reads as null rather than wedging', () => {
    const root = tmp();
    const cfg = join(root, 'runtime.json');
    writeFileSync(cfg, '{ not json');
    process.env[ENV] = cfg;
    expect(loadRuntimeConfig()).toBeNull();
  });
});

describe('the installation the command reads', () => {
  /** An installation at `root`: its version, and its record saying `scope` where
   *  `record` is given; an author's render tree where `record` is false. */
  function place(
    root: string,
    record: { scope?: string } | false = {},
  ): string {
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, 'package.json'), '{"version":"2.4.0"}');
    if (record !== false)
      writeFileSync(join(root, 'installation.json'), JSON.stringify(record));
    return root;
  }
  /** A home holding the user's installation, and a project under it whose
   *  working directory is two levels down. */
  function host(): {
    home: string;
    user: string;
    project: string;
    cwd: string;
  } {
    const base = tmp();
    const home = join(base, 'home');
    const user = place(join(home, '.cratylus', 'omp'), { scope: 'user' });
    const project = join(home, 'work', 'app');
    const cwd = join(project, 'src', 'deep');
    mkdirSync(cwd, { recursive: true });
    vi.stubEnv('HOME', home);
    vi.stubEnv('CRATYLUS_INSTALLATION', '');
    return { home, user, project, cwd };
  }

  it('is the project installation nearest above the working directory, over the home’s', () => {
    const { project, cwd, user } = host();
    const installed = place(join(project, '.cratylus', 'omp'), {
      scope: 'project',
    });
    expect(installationRoot(cwd)).toBe(installed);
    expect(installationRoot(project)).toBe(installed);
    expect(installationRoot(join(project, '..'))).toBe(user);
  });

  it('is the nearest of nested project installations: the inner from inside it, the outer from outside it', () => {
    const { project, cwd } = host();
    const outer = place(join(project, '.cratylus', 'omp'), {
      scope: 'project',
    });
    const nested = join(project, 'packages', 'inner');
    const inner = place(join(nested, '.cratylus', 'omp'), {
      scope: 'project',
    });
    mkdirSync(join(nested, 'src'), { recursive: true });
    expect(installationRoot(join(nested, 'src'))).toBe(inner);
    expect(installationRoot(nested)).toBe(inner);
    expect(installationRoot(cwd)).toBe(outer);
    expect(installationRoot(join(project, 'packages'))).toBe(outer);
  });

  it('never takes the home’s own .cratylus as a project installation, even where its record says project', () => {
    const { home, cwd } = host();
    // The home's record says project; were the walk to take it, it would be the one
    // project installation there. The home rule sees two installations and refuses.
    place(join(home, '.cratylus', 'omp'), { scope: 'project' });
    place(join(home, '.cratylus', 'other'), { scope: 'user' });
    expect(() => installationRoot(cwd)).toThrow(NoInstallationError);
    expect(() => installationRoot(cwd)).toThrow(/2 installations under/);
    expect(() => installationRoot(home)).toThrow(/2 installations under/);
  });

  it('is never an author’s render tree, which has no installation record', () => {
    const { project, cwd, user } = host();
    place(join(project, '.cratylus', 'omp'), false);
    expect(installationRoot(cwd)).toBe(user);
  });

  it('is never a tree whose record says no project scope', () => {
    const { project, cwd, user } = host();
    place(join(project, '.cratylus', 'omp'), {});
    expect(installationRoot(cwd)).toBe(user);
  });

  it('is the one $CRATYLUS_INSTALLATION names, over a project installation', () => {
    const { project, cwd } = host();
    place(join(project, '.cratylus', 'omp'), { scope: 'project' });
    const named = place(join(tmp(), 'named'));
    vi.stubEnv('CRATYLUS_INSTALLATION', named);
    expect(installationRoot(cwd)).toBe(named);
  });

  it('records its scope, a record without one, or none, reading as the user’s', () => {
    const base = tmp();
    expect(
      installationScope(place(join(base, 'p'), { scope: 'project' })),
    ).toBe('project');
    expect(installationScope(place(join(base, 'u'), { scope: 'user' }))).toBe(
      'user',
    );
    expect(installationScope(place(join(base, 'old'), {}))).toBe('user');
    expect(installationScope(place(join(base, 'none'), false))).toBe('user');
  });

  it('is reported with its scope and root by versionSkew report', () => {
    const root = place(join(tmp(), 'app', '.cratylus', 'omp'), {
      scope: 'project',
    });
    vi.stubEnv('CRATYLUS_INSTALLATION', root);
    expect(dispatchVersionSkew(['report'], { version: '2.5.0' })).toEqual({
      artifacts: '2.4.0',
      command: '2.5.0',
      scope: 'project',
      installation: root,
    });
  });

  /** Writes `fields` as the delivered document `<origin>/<file>` of `root`. */
  function deliver(
    root: string,
    origin: string,
    file: string,
    fields: Record<string, unknown>,
  ): void {
    mkdirSync(join(root, 'delivered', origin), { recursive: true });
    writeFileSync(
      join(root, 'delivered', origin, file),
      JSON.stringify({
        origin,
        version: '2.4.0',
        context: file.replace(/\.json$/, ''),
        identity: `${origin}-${file}`,
        subject: 'S.',
        relation: 'R.',
        concepts: [],
        ...fields,
      }),
    );
  }

  it('delivers its contexts by origin, then position, never by file name', () => {
    const root = place(join(tmp(), 'omp'), { scope: 'user' });
    vi.stubEnv('CRATYLUS_INSTALLATION', root);
    // File-name order in each origin is the reverse of position order, and the
    // origins' contexts interleave by position.
    deliver(root, 'b', 'a.json', { position: 1 });
    deliver(root, 'b', 'z.json', { position: 0 });
    deliver(root, 'a', 'a.json', { position: 2 });
    deliver(root, 'a', 'm.json', { position: 1 });
    deliver(root, 'a', 'z.json', { position: 0 });
    expect(deliveredContexts().map((d) => `${d.origin}:${d.context}`)).toEqual([
      'a:z',
      'a:m',
      'a:a',
      'b:z',
      'b:a',
    ]);
  });

  it('refuses a delivered document an earlier cratylus projected, naming the installation and the remedy', () => {
    const root = place(join(tmp(), 'app', '.cratylus', 'omp'), {
      scope: 'project',
    });
    vi.stubEnv('CRATYLUS_INSTALLATION', root);
    deliver(root, 'cratylus', 'workflow.json', {});
    expect(() => deliveredContexts()).toThrow(
      `${join(root, 'delivered', 'cratylus', 'workflow.json')} carries no position: the project installation at ${root} was projected by an earlier cratylus; install again with the cratylus in use, at its project scope`,
    );
  });
});
