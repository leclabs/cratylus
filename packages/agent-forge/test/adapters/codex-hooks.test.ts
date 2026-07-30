import { describe, expect, it } from 'vitest';
import {
  codexHarnessAdapter,
  codexHooksJson,
} from '../../src/adapters/codex/anatomy.js';
import type { HarnessMechanism } from '../../src/core/hook/index.js';

const MECH = new Map<string, HarnessMechanism>([
  ['stance', { command: 'sh stance.sh', workers: [] }],
]);

// THE ADAPTER'S JOB IS TO ADAPT. The canon authors one shape — a constraint
// composed into the agents it governs — and each harness gets as close to it as
// its surface allows. Claude attaches a hook to a subagent directly. Codex
// declares hooks globally, so its adapter must re-express per-agent scope with the
// selector codex offers: `matcher` as a regex over `agent_type`, on
// SubagentStart/SubagentStop.

const binding = (
  anchor: string,
  agents: string[],
  events: string[],
  extra: Record<string, unknown> = {},
) => ({
  anchor,
  agents,
  fragment: {
    body: `${anchor} ≜ x`,
    substrate: 'harness',
    events,
    ...extra,
  },
});

describe('codex realizes events — the false claim, corrected', () => {
  it('realizes the canonical events codex actually supports', () => {
    // Was `() => false`, from a stale comment. Codex has a full hook surface.
    for (const e of [
      'session.start',
      'tool.use.pre',
      'turn.end',
      'subagent.end',
      'permission.request',
    ] as const) {
      expect(codexHarnessAdapter.realizes(e)).toBe(true);
    }
  });

  it('still refuses an event with no codex peer', () => {
    // The refusal survives the correction — it is now TRUE where it fires.
    expect(codexHarnessAdapter.realizes('vcs.commit.post')).toBe(false);
  });
});

describe('per-agent scope, said in codex’s language', () => {
  it('generates a matcher over agent_type from the composed agents', () => {
    const out = codexHooksJson(
      [binding('stance', ['nico', 'mav'], ['subagent.end'])],
      MECH,
    );
    expect(out).not.toBeNull();
    const parsed = JSON.parse(out?.content ?? '{}');
    const entry = parsed.hooks.SubagentStop[0];
    // Sorted, so the emitted bytes are stable across composition order.
    expect(entry.matcher).toBe('^(mav|nico)$');
    expect(entry.hooks[0]).toMatchObject({
      type: 'command',
      command: 'sh stance.sh',
    });
  });

  it('the matcher FOLLOWS composition — it cannot go stale', () => {
    const two = codexHooksJson(
      [binding('stance', ['nico', 'mav'], ['subagent.end'])],
      MECH,
    );
    const one = codexHooksJson(
      [binding('stance', ['nico'], ['subagent.end'])],
      MECH,
    );
    expect(JSON.parse(two?.content ?? '{}').hooks.SubagentStop[0].matcher).toBe(
      '^(mav|nico)$',
    );
    expect(JSON.parse(one?.content ?? '{}').hooks.SubagentStop[0].matcher).toBe(
      '^(nico)$',
    );
  });

  it('REFUSES an event codex cannot narrow to the composed agents', () => {
    // PreToolUse input carries no agent identifier. Emitting the hook anyway
    // would govern EVERY agent — a widened blast radius wearing a projection.
    expect(() =>
      codexHooksJson([binding('stance', ['nico'], ['tool.use.pre'])], MECH),
    ).toThrow(/no agent identifier/);
  });

  it('names the constraint, its agents, and the offending event when it refuses', () => {
    let msg = '';
    try {
      codexHooksJson([binding('stance', ['nico', 'mav'], ['turn.end'])], MECH);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toContain('stance');
    expect(msg).toContain('nico');
    expect(msg).toContain('turn.end');
    expect(msg).toContain('Stop');
  });

  it('emits nothing when no harness-substrate constraint is bound', () => {
    expect(codexHooksJson([], MECH)).toBeNull();
    expect(
      codexHooksJson([
        {
          anchor: 'git-side',
          agents: ['nico'],
          fragment: {
            substrate: 'git',
            events: ['vcs.commit.post'],
          },
        },
      ]),
    ).toBeNull();
  });
});
