// event-tap capability — hermetic tests proving the S5 falsifier gate:
//   (1) `tap install --events … --sink …` merges a PASSIVE logger into a test
//       settings.json, preserving foreign top-level keys AND foreign per-event
//       entries;
//   (2) `tap uninstall` surgically drops ONLY the EVENT_TAP_ID entry (file restored byte
//       -for-byte; zero residue — no bare `hooks: {}`);
//   (3) `tap status`/`tap read` reflect the real installed state, derived from the
//       target file (correct across separate processes);
//   (4) the installed logger, fed a synthetic event, emits EMPTY stdout + exit 0
//       (prove-CANNOT-block, non-vacuous);
//   (5) the capability imports NOTHING from `@cratylus/forge` (DAG guard).

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { CLI_BIN } from '../src/bin-name.js';
import {
  type EventTapResult,
  type EventTapVerb,
  VERBS,
} from '../src/capabilities/event-tap/dispatch.js';
import {
  EVENT_TAP_ID,
  dispatchEventTap,
} from '../src/capabilities/event-tap/index.js';
import {
  RUNTIME_CONFIG_ENV,
  type RuntimeConfig,
  loadRuntimeConfig,
} from '../src/runtime-config.js';
import * as verbFlags from '../src/verb-flags.js';

/**
 * The host config a deployed host would carry — the corpus's vocabulary, and
 * Claude's stanza of native names. Injected rather than written to a real
 * `~/.cratylus.json`, and injected rather than defaulted inside the capability: a
 * bundled default set is exactly what this suite's subject stopped carrying, so a
 * test that supplied one would be exercising a path no host has.
 *
 * Only the events this suite drives are declared, which also makes the vocabulary
 * check below non-trivial — `not.an.event` is rejected against THIS list.
 */
const CONFIG: RuntimeConfig = {
  events: { vocabulary: ['session.start', 'turn.end', 'tool.use.pre'] },
  harnesses: {
    claude: {
      native: {
        'session.start': 'SessionStart',
        'turn.end': 'Stop',
        'tool.use.pre': 'PreToolUse',
      },
    },
  },
};

// This suite drives the CLAUDE tap. The tap reads which harness invoked it from the
// environment (`event-tap-harness.test.ts` covers that), so a run launched from
// inside an omp session would be refused; the suite states the harness it means
// instead of inheriting the runner's.
beforeAll(() => {
  vi.stubEnv('OMPCODE', '');
});
afterAll(() => {
  vi.unstubAllEnvs();
});

/** Drive the verb surface with the host config a deployed host would have. */
const tap = (argv: string[]): ReturnType<typeof dispatchEventTap> =>
  dispatchEventTap(argv, { config: CONFIG });

const here = dirname(fileURLToPath(import.meta.url));
const CAP_DIR = join(here, '..', 'src', 'capabilities', 'event-tap');

interface HookCommand {
  type: string;
  command?: string;
  id?: string;
}
interface Settings {
  permissions?: { allow?: string[] };
  env?: Record<string, string>;
  hooks?: Record<string, Array<{ matcher?: string; hooks: HookCommand[] }>>;
}

function fixture(): { settingsPath: string; sinkPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'cratylus-event-tap-'));
  return {
    settingsPath: join(dir, '.claude', 'settings.json'),
    sinkPath: join(dir, 'capture.log'),
  };
}

function seed(settingsPath: string, obj: Settings): string {
  const text = `${JSON.stringify(obj, null, 2)}\n`;
  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, text, 'utf8');
  return text;
}

function read(settingsPath: string): Settings {
  return JSON.parse(readFileSync(settingsPath, 'utf8')) as Settings;
}

describe('tap install (accept 1: merge + preserve)', () => {
  it('merges a passive logger, preserving foreign keys + entries', () => {
    const { settingsPath, sinkPath } = fixture();
    seed(settingsPath, {
      permissions: { allow: ['Bash(git:*)'] },
      env: { FOO: 'bar' },
      hooks: {
        Stop: [{ hooks: [{ type: 'command', command: 'echo foreign' }] }],
      },
    });

    const res = tap([
      'install',
      '--events',
      'turn.end,session.start',
      '--sink',
      sinkPath,
      '--settings',
      settingsPath,
    ]);
    expect(res).toEqual({
      verb: 'install',
      events: ['turn.end', 'session.start'],
      sink: sinkPath,
    });

    const after = read(settingsPath);
    expect(after.permissions).toEqual({ allow: ['Bash(git:*)'] });
    expect(after.env).toEqual({ FOO: 'bar' });
    // turn.end → Stop: foreign entry kept, ours appended
    expect(after.hooks?.Stop).toHaveLength(2);
    expect(after.hooks?.Stop?.[0]?.hooks[0]?.command).toBe('echo foreign');
    const ours = after.hooks?.Stop?.[1]?.hooks[0];
    expect(ours?.type).toBe('command');
    expect(ours?.command).toContain(sinkPath);
    expect(ours?.command).toContain('exit 0');
    expect(ours?.id).toBe('cratylus-event-tap');
    // session.start → SessionStart added
    expect(after.hooks?.SessionStart).toHaveLength(1);
  });
});

describe('tap uninstall (accept 2: zero residue)', () => {
  it('restores a fixture with no prior hooks byte-for-byte', () => {
    const { settingsPath, sinkPath } = fixture();
    const before = seed(settingsPath, {
      permissions: { allow: ['Bash(git:*)'] },
      env: { FOO: 'bar' },
    });

    tap([
      'install',
      '--events',
      'turn.end',
      '--sink',
      sinkPath,
      '--settings',
      settingsPath,
    ]);
    expect(read(settingsPath).hooks?.Stop).toHaveLength(1);
    tap(['uninstall', '--settings', settingsPath]);

    // exact prior state — the hooks key is GONE, not left as `{}`
    expect(readFileSync(settingsPath, 'utf8')).toBe(before);
  });

  it('surgically removes only its own entry, sparing a foreign one', () => {
    const { settingsPath, sinkPath } = fixture();
    seed(settingsPath, {
      hooks: {
        Stop: [{ hooks: [{ type: 'command', command: 'echo foreign' }] }],
      },
    });

    tap([
      'install',
      '--events',
      'turn.end',
      '--sink',
      sinkPath,
      '--settings',
      settingsPath,
    ]);
    expect(read(settingsPath).hooks?.Stop).toHaveLength(2);
    tap(['uninstall', '--settings', settingsPath]);

    const after = read(settingsPath);
    expect(after.hooks?.Stop).toHaveLength(1);
    expect(after.hooks?.Stop?.[0]?.hooks[0]?.command).toBe('echo foreign');
  });
});

describe('tap uninstall restores what install placed', () => {
  const install = (settingsPath: string, sinkPath: string): void => {
    tap([
      'install',
      '--events',
      'turn.end',
      '--sink',
      sinkPath,
      '--settings',
      settingsPath,
    ]);
  };

  it('removes the settings file and the .claude directory install created', () => {
    const { settingsPath, sinkPath } = fixture();
    install(settingsPath, sinkPath);
    expect(existsSync(settingsPath)).toBe(true);

    const res = tap(['uninstall', '--settings', settingsPath]);

    expect(existsSync(settingsPath)).toBe(false);
    expect(existsSync(dirname(settingsPath))).toBe(false);
    expect(res).toEqual({ verb: 'uninstall' });
  });

  it('removes every directory install made for a nested settings path', () => {
    const { settingsPath, sinkPath } = fixture();
    const nested = join(
      dirname(dirname(settingsPath)),
      'a',
      'b',
      'settings.json',
    );
    install(nested, sinkPath);

    tap(['uninstall', '--settings', nested]);

    expect(existsSync(join(dirname(dirname(settingsPath)), 'a'))).toBe(false);
    expect(existsSync(dirname(dirname(settingsPath)))).toBe(true);
  });

  it('keeps a settings file that held {} before install, holding {}', () => {
    const { settingsPath, sinkPath } = fixture();
    seed(settingsPath, {});
    install(settingsPath, sinkPath);

    tap(['uninstall', '--settings', settingsPath]);

    expect(read(settingsPath)).toEqual({});
  });

  it('keeps a .claude directory that held another file before install', () => {
    const { settingsPath, sinkPath } = fixture();
    const other = join(dirname(settingsPath), 'CLAUDE.md');
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(other, 'host-owned\n', 'utf8');
    install(settingsPath, sinkPath);

    const res = tap(['uninstall', '--settings', settingsPath]);

    expect(existsSync(settingsPath)).toBe(false);
    expect(readFileSync(other, 'utf8')).toBe('host-owned\n');
    expect(res).toEqual({ verb: 'uninstall' });
  });

  it('keeps a directory the host put a file in after install', () => {
    const { settingsPath, sinkPath } = fixture();
    install(settingsPath, sinkPath);
    const other = join(dirname(settingsPath), 'CLAUDE.md');
    writeFileSync(other, 'added later\n', 'utf8');

    const res = tap(['uninstall', '--settings', settingsPath]);

    expect(existsSync(settingsPath)).toBe(false);
    expect(readFileSync(other, 'utf8')).toBe('added later\n');
    expect(res).toEqual({
      verb: 'uninstall',
      left: [
        { path: dirname(settingsPath), why: expect.stringContaining('host') },
      ],
    });
  });

  it('keeps a settings file the host added keys to after install', () => {
    const { settingsPath, sinkPath } = fixture();
    install(settingsPath, sinkPath);
    const installed = read(settingsPath);
    writeFileSync(
      settingsPath,
      JSON.stringify({ ...installed, env: { FOO: 'bar' } }),
      'utf8',
    );

    const res = tap(['uninstall', '--settings', settingsPath]);

    expect(read(settingsPath)).toEqual({ env: { FOO: 'bar' } });
    expect(res).toEqual({
      verb: 'uninstall',
      left: [{ path: settingsPath, why: expect.stringContaining('host') }],
    });
  });

  it.each([
    ['an empty file', ''],
    ['a whitespace-only file', '  \n'],
    ['a one-line document with no newline', '{"env":{"FOO":"bar"}}'],
    ['a 4-space document', '{\n    "env": {\n        "FOO": "bar"\n    }\n}\n'],
    ['a tab-indented document', '{\n\t"env": {\n\t\t"FOO": "bar"\n\t}\n}\n'],
    [
      'a 4-space document with hooks of its own',
      '{\n    "hooks": {\n        "Stop": [\n            {\n                "hooks": [\n                    {\n                        "type": "command",\n                        "command": "echo foreign"\n                    }\n                ]\n            }\n        ]\n    },\n    "env": {\n        "FOO": "bar"\n    }\n}\n',
    ],
  ])('puts back %s exactly as the host laid it out', (_name, before) => {
    const { settingsPath, sinkPath } = fixture();
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(settingsPath, before, 'utf8');
    install(settingsPath, sinkPath);

    tap(['uninstall', '--settings', settingsPath]);

    expect(readFileSync(settingsPath, 'utf8')).toBe(before);
  });

  it('puts back the host layout after a second install over the first', () => {
    const { settingsPath, sinkPath } = fixture();
    const before = '{\n    "env": {\n        "FOO": "bar"\n    }\n}\n';
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(settingsPath, before, 'utf8');
    install(settingsPath, sinkPath);
    install(settingsPath, sinkPath);

    tap(['uninstall', '--settings', settingsPath]);

    expect(readFileSync(settingsPath, 'utf8')).toBe(before);
  });

  it('removes the file after a second install over the first', () => {
    const { settingsPath, sinkPath } = fixture();
    install(settingsPath, sinkPath);
    install(settingsPath, sinkPath);

    tap(['uninstall', '--settings', settingsPath]);

    expect(existsSync(dirname(settingsPath))).toBe(false);
  });
});

describe('tap status / read (accept 3: reflect state across processes)', () => {
  it('status reflects installed state, derived from the target file', () => {
    const { settingsPath, sinkPath } = fixture();
    expect(tap(['status', '--settings', settingsPath])).toEqual({
      verb: 'status',
      status: { attached: false, events: [] },
    });

    tap([
      'install',
      '--events',
      'turn.end,session.start',
      '--sink',
      sinkPath,
      '--settings',
      settingsPath,
    ]);
    const s = tap(['status', '--settings', settingsPath]);
    expect(s.verb).toBe('status');
    if (s.verb !== 'status') throw new Error('unreachable');
    expect(s.status.attached).toBe(true);
    expect([...s.status.events].sort()).toEqual(['session.start', 'turn.end']);

    tap(['uninstall', '--settings', settingsPath]);
    expect(tap(['status', '--settings', settingsPath])).toEqual({
      verb: 'status',
      status: { attached: false, events: [] },
    });
  });

  it('read recovers the sink from settings (fresh dispatch, no in-mem state)', () => {
    const { settingsPath, sinkPath } = fixture();
    tap([
      'install',
      '--events',
      'turn.end',
      '--sink',
      sinkPath,
      '--settings',
      settingsPath,
    ]);
    // simulate the harness having written one captured record
    writeFileSync(
      sinkPath,
      `${JSON.stringify({ hook_event_name: 'Stop', turns: 1 })}\n`,
      'utf8',
    );

    // a SEPARATE dispatch (no prior install on this call path)
    const r = tap(['read', '--settings', settingsPath]);
    expect(r.verb).toBe('read');
    if (r.verb !== 'read') throw new Error('unreachable');
    expect(r.records).toHaveLength(1);
    expect(r.records[0]?.event).toBe('turn.end');
    expect(r.records[0]?.payload).toEqual({
      hook_event_name: 'Stop',
      turns: 1,
    });
  });
});

describe('tap on an ACT event (a native event narrowed to the tool that performs it)', () => {
  /** The claude stanza as `deploy` writes it: plain names under `native`, and each
   *  act's ⟨event, matcher⟩ under `acts`; read back by the runtime's own loader. */
  function deployedConfig(): RuntimeConfig {
    const path = join(
      mkdtempSync(join(tmpdir(), 'cratylus-event-tap-')),
      'config.json',
    );
    writeFileSync(
      path,
      JSON.stringify({
        events: {
          vocabulary: [
            'tool.use.pre',
            'operator.consult.pre',
            'subagent.dispatch.pre',
          ],
        },
        harnesses: {
          claude: {
            native: { 'tool.use.pre': 'PreToolUse' },
            acts: {
              'operator.consult.pre': {
                event: 'PreToolUse',
                matcher: 'AskUserQuestion',
              },
              'subagent.dispatch.pre': {
                event: 'PreToolUse',
                matcher: 'Agent|SendMessage',
              },
            },
          },
        },
      }),
    );
    const config = loadRuntimeConfig(path);
    if (config === null) throw new Error('the stanza read as no config');
    return config;
  }

  const act = (argv: string[]) =>
    dispatchEventTap(argv, { config: deployedConfig() });

  it('installs a PreToolUse entry narrowed to the act’s matcher, sparing foreign entries', () => {
    const { settingsPath, sinkPath } = fixture();
    seed(settingsPath, {
      hooks: {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [{ type: 'command', command: 'echo foreign' }],
          },
        ],
      },
    });

    expect(
      act([
        'install',
        '--events',
        'operator.consult.pre,subagent.dispatch.pre',
        '--sink',
        sinkPath,
        '--settings',
        settingsPath,
      ]),
    ).toEqual({
      verb: 'install',
      events: ['operator.consult.pre', 'subagent.dispatch.pre'],
      sink: sinkPath,
    });

    const entries = read(settingsPath).hooks?.PreToolUse ?? [];
    expect(entries.map((e) => e.matcher)).toEqual([
      'Bash',
      'AskUserQuestion',
      'Agent|SendMessage',
    ]);
    expect(entries[0]?.hooks[0]?.command).toBe('echo foreign');
    for (const ours of entries.slice(1))
      expect(ours.hooks).toEqual([
        {
          type: 'command',
          command: expect.any(String),
          id: EVENT_TAP_ID,
          restore: expect.any(Object),
        },
      ]);

    // Teardown drops the two narrowed entries and nothing else.
    act(['uninstall', '--settings', settingsPath]);
    expect(read(settingsPath).hooks?.PreToolUse).toEqual([
      {
        matcher: 'Bash',
        hooks: [{ type: 'command', command: 'echo foreign' }],
      },
    ]);
  });

  it('reports the acts as attached, and reads each capture back as the act it was', () => {
    const { settingsPath, sinkPath } = fixture();
    act([
      'install',
      '--events',
      'operator.consult.pre,subagent.dispatch.pre',
      '--sink',
      sinkPath,
      '--settings',
      settingsPath,
    ]);
    expect(act(['status', '--settings', settingsPath])).toEqual({
      verb: 'status',
      status: {
        attached: true,
        events: ['operator.consult.pre', 'subagent.dispatch.pre'],
      },
    });

    const row = (tool: string) => ({
      hook_event_name: 'PreToolUse',
      tool_name: tool,
    });
    writeFileSync(
      sinkPath,
      [row('AskUserQuestion'), row('SendMessage'), row('Agent'), row('Bash')]
        .map((r) => `${JSON.stringify(r)}\n`)
        .join(''),
      'utf8',
    );
    const r = act(['read', '--settings', settingsPath]);
    if (r.verb !== 'read') throw new Error('unreachable');
    // `Bash` is the plain `tool.use.pre`: an act claims only the tools it names.
    expect(r.records.map((x) => x.event)).toEqual([
      'operator.consult.pre',
      'subagent.dispatch.pre',
      'subagent.dispatch.pre',
      'tool.use.pre',
    ]);
  });

  it('keeps the plain event and an act on one native event as distinct entries', () => {
    const { settingsPath, sinkPath } = fixture();
    act([
      'install',
      '--events',
      'tool.use.pre,operator.consult.pre',
      '--sink',
      sinkPath,
      '--settings',
      settingsPath,
    ]);
    const entries = read(settingsPath).hooks?.PreToolUse ?? [];
    expect(entries.map((e) => e.matcher)).toEqual([
      undefined,
      'AskUserQuestion',
    ]);
    expect(act(['status', '--settings', settingsPath])).toMatchObject({
      status: { events: ['tool.use.pre', 'operator.consult.pre'] },
    });
  });
});

describe('installed logger (accept 4: prove-CANNOT-block)', () => {
  it('emits EMPTY stdout + exit 0 on a synthetic event', () => {
    const { settingsPath, sinkPath } = fixture();
    tap([
      'install',
      '--events',
      'turn.end',
      '--sink',
      sinkPath,
      '--settings',
      settingsPath,
    ]);

    const command = read(settingsPath).hooks?.Stop?.[0]?.hooks[0]?.command;
    expect(command).toBeTypeOf('string');

    const synthetic = JSON.stringify({ hook_event_name: 'Stop', turns: 1 });
    // Run the logger EXACTLY as the harness would: JSON on stdin, via sh.
    // execFileSync throws on any non-zero exit — reaching the assertion proves
    // exit 0. Its return value is the command's stdout.
    const stdout = execFileSync('sh', ['-c', command as string], {
      input: synthetic,
    });
    expect(stdout.toString()).toBe(''); // emits nothing → cannot block/deny

    const r = tap(['read', '--settings', settingsPath]);
    if (r.verb !== 'read') throw new Error('unreachable');
    expect(r.records).toHaveLength(1);
    expect(r.records[0]?.event).toBe('turn.end');
  });
});

describe('unknown input fails LOUD (no silent no-op)', () => {
  it('throws on an undeclared verb, naming it, the verbs and the help to ask for', () => {
    expect(() => tap(['frobnicate'])).toThrow(
      `eventTap: unknown verb 'frobnicate'; the verbs are ${Object.keys(VERBS).join(', ')}; run ${CLI_BIN} eventTap --help`,
    );
  });
  it('throws on an unknown lifecycle event', () => {
    expect(() =>
      tap(['install', '--events', 'not.an.event', '--sink', '/x']),
    ).toThrow(/unknown lifecycle event/);
  });
  it('refuses a host whose config holds no claude names, naming the install and the deploy', () => {
    // The old flat shape: one `native` map under `events`, for every harness. It is
    // not read, so this host has a vocabulary and no stanza for claude, and the tap
    // refuses rather than attaching through a map that may be another harness's.
    const path = join(
      mkdtempSync(join(tmpdir(), 'cratylus-event-tap-')),
      'config.json',
    );
    writeFileSync(
      path,
      JSON.stringify({
        events: {
          vocabulary: ['turn.end'],
          native: { 'turn.end': 'Stop' },
        },
      }),
    );
    const config = loadRuntimeConfig(path);
    expect(config?.events?.vocabulary).toEqual(['turn.end']);
    expect(() => dispatchEventTap(['status'], { config })).toThrow(
      /install --harness claude[\s\S]*deploy --harness claude/,
    );

    // A claude stanza holding no names is the same fact: an install through it
    // would write a tap that observes nothing while reporting success.
    writeFileSync(
      path,
      JSON.stringify({
        events: { vocabulary: ['turn.end'] },
        harnesses: { claude: { native: {} } },
      }),
    );
    const { settingsPath, sinkPath } = fixture();
    expect(() =>
      dispatchEventTap(
        [
          'install',
          '--events',
          'turn.end',
          '--sink',
          sinkPath,
          '--settings',
          settingsPath,
        ],
        { config: loadRuntimeConfig(path) },
      ),
    ).toThrow(/install --harness claude[\s\S]*deploy --harness claude/);
    expect(existsSync(settingsPath)).toBe(false);
  });
});

describe('a flag the verb does not take is refused before the verb acts', () => {
  /** Each verb, and one flag it does not take. */
  const UNTAKEN: Record<EventTapVerb, string> = {
    install: '--evnets',
    uninstall: '--sink',
    read: '--events',
    status: '--bogus',
  };

  /** `argv` driven with no host config: `$AGENT_RUNTIME_CONFIG` at a path
   *  that holds none. */
  function unconfigured(argv: string[]): EventTapResult {
    const prior = process.env[RUNTIME_CONFIG_ENV];
    process.env[RUNTIME_CONFIG_ENV] = join(
      mkdtempSync(join(tmpdir(), 'cratylus-event-tap-')),
      'none.json',
    );
    try {
      return dispatchEventTap(argv);
    } finally {
      if (prior === undefined) delete process.env[RUNTIME_CONFIG_ENV];
      else process.env[RUNTIME_CONFIG_ENV] = prior;
    }
  }

  for (const [verb, flag] of Object.entries(UNTAKEN) as [
    EventTapVerb,
    string,
  ][]) {
    for (const [host, drive] of [
      ['with a host config', tap],
      ['without one', unconfigured],
    ] as const) {
      it(`${verb} ${flag}, ${host}`, () => {
        const { settingsPath, sinkPath } = fixture();
        const argv = [verb, '--settings', settingsPath, flag, '-s.jsonl'];
        if (verb === 'install')
          argv.push('--events', 'turn.end', '--sink', sinkPath);
        expect(() => drive(argv)).toThrow(
          new Error(verbFlags.refused('eventTap', verb, [flag], VERBS[verb])),
        );
        expect(existsSync(settingsPath)).toBe(false);
        expect(existsSync(sinkPath)).toBe(false);
      });
    }
  }

  it('reads a declared --flag=value as that flag, and installs', () => {
    const { settingsPath, sinkPath } = fixture();
    expect(
      tap([
        'install',
        '--events=turn.end',
        `--sink=${sinkPath}`,
        `--settings=${settingsPath}`,
      ]),
    ).toEqual({ verb: 'install', events: ['turn.end'], sink: sinkPath });
    const ours = read(settingsPath).hooks?.Stop?.[0]?.hooks[0];
    expect(ours?.id).toBe('cratylus-event-tap');
    expect(ours?.command).toContain(sinkPath);
  });

  it('refuses an undeclared --flag=value as --flag, suggesting the nearest', () => {
    const { settingsPath, sinkPath } = fixture();
    expect(verbFlags.nearest('--evnets', VERBS.install)).toBe('events');
    expect(() =>
      tap([
        'install',
        '--evnets=turn.end',
        '--sink',
        sinkPath,
        '--settings',
        settingsPath,
      ]),
    ).toThrow(
      new Error(
        verbFlags.refused('eventTap', 'install', ['--evnets'], VERBS.install),
      ),
    );
    expect(existsSync(settingsPath)).toBe(false);
    expect(existsSync(sinkPath)).toBe(false);
  });
});

/**
 * Every `forge` MODULE SPECIFIER a source text imports. Named rather than
 * inlined so the same scan can be fed a synthetic BAD source below: a guard that
 * only ever sees the clean corpus is green whether the DAG holds or the scan
 * stopped matching. Inspects import specifiers only — prose mentions of forge in
 * comments are fine, the guard is against a real module edge, not the word.
 */
function forgeImports(src: string): string[] {
  const specifier = /(?:from|import|require\()\s*['"]([^'"]+)['"]/g;
  return [...src.matchAll(specifier)]
    .map((m) => m[1] as string)
    .filter((s) => s.includes('forge'));
}

describe('DAG guard (accept 5: runtime never → forge)', () => {
  it('no capability source file imports @cratylus/forge', () => {
    const scanned: string[] = [];
    for (const file of readdirSync(CAP_DIR)) {
      if (!file.endsWith('.ts')) continue;
      scanned.push(file);
      const found = forgeImports(readFileSync(join(CAP_DIR, file), 'utf8'));
      expect(found, `${file} imports ${found.join(', ')}`).toEqual([]);
    }
    // A scan that reached nothing reports green forever.
    expect(scanned.length).toBeGreaterThan(0);
  });

  it('is non-vacuous — the scan FLAGS a source that takes the forbidden edge', () => {
    // The BAD input the live corpus does not contain: each import form the
    // specifier regex must catch, and the prose that must NOT be mistaken for one.
    expect(
      forgeImports("import { project } from '@cratylus/forge/project';\n"),
    ).toEqual(['@cratylus/forge/project']);
    expect(forgeImports("export * from '@cratylus/forge';\n")).toEqual([
      '@cratylus/forge',
    ]);
    expect(forgeImports("const f = require('@cratylus/forge');\n")).toEqual([
      '@cratylus/forge',
    ]);
    // EXONERATES: naming forge in prose is not a module edge.
    expect(forgeImports('// the projector lives in @cratylus/forge\n')).toEqual(
      [],
    );
    expect(forgeImports("import { x } from './claude.js';\n")).toEqual([]);
  });
});
