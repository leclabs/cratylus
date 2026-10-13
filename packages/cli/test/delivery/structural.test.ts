import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { join } from 'node:path';
import canon from '@cratylus/canon';
import { afterEach, expect, it } from 'vitest';
import { runInstall } from '../../../forge/src/cli/commands/install.js';
import type { Host } from '../capability-port/fixture.js';
import { run, toolText } from '../capability-port/fixture.js';
import { parseYaml } from '../yaml.js';
import {
  assertOwned,
  assertRemoved,
  earlier,
  earlierCommand,
  fresh,
  hostMaterial,
  install,
  load,
  noTap,
  normalizeProjection,
  owned,
  preserved,
  put,
  skew,
  success,
  toolJSON,
  traceCommand,
  tree,
  treeWithoutBindings,
  uninstall,
  version,
  versions,
} from './fixture.js';

let h: Host | undefined;
afterEach(() => {
  h?.dispose();
  h = undefined;
});
const negative = process.env.DELIVERY_NEGATIVE;

it('delivery/1 — one user installation is offered in existing and later projects, without changing another user', () => {
  h = fresh();
  const second = join(h.root, 'second-user');
  mkdirSync(second);
  put(join(second, '.omp/agent/config.yml'), 'theme: another-user\n');
  const otherBefore = tree(second);
  const projects = [h.cwd, join(h.root, 'project-two')];
  mkdirSync(projects[1]!);
  success(install(h));
  const afterInstall = tree(owned(h));
  projects.push(join(h.root, 'later-project'));
  mkdirSync(projects[2]!);
  expect(
    Object.keys(tree(join(owned(h), 'agents'))).filter((p) => p.endsWith('.md'))
      .length,
    'installed corpus agents',
  ).toBeGreaterThan(0);
  expect(
    Object.keys(tree(join(owned(h), 'skills'))).filter((p) =>
      p.endsWith('/SKILL.md'),
    ).length,
    'installed corpus skills',
  ).toBeGreaterThan(0);
  for (const cwd of projects)
    expect(tree(cwd)).not.toHaveProperty(
      '.cratylus/omp/extensions/cratylus.ts',
    );
  expect(tree(owned(h))).toEqual(afterInstall);
  expect(tree(second)).toEqual(otherBefore);
});

it('delivery/2 — every projected leaf belongs to the owned root and outside surfaces are references, never copies', () => {
  h = fresh();
  const before = tree(h.home);
  success(install(h));
  assertOwned(h, before);
  for (const directory of ['agents', 'skills', 'extensions'])
    expect(
      Object.keys(tree(join(owned(h), directory))).length,
      directory,
    ).toBeGreaterThan(0);
});

it('delivery/3 — colliding host agent, skill, extension and settings survive installation', () => {
  h = fresh();
  const material = hostMaterial(h);
  const before = tree(h.home);
  success(install(h));
  preserved(h, material);
  assertOwned(h, before);
});

it('delivery/4 — interactive install with all supplied answers asks nothing', async () => {
  h = fresh();
  const asked: string[] = [];
  const rc = await runInstall({
    harness: 'omp',
    home: h.home,
    cwd: h.cwd,
    corpus: canon,
    all: true,
    modelRoles: 'default',
    interactive: true,
    prompts: {
      harness: async () => {
        asked.push('harness');
        return 'omp';
      },
      practices: async (offered) => {
        asked.push('practices');
        return offered.map((p) => p.name);
      },
      routes: async () => {
        asked.push('models');
        return {};
      },
      agentStatus: async () => {
        asked.push('agent-status');
        return true;
      },
      confirm: async () => {
        asked.push('confirmation');
        return true;
      },
    },
  });
  if (negative === '4') asked.push('models'); // Negative recording: asks for a model answer already supplied.
  expect(rc).toBe(0);
  expect(asked, 'never re-ask a supplied answer or confirm it').toEqual([]);
});

it('delivery/5 — after an answer interactive install asks only missing information, never the harness or an answered question', async () => {
  h = fresh();
  const asked: string[] = [];
  const record = (name: string) => {
    asked.push(name);
  };
  const rc = await runInstall({
    harness: 'omp',
    home: h.home,
    cwd: h.cwd,
    corpus: canon,
    interactive: true,
    prompts: {
      harness: async () => {
        record('harness');
        return 'omp';
      },
      practices: async (offered) => {
        record('practices');
        return offered.map((p) => p.name);
      },
      routes: async () => {
        record('models');
        return {};
      },
      agentStatus: async () => {
        record('agent-status');
        return true;
      },
      confirm: async () => {
        record('confirmation');
        return true;
      },
    },
  });
  expect(rc).toBe(0);
  expect(asked).toContain('practices');
  if (negative === '5') asked.push('practices'); // Negative recording: a second request for the answered selection.
  expect(asked).not.toContain('harness');
  expect(asked.length, 'no answered question repeated').toBe(
    new Set(asked).size,
  );
});

it('delivery/6 — reinstalling the same version leaves the entire installation and changed host settings unchanged', async () => {
  h = fresh();
  success(install(h));
  const settings = join(h.home, '.omp/agent/config.yml');
  const c = parseYaml(
    existsSync(settings) ? readFileSync(settings, 'utf8') : '{}',
  ) as { modelRoles?: object };
  put(
    settings,
    `${JSON.stringify({ ...c, theme: 'mira-changed-theme', modelRoles: { ...c.modelRoles, frontier: 'host/changed-model' }, statusLine: { preset: 'custom', leftSegments: ['model'], rightSegments: ['cwd'], showHookStatus: false } })}\n`,
  );
  const before = tree(h.home);
  success(install(h));
  expect(tree(h.home)).toEqual(before);
  const ext = await load(h);
  try {
    expect(await versions(ext)).toMatchObject({
      artifacts: '2.4.0',
      command: '2.4.0',
    });
  } finally {
    ext.restore();
  }
});

it('delivery/7 — the version tool identifies the projecting build and the command reached, not another available build', async () => {
  h = fresh();
  const other = join(h.root, 'other-build');
  cpSync(h.prefix, other, { recursive: true, verbatimSymlinks: true });
  version(h, '2.6.0', other);
  h.env.PATH += `:${other}/node_modules/.bin`;
  success(install(h));
  const before = tree(h.home);
  const ext = await load(h);
  try {
    expect(await versions(ext)).toMatchObject({
      artifacts: '2.4.0',
      command: '2.4.0',
    });
    expect(tree(h.home)).toEqual(before);
  } finally {
    ext.restore();
  }
});

it('delivery/8 — a real earlier projection is replaced by exactly the new projection, not merged with removed agents or skills', async () => {
  h = fresh();
  const bindings = earlier(h);
  version(h, '2.5.0');
  success(install(h));
  preserved(h, bindings);
  const comparison = fresh();
  try {
    version(comparison, '2.5.0');
    success(install(comparison));
    expect(normalizeProjection(h)).toBe(normalizeProjection(comparison));
  } finally {
    comparison.dispose();
  }
  const all = JSON.stringify(treeWithoutBindings(h));
  expect(all).not.toMatch(/obsolete-agent|obsolete-skill/);
  assertOwned(
    h,
    Object.fromEntries(
      Object.entries(bindings).map(([path, text]) => [path, { text }]),
    ),
  );
  const ext = await load(h);
  try {
    expect(await versions(ext)).toMatchObject({
      artifacts: '2.5.0',
      command: '2.5.0',
    });
  } finally {
    ext.restore();
  }
});

it('delivery/8 — a genuine pre-digest installation leaves no earlier projection and keeps seeded bindings', () => {
  h = fresh();
  const bindings = earlier(h, 'pre-digest-installation.json');
  const manifest = JSON.parse(
    readFileSync(join(h.home, '.omp/.forge/deploy-manifest.json'), 'utf8'),
  );
  expect(manifest).not.toHaveProperty('digests');
  expect(existsSync(join(h.home, '.omp/agent/agents/implementer.md'))).toBe(
    true,
  );
  expect(existsSync(join(h.home, '.agents/skills/carry-on/SKILL.md'))).toBe(
    true,
  );
  version(h, '2.5.0');
  success(install(h));
  preserved(h, bindings);
  const comparison = fresh();
  try {
    version(comparison, '2.5.0');
    success(install(comparison));
    expect(normalizeProjection(h)).toBe(normalizeProjection(comparison));
  } finally {
    comparison.dispose();
  }
  assertOwned(
    h,
    Object.fromEntries(
      Object.entries(bindings).map(([path, text]) => [path, { text }]),
    ),
  );
});

it('delivery/8 — no earlier same-name agent outside the root survives the upgrade', () => {
  h = fresh();
  const bindings = earlier(h, 'pre-digest-installation.json');
  const oldArchitect = join(h.home, '.omp/agent/agents/architect.md');
  expect(
    existsSync(oldArchitect),
    'real earlier declaration outside the root',
  ).toBe(true);
  version(h, '2.5.0');
  success(install(h));
  preserved(h, bindings);
  for (const path of Object.keys(tree(join(owned(h), 'agents')))) {
    if (!path.endsWith('.md')) continue;
    const outside = join(h.home, '.omp/agent/agents', path);
    if (!existsSync(outside)) continue;
    expect(
      realpathSync(outside),
      `${path} resolves to the new declaration, not an earlier same-name copy`,
    ).toBe(realpathSync(join(owned(h), 'agents', path)));
  }
});

it('delivery/9 — upgrade discards all inside-root edits and additions but preserves an outside skill edit', () => {
  h = fresh();
  const bindings = earlier(h);
  success(install(h));
  preserved(h, bindings);
  const skill = join(owned(h), 'skills/conceptualize/SKILL.md');
  put(skill, 'Mira changed installed content');
  put(join(owned(h), 'local/addition.txt'), 'Mira local addition');
  const outside = join(h.home, '.agents/skills/host-skill/SKILL.md');
  put(outside, 'Mira edited the outside skill');
  version(h, '2.5.0');
  success(install(h));
  preserved(h, bindings);
  expect(readFileSync(skill, 'utf8')).not.toContain('Mira changed');
  expect(existsSync(join(owned(h), 'local'))).toBe(false);
  expect(readFileSync(outside, 'utf8')).toBe('Mira edited the outside skill');
  const comparison = fresh();
  try {
    version(comparison, '2.5.0');
    success(install(comparison));
    expect(normalizeProjection(h)).toBe(normalizeProjection(comparison));
  } finally {
    comparison.dispose();
  }
});

it('delivery/10 — upgrade rewrites every reference while retaining the host references and settings on shared surfaces', () => {
  h = fresh();
  const bindings = earlier(h);
  const material = hostMaterial(h, bindings);
  version(h, '2.5.0');
  success(install(h));
  if (negative === '10-bindings') {
    // Negative recording: upgrade drops a seeded answer because its agent retired.
    const config = join(h.home, '.omp/agent/config.yml');
    const changed = parseYaml(readFileSync(config, 'utf8')) as {
      modelRoles: Record<string, unknown>;
    };
    const { 'obsolete-agent': _retired, ...modelRoles } = changed.modelRoles;
    put(config, `${JSON.stringify({ ...changed, modelRoles })}\n`);
  }
  preserved(h, bindings);
  preserved(h, material);
  const all = JSON.stringify(treeWithoutBindings(h));
  expect(all).not.toMatch(/obsolete-agent|obsolete-skill/);
  assertOwned(
    h,
    Object.fromEntries(
      Object.entries(material).map(([path, text]) => [path, { text }]),
    ),
  );
});

it.each(['redirected', 'replaced'])(
  'delivery/10 — upgrade preserves a host-%s installation reference location',
  (change) => {
    h = fresh();
    success(install(h));
    const reference = Object.entries(tree(h.home)).find(
      ([path, item]) =>
        !path.startsWith('.cratylus/omp/') &&
        item.link?.includes('.cratylus/omp'),
    );
    expect(reference, 'an installed root reference').toBeDefined();
    const path = join(h.home, reference![0]);
    rmSync(path, { recursive: true, force: true });
    const text =
      '---\nname: mira-replacement\ndescription: Host replacement\n---\nHost-owned material.\n';
    if (change === 'redirected') {
      const target = join(h.home, 'mira/skill');
      put(join(target, 'SKILL.md'), text);
      symlinkSync(target, path);
    } else put(join(path, 'SKILL.md'), text);
    const before = tree(h.home);
    version(h, '2.5.0');
    success(install(h));
    const after = tree(h.home);
    // Negative observation: upgrade erased the directory the host put at the old link.
    if (negative === '10-reference' && change === 'replaced')
      delete after[`${reference![0]}/SKILL.md`];
    for (const [name, value] of Object.entries(before))
      if (
        name === reference![0] ||
        name.startsWith(`${reference![0]}/`) ||
        name.startsWith('mira/')
      )
        expect(
          after[name],
          'host replacement is not an obsolete cratylus reference',
        ).toEqual(value);
    expect(existsSync(join(owned(h), 'extensions/cratylus.ts'))).toBe(true);
  },
);

it('delivery/11 — uninstall removes the whole root and all its references, never customized host surfaces', () => {
  h = fresh();
  const material = hostMaterial(h);
  success(install(h));
  put(join(owned(h), 'local/addition.txt'), 'inside root');
  success(uninstall(h));
  assertRemoved(h);
  preserved(h, material);
});

it.each([
  'missing-record',
  'empty-record',
  'malformed-record',
  'removed-root',
  'unrecorded-reference',
])(
  'delivery/11 — uninstall follows reference targets despite a %s and keeps shared host surfaces',
  (damage) => {
    h = fresh();
    const material = hostMaterial(h);
    const pluginManifest = join(h.home, '.omp/plugins/package.json');
    const hostPlugin = join(h.home, 'mira-plugin');
    put(
      join(hostPlugin, 'package.json'),
      '{"name":"mira-plugin","version":"1.0.0"}',
    );
    put(
      pluginManifest,
      JSON.stringify({
        private: true,
        dependencies: { 'mira-plugin': `file://${hostPlugin}` },
      }),
    );
    mkdirSync(join(h.home, '.omp/plugins/node_modules'), { recursive: true });
    symlinkSync(
      hostPlugin,
      join(h.home, '.omp/plugins/node_modules/mira-plugin'),
    );
    success(install(h));
    const shared = JSON.parse(readFileSync(pluginManifest, 'utf8'));
    expect(shared.dependencies['cratylus-omp']).toContain(owned(h));
    shared.description = 'Mira customized this shared surface after install';
    shared.dependencies['earlier-projection'] = `file://${owned(h)}`;
    symlinkSync(
      '../../../.cratylus/omp',
      join(h.home, '.omp/plugins/node_modules/earlier-projection'),
    );
    put(pluginManifest, JSON.stringify(shared));
    put(join(owned(h), 'local/addition.txt'), 'inside root');
    const record = join(owned(h), 'installation.json');
    if (damage === 'missing-record') rmSync(record);
    if (damage === 'empty-record') put(record, '{"references":[]}');
    if (damage === 'malformed-record') put(record, '{host edit');
    if (damage === 'removed-root') rmSync(owned(h), { recursive: true });
    success(uninstall(h));
    assertRemoved(h);
    preserved(h, material);
    expect(JSON.parse(readFileSync(pluginManifest, 'utf8'))).toEqual({
      private: true,
      description: shared.description,
      dependencies: { 'mira-plugin': `file://${hostPlugin}` },
    });
    expect(
      realpathSync(join(h.home, '.omp/plugins/node_modules/mira-plugin')),
    ).toBe(hostPlugin);
  },
);

it('delivery/12 — uninstall reaches all projects but neither their records nor a second user installation', () => {
  h = fresh();
  success(install(h));
  const second = join(h.root, 'second-user');
  mkdirSync(second);
  success(install(h, second));
  const secondBefore = tree(second);
  const projects = [
    h.cwd,
    join(h.root, 'project-two'),
    join(h.root, 'later-project'),
  ];
  for (const cwd of projects) {
    mkdirSync(cwd, { recursive: true });
    success(run('git', ['init', '--initial-branch=journal'], cwd, h.env));
    success(
      h.command(
        [
          'concepts',
          'context',
          'booking',
          '--subject',
          'This project schedules deliveries',
        ],
        cwd,
      ),
    );
    success(
      h.command(
        [
          'concepts',
          'define',
          'delivery window',
          '--context',
          'booking',
          '--wording',
          'A reserved hour',
          '--reason',
          'Project design',
        ],
        cwd,
      ),
    );
    put(join(cwd, 'work.txt'), 'project work');
  }
  const before = projects.map((cwd) => tree(cwd));
  success(uninstall(h));
  for (const [i, cwd] of projects.entries())
    expect(tree(cwd)).toEqual(before[i]);
  expect(tree(second)).toEqual(secondBefore);
  assertRemoved(h);
});

it('delivery/13 — both starts immediately warn about skew without invoking a tool, changing installation or selecting a build', async () => {
  h = fresh();
  success(install(h));
  version(h, '2.5.0');
  const before = tree(h.home);
  for (let i = 0; i < 2; i++) {
    const ext = await load(h);
    try {
      await ext.start();
      skew(ext.notifications, '2.4.0', '2.5.0');
      expect(tree(h.home)).toEqual(before);
      expect(success(h.command(['--version'])).trim()).toBe('2.5.0');
    } finally {
      ext.restore();
    }
  }
});

it('delivery/14 — matching versions are silent at startup and both remain queryable', async () => {
  h = fresh();
  success(install(h));
  const ext = await load(h);
  try {
    await ext.start();
    expect(ext.notifications.filter((n) => n.level === 'warning')).toEqual([]);
    expect(await versions(ext)).toMatchObject({
      artifacts: '2.4.0',
      command: '2.4.0',
    });
  } finally {
    ext.restore();
  }
});

it('delivery/15 — reinstalling with the reached command replaces the recorded version and resolves the startup warning', async () => {
  h = fresh();
  success(install(h));
  version(h, '2.5.0');
  const before = await load(h);
  try {
    await before.start();
    skew(before.notifications, '2.4.0', '2.5.0');
  } finally {
    before.restore();
  }
  success(install(h));
  const after = await load(h);
  try {
    await after.start();
    expect(await versions(after)).toMatchObject({
      artifacts: '2.5.0',
      command: '2.5.0',
    });
    expect(after.notifications.filter((n) => n.level === 'warning')).toEqual(
      [],
    );
  } finally {
    after.restore();
  }
});

it('delivery/13 — each startup reports a genuinely earlier command even when it cannot explain version skew', async () => {
  h = fresh();
  success(install(h));
  const old = earlierCommand(h);
  const snapshot = tree(h.home);
  for (let i = 0; i < 2; i++) {
    const ext = await load(h);
    try {
      await ext.start();
      skew(ext.notifications, '2.4.0', old.version);
      expect(tree(h.home)).toEqual(snapshot);
      expect(success(h.command(['--version'])).trim()).toBe(old.version);
    } finally {
      ext.restore();
    }
  }
});

it('delivery/14 — matching an actual earlier command stays silent with both versions queryable', async () => {
  h = fresh();
  version(h, '0.11.0');
  success(install(h));
  const old = earlierCommand(h);
  const ext = await load(h);
  try {
    await ext.start();
    expect(
      ext.notifications.filter(
        (n) => n.level === 'warning' && /skew/i.test(n.text),
      ),
    ).toEqual([]);
    expect(await versions(ext)).toEqual({
      artifacts: old.version,
      command: old.version,
    });
  } finally {
    ext.restore();
  }
});

it('delivery/15 — restoring the current command and reinstalling resolves real-build skew', async () => {
  h = fresh();
  success(install(h));
  const old = earlierCommand(h);
  const before = await load(h);
  try {
    await before.start();
    skew(before.notifications, '2.4.0', old.version);
  } finally {
    before.restore();
  }
  old.restore();
  version(h, '2.5.0');
  success(install(h));
  const after = await load(h);
  try {
    await after.start();
    expect(await versions(after)).toEqual({
      artifacts: '2.5.0',
      command: '2.5.0',
    });
    expect(after.notifications.filter((n) => n.level === 'warning')).toEqual(
      [],
    );
  } finally {
    after.restore();
  }
});

it('delivery/16 — a project-pinned 2.6.0 never redirects either installed 2.4.0 route or causes a warning', async () => {
  h = fresh();
  success(install(h));
  const pinned = join(h.cwd, 'pinned');
  cpSync(h.prefix, pinned, { recursive: true, verbatimSymlinks: true });
  version(h, '2.6.0', pinned);
  symlinkSync(join(pinned, 'node_modules'), join(h.cwd, 'node_modules'), 'dir');
  put(join(h.cwd, 'package.json'), '{"dependencies":{"cratylus":"2.6.0"}}');
  h.seed();
  const calls = traceCommand(h);
  const ext = await load(h);
  try {
    await ext.start();
    expect(await versions(ext)).toMatchObject({
      artifacts: '2.4.0',
      command: '2.4.0',
    });
    expect(ext.notifications.filter((n) => n.level === 'warning')).toEqual([]);
    const before = calls().length;
    expect(
      toolJSON(await ext.call('concept_journal', { verb: 'state' })),
    ).toEqual(h.concepts('state'));
    const reached = calls()
      .slice(before)
      .filter((c) => c.args[0] === 'concepts' && c.args[1] === 'state');
    expect(reached.length).toBeGreaterThanOrEqual(2);
    expect(reached.every((c) => c.version === '2.4.0')).toBe(true);
    expect(success(h.command(['--version'])).trim()).toBe('2.4.0');
  } finally {
    ext.restore();
  }
});

it('delivery/17 — command and tool share journal writes and supersession through the installed runtime with no source path', async () => {
  h = fresh();
  success(install(h));
  h.seed();
  h.concepts(
    'define',
    'delivery window',
    '--context',
    'booking',
    '--wording',
    'A two-hour interval.',
    '--reason',
    'First design',
  );
  const ext = await load(h);
  try {
    const observed = toolJSON(
      await ext.call('concept_journal', { verb: 'state' }),
    );
    const initial = negative === '17' ? {} : observed; // Negative recording: adapter returns its own empty design.
    expect(JSON.stringify(initial)).toContain('A two-hour interval.');
    const changed = await ext.call('concept_journal', {
      verb: 'supersede',
      concept: 'delivery window',
      context: 'booking',
      wording: 'A one-hour interval.',
      reason: 'Revised design',
    });
    expect(changed.isError).not.toBe(true);
    const after = h.concepts('state');
    expect(JSON.stringify(after)).toContain('A one-hour interval.');
    expect(
      toolJSON(await ext.call('concept_journal', { verb: 'state' })),
    ).toEqual(after);
    expect(h.env.PATH).not.toContain('/workspaces/cratylus');
  } finally {
    ext.restore();
  }
});

it('delivery/18 — command and tool report the same missing-decision refusal without changing the journal', async () => {
  h = fresh();
  success(install(h));
  h.seed();
  const before = tree(h.cwd);
  const command = h.command(['concepts', 'accept', 'missing-decision']);
  const ext = await load(h);
  try {
    const result = await ext.call('concept_journal', {
      verb: 'accept',
      id: 'missing-decision',
    });
    if (negative === '18') result.isError = false;
    expect(command.code).not.toBe(0);
    expect(result.isError).toBe(true);
    expect(toolText(result)).toContain(command.stderr.trim());
    expect(command.stderr).toMatch(/missing-decision/);
    expect(tree(h.cwd)).toEqual(before);
  } finally {
    ext.restore();
  }
});

it('delivery/19 — the event tap is absent from delivered commands, projection and harness tools, including hidden or disabled forms', async () => {
  h = fresh();
  success(install(h));
  noTap(h);
  const ext = await load(h);
  try {
    expect(ext.tools.map((t) => t.name).join(' ')).not.toMatch(
      /event[-_ ]?tap/i,
    );
  } finally {
    ext.restore();
  }
});

it('delivery/20 — upgrading a real event-tap installation removes its material and references but keeps unrelated extensions', () => {
  h = fresh();
  const bindings = earlier(h);
  put(
    join(h.home, '.omp/agent/extensions/unrelated.ts'),
    'export default function unrelated() {}\n',
  );
  success(install(h));
  preserved(h, bindings);
  noTap(h);
  expect(
    readFileSync(join(h.home, '.omp/agent/extensions/unrelated.ts'), 'utf8'),
  ).toBe('export default function unrelated() {}\n');
  assertOwned(h, {
    ...Object.fromEntries(
      Object.entries(bindings).map(([path, text]) => [path, { text }]),
    ),
    '.omp/agent/extensions/unrelated.ts': {
      text: 'export default function unrelated() {}\n',
    },
  });
});
