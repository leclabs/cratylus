// `eventTap install` on Claude Code degrades and warns for a requested event Claude
// fires no native event for, instead of listing it as tapped and writing nothing.
//
// Three cases, by how much of the request can be tapped: all of it, some of it, none.
// The vocabulary declares `session.resume`, which the Claude stanza has no name for —
// a real corpus event with no native peer, not a typo — so the refusals below are the
// shortfall path, not the unknown-word one.

import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dispatchEventTap } from '../src/capabilities/event-tap/index.js';
import type { RuntimeConfig } from '../src/runtime-config.js';

const CONFIG: RuntimeConfig = {
  events: {
    vocabulary: [
      'turn.end',
      'agent.idle',
      'session.resume',
      'operator.consult.pre',
    ],
  },
  harnesses: {
    claude: { native: { 'turn.end': 'Stop', 'agent.idle': 'TeammateIdle' } },
  },
};

function install(events: string, config: RuntimeConfig = CONFIG) {
  const dir = mkdtempSync(join(tmpdir(), 'cratylus-event-tap-skipped-'));
  const settings = join(dir, '.claude', 'settings.json');
  const warnings: string[] = [];
  const run = () =>
    dispatchEventTap(
      [
        'install',
        '--events',
        events,
        '--sink',
        join(dir, 'capture.log'),
        '--settings',
        settings,
      ],
      { config, env: {}, warn: (line) => warnings.push(line) },
    );
  return { run, settings, warnings };
}

describe('eventTap install, by how much of the request Claude Code can tap', () => {
  it('reports every event tapped and warns of none when all are mapped', () => {
    const { run, settings, warnings } = install('turn.end,agent.idle');
    expect(run()).toEqual({
      verb: 'install',
      events: ['turn.end', 'agent.idle'],
      sink: expect.any(String),
    });
    expect(warnings).toEqual([]);
    expect(
      Object.keys(JSON.parse(readFileSync(settings, 'utf8')).hooks),
    ).toEqual(['Stop', 'TeammateIdle']);
  });

  it('taps the mapped ones, reports the rest as skipped with why, and warns per event', () => {
    const { run, settings, warnings } = install('agent.idle,session.resume');
    const result = run();
    expect(result).toMatchObject({
      verb: 'install',
      events: ['agent.idle'],
      skipped: [
        {
          event: 'session.resume',
          reason: expect.stringContaining('Claude Code'),
        },
      ],
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/session\.resume/);
    expect(warnings[0]).toMatch(/Claude Code/);
    expect(
      Object.keys(JSON.parse(readFileSync(settings, 'utf8')).hooks),
    ).toEqual(['TeammateIdle']);
  });

  it('refuses when nothing requested can be tapped, and writes nothing', () => {
    const { run, settings, warnings } = install('session.resume');
    expect(run).toThrow(
      /^eventTap install: .*session\.resume.*nothing was written/,
    );
    expect(existsSync(settings)).toBe(false);
    expect(warnings).toEqual([]);
  });

  it('skips an act event for a stanza an earlier deploy wrote, which holds names only', () => {
    // Before the stanza carried `acts`, `operator.consult.pre` had no binding to
    // read; the stanza below is that deploy's, and the act is skipped as it was.
    const { run, settings, warnings } = install(
      'turn.end,operator.consult.pre',
    );
    expect(run()).toMatchObject({
      events: ['turn.end'],
      skipped: [{ event: 'operator.consult.pre' }],
    });
    expect(warnings).toHaveLength(1);
    expect(
      Object.keys(JSON.parse(readFileSync(settings, 'utf8')).hooks),
    ).toEqual(['Stop']);
  });

  it('names the missing binding and the deploy that writes it when a names-only stanza skips an act', () => {
    const { run, warnings } = install('turn.end,operator.consult.pre');
    const result = run();
    if (result.verb !== 'install')
      throw new Error('expected an install result');
    for (const text of [warnings[0], result.skipped?.[0]?.reason]) {
      expect(text).toMatch(/binding/);
      expect(text).toContain('cratylus install --harness claude');
      expect(text).toContain('cratylus deploy --harness claude');
      expect(text).not.toContain('fires no native event');
    }
  });

  it('names them in the refusal too when the only event asked for is such an act', () => {
    const { run, settings } = install('operator.consult.pre');
    let refusal = '';
    try {
      run();
    } catch (error) {
      refusal = error instanceof Error ? error.message : String(error);
    }
    expect(refusal).toMatch(
      /^eventTap install: .*operator\.consult\.pre.*cratylus install --harness claude.*nothing was written/,
    );
    expect(refusal).not.toContain('fires no native event');
    expect(existsSync(settings)).toBe(false);
  });

  it('keeps the plain reason on a stanza that carries act bindings but not this event', () => {
    const current: RuntimeConfig = {
      ...CONFIG,
      harnesses: {
        claude: {
          native: { 'turn.end': 'Stop' },
          acts: {
            'operator.consult.pre': {
              event: 'PreToolUse',
              matcher: 'AskUserQuestion',
            },
          },
        },
      },
    };
    const { run, warnings } = install(
      'operator.consult.pre,session.resume',
      current,
    );
    expect(run()).toMatchObject({
      events: ['operator.consult.pre'],
      skipped: [
        {
          event: 'session.resume',
          reason: 'Claude Code fires no native event for it',
        },
      ],
    });
    expect(warnings).toEqual([
      "eventTap install: 'session.resume' is not tapped — Claude Code fires no native event for it.",
    ]);
  });
});
