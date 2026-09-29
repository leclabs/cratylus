// The event tap targets the harness that INVOKED it, and refuses one with no tap
// strategy instead of attaching to Claude's `settings.json` on its behalf.
//
// The environment is injected (`opts.env`) rather than mutated, so each case names
// the invoking context it means. The host config carries BOTH harnesses' stanzas —
// the host on which this bug was found — because a config holding only Claude's
// would refuse for the wrong reason.

import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  dispatchEventTap,
  invokingHarness,
} from '../src/capabilities/event-tap/index.js';
import type { RuntimeConfig } from '../src/runtime-config.js';

const CONFIG: RuntimeConfig = {
  events: { vocabulary: ['turn.end'] },
  harnesses: {
    claude: { native: { 'turn.end': 'Stop' } },
    omp: { native: { 'turn.end': 'session_stop' } },
  },
};

/** What omp exports to a tool subprocess: its own marker, and Claude Code's. */
const OMP_ENV = { OMPCODE: '1', CLAUDECODE: '1' };
const CLAUDE_ENV = { CLAUDECODE: '1' };

function scratch(): { settings: string; sink: string } {
  const dir = mkdtempSync(join(tmpdir(), 'cratylus-event-tap-harness-'));
  return {
    settings: join(dir, '.claude', 'settings.json'),
    sink: join(dir, 'capture.log'),
  };
}

describe('invokingHarness — omp exports Claude Code’s marker too', () => {
  it('reads omp from its own marker even when CLAUDECODE is also set', () => {
    expect(invokingHarness(OMP_ENV)).toBe('omp');
    expect(invokingHarness({ OMPCODE: '1' })).toBe('omp');
  });
  it('reads Claude Code from CLAUDECODE alone, and nothing from a bare or blank environment', () => {
    expect(invokingHarness(CLAUDE_ENV)).toBe('claude');
    expect(invokingHarness({})).toBeUndefined();
    expect(invokingHarness({ OMPCODE: '', CLAUDECODE: ' ' })).toBeUndefined();
  });
});

describe('from an omp invocation context', () => {
  it('refuses install, naming omp and Claude Code, and writes no settings', () => {
    const { settings, sink } = scratch();
    const argv = [
      'install',
      '--events',
      'turn.end',
      '--sink',
      sink,
      '--settings',
      settings,
    ];
    let message = '';
    try {
      dispatchEventTap(argv, { config: CONFIG, env: OMP_ENV });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/^eventTap install:/);
    expect(message).toMatch(/omp/);
    expect(message).toMatch(/Claude Code/);
    expect(existsSync(join(settings, '..'))).toBe(false);
    expect(existsSync(sink)).toBe(false);
  });

  it('refuses every verb, so status can never report attached', () => {
    const { settings } = scratch();
    for (const verb of ['install', 'uninstall', 'read', 'status']) {
      expect(() =>
        dispatchEventTap([verb, '--settings', settings], {
          config: CONFIG,
          env: OMP_ENV,
        }),
      ).toThrow(/no event-tap strategy/);
    }
  });

  it('refuses before the vocabulary is looked up, so the reason is the harness', () => {
    expect(() =>
      dispatchEventTap(['status'], { config: null, env: OMP_ENV }),
    ).toThrow(/omp has no event-tap strategy/);
  });

  it('still refuses a flag the verb does not take first', () => {
    expect(() =>
      dispatchEventTap(['status', '--bogus'], { config: CONFIG, env: OMP_ENV }),
    ).toThrow(/--bogus/);
  });
});

describe('from a Claude Code or harness-less context', () => {
  for (const [context, env] of [
    ['Claude Code', CLAUDE_ENV],
    ['a bare shell', {}],
  ] as const) {
    it(`installs and reports attached, from ${context}`, () => {
      const { settings, sink } = scratch();
      dispatchEventTap(
        [
          'install',
          '--events',
          'turn.end',
          '--sink',
          sink,
          '--settings',
          settings,
        ],
        { config: CONFIG, env },
      );
      const result = dispatchEventTap(['status', '--settings', settings], {
        config: CONFIG,
        env,
      });
      expect(result).toEqual({
        verb: 'status',
        status: { attached: true, events: ['turn.end'] },
      });
    });
  }
});
