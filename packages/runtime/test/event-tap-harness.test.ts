// The event tap refuses an omp invocation because omp has no tap strategy.
//
// The environment is injected (`opts.env`) rather than mutated, so each case names
// the invoking context it means.

import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  dispatchEventTap,
  invokingHarness,
} from '../src/capabilities/event-tap/index.js';
import type { RuntimeConfig } from '../src/runtime-config.js';

const CONFIG: RuntimeConfig = {
  events: { vocabulary: ['turn.end'] },
  harnesses: {
    omp: { native: { 'turn.end': 'session_stop' } },
  },
};

const OMP_ENV = { OMPCODE: '1' };

const made: string[] = [];
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

function scratch(): { settings: string; sink: string } {
  const dir = mkdtempSync(join(tmpdir(), 'cratylus-event-tap-harness-'));
  made.push(dir);
  return {
    settings: join(dir, '.omp', 'settings.json'),
    sink: join(dir, 'capture.log'),
  };
}

describe('invokingHarness — omp', () => {
  it('reads omp from its own marker', () => {
    expect(invokingHarness(OMP_ENV)).toBe('omp');
    expect(invokingHarness({})).toBeUndefined();
  });
});

describe('from an omp invocation context', () => {
  it('refuses install and writes no settings', () => {
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
    expect(() =>
      dispatchEventTap(argv, { config: CONFIG, env: OMP_ENV }),
    ).toThrow(/^eventTap install: .*omp.*no event-tap strategy/);
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
