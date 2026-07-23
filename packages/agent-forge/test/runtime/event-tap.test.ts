// EventTapHost port + EventTapHostClaude adapter — hermetic runtime tests.
//
// Proves each acceptance criterion of the runtime-port shard:
//   (1) the port interface names NOTHING harness-specific (source grep);
//   (2) installTap adds the passive logger AND preserves foreign keys/entries;
//   (3) removeTap restores the fixture to its prior state (zero residue);
//   (4) the installed logger, fed a synthetic event, emits EMPTY stdout + exit 0
//       (prove-CANNOT-block) and readCapture lifts it to a neutral record;
//   (+) status() reflects the real installed state.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  type CaptureSink,
  EventTapHostClaude,
} from '../../src/runtime/event-tap/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const PORT_SRC = join(
  here,
  '..',
  '..',
  'src',
  'runtime',
  'event-tap',
  'port.ts',
);

interface HookCommand {
  type: string;
  command?: string;
  id?: string;
}
interface HookEntry {
  hooks: HookCommand[];
}
interface Settings {
  permissions?: { allow?: string[] };
  env?: Record<string, string>;
  hooks?: Record<string, HookEntry[]>;
}

function fixtureDir(): { settingsPath: string; sink: CaptureSink } {
  const dir = mkdtempSync(join(tmpdir(), 'agent-forge-event-tap-'));
  return {
    settingsPath: join(dir, '.claude', 'settings.json'),
    sink: { path: join(dir, 'capture.log') },
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

describe('EventTapHost port (accept 1: harness-neutral names)', () => {
  it('references no Claude/settings/hook term anywhere in the port', () => {
    const src = readFileSync(PORT_SRC, 'utf8');
    // Whole-file (strongest form of "the port names nothing harness-specific"):
    // the interface, its methods, and its types must be free of these terms.
    expect(/claude/i.test(src)).toBe(false);
    expect(/settings/i.test(src)).toBe(false);
    expect(/hook/i.test(src)).toBe(false);
  });
});

describe('EventTapHostClaude.installTap (accept 2)', () => {
  it('adds the passive logger AND preserves foreign keys + entries', () => {
    const { settingsPath, sink } = fixtureDir();
    seed(settingsPath, {
      permissions: { allow: ['Bash(git:*)'] },
      env: { FOO: 'bar' },
      // a pre-existing FOREIGN hook under an event we also tap
      hooks: {
        Stop: [{ hooks: [{ type: 'command', command: 'echo foreign' }] }],
      },
    });

    new EventTapHostClaude(settingsPath).installTap(
      ['turn.end', 'session.start'],
      sink,
    );

    const after = read(settingsPath);
    // foreign top-level keys survive
    expect(after.permissions).toEqual({ allow: ['Bash(git:*)'] });
    expect(after.env).toEqual({ FOO: 'bar' });
    // turn.end → Stop: foreign entry kept, ours appended
    expect(after.hooks?.Stop).toHaveLength(2);
    expect(after.hooks?.Stop?.[0]?.hooks[0]?.command).toBe('echo foreign');
    const ours = after.hooks?.Stop?.[1]?.hooks[0];
    expect(ours?.type).toBe('command');
    expect(ours?.command).toContain(sink.path);
    expect(ours?.command).toContain('exit 0');
    // session.start → SessionStart added
    expect(after.hooks?.SessionStart).toHaveLength(1);
  });
});

describe('EventTapHostClaude.removeTap (accept 3: zero residue)', () => {
  it('restores a fixture with no prior hooks byte-for-byte', () => {
    const { settingsPath, sink } = fixtureDir();
    const before = seed(settingsPath, {
      permissions: { allow: ['Bash(git:*)'] },
      env: { FOO: 'bar' },
    });

    const host = new EventTapHostClaude(settingsPath);
    host.installTap(['turn.end'], sink);
    expect(read(settingsPath).hooks?.Stop).toHaveLength(1); // installed
    host.removeTap();

    // exact prior state — the hooks key is gone, not left as `{}`
    expect(readFileSync(settingsPath, 'utf8')).toBe(before);
  });

  it('surgically removes only its own entry, sparing a foreign one', () => {
    const { settingsPath, sink } = fixtureDir();
    seed(settingsPath, {
      hooks: {
        Stop: [{ hooks: [{ type: 'command', command: 'echo foreign' }] }],
      },
    });

    const host = new EventTapHostClaude(settingsPath);
    host.installTap(['turn.end'], sink);
    expect(read(settingsPath).hooks?.Stop).toHaveLength(2);
    host.removeTap();

    const after = read(settingsPath);
    expect(after.hooks?.Stop).toHaveLength(1);
    expect(after.hooks?.Stop?.[0]?.hooks[0]?.command).toBe('echo foreign');
  });
});

describe('installed logger (accept 4: prove-CANNOT-block)', () => {
  it('emits EMPTY stdout + exit 0 on a synthetic event, and is captured', () => {
    const { settingsPath, sink } = fixtureDir();
    const host = new EventTapHostClaude(settingsPath);
    host.installTap(['turn.end'], sink);

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

    // the event was captured and lifts back to a neutral record
    const rows = host.readCapture();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.event).toBe('turn.end'); // Stop → turn.end
    expect(rows[0]?.payload).toEqual({ hook_event_name: 'Stop', turns: 1 });
  });
});

describe('EventTapHostClaude.status', () => {
  it('reflects the real installed state, derived from the target file', () => {
    const { settingsPath, sink } = fixtureDir();
    const host = new EventTapHostClaude(settingsPath);
    expect(host.status()).toEqual({ attached: false, events: [] });

    host.installTap(['turn.end', 'session.start'], sink);
    const s = host.status();
    expect(s.attached).toBe(true);
    expect([...s.events].sort()).toEqual(['session.start', 'turn.end']);

    host.removeTap();
    expect(host.status()).toEqual({ attached: false, events: [] });
  });
});
