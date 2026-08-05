import { describe, expect, it } from 'vitest';
import { claudeHarnessAdapter } from '../../src/adapters/claude/render.js';
import { codexHarnessAdapter } from '../../src/adapters/codex/render.js';
import { realizationOf, routes } from '../../src/project/realization.js';

// FOUR OUTCOMES, NOT TWO. Each is exercised and OBSERVED below, and a decision
// never seen to go both ways is not a decision.
//
// The law as first written conflated the rest and would have REFUSED a perfectly
// correct git-substrate constraint on claude. A later revision found `steer`
// hiding inside `bound` — an adapter that FIRES an event but cannot narrow it to
// an agent was passing, and the codex adapter had grown a private `throw` to
// catch it, a second decision site.
//
// Both revisions still assumed a shortfall was a BUILD FAILURE. It is not. The
// DECLARATION face is projected unconditionally by `agentBody`, so a constraint
// the harness cannot mechanize still reaches the agent and still governs it — as
// a steer rather than a bound. The floor is never silence, which is why these are
// warnings and the projection completes.

describe('bound — the harness realizes every event at the composed scope', () => {
  it('claude carries a natively-mapped event with no loss', () => {
    const r = realizationOf(
      {
        anchor: 'stance',
        substrate: 'harness',
        events: ['tool.use.pre'],
        agents: ['nico'],
      },
      claudeHarnessAdapter,
    );
    expect(r.mode).toBe('bound');
    expect(r.losses).toEqual([]);
  });
});

describe('steer — no peer for the event at all: degrade, do not fail', () => {
  // `file.read.pre` is a canonical event with no peer on EITHER harness.
  const orphan = {
    anchor: 'stance',
    substrate: 'harness',
    events: ['file.read.pre'],
    agents: [],
  } as const;

  it('degrades to a steer rather than throwing', () => {
    expect(() => realizationOf(orphan, codexHarnessAdapter)).not.toThrow();
    expect(realizationOf(orphan, codexHarnessAdapter).mode).toBe('steer');
  });

  it('reports the loss as unrealizable, naming f · e · adapter', () => {
    const [loss, ...rest] = realizationOf(orphan, codexHarnessAdapter).losses;
    expect(rest).toEqual([]);
    expect(loss?.reason).toBe('unrealizable');
    expect(loss?.warning).toContain('stance'); // f
    expect(loss?.warning).toContain('file.read.pre'); // e
    expect(loss?.warning).toContain('codex'); // adapter
  });
});

describe('steer — fires it but cannot NAME the agent: degrade, do not widen', () => {
  // Codex declares hooks in one global `hooks.json`. `turn.end → Stop` is
  // realizable there, and its hook input carries no agent identifier — so a
  // constraint composed into nico+mav could only be emitted for EVERYONE.
  const composed = {
    anchor: 'stance-guardrail',
    substrate: 'harness',
    events: ['turn.end'],
    agents: ['mav', 'nico'],
  } as const;

  it('asserts the two predicates genuinely diverge — else this tests nothing', () => {
    expect(codexHarnessAdapter.realizes('turn.end')).toBe(true);
    expect(codexHarnessAdapter.scopes('turn.end')).toBe(false);
  });

  it('degrades to a steer, reporting unscopable and naming f · e · adapter · a', () => {
    const r = realizationOf(composed, codexHarnessAdapter);
    expect(r.mode).toBe('steer');
    const [loss] = r.losses;
    expect(loss?.reason).toBe('unscopable');
    expect(loss?.warning).toContain('stance-guardrail'); // f
    expect(loss?.warning).toContain('turn.end'); // e
    expect(loss?.warning).toContain('codex'); // adapter
    expect(loss?.warning).toContain('nico'); // a
    expect(loss?.warning).toContain('mav'); // a
  });

  it('tells the operator the rule SURVIVES — the whole reason this is not fatal', () => {
    // A warning that only announced a loss would read as silent non-enforcement.
    // What makes it safe to continue is that the declaration still governs, and
    // the message has to say so or the operator cannot judge the risk.
    const [loss] = realizationOf(composed, codexHarnessAdapter).losses;
    expect(loss?.warning).toMatch(/declaration/i);
    expect(loss?.warning).toMatch(/steer, not a bound/i);
  });

  it('is distinguishable from unrealizable — the two have different remedies', () => {
    const unscopable = realizationOf(composed, codexHarnessAdapter).losses[0];
    const unrealizable = realizationOf(
      { ...composed, events: ['file.read.pre'] },
      codexHarnessAdapter,
    ).losses[0];
    expect(unscopable?.reason).not.toBe(unrealizable?.reason);
  });

  it('does not degrade on claude, which scopes by attachment', () => {
    expect(realizationOf(composed, claudeHarnessAdapter).mode).toBe('bound');
  });

  it('is not asked when no agent composes the constraint', () => {
    // A session-wide hook has nothing to narrow to. Silence here is a different
    // question answered, not this question skipped.
    const r = realizationOf({ ...composed, agents: [] }, codexHarnessAdapter);
    expect(r.mode).toBe('bound');
    expect(r.losses).toEqual([]);
  });
});

describe('one loss degrades the WHOLE constraint, never a subset of its events', () => {
  it('a mixed event set steers rather than half-mechanizing', () => {
    // subagent.end IS scopable on codex; turn.end is not. Emitting the mechanism
    // for only the scopable half would enforce a constraint nobody authored —
    // binding on some occasions, silent on others, with no declaration saying
    // which. The declaration already covers every occasion.
    const r = realizationOf(
      {
        anchor: 'stance-guardrail',
        substrate: 'harness',
        events: ['subagent.end', 'turn.end'],
        agents: ['nico'],
      },
      codexHarnessAdapter,
    );
    expect(codexHarnessAdapter.scopes('subagent.end')).toBe(true);
    expect(r.mode).toBe('steer');
    expect(r.losses).toHaveLength(1);
    expect(r.losses[0]?.event).toBe('turn.end');
  });
});

describe('routed — another substrate: not this adapter’s concern, and not a loss', () => {
  // The regression this law was NEARLY written to cause. `praxis-continuity` is a
  // real git-substrate cell; under the unqualified law, deploying it to the claude
  // adapter would have refused on correct configuration.
  const gitConstraint = {
    anchor: 'praxis-continuity',
    substrate: 'git',
    events: ['vcs.commit.post'],
    agents: ['nico'],
  } as const;

  it('is recognised as someone else’s concern', () => {
    expect(routes(gitConstraint, claudeHarnessAdapter)).toBe(true);
  });

  it('reports mode routed with no losses — routing is not degradation', () => {
    const r = realizationOf(gitConstraint, claudeHarnessAdapter);
    expect(r.mode).toBe('routed');
    expect(r.losses).toEqual([]);
  });

  it('never consults either capability predicate for a routed constraint', () => {
    // If it did, `vcs.commit.post` has no Claude peer and routing would collapse
    // into degradation — which is exactly the conflation being fixed.
    let asked = false;
    const spy = {
      ...claudeHarnessAdapter,
      realizes: (e: never) => {
        asked = true;
        return claudeHarnessAdapter.realizes(e);
      },
      scopes: (e: never) => {
        asked = true;
        return claudeHarnessAdapter.scopes(e);
      },
    };
    realizationOf(gitConstraint, spy);
    expect(asked).toBe(false);
  });
});

describe('what the corpus actually faces — measured per predicate, not assumed', () => {
  const CANON_EVENTS = [
    'session.start',
    'tool.use.pre',
    'turn.end',
    'subagent.end',
  ] as const;

  it('every harness event the canon cells declare is realizable on BOTH', () => {
    for (const event of CANON_EVENTS) {
      expect(claudeHarnessAdapter.realizes(event)).toBe(true);
      // Codex has a full hook surface, contrary to what this adapter used to
      // claim about itself.
      expect(codexHarnessAdapter.realizes(event)).toBe(true);
    }
  });

  it('claude scopes all four — attachment is the scope', () => {
    for (const event of CANON_EVENTS) {
      expect(claudeHarnessAdapter.scopes(event)).toBe(true);
    }
  });

  it('codex scopes ONLY the subagent pair — this is the live consequence', () => {
    // Recorded so the next reader inherits the measurement rather than the
    // surprise. Once an agent-composed constraint carries session.start,
    // tool.use.pre or turn.end, deploying it to codex degrades that constraint
    // to a declaration and warns. The projection still completes.
    expect(codexHarnessAdapter.scopes('subagent.end')).toBe(true);
    expect(codexHarnessAdapter.scopes('subagent.start')).toBe(true);
    for (const event of [
      'session.start',
      'tool.use.pre',
      'turn.end',
    ] as const) {
      expect(codexHarnessAdapter.scopes(event)).toBe(false);
    }
  });

  it('honours MODEL `scopable ⇒ realizable` on every adapter and event', () => {
    for (const adapter of [claudeHarnessAdapter, codexHarnessAdapter]) {
      for (const event of CANON_EVENTS) {
        if (adapter.scopes(event)) expect(adapter.realizes(event)).toBe(true);
      }
    }
  });
});
