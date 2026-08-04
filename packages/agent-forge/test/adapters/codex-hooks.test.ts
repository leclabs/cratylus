import type { HarnessMechanism } from '@leclabs/agent-schema/hook';
import { describe, expect, it } from 'vitest';
import {
  codexHarnessAdapter,
  codexHooksJson,
} from '../../src/adapters/codex/anatomy.js';

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

  it('still reports FALSE for an event with no codex peer', () => {
    // The negative survives the correction — it is now TRUE where it fires.
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

  // THE DECISION MOVED, THE COVERAGE DID NOT. These cases used to assert a
  // `throw` raised inside `codexHooksJson`. That throw was a SECOND decision site
  // — `realization.ts` states it is the only one — and it existed because MODEL
  // had no word for "fires it but cannot name the agent". With `scopable` split
  // out, the adapter DECLARES capability and the seam decides what follows; the
  // shortfall is now a warning, not a build failure.
  //
  // Mode and warning are pinned in `test/project/realization.test.ts`. What
  // remains the adapter's own is the declaration, asserted here.
  it('DECLARES it cannot narrow the events whose input carries no agent id', () => {
    // PreToolUse and Stop fire fine on codex; neither names an agent. Emitting
    // for them anyway would govern EVERY agent — a widened blast radius wearing
    // a projection.
    for (const e of ['tool.use.pre', 'turn.end', 'session.start'] as const) {
      expect(codexHarnessAdapter.realizes(e), `${e} realizable`).toBe(true);
      expect(codexHarnessAdapter.scopes(e), `${e} scopable`).toBe(false);
    }
  });

  it('DECLARES it can narrow the subagent pair, which does carry one', () => {
    for (const e of ['subagent.start', 'subagent.end'] as const) {
      expect(codexHarnessAdapter.scopes(e)).toBe(true);
    }
  });

  it('never refuses and never widens — it SKIPS what it cannot express', () => {
    // The seam decided mode already and withholds a degraded binding, so this
    // path should not see one. If it does, the only safe act is to omit: throwing
    // would be a second decision site, and emitting would govern every agent on
    // the host with a hook only two agents composed.
    let out: unknown;
    expect(() => {
      out = codexHooksJson([binding('stance', ['nico'], ['turn.end'])], MECH);
    }).not.toThrow();
    expect(JSON.stringify(out ?? null)).not.toContain('Stop');
  });

  it('still emits normally for an event it CAN narrow', () => {
    const out = JSON.stringify(
      codexHooksJson([binding('stance', ['nico'], ['subagent.end'])], MECH),
    );
    expect(out).toContain('SubagentStop');
    expect(out).toContain('^(nico)$');
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
