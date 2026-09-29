// The host's status line — what install may do to it so the persona badge is visible,
// and what it must never do.
//
// Both files are HOST-OWNED, so nearly every case is a byte claim. Claude Code's
// `settings.statusLine` is one command: install sets it only where the host has none,
// and a host's own is left exactly as it is unless the operator asks to wrap it —
// which keeps the command, and every other key beside it, and never wraps twice. omp's
// `statusLine.leftSegments` is a list: `status` is appended to the host's own, no other
// byte changing, and left alone when already listed. Unit cases drive the two functions
// on strings a host might really have written; install cases run `runInstall` against
// a corpus written at run time, with a tmp HOME so no real host is ever read.

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
import {
  OMP_DEFAULT_LEFT_SEGMENTS,
  ensureBadgeStatusLine,
  ensureStatusSegment,
} from '../../src/deploy/status-line.js';
import type { ProjectablePlugin } from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

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

// ── Claude Code: settings.json ───────────────────────────────────────────────

describe('ensureBadgeStatusLine', () => {
  const WORKER = 'sh "$HOME/.claude/personas/_session/worker.sh"';
  const HOST = `${JSON.stringify(
    {
      theme: 'dark',
      statusLine: { type: 'command', command: "printf 'it''s'", padding: 0 },
      hooks: {},
    },
    null,
    2,
  )}\n`;

  it('sets the worker as the status line where the host has none, keeping every other key', () => {
    const f = file(
      'settings.json',
      `${JSON.stringify({ theme: 'dark', hooks: { A: [] } }, null, 2)}\n`,
    );
    const r = ensureBadgeStatusLine(f.path, WORKER);
    expect(r).toMatchObject({ state: 'set', wrote: true });
    expect(JSON.parse(f.read() as string)).toEqual({
      theme: 'dark',
      hooks: { A: [] },
      statusLine: { type: 'command', command: WORKER },
    });
  });

  it('creates the file where the host has no settings at all', () => {
    const f = file('settings.json', null);
    expect(ensureBadgeStatusLine(f.path, WORKER).state).toBe('set');
    expect(JSON.parse(f.read() as string)).toEqual({
      statusLine: { type: 'command', command: WORKER },
    });
  });

  it('leaves the host’s own status line byte-identical and offers the wrap, without the flag', () => {
    const f = file('settings.json', HOST);
    const r = ensureBadgeStatusLine(f.path, WORKER);
    expect(r).toMatchObject({ state: 'offer', wrote: false });
    expect(f.read()).toBe(HOST);
  });

  it('wraps the host’s command verbatim as the worker’s one argument, keeping its other keys', () => {
    const f = file('settings.json', HOST);
    const r = ensureBadgeStatusLine(f.path, WORKER, { wrap: true });
    expect(r).toMatchObject({ state: 'wrapped', wrote: true });
    const line = JSON.parse(f.read() as string).statusLine;
    expect(line.padding).toBe(0);
    expect(line.type).toBe('command');
    // The host command's own quote survives one round of shell quoting.
    expect(line.command).toBe(`${WORKER} 'printf '\\''it'\\'''\\''s'\\'''`);
    expect(JSON.parse(f.read() as string).theme).toBe('dark');
  });

  it('never wraps twice, and never re-sets what is already the worker', () => {
    const f = file('settings.json', HOST);
    ensureBadgeStatusLine(f.path, WORKER, { wrap: true });
    const wrapped = f.read();
    expect(ensureBadgeStatusLine(f.path, WORKER, { wrap: true }).state).toBe(
      'kept',
    );
    expect(f.read()).toBe(wrapped);

    const bare = file(
      'settings.json',
      `${JSON.stringify({ statusLine: { type: 'command', command: WORKER } }, null, 2)}\n`,
    );
    const before = bare.read();
    expect(ensureBadgeStatusLine(bare.path, WORKER, { wrap: true }).state).toBe(
      'kept',
    );
    expect(bare.read()).toBe(before);
  });

  it('writes nothing under dry-run, for a set and for a wrap alike', () => {
    const none = file('settings.json', '{}\n');
    expect(
      ensureBadgeStatusLine(none.path, WORKER, { dry: true }),
    ).toMatchObject({ state: 'set', wrote: false });
    expect(none.read()).toBe('{}\n');

    const host = file('settings.json', HOST);
    expect(
      ensureBadgeStatusLine(host.path, WORKER, { dry: true, wrap: true }),
    ).toMatchObject({ state: 'wrapped', wrote: false });
    expect(host.read()).toBe(HOST);

    const absent = file('settings.json', null);
    ensureBadgeStatusLine(absent.path, WORKER, { dry: true });
    expect(absent.read()).toBeNull();
  });

  it.each([
    ['a file that is not JSON', '{ not json'],
    ['a JSON array', '[]'],
    ['a status line that is not a command', '{"statusLine":{"type":"text"}}'],
    ['a status line with no command', '{"statusLine":{"type":"command"}}'],
    ['a status line that is a string', '{"statusLine":"printf x"}'],
  ])('refuses %s, leaving the file as it was', (_name, content) => {
    const f = file('settings.json', content);
    const r = ensureBadgeStatusLine(f.path, WORKER, { wrap: true });
    expect(r.state).toBe('refused');
    expect(r.refused).toBeTruthy();
    expect(f.read()).toBe(content);
  });
});

// ── omp: config.yml ──────────────────────────────────────────────────────────

describe('ensureStatusSegment', () => {
  const DEFAULTS = [...OMP_DEFAULT_LEFT_SEGMENTS, 'status'];
  const block = (indent: string, itemIndent: string) =>
    [
      `${indent}leftSegments:`,
      ...DEFAULTS.map((s) => `${itemIndent}- ${s}`),
    ].join('\n');

  it('writes omp’s default left list plus status where the host has no statusLine', () => {
    const host = '# host config\ntheme: dark\nmodelRoles:\n  default: "@x"\n';
    const f = file('config.yml', host);
    const r = ensureStatusSegment(f.path);
    expect(r).toMatchObject({ state: 'added', wrote: true, written: DEFAULTS });
    expect(f.read()).toBe(`${host}statusLine:\n${block('  ', '    ')}\n`);
    expect(DEFAULTS).toEqual([
      'vim',
      'model',
      'mode',
      'path',
      'git',
      'pr',
      'status',
    ]);
  });

  it('creates the file where the host has no config, and appends after an unterminated last line', () => {
    const absent = file('agent/config.yml', null);
    ensureStatusSegment(absent.path);
    expect(absent.read()).toBe(`statusLine:\n${block('  ', '    ')}\n`);

    const cut = file('config.yml', 'theme: dark');
    ensureStatusSegment(cut.path);
    expect(cut.read()).toBe(
      `theme: dark\nstatusLine:\n${block('  ', '    ')}\n`,
    );
  });

  it('inserts the list into a statusLine that has none, at that mapping’s own indentation', () => {
    const f = file(
      'config.yml',
      'statusLine:\n   preset: custom # mine\n   separator: pipe\ntheme: dark\n',
    );
    ensureStatusSegment(f.path);
    expect(f.read()).toBe(
      `statusLine:\n   preset: custom # mine\n   separator: pipe\n${block('   ', '     ')}\ntheme: dark\n`,
    );
  });

  it('appends status to the host’s own block list, changing no other byte', () => {
    const host =
      '# top\nstatusLine:\n  preset: custom\n  leftSegments:\n    - pi # brand\n    - "model"\n    - path\n  rightSegments:\n    - cost\ntheme: dark\n';
    const f = file('config.yml', host);
    const r = ensureStatusSegment(f.path);
    expect(r).toMatchObject({ state: 'added', written: ['status'] });
    expect(f.read()).toBe(
      host.replace('    - path\n', '    - path\n    - status\n'),
    );
  });

  it('reads a list whose items sit at the key’s own indentation, and keeps the file’s line ending', () => {
    const f = file(
      'config.yml',
      'statusLine:\r\n  leftSegments:\r\n  - vim\r\n  - model\r\ntheme: dark\r\n',
    );
    ensureStatusSegment(f.path);
    expect(f.read()).toBe(
      'statusLine:\r\n  leftSegments:\r\n  - vim\r\n  - model\r\n  - status\r\ntheme: dark\r\n',
    );
  });

  it.each([
    ['[vim, model]', '[vim, model, status]'],
    ['[vim, model ] # mine', '[vim, model, status ] # mine'],
    ['[vim,]', '[vim, status]'],
    ['[]', '[status]'],
    ['["vim"]', '["vim", status]'],
  ])('appends status to a one-line flow list %s', (before, after) => {
    const f = file('config.yml', `statusLine:\n  leftSegments: ${before}\n`);
    expect(ensureStatusSegment(f.path).state).toBe('added');
    expect(f.read()).toBe(`statusLine:\n  leftSegments: ${after}\n`);
  });

  it.each([
    [
      'a block list',
      'statusLine:\n  leftSegments:\n    - vim\n    - status\n    - pr\n',
    ],
    [
      'a quoted item',
      'statusLine:\n  leftSegments:\n    - vim\n    - "status" # here\n',
    ],
    ['a flow list', 'statusLine:\n  leftSegments: [vim, status, pr]\n'],
    ['a quoted flow item', "statusLine:\n  leftSegments: ['status']\n"],
  ])(
    'leaves a host that already lists status (%s) byte-identical',
    (_n, host) => {
      const f = file('config.yml', host);
      const r = ensureStatusSegment(f.path);
      expect(r).toMatchObject({ state: 'present', wrote: false });
      expect(f.read()).toBe(host);
    },
  );

  it('does not mistake a longer segment name for status', () => {
    const f = file(
      'config.yml',
      'statusLine:\n  leftSegments:\n    - status_bar\n',
    );
    expect(ensureStatusSegment(f.path).state).toBe('added');
    expect(f.read()).toBe(
      'statusLine:\n  leftSegments:\n    - status_bar\n    - status\n',
    );
  });

  it('reports what it would add and writes nothing under dry-run', () => {
    const host = 'statusLine:\n  leftSegments: [vim]\n';
    const f = file('config.yml', host);
    expect(ensureStatusSegment(f.path, { dry: true })).toMatchObject({
      state: 'added',
      wrote: false,
      written: ['status'],
    });
    expect(f.read()).toBe(host);
    const absent = file('config.yml', null);
    expect(ensureStatusSegment(absent.path, { dry: true }).written).toEqual(
      DEFAULTS,
    );
    expect(absent.read()).toBeNull();
  });

  it.each([
    ['a flow mapping', 'statusLine: {preset: custom}\n'],
    ['an alias', 'statusLine: *shared\n'],
    ['a scalar leftSegments', 'statusLine:\n  leftSegments: vim\n'],
    ['a null leftSegments', 'statusLine:\n  leftSegments:\nother: 1\n'],
    [
      'a multi-line flow list',
      'statusLine:\n  leftSegments: [vim,\n    model]\n',
    ],
    ['a document that is not a mapping', '- a\n- b\n'],
  ])('refuses %s, leaving the file as it was', (_name, host) => {
    const f = file('config.yml', host);
    const r = ensureStatusSegment(f.path);
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
  return { name: 'badge-fixture', manifest: FIXTURE_MANIFEST, agents };
}

describe('install — the status line', () => {
  let home: string;
  let cwd: string;
  let plugin: ProjectablePlugin;
  let out: string;
  const install = (
    harness: 'claude' | 'omp',
    extra: Partial<Parameters<typeof runInstall>[0]> = {},
  ) =>
    runInstall({
      harness,
      home,
      cwd,
      corpus: plugin as never,
      pathEnv: '/usr/bin',
      ...extra,
    });
  const settings = () => join(home, '.claude', 'settings.json');
  const ompConfig = () => join(home, '.omp', 'agent', 'config.yml');
  const worker = () => adapterByName('claude').statusLine?.command as string;

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

  describe('claude', () => {
    it('sets the badge as the status line where the host has none, and places the worker and every badge', async () => {
      expect(await install('claude')).toBe(0);
      expect(JSON.parse(readFileSync(settings(), 'utf8')).statusLine).toEqual({
        type: 'command',
        command: worker(),
      });
      expect(out).toContain('set to the persona badge');
      const scope = join(home, '.claude', 'personas');
      const adapter = adapterByName('claude');
      expect(
        existsSync(
          join(
            home,
            '.claude',
            adapter.scopedRel?.(adapter.statusLine?.file as string) as string,
          ),
        ),
      ).toBe(true);
      expect(existsSync(join(scope, 'alpha'))).toBe(true);
    });

    it('never replaces the host’s own status line without the flag, and names the flag', async () => {
      const host = `${JSON.stringify(
        {
          statusLine: {
            type: 'command',
            command: 'printf HOSTLINE-7731',
            padding: 0,
          },
        },
        null,
        2,
      )}\n`;
      mkdirSync(join(home, '.claude'), { recursive: true });
      writeFileSync(settings(), host);
      expect(await install('claude')).toBe(0);
      expect(JSON.parse(readFileSync(settings(), 'utf8')).statusLine).toEqual({
        type: 'command',
        command: 'printf HOSTLINE-7731',
        padding: 0,
      });
      expect(out).toContain('--wrap-status-line');
    });

    it('wraps it under --wrap-status-line, keeps padding, and a second run changes no byte', async () => {
      mkdirSync(join(home, '.claude'), { recursive: true });
      writeFileSync(
        settings(),
        JSON.stringify({
          statusLine: {
            type: 'command',
            command: 'printf HOSTLINE-7731',
            padding: 0,
          },
        }),
      );
      expect(await install('claude', { wrapStatusLine: true })).toBe(0);
      const line = JSON.parse(readFileSync(settings(), 'utf8')).statusLine;
      expect(line.command).toBe(`${worker()} 'printf HOSTLINE-7731'`);
      expect(line.padding).toBe(0);
      const once = readFileSync(settings(), 'utf8');
      expect(await install('claude', { wrapStatusLine: true })).toBe(0);
      expect(readFileSync(settings(), 'utf8')).toBe(once);
    });

    it('writes nothing to the status line under --dry-run, and says what it would do', async () => {
      expect(await install('claude', { dryRun: true })).toBe(0);
      expect(existsSync(settings())).toBe(false);
      expect(out).toContain('would set');
    });
  });

  describe('omp', () => {
    it('writes omp’s default left list plus status where the host has no statusLine', async () => {
      expect(await install('omp')).toBe(0);
      const text = readFileSync(ompConfig(), 'utf8');
      expect(text).toContain(
        'statusLine:\n  leftSegments:\n    - vim\n    - model\n    - mode\n    - path\n    - git\n    - pr\n    - status\n',
      );
      expect(out).toContain('added vim, model, mode, path, git, pr, status');
    });

    it('appends status to a host list without it, changing no other byte, and a second install changes none', async () => {
      const host =
        '# mine\nstatusLine:\n  preset: custom\n  leftSegments:\n    - pi\n    - model\ntheme: dark\n';
      mkdirSync(dirname(ompConfig()), { recursive: true });
      writeFileSync(ompConfig(), host);
      expect(await install('omp')).toBe(0);
      const after = readFileSync(ompConfig(), 'utf8');
      // The role entries install also adds are its own; the status line is the host's
      // list plus one line.
      expect(after).toContain(
        '  leftSegments:\n    - pi\n    - model\n    - status\ntheme: dark\n',
      );
      expect(after.replace('    - status\n', '')).not.toContain('- status');
      expect(await install('omp')).toBe(0);
      expect(readFileSync(ompConfig(), 'utf8')).toBe(after);
      expect(out).toContain('`status` already listed');
    });

    it('leaves a host that already lists status byte-identical, and writes nothing under --dry-run', async () => {
      const host =
        'modelRoles:\n  default: "@default"\n  implementer: "@task"\n  planner: "@plan"\n  architect: "@default"\n  assayer: "@default"\nstatusLine:\n  leftSegments: [pi, status]\n';
      mkdirSync(dirname(ompConfig()), { recursive: true });
      writeFileSync(ompConfig(), host);
      expect(await install('omp')).toBe(0);
      expect(readFileSync(ompConfig(), 'utf8')).toBe(host);

      const bare = 'theme: dark\n';
      writeFileSync(ompConfig(), bare);
      expect(await install('omp', { dryRun: true })).toBe(0);
      expect(readFileSync(ompConfig(), 'utf8')).toBe(bare);
    });
  });
});
