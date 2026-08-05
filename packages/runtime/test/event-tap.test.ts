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
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { dispatchEventTap } from '../src/capabilities/event-tap/index.js';

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
  hooks?: Record<string, Array<{ hooks: HookCommand[] }>>;
}

function fixture(): { settingsPath: string; sinkPath: string } {
  const dir = mkdtempSync(join(tmpdir(), 'cratylus-run-event-tap-'));
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

    const res = dispatchEventTap([
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
    expect(ours?.id).toBe('cratylus-run-event-tap');
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

    dispatchEventTap([
      'install',
      '--events',
      'turn.end',
      '--sink',
      sinkPath,
      '--settings',
      settingsPath,
    ]);
    expect(read(settingsPath).hooks?.Stop).toHaveLength(1);
    dispatchEventTap(['uninstall', '--settings', settingsPath]);

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

    dispatchEventTap([
      'install',
      '--events',
      'turn.end',
      '--sink',
      sinkPath,
      '--settings',
      settingsPath,
    ]);
    expect(read(settingsPath).hooks?.Stop).toHaveLength(2);
    dispatchEventTap(['uninstall', '--settings', settingsPath]);

    const after = read(settingsPath);
    expect(after.hooks?.Stop).toHaveLength(1);
    expect(after.hooks?.Stop?.[0]?.hooks[0]?.command).toBe('echo foreign');
  });
});

describe('tap status / read (accept 3: reflect state across processes)', () => {
  it('status reflects installed state, derived from the target file', () => {
    const { settingsPath, sinkPath } = fixture();
    expect(dispatchEventTap(['status', '--settings', settingsPath])).toEqual({
      verb: 'status',
      status: { attached: false, events: [] },
    });

    dispatchEventTap([
      'install',
      '--events',
      'turn.end,session.start',
      '--sink',
      sinkPath,
      '--settings',
      settingsPath,
    ]);
    const s = dispatchEventTap(['status', '--settings', settingsPath]);
    expect(s.verb).toBe('status');
    if (s.verb !== 'status') throw new Error('unreachable');
    expect(s.status.attached).toBe(true);
    expect([...s.status.events].sort()).toEqual(['session.start', 'turn.end']);

    dispatchEventTap(['uninstall', '--settings', settingsPath]);
    expect(dispatchEventTap(['status', '--settings', settingsPath])).toEqual({
      verb: 'status',
      status: { attached: false, events: [] },
    });
  });

  it('read recovers the sink from settings (fresh dispatch, no in-mem state)', () => {
    const { settingsPath, sinkPath } = fixture();
    dispatchEventTap([
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
    const r = dispatchEventTap(['read', '--settings', settingsPath]);
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

describe('installed logger (accept 4: prove-CANNOT-block)', () => {
  it('emits EMPTY stdout + exit 0 on a synthetic event', () => {
    const { settingsPath, sinkPath } = fixture();
    dispatchEventTap([
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

    const r = dispatchEventTap(['read', '--settings', settingsPath]);
    if (r.verb !== 'read') throw new Error('unreachable');
    expect(r.records).toHaveLength(1);
    expect(r.records[0]?.event).toBe('turn.end');
  });
});

describe('unknown input fails LOUD (no silent no-op)', () => {
  it('throws on an unknown verb', () => {
    expect(() => dispatchEventTap(['frobnicate'])).toThrow(/unknown verb/);
  });
  it('throws on an unknown lifecycle event', () => {
    expect(() =>
      dispatchEventTap(['install', '--events', 'not.an.event', '--sink', '/x']),
    ).toThrow(/unknown lifecycle event/);
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
