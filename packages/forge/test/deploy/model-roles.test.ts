// The host's `modelRoles` mapping — what install adds for a held role, and what it
// must never touch.
//
// The file is HOST-OWNED, so every case is a byte claim: an entry install adds is
// the only difference, and deleting those lines gives the original back. Unit cases
// drive `addModelRoles` on strings the host might really have written; install
// cases run `runInstall` against a corpus written to a tmp dir at run time (the
// resolver-parity fixture shape), with a tmp HOME so no real host is ever read.

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
import { runInstall } from '../../src/cli/commands/install.js';
import { ensureHostSettings } from '../../src/deploy/host-settings.js';
import { undoHunks } from '../../src/deploy/manifest.js';
import {
  type ModelRoleEntry,
  addModelRoles,
} from '../../src/deploy/model-roles.js';
import type { ProjectablePlugin } from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import { FIXTURE_PRACTICE, fixturePractices } from './helpers.js';

const roots: string[] = [];
function tmpRoot(): string {
  const r = mkdtempSync(join(tmpdir(), 'model-roles-'));
  roots.push(r);
  return r;
}
afterEach(() => {
  vi.restoreAllMocks();
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots.length = 0;
});

// In the order install reports them: `heldRoles` is sorted.
const WANT: ModelRoleEntry[] = [
  { role: 'architect', value: '@default' },
  { role: 'assayer', value: '@default' },
  { role: 'implementer', value: '@task' },
  { role: 'planner', value: '@plan' },
];
const IMPLEMENTER: ModelRoleEntry = { role: 'implementer', value: '@task' };
const ADDED_LINES = (indent: string) =>
  WANT.map((e) => `${indent}${e.role}: "${e.value}"`);

/** Run `addModelRoles` on `content` in a tmp file; return the result and the bytes after. */
function run(
  content: string | null,
  wanted: readonly ModelRoleEntry[] = WANT,
  dry = false,
) {
  const path = join(tmpRoot(), 'agent', 'config.yml');
  if (content !== null) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  const result = addModelRoles(path, wanted, { dry });
  return {
    result,
    after: existsSync(path) ? readFileSync(path, 'utf8') : null,
  };
}

describe('addModelRoles — a block-style modelRoles', () => {
  const HOST =
    '# host config\nmodelRoles:\n default: anthropic/claude-opus-5-5:high # main\n task: "@default"\ntheme: dark\n';

  it('inserts after the last entry at that mapping’s own indentation, leaving every other byte', () => {
    const { result, after } = run(HOST);
    expect(result.added).toEqual(WANT);
    expect(result.wrote).toBe(true);
    expect(after).toBe(
      [
        '# host config',
        'modelRoles:',
        ' default: anthropic/claude-opus-5-5:high # main',
        ' task: "@default"',
        ...ADDED_LINES(' '),
        'theme: dark',
        '',
      ].join('\n'),
    );
    // Deleting exactly the added lines gives the host's bytes back.
    const restored = (after as string)
      .split('\n')
      .filter((l) => !ADDED_LINES(' ').includes(l))
      .join('\n');
    expect(restored).toBe(HOST);
  });

  it('never changes an entry the host has, whatever its shape, and adds only the rest', () => {
    const host =
      '# host\nmodelRoles:\n implementer: "@task"\n planner: openai/gpt-5:high\n';
    const { result, after } = run(host);
    expect(result.added).toEqual([
      { role: 'architect', value: '@default' },
      { role: 'assayer', value: '@default' },
    ]);
    expect(after).toBe(`${host} architect: "@default"\n assayer: "@default"\n`);
  });

  it('reads plain, single-quoted and double-quoted keys as present', () => {
    const host =
      'modelRoles:\n  implementer: x\n  \'planner\': y\n  "assayer": z\n';
    const { result, after } = run(host);
    expect(result.added).toEqual([{ role: 'architect', value: '@default' }]);
    expect(after).toBe(`${host}  architect: "@default"\n`);
  });

  it('adds nothing, and writes nothing, when every wanted role is present', () => {
    const host = `modelRoles:\n${WANT.map((e) => `  ${e.role}: anything`).join('\n')}\n`;
    const { result, after } = run(host);
    expect(result).toMatchObject({ added: [], wrote: false });
    expect(after).toBe(host);
  });

  it('counts an entry at the mapping’s own indentation only — a nested key of that name is not one', () => {
    const host =
      'modelRoles:\n  default:\n    implementer: nested\n    planner: nested\n';
    const { result } = run(host);
    expect(result.added.map((e) => e.role)).toEqual([
      'architect',
      'assayer',
      'implementer',
      'planner',
    ]);
  });

  it('inserts after the whole last entry, continuation lines included, before later comments', () => {
    const host =
      'modelRoles:\n  task: >\n    folded\n    text\n  # trailing note\n\ntheme: dark\n';
    const { after } = run(host, [{ role: 'plan', value: '@default' }]);
    expect(after).toBe(
      'modelRoles:\n  task: >\n    folded\n    text\n  plan: "@default"\n  # trailing note\n\ntheme: dark\n',
    );
  });

  it('uses two spaces when the mapping has no entries yet, and inserts right below the key', () => {
    const { after } = run('modelRoles:\n# note\ntheme: dark\n', [IMPLEMENTER]);
    expect(after).toBe(
      'modelRoles:\n  implementer: "@task"\n# note\ntheme: dark\n',
    );
  });

  it('keeps the file’s CRLF line endings', () => {
    const { after } = run('modelRoles:\r\n  task: x\r\ntheme: dark\r\n', [
      IMPLEMENTER,
    ]);
    expect(after).toBe(
      'modelRoles:\r\n  task: x\r\n  implementer: "@task"\r\ntheme: dark\r\n',
    );
  });

  it('extends a mapping that ends the file with no final newline, and keeps it that way', () => {
    const { after } = run('modelRoles:\n  task: x', [IMPLEMENTER]);
    expect(after).toBe('modelRoles:\n  task: x\n  implementer: "@task"');
  });

  it('quotes the value it writes and keys a role that is not a plain word', () => {
    const { after } = run('modelRoles:\n  task: x\n', [
      { role: 'odd role: 1', value: 'a "b"' },
    ]);
    expect(after).toBe(
      'modelRoles:\n  task: x\n  "odd role: 1": "a \\"b\\""\n',
    );
  });
});

describe('addModelRoles — retarget', () => {
  const HOST =
    '# host\nmodelRoles:\n  planner: "@plan"\n  task: "@default"\ntheme: dark\n';
  const at = (content: string, retarget: readonly ModelRoleEntry[]) => {
    const path = join(tmpRoot(), 'config.yml');
    writeFileSync(path, content);
    const result = addModelRoles(path, retarget, { retarget });
    return { result, after: readFileSync(path, 'utf8') };
  };

  it('moves the one line it is told to, in place, and reports it whole', () => {
    const { result, after } = at(HOST, [{ role: 'planner', value: '@slow' }]);
    expect(after).toBe(HOST.replace('"@plan"', '"@slow"'));
    expect(result.added).toEqual([]);
    expect(result.wrote).toBe(true);
    expect(result.retargeted.map((m) => [m.from, m.to])).toEqual([
      ['  planner: "@plan"\n', '  planner: "@slow"\n'],
    ]);
    // A move is not an insertion: nothing for an uninstall to take out beyond the record.
    expect(result.edit).toBeUndefined();
  });

  it('moves a line and adds a missing one in the same write', () => {
    const { result, after } = at(HOST, [
      { role: 'planner', value: '@slow' },
      { role: 'assayer', value: '@fast' },
    ]);
    expect(after).toBe(
      '# host\nmodelRoles:\n  planner: "@slow"\n  task: "@default"\n  assayer: "@fast"\ntheme: dark\n',
    );
    expect(result.added).toEqual([{ role: 'assayer', value: '@fast' }]);
    expect(result.edit?.hunks.flatMap((h) => h.after)).toEqual([
      '  assayer: "@fast"\n',
    ]);
  });

  it('leaves a line already holding the value, and a role with no line, alone', () => {
    const path = join(tmpRoot(), 'config.yml');
    writeFileSync(path, HOST);
    const result = addModelRoles(path, [], {
      retarget: [
        { role: 'planner', value: '@plan' },
        { role: 'ghost', value: '@x' },
      ],
    });
    expect(result.retargeted).toEqual([]);
    expect(result.wrote).toBe(false);
    expect(readFileSync(path, 'utf8')).toBe(HOST);
  });
});

describe('addModelRoles — no modelRoles block', () => {
  it('appends the block at the end and leaves line 1 alone', () => {
    const { result, after } = run('theme: dark\n');
    expect(result.added).toEqual(WANT);
    expect(after).toBe(
      `theme: dark\nmodelRoles:\n${ADDED_LINES('  ').join('\n')}\n`,
    );
  });

  it('starts a new line first when the file does not end in one', () => {
    const { after } = run('theme: dark', [IMPLEMENTER]);
    expect(after).toBe('theme: dark\nmodelRoles:\n  implementer: "@task"\n');
  });

  it('creates the file, and its directory, when the host has none', () => {
    const { result, after } = run(null);
    expect(result).toMatchObject({ added: WANT, wrote: true });
    expect(after).toBe(`modelRoles:\n${ADDED_LINES('  ').join('\n')}\n`);
  });

  it('does not mistake a commented or nested modelRoles for the key', () => {
    const host = '# modelRoles:\nother:\n  modelRoles:\n    x: y\n';
    const { after } = run(host, [IMPLEMENTER]);
    expect(after).toBe(`${host}modelRoles:\n  implementer: "@task"\n`);
  });
});

describe('addModelRoles — dry run', () => {
  it('reports the same entries and writes nothing, not even a missing file', () => {
    const present = run('theme: dark\n', WANT, true);
    expect(present.result).toMatchObject({ added: WANT, wrote: false });
    expect(present.after).toBe('theme: dark\n');

    const absent = run(null, WANT, true);
    expect(absent.result).toMatchObject({ added: WANT, wrote: false });
    expect(absent.after).toBeNull();
  });
});

describe('addModelRoles — a modelRoles it cannot safely extend', () => {
  const cases: [string, string][] = [
    ['a flow mapping', 'modelRoles: {default: x}\n'],
    ['a scalar', 'modelRoles: nothing-here\n'],
    ['an anchor', 'modelRoles: &roles\n  default: x\n'],
    ['an alias', 'shared: &s {a: b}\nmodelRoles: *s\n'],
    ['a block scalar', 'modelRoles: |\n  default: x\n'],
    ['a sequence', 'modelRoles:\n  - default\n'],
    ['a flow value with a trailing comment', 'modelRoles: {a: b} # c\n'],
  ];
  it.each(cases)('leaves %s untouched and says why', (_name, host) => {
    const { result, after } = run(host);
    expect(result.added).toEqual([]);
    expect(result.wrote).toBe(false);
    expect(result.refused).toMatch(/modelRoles/);
    expect(after).toBe(host);
  });

  it('refuses a document whose top level is not a block mapping, rather than corrupt it', () => {
    for (const host of ['- a\n- b\n', '{a: b}\n', '[a]\n']) {
      const { result, after } = run(host);
      expect(result.refused).toBeDefined();
      expect(after).toBe(host);
    }
  });

  it('is not refused for a comment after the key with no value', () => {
    const { result } = run('modelRoles: # roles\n  task: x\n', [IMPLEMENTER]);
    expect(result.refused).toBeUndefined();
    expect(result.added).toHaveLength(1);
  });
});

// ── install ───────────────────────────────────────────────────────────────────

/** Four agents, one per held role, and one holding none — written at run time. */
function corpus(): ProjectablePlugin {
  const root = tmpRoot();
  const agents = join(root, 'agents');
  mkdirSync(agents, { recursive: true });
  const nulls = Object.keys(FIXTURE_MANIFEST)
    .map((k) => `  ${kebabToCamel(k)}: null,`)
    .join('\n');
  const held: Record<string, string | null> = {
    implementer: 'implementer',
    planner: 'planner',
    assayer: 'assayer',
    architect: 'architect',
    // Two agents may hold one role; the host still needs ONE entry for it.
    twin: 'architect',
    bystander: null,
  };
  for (const [name, holds] of Object.entries(held)) {
    writeFileSync(
      join(agents, `${name}.ts`),
      [
        `export const ${name} = {`,
        `  name: '${name}',`,
        `  description: 'fixture agent ${name}',`,
        `  archetype: '${name} probe',`,
        ...(holds === null ? [] : [`  holds: '${holds}',`]),
        nulls,
        '};',
        '',
      ].join('\n'),
      'utf8',
    );
  }
  return {
    name: 'roles-fixture',
    manifest: FIXTURE_MANIFEST,
    agents,
    practices: fixturePractices(Object.keys(held)),
  };
}

describe('install — the host modelRoles', () => {
  let home: string;
  let cwd: string;
  let plugin: ProjectablePlugin;
  let out: string;
  let err: string;
  const config = () => join(home, '.omp', 'agent', 'config.yml');
  const install = (dryRun = false) =>
    runInstall({
      harness: 'omp',
      home,
      cwd,
      corpus: plugin as never,
      practices: FIXTURE_PRACTICE,
      dryRun,
      verbose: true,
    });

  beforeEach(() => {
    const root = tmpRoot();
    home = join(root, 'home');
    cwd = join(root, 'cwd');
    mkdirSync(join(home, '.omp', 'agent'), { recursive: true });
    mkdirSync(cwd, { recursive: true });
    plugin = corpus();
    out = '';
    err = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((s) => {
      out += String(s);
      return true;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation((s) => {
      err += String(s);
      return true;
    });
    vi.spyOn(console, 'log').mockImplementation((...a) => {
      out += `${a.join(' ')}\n`;
    });
    vi.spyOn(console, 'error').mockImplementation((...a) => {
      err += `${a.join(' ')}\n`;
    });
  });

  const HOST =
    '# host config\nmodelRoles:\n default: anthropic/claude-opus-5-5:high # main\n task: "@default"\ntheme: dark\n';

  // Install also makes omp's status line list the `status` segment the persona badge
  // renders in (status-line.test.ts owns that). These cases are about `modelRoles`, so
  // they read the config without the `statusLine:` block a host with none gets.
  const withoutStatusLine = (path: string) =>
    readFileSync(path, 'utf8').replace(/^statusLine:\n(?: {2}.*\n)+/m, '');

  it('adds the four held roles, reports each with its alias and the path, and changes nothing else', async () => {
    writeFileSync(config(), HOST);
    expect(await install()).toBe(0);

    const after = withoutStatusLine(config());
    for (const line of ADDED_LINES(' ')) {
      expect(after.split('\n').filter((l) => l === line)).toHaveLength(1);
      expect(out).toContain(line.trim());
    }
    expect(out).toContain(config());
    expect(after.indexOf(' architect:')).toBeLessThan(after.indexOf('theme:'));
    // The twin agent holds architect too: still one entry.
    expect(after.match(/architect:/g)).toHaveLength(1);
    expect(
      after
        .split('\n')
        .filter((l) => !ADDED_LINES(' ').includes(l))
        .join('\n'),
    ).toBe(HOST);
  });

  it('never rewrites an entry the host already has and reports only the missing ones', async () => {
    const host =
      '# host\nmodelRoles:\n implementer: "@task"\n planner: openai/gpt-5:high\n';
    writeFileSync(config(), host);
    expect(await install()).toBe(0);
    expect(withoutStatusLine(config())).toBe(
      `${host} architect: "@default"\n assayer: "@default"\n`,
    );
    expect(out).toContain('assayer: "@default"');
    expect(out).toContain('architect: "@default"');
    expect(out).not.toMatch(/implementer: "@/);
    expect(out).not.toMatch(/planner: "@/);
  });

  it('appends a modelRoles block to a config that has none', async () => {
    writeFileSync(config(), 'theme: dark\n');
    expect(await install()).toBe(0);
    const after = withoutStatusLine(config());
    expect(after.split('\n')[0]).toBe('theme: dark');
    expect(after).toBe(
      `theme: dark\nmodelRoles:\n${ADDED_LINES('  ').join('\n')}\n`,
    );
  });

  it('creates the config when the host has none', async () => {
    expect(await install()).toBe(0);
    expect(withoutStatusLine(config())).toBe(
      `modelRoles:\n${ADDED_LINES('  ').join('\n')}\n`,
    );
  });

  it('reports the same entries under --dry-run and writes nothing', async () => {
    writeFileSync(config(), HOST);
    expect(await install(true)).toBe(0);
    expect(readFileSync(config(), 'utf8')).toBe(HOST);
    expect(out).toMatch(/would add/);
    for (const line of ADDED_LINES('')) expect(out).toContain(line);
  });

  it('edits config.yaml when that is the only config the host has, and creates no config.yml', async () => {
    // omp reads config.yml, and config.yaml only when config.yml is absent. A
    // config.yml created here would shadow every setting the host keeps in config.yaml.
    const yaml = join(home, '.omp', 'agent', 'config.yaml');
    const host =
      '# host\nmodelRoles:\n implementer: openai/gpt-5:high\n default: x\ntheme: dark\n';
    writeFileSync(yaml, host);
    expect(await install()).toBe(0);
    expect(existsSync(config())).toBe(false);
    const after = withoutStatusLine(yaml);
    expect(after).toBe(
      '# host\nmodelRoles:\n implementer: openai/gpt-5:high\n default: x\n architect: "@default"\n assayer: "@default"\n planner: "@plan"\ntheme: dark\n',
    );
    expect(out).toContain(yaml);
    expect(out).not.toMatch(/implementer: "@/);
  });

  it('prefers config.yml when both exist, and leaves config.yaml alone', async () => {
    const yaml = join(home, '.omp', 'agent', 'config.yaml');
    writeFileSync(yaml, 'modelRoles:\n  default: x\n');
    writeFileSync(config(), 'theme: dark\n');
    expect(await install()).toBe(0);
    expect(readFileSync(yaml, 'utf8')).toBe('modelRoles:\n  default: x\n');
    expect(withoutStatusLine(config())).toBe(
      `theme: dark\nmodelRoles:\n${ADDED_LINES('  ').join('\n')}\n`,
    );
  });

  it('reports a modelRoles it cannot extend, leaves the file, and still succeeds', async () => {
    writeFileSync(config(), 'modelRoles: {default: x}\n');
    expect(await install()).toBe(0);
    expect(withoutStatusLine(config())).toBe('modelRoles: {default: x}\n');
    expect(err).toContain('did not edit');
    expect(err).toContain(config());
  });

  it('is idempotent: a second install adds nothing and reports that none was missing', async () => {
    writeFileSync(config(), HOST);
    expect(await install()).toBe(0);
    const once = readFileSync(config(), 'utf8');
    out = '';
    expect(await install()).toBe(0);
    expect(readFileSync(config(), 'utf8')).toBe(once);
    expect(out).toMatch(/no entry was missing/);
  });
});

// ── Scalar settings nested in the host's YAML ────────────────────────────────

describe('ensureHostSettings — task.isolation in a host-owned config', () => {
  const SETTINGS = {
    parent: ['task', 'isolation'],
    entries: { enabled: 'true', apply: 'false', merge: 'branch' },
  } as const;
  const BLOCK =
    '  isolation:\n    enabled: true\n    apply: false\n    merge: branch\n';

  /** Run the editor over a file holding `host` (absent when undefined); returns what
   *  it did and the file's bytes after, and checks the recorded edit undoes to `host`. */
  function edit(host: string | undefined, dry = false) {
    const path = join(tmpRoot(), 'agent', 'config.yml');
    if (host !== undefined) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, host);
    }
    const result = ensureHostSettings(path, SETTINGS, { dry });
    const after = existsSync(path) ? readFileSync(path, 'utf8') : undefined;
    if (result.edit !== undefined) {
      expect(undoHunks(after as string, result.edit.hunks).text).toBe(
        host ?? '',
      );
      expect(result.edit.created).toBe(host === undefined);
    }
    return { result, after };
  }

  it('creates the file, with the whole mapping, where the host has none', () => {
    const { result, after } = edit(undefined);
    expect(after).toBe(`task:\n${BLOCK}`);
    expect(result.changed.map((c) => c.setting)).toEqual([
      'task.isolation.enabled',
      'task.isolation.apply',
      'task.isolation.merge',
    ]);
  });

  it('appends a `task` mapping to a file without one, and ends a last line that had no terminator', () => {
    const { after } = edit('# host\ntheme: dark');
    expect(after).toBe(`# host\ntheme: dark\ntask:\n${BLOCK}`);
  });

  it('adds `isolation` inside a `task` mapping, below its last entry and at its indentation', () => {
    const host =
      'task:\n    disabledAgents:\n      []\n    agentPrewalk:\n      spark: "on"\ntheme: dark\n';
    const { after } = edit(host);
    expect(after).toBe(
      'task:\n    disabledAgents:\n      []\n    agentPrewalk:\n      spark: "on"\n' +
        '    isolation:\n      enabled: true\n      apply: false\n      merge: branch\n' +
        'theme: dark\n',
    );
  });

  it('inserts only the missing keys and moves only the line holding another value, keeping the rest', () => {
    const host =
      'task:\n  isolation:\n    apply: true # keep\n    backend: auto\n  other: 1\n';
    const { result, after } = edit(host);
    expect(after).toBe(
      'task:\n  isolation:\n    apply: false\n    backend: auto\n    enabled: true\n    merge: branch\n  other: 1\n',
    );
    expect(result.changed).toEqual([
      { setting: 'task.isolation.enabled', to: 'true', from: undefined },
      { setting: 'task.isolation.apply', to: 'false', from: 'true' },
      { setting: 'task.isolation.merge', to: 'branch', from: undefined },
    ]);
  });

  it('writes nothing when the host already holds every value', () => {
    const host = `# mine\ntask:\n${BLOCK}`;
    const { result, after } = edit(host);
    expect(result).toEqual({
      path: expect.any(String),
      changed: [],
      wrote: false,
    });
    expect(after).toBe(host);
  });

  it('reports what it would change and writes nothing under dry', () => {
    const host = 'task:\n  isolation:\n    enabled: false\n';
    const { result, after } = edit(host, true);
    expect(result.wrote).toBe(false);
    expect(result.changed.map((c) => c.setting)).toEqual([
      'task.isolation.enabled',
      'task.isolation.apply',
      'task.isolation.merge',
    ]);
    expect(after).toBe(host);
  });

  it('keeps the file’s CRLF line endings', () => {
    const { after } = edit(
      'task:\r\n  isolation:\r\n    enabled: false\r\nx: 1\r\n',
    );
    expect(after).toBe(
      'task:\r\n  isolation:\r\n    enabled: true\r\n    apply: false\r\n    merge: branch\r\nx: 1\r\n',
    );
  });

  it.each([
    ['a flow mapping', 'task: { a: 1 }\n', 'inline value'],
    [
      'a flow mapping below',
      'task:\n  isolation: { enabled: false }\n',
      'inline value',
    ],
    ['a dotted key', 'task.isolation.enabled: false\n', 'dotted key'],
    [
      'a value on the lines beneath',
      'task:\n  isolation:\n    apply:\n      true\n',
      'beneath',
    ],
    ['a list at the top', '- a\n- b\n', 'not a block mapping'],
  ])('leaves %s as it is, and says why', (_name, host, why) => {
    const { result, after } = edit(host);
    expect(result.wrote).toBe(false);
    expect(result.refused).toContain(why);
    expect(after).toBe(host);
  });
});
