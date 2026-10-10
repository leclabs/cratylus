// OMP's status-line editor preserves host configuration while adding only what the
// status segment needs. These byte-level assertions cover user-owned config files.

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { kebabToCamel } from '@cratylus/schema';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import { runInstall } from '../../src/cli/commands/install.js';
import type { StatusSegmentHost } from '../../src/core/harness-adapter.js';
import { ensureStatusSegment } from '../../src/deploy/status-line.js';
import type { ProjectablePlugin } from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import { FIXTURE_PRACTICE, fixturePractices } from './helpers.js';

const roots: string[] = [];
function tmpRoot(): string {
  const r = mkdtempSync(join(tmpdir(), 'status-line-'));
  roots.push(r);
  return r;
}
afterEach(() => {
  vi.restoreAllMocks();
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots.length = 0;
});

/** Write `content` (or nothing) at a fresh path; hand back the path and a reader. */
function file(name: string, content: string | null) {
  const path = join(tmpRoot(), name);
  if (content !== null) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  return {
    path,
    read: () => (existsSync(path) ? readFileSync(path, 'utf8') : null),
  };
}

// ── omp: config.yml ──────────────────────────────────────────────────────────

// The default preset's own layout, written out the way install writes it — literal, so
// a drift in what the adapter declares is red here and not merely mirrored.
const DEFAULT_LEFT = [
  'pi',
  'vim',
  'model',
  'mode',
  'collab',
  'stream',
  'path',
  'git',
  'pr',
  'context_pct',
  'cost',
  'status',
];
const PRESET = (i: string) => [`${i}preset: custom`];
const LEFT_OF = (i: string, items: readonly string[]) => [
  `${i}leftSegments:`,
  ...items.map((s) => `${i}  - ${s}`),
];
const LEFT = (i: string) => LEFT_OF(i, DEFAULT_LEFT);
const RIGHT = (i: string) => [`${i}rightSegments:`, `${i}  - session_name`];
const OPTIONS = (i: string) => [
  `${i}segmentOptions:`,
  `${i}  model:`,
  `${i}    showThinkingLevel: true`,
  `${i}  path:`,
  `${i}    abbreviate: true`,
  `${i}    maxLength: 40`,
  `${i}    stripWorkPrefix: true`,
  `${i}  git:`,
  `${i}    showBranch: true`,
  `${i}    showStaged: true`,
  `${i}    showUnstaged: true`,
  `${i}    showUntracked: true`,
];
// The row omp prints beneath the editor repeating every extension's status: off, so the
// status segment appears only once in the configured line.
const HOOKS = (i: string) => [`${i}showHookStatus: false`];
const FULL = (i: string) =>
  [...PRESET(i), ...LEFT(i), ...RIGHT(i), ...OPTIONS(i), ...HOOKS(i)].join(
    '\n',
  );

describe('ensureStatusSegment', () => {
  const OMP = adapterByName('omp').statusSegment as StatusSegmentHost;
  const ensure = (path: string, dry = false) =>
    ensureStatusSegment(path, OMP, { dry });
  const CUSTOM_LEFT = ['vim', 'model', 'mode', 'path', 'git', 'pr'];
  const HOOK_LINE = '  showHookStatus: false\n';

  it('appends the default preset’s whole layout under custom where the host has no statusLine', () => {
    const host = '# host config\ntheme: dark\nmodelRoles:\n  default: "@x"\n';
    const f = file('config.yml', host);
    const r = ensure(f.path);
    expect(r).toMatchObject({ state: 'added', wrote: true });
    expect(r.written).toEqual([
      'preset: custom',
      `leftSegments: ${DEFAULT_LEFT.join(', ')}`,
      'rightSegments: session_name',
      'segmentOptions: model, path, git',
      'showHookStatus: false',
    ]);
    expect(f.read()).toBe(`${host}statusLine:\n${FULL('  ')}\n`);
  });

  it('creates the file where the host has no config, and appends after an unterminated last line', () => {
    const absent = file('agent/config.yml', null);
    ensure(absent.path);
    expect(absent.read()).toBe(`statusLine:\n${FULL('  ')}\n`);

    const cut = file('config.yml', 'theme: dark');
    ensure(cut.path);
    expect(cut.read()).toBe(`theme: dark\nstatusLine:\n${FULL('  ')}\n`);
  });

  it('fills in a statusLine with no preset after its last entry, at its own indentation, keeping every key the host set', () => {
    const f = file(
      'config.yml',
      'statusLine:\n   separator: pipe # mine\n   transparent: true\ntheme: dark\n',
    );
    expect(ensure(f.path).state).toBe('added');
    expect(f.read()).toBe(
      `statusLine:\n   separator: pipe # mine\n   transparent: true\n${FULL('   ')}\ntheme: dark\n`,
    );
  });

  it.each([
    ['leftSegments', '  leftSegments:\n    - model\n', ['leftSegments']],
    ['rightSegments', '  rightSegments: [cost]\n', ['rightSegments']],
    [
      'a leftSegments that already lists status',
      '  leftSegments: [vim, status]\n  rightSegments: []\n',
      ['leftSegments', 'rightSegments'],
    ],
  ])(
    'leaves a no-preset host with its own %s byte-identical and gives the whole default block, segment options and all',
    (_n, rest, keys) => {
      // Under the default preset omp ignores the lists, and custom would make them the
      // whole line: not ours to do.
      const host = `statusLine:\n${rest}theme: dark\n`;
      const f = file('config.yml', host);
      const r = ensure(f.path);
      expect(r).toMatchObject({ state: 'own-layout', wrote: false, keys });
      expect(f.read()).toBe(host);
      const advice = (r.advice ?? []).join('\n');
      expect(advice).toContain(
        `statusLine:\n${FULL('  ')}`.replace(/\n/g, '\n      '),
      );
      expect(advice).not.toContain('KEEP your `segmentOptions`');
      expect(advice).toContain('would change the line');
    },
  );

  it('offers a host with its own leftSegments the way to make its own layout live, and one with only rightSegments not', () => {
    const f = file('config.yml', 'statusLine:\n  leftSegments: [model]\n');
    expect((ensure(f.path).advice ?? []).join('\n')).toContain(
      'put `status` last in your `leftSegments`',
    );
    const right = file('config.yml', 'statusLine:\n  rightSegments: [cost]\n');
    expect((ensure(right.path).advice ?? []).join('\n')).not.toContain(
      'or use your own layout',
    );
  });

  it.each([
    [
      'segmentOptions alone',
      '  segmentOptions:\n    path:\n      maxLength: 12\n',
      ['segmentOptions'],
    ],
    [
      'all of them, with a separator',
      '  leftSegments: [model]\n  rightSegments: [cost]\n  separator: ascii\n  segmentOptions:\n    path:\n      maxLength: 12\n',
      ['leftSegments', 'rightSegments', 'segmentOptions'],
    ],
  ])(
    'keeps a no-preset host’s own segmentOptions in the advice (%s): it never says to replace them',
    (_n, rest, keys) => {
      const host = `statusLine:\n${rest}theme: dark\n`;
      const f = file('config.yml', host);
      const r = ensure(f.path);
      expect(r).toMatchObject({ state: 'own-layout', wrote: false, keys });
      expect(f.read()).toBe(host);
      const lines = r.advice ?? [];
      const advice = lines.join('\n');
      // The block to write has the preset, the two lists and the hook switch, and NO
      // segmentOptions between them: the host's own stay where they are.
      const start = lines.indexOf('      statusLine:');
      const end = lines.indexOf('        showHookStatus: false');
      expect(lines.slice(start, end + 1)).toEqual([
        '      statusLine:',
        ...PRESET('        '),
        ...LEFT('        '),
        ...RIGHT('        '),
        ...HOOKS('        '),
      ]);
      expect(advice).toContain('KEEP your `segmentOptions` as they are');
      // What custom no longer supplies is offered for whatever the host did not set.
      expect(advice).toContain(
        'for any you did not set, keeping the value of each you did',
      );
      expect(advice).toContain(OPTIONS('        ').join('\n'));
    },
  );

  it('keeps the host’s own segmentOptions in the advice under `preset: default` written out', () => {
    const f = file(
      'config.yml',
      'statusLine:\n  preset: default\n  segmentOptions:\n    path:\n      maxLength: 12\n',
    );
    const lines = ensure(f.path).advice ?? [];
    expect(lines.join('\n')).toContain(
      'KEEP your `segmentOptions` as they are',
    );
    const start = lines.indexOf('  statusLine:');
    const end = lines.indexOf('    showHookStatus: false');
    expect(lines.slice(start, end + 1)).not.toContain('    segmentOptions:');
  });

  it('does not treat a separator alone as a layout of its own: it applies under every preset', () => {
    const f = file('config.yml', 'statusLine:\n  separator: ascii\n');
    expect(ensure(f.path).state).toBe('added');
    expect(f.read()).toBe(`statusLine:\n  separator: ascii\n${FULL('  ')}\n`);
  });

  it('writes nothing under dry-run for a host with a layout of its own either', () => {
    const host = 'statusLine:\n  leftSegments: [model]\n';
    const f = file('config.yml', host);
    expect(ensure(f.path, true).state).toBe('own-layout');
    expect(f.read()).toBe(host);
  });

  it('writes only the preset and what is missing for a host that set a showHookStatus alone', () => {
    const f = file('config.yml', 'statusLine:\n  showHookStatus: true\n');
    expect(ensure(f.path).written).toEqual([
      'preset: custom',
      `leftSegments: ${DEFAULT_LEFT.join(', ')}`,
      'rightSegments: session_name',
      'segmentOptions: model, path, git',
    ]);
  });

  it('never changes a showHookStatus the host set, whatever its value', () => {
    for (const value of ['true', 'false']) {
      const host = `statusLine:\n  showHookStatus: ${value}\n`;
      const f = file('config.yml', host);
      const r = ensure(f.path);
      expect(r.written).not.toContain('showHookStatus: false');
      expect(f.read()).toContain(`  showHookStatus: ${value}\n`);
      expect(f.read()?.match(/showHookStatus/g)).toHaveLength(1);
    }
  });

  describe('on the custom preset', () => {
    const custom = (rest: string) => `statusLine:\n  preset: custom\n${rest}`;

    it('inserts omp’s custom left list plus status where the host lists none, and the hook-row switch', () => {
      const f = file('config.yml', custom('  separator: pipe\ntheme: dark\n'));
      const r = ensure(f.path);
      expect(r.written).toEqual([
        `leftSegments: ${[...CUSTOM_LEFT, 'status'].join(', ')}`,
        'showHookStatus: false',
      ]);
      expect(f.read()).toBe(
        custom(
          `  separator: pipe\n${LEFT_OF('  ', [...CUSTOM_LEFT, 'status']).join('\n')}\n${HOOK_LINE}theme: dark\n`,
        ),
      );
    });

    it('appends status to the host’s own block list and switches the hook row off, changing no other byte', () => {
      const host = custom(
        '  leftSegments:\n    - pi # brand\n    - "model"\n    - path\n  rightSegments:\n    - cost\ntheme: dark\n',
      );
      const f = file('config.yml', `# top\n${host}`);
      const r = ensure(f.path);
      expect(r).toMatchObject({
        state: 'added',
        written: ['leftSegments: + status', 'showHookStatus: false'],
      });
      expect(f.read()).toBe(
        `# top\n${host
          .replace('    - path\n', '    - path\n    - status\n')
          .replace('    - cost\n', `    - cost\n${HOOK_LINE}`)}`,
      );
    });

    it('reads a list whose items sit at the key’s own indentation, and keeps the file’s line ending', () => {
      const f = file(
        'config.yml',
        'statusLine:\r\n  preset: custom\r\n  leftSegments:\r\n  - vim\r\n  - model\r\ntheme: dark\r\n',
      );
      ensure(f.path);
      expect(f.read()).toBe(
        'statusLine:\r\n  preset: custom\r\n  leftSegments:\r\n  - vim\r\n  - model\r\n  - status\r\n  showHookStatus: false\r\ntheme: dark\r\n',
      );
    });

    it.each([
      ['[vim, model]', '[vim, model, status]'],
      ['[vim, model ] # mine', '[vim, model, status ] # mine'],
      ['[vim,]', '[vim, status]'],
      ['[]', '[status]'],
      ['["vim"]', '["vim", status]'],
    ])('appends status to a one-line flow list %s', (before, after) => {
      const f = file('config.yml', custom(`  leftSegments: ${before}\n`));
      expect(ensure(f.path).state).toBe('added');
      expect(f.read()).toBe(custom(`  leftSegments: ${after}\n${HOOK_LINE}`));
    });

    it.each([
      ['a block list', '  leftSegments:\n    - vim\n    - status\n    - pr\n'],
      ['a quoted item', '  leftSegments:\n    - vim\n    - "status" # here\n'],
      ['a flow list', '  leftSegments: [vim, status, pr]\n'],
      ['a quoted flow item', "  leftSegments: ['status']\n"],
    ])(
      'leaves a host that already lists status (%s) and set showHookStatus byte-identical',
      (_n, rest) => {
        const host = custom(`${rest}  showHookStatus: true\n`);
        const f = file('config.yml', host);
        expect(ensure(f.path)).toMatchObject({
          state: 'present',
          wrote: false,
        });
        expect(f.read()).toBe(host);
      },
    );

    it('switches only the hook row off for a host that lists status and never set it', () => {
      const host = custom('  leftSegments: [vim, status]\n');
      const f = file('config.yml', host);
      const r = ensure(f.path);
      expect(r).toMatchObject({
        state: 'added',
        written: ['showHookStatus: false'],
      });
      expect(f.read()).toBe(`${host}${HOOK_LINE}`);
    });

    it('does not mistake a longer segment name for status', () => {
      const f = file(
        'config.yml',
        custom('  leftSegments:\n    - status_bar\n'),
      );
      expect(ensure(f.path).state).toBe('added');
      expect(f.read()).toBe(
        custom(`  leftSegments:\n    - status_bar\n    - status\n${HOOK_LINE}`),
      );
    });

    it('accepts the preset quoted', () => {
      const f = file(
        'config.yml',
        'statusLine:\n  preset: "custom" # mine\n  leftSegments: [vim]\n',
      );
      expect(ensure(f.path).state).toBe('added');
      expect(f.read()).toBe(
        `statusLine:\n  preset: "custom" # mine\n  leftSegments: [vim, status]\n${HOOK_LINE}`,
      );
    });
  });

  it.each([
    ['minimal', 'minimal', 'minimal'],
    ['a quoted name', '"compact" # mine', 'compact'],
    ['a name omp does not know', 'nonesuch', 'nonesuch'],
  ])(
    'leaves a host on another preset (%s) byte-identical, showHookStatus unwritten, and says custom replaces that preset’s layout',
    (_n, value, name) => {
      const host = `statusLine:\n  preset: ${value}\n  leftSegments:\n    - vim\n`;
      const f = file('config.yml', host);
      const r = ensure(f.path);
      expect(r).toMatchObject({ state: 'other-preset', wrote: false });
      expect(r.preset).toBe(name);
      expect(f.read()).toBe(host);
      const advice = (r.advice ?? []).join('\n');
      expect(advice).toContain(`REPLACES the \`${name}\` preset's layout`);
      // That preset's own segments, then status — never a list of omp's default.
      expect(advice).toContain(
        `<each of ${name}'s own left segments, in order>\n      - status`,
      );
      expect(advice).toContain(
        `<each of ${name}'s own right segments, in order>`,
      );
      expect(advice).not.toContain('- pi\n');
      // The separator is the host's own setting under every preset: never told to write it.
      expect(advice).not.toMatch(/write them too/);
      expect(advice).toContain(
        '`separator` setting applies under every preset',
      );
      expect(advice).toContain(`write \`${name}\`'s segment options there`);
    },
  );

  it('leaves `preset: default` written out alone and gives the exact default block', () => {
    const host = 'statusLine:\n  preset: default\n';
    const f = file('config.yml', host);
    const r = ensure(f.path);
    expect(r).toMatchObject({
      state: 'other-preset',
      wrote: false,
      preset: 'default',
    });
    expect(f.read()).toBe(host);
    expect((r.advice ?? []).join('\n')).toContain(
      `statusLine:\n${FULL('  ')}`.replace(/\n/g, '\n  '),
    );
  });

  // The row beneath the editor is the only place for status wherever the layout lists no
  // `status`; this keeps the extension-status row visible for the host.
  describe('where the layout has no status segment but the row beneath the editor remains', () => {
    it.each([
      [
        'another named preset',
        'statusLine:\n  preset: minimal\n  showHookStatus: false # quiet\ntheme: dark\n',
        'statusLine:\n  preset: minimal\n  showHookStatus: true # quiet\ntheme: dark\n',
        'other-preset',
      ],
      [
        'a layout of its own and no preset',
        'statusLine:\n  leftSegments:\n    - vim\n  showHookStatus: False\n',
        'statusLine:\n  leftSegments:\n    - vim\n  showHookStatus: true\n',
        'own-layout',
      ],
      [
        'a custom list it cannot extend',
        'statusLine:\n  preset: custom\n  leftSegments: &l [vim]\n  showHookStatus: false\n',
        'statusLine:\n  preset: custom\n  leftSegments: &l [vim]\n  showHookStatus: true\n',
        'refused',
      ],
      [
        'a statusLine that is a flow mapping on one line',
        'statusLine: {preset: minimal, showHookStatus: false}\ntheme: dark\n',
        'statusLine: {preset: minimal, showHookStatus: true}\ntheme: dark\n',
        'refused',
      ],
      [
        'a statusLine that is a flow mapping over several lines, its key quoted',
        'statusLine:\n  {\n    preset: minimal, # mine\n    "showHookStatus": False,\n  }\ntheme: dark\nshowHookStatus: false\n',
        'statusLine:\n  {\n    preset: minimal, # mine\n    "showHookStatus": true,\n  }\ntheme: dark\nshowHookStatus: false\n',
        'refused',
      ],
      [
        'a preset that is not a plain value',
        'statusLine:\n  preset: [minimal]\n  showHookStatus: false\n',
        'statusLine:\n  preset: [minimal]\n  showHookStatus: true\n',
        'refused',
      ],
      [
        'a whole file that is a flow mapping',
        '{statusLine: {preset: minimal, showHookStatus: false}}\n',
        '{statusLine: {preset: minimal, showHookStatus: true}}\n',
        'refused',
      ],
    ])(
      'turns a hidden row on for a host on %s, changing no other byte',
      (_n, host, shown, state) => {
        const f = file('config.yml', host);
        const r = ensure(f.path);
        expect(r).toMatchObject({
          state,
          wrote: true,
          hookRowShown: true,
          written: ['showHookStatus: true (was false)'],
        });
        expect(f.read()).toBe(shown);
      },
    );

    it('reports it and writes nothing under dry-run', () => {
      const host = 'statusLine:\n  preset: minimal\n  showHookStatus: false\n';
      const f = file('config.yml', host);
      expect(ensure(f.path, true)).toMatchObject({
        state: 'other-preset',
        wrote: false,
        hookRowShown: true,
      });
      expect(f.read()).toBe(host);
    });

    it.each([
      [
        'a row the host left shown',
        'statusLine:\n  preset: minimal\n  showHookStatus: true\n',
      ],
      ['a row the host never set', 'statusLine:\n  preset: minimal\n'],
    ])('leaves %s byte-identical', (_n, host) => {
      const f = file('config.yml', host);
      const r = ensure(f.path);
      expect(r).toMatchObject({ state: 'other-preset', wrote: false });
      expect(r.hookRowShown).toBeUndefined();
      expect(f.read()).toBe(host);
    });
  });

  it('reports what it would add and writes nothing under dry-run', () => {
    const host = 'statusLine:\n  preset: custom\n  leftSegments: [vim]\n';
    const f = file('config.yml', host);
    expect(ensure(f.path, true)).toMatchObject({
      state: 'added',
      wrote: false,
      written: ['leftSegments: + status', 'showHookStatus: false'],
    });
    expect(f.read()).toBe(host);
    const none = file('config.yml', 'theme: dark\n');
    expect(ensure(none.path, true).written).toContain('preset: custom');
    expect(none.read()).toBe('theme: dark\n');
    const absent = file('config.yml', null);
    expect(ensure(absent.path, true).state).toBe('added');
    expect(absent.read()).toBeNull();
  });

  it.each([
    ['a flow mapping', 'statusLine: {preset: custom}\n'],
    ['an alias', 'statusLine: *shared\n'],
    ['a null statusLine', 'statusLine: ~\n'],
    [
      'a scalar leftSegments',
      'statusLine:\n  preset: custom\n  leftSegments: vim\n',
    ],
    [
      'a null leftSegments',
      'statusLine:\n  preset: custom\n  leftSegments:\nother: 1\n',
    ],
    [
      'a multi-line flow list',
      'statusLine:\n  preset: custom\n  leftSegments: [vim,\n    model]\n',
    ],
    ['a preset that is a list', 'statusLine:\n  preset: [custom]\n'],
    [
      'a preset with no value',
      'statusLine:\n  preset:\n  leftSegments: [vim]\n',
    ],
    ['a document that is not a mapping', '- a\n- b\n'],
  ])('refuses %s, leaving the file as it was', (_name, host) => {
    const f = file('config.yml', host);
    const r = ensure(f.path);
    expect(r.state).toBe('refused');
    expect(r.refused).toBeTruthy();
    expect(f.read()).toBe(host);
  });
});

// ── install ──────────────────────────────────────────────────────────────────

/** Two agents, written at run time. */
function corpus(): ProjectablePlugin {
  const agents = join(tmpRoot(), 'agents');
  mkdirSync(agents, { recursive: true });
  const nulls = Object.keys(FIXTURE_MANIFEST)
    .map((k) => `  ${kebabToCamel(k)}: null,`)
    .join('\n');
  for (const name of ['alpha', 'beta']) {
    writeFileSync(
      join(agents, `${name}.ts`),
      [
        `export const ${name} = {`,
        `  name: '${name}',`,
        `  description: 'fixture agent ${name}',`,
        `  archetype: '${name} probe',`,
        nulls,
        '};',
        '',
      ].join('\n'),
      'utf8',
    );
  }
  return {
    name: 'status-line-fixture',
    manifest: FIXTURE_MANIFEST,
    agents,
    practices: fixturePractices(['alpha', 'beta']),
  };
}

describe('install — the status line', () => {
  let home: string;
  let cwd: string;
  let plugin: ProjectablePlugin;
  let out: string;
  const install = (
    harness: 'omp',
    extra: Partial<Parameters<typeof runInstall>[0]> = {},
  ) =>
    runInstall({
      harness,
      home,
      cwd,
      corpus: plugin as never,
      practices: FIXTURE_PRACTICE,
      verbose: true,
      ...extra,
    });
  const ompConfig = () => join(home, '.omp', 'agent', 'config.yml');

  beforeEach(() => {
    const root = tmpRoot();
    home = join(root, 'home');
    cwd = join(root, 'cwd');
    mkdirSync(cwd, { recursive: true });
    plugin = corpus();
    out = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((s) => {
      out += String(s);
      return true;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation((s) => {
      out += String(s);
      return true;
    });
    vi.spyOn(console, 'log').mockImplementation((...a) => {
      out += `${a.join(' ')}\n`;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('omp', () => {
    const seed = (host: string) => {
      mkdirSync(dirname(ompConfig()), { recursive: true });
      writeFileSync(ompConfig(), host);
      return () => readFileSync(ompConfig(), 'utf8');
    };
    // The entries install also seeds in `modelRoles` are its own; a host that has them
    // already sees the status line and nothing else change.
    const ROLES = 'modelRoles:\n  default: "@default"\n';

    it('moves a host with no statusLine to custom with the default preset’s own layout plus status, the hook row off', async () => {
      expect(await install('omp')).toBe(0);
      expect(readFileSync(ompConfig(), 'utf8')).toContain(
        `statusLine:\n${FULL('  ')}\n`,
      );
      expect(out).toContain('added preset: custom; leftSegments: pi, vim');
      expect(out).toContain('showHookStatus: false');
    });

    it('lists status for a corpus that delivers no agent, since any session may start as one', async () => {
      // The cratylus extension shows the name and mark of any declaration omp
      // discovers, so the place it renders is made whatever the corpus delivers.
      const agents = join(tmpRoot(), 'none');
      mkdirSync(agents, { recursive: true });
      plugin = { ...plugin, agents, practices: undefined };
      const host = `${ROLES}statusLine:\n  preset: custom\n  leftSegments: [model]\n  showHookStatus: false\n`;
      const read = seed(host);
      expect(await install('omp', { practices: undefined })).toBe(0);
      expect(read()).toContain('leftSegments: [model, status]');
    });

    it('appends status to a host already on custom and switches the hook row off, changing no other byte, and a second install changes none', async () => {
      const host = `${ROLES}statusLine:\n  preset: custom\n  leftSegments:\n    - pi\n    - model\ntheme: dark\n`;
      const read = seed(host);
      expect(await install('omp')).toBe(0);
      expect(read()).toBe(
        host.replace(
          '    - model\n',
          '    - model\n    - status\n  showHookStatus: false\n',
        ),
      );
      const after = read();
      out = '';
      expect(await install('omp')).toBe(0);
      expect(read()).toBe(after);
      expect(out).toContain('`status` already listed');
    });

    it('leaves a host on another named preset byte-identical, hook row untouched, and tells it that custom replaces the layout', async () => {
      const host = `${ROLES}statusLine:\n  preset: minimal\n`;
      const read = seed(host);
      expect(await install('omp')).toBe(0);
      expect(read()).toBe(host);
      expect(out).toContain('preset `minimal`');
      expect(out).toContain("REPLACES the `minimal` preset's layout");
      expect(out).toContain("<each of minimal's own left segments, in order>");
      expect(out).toContain('showHookStatus: false');
    });

    it('shows the row beneath the editor for a host that hid it on a layout with no status segment, and says so', async () => {
      const host = `${ROLES}statusLine:\n  preset: minimal\n  showHookStatus: false\n`;
      const read = seed(host);
      expect(await install('omp')).toBe(0);
      expect(read()).toBe(
        host.replace('showHookStatus: false', 'showHookStatus: true'),
      );
      expect(out).toContain('`showHookStatus` was false');
      expect(out).toContain('it is now true');
      const after = read();
      out = '';
      expect(await install('omp')).toBe(0);
      expect(read()).toBe(after);
      expect(out).not.toContain('`showHookStatus` was false');
    });

    it('leaves a no-preset host with a layout of its own byte-identical and gives it the block to write', async () => {
      const host = `${ROLES}statusLine:\n  leftSegments:\n    - model\n  separator: ascii\n`;
      const read = seed(host);
      expect(await install('omp')).toBe(0);
      expect(read()).toBe(host);
      expect(out).toContain('the host set `leftSegments` with no preset');
      // The exact default-preset block, ready to write (install indents each line).
      const pad = ' '.repeat(10);
      expect(out).toContain(
        `${pad}statusLine:\n${FULL('  ')
          .split('\n')
          .map((l) => `${pad}${l}`)
          .join('\n')}`,
      );
    });

    it('writes nothing under --dry-run, and says what it would add', async () => {
      const bare = 'theme: dark\n';
      const read = seed(bare);
      expect(await install('omp', { dryRun: true })).toBe(0);
      expect(read()).toBe(bare);
      expect(out).toContain('would add preset: custom');
    });
  });
});
