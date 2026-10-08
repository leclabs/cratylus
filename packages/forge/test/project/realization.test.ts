import { describe, expect, it } from 'vitest';
import { ompHarnessAdapter } from '../../src/adapters/omp/render.js';
import { realizationOf, routes } from '../../src/project/realization.js';
import { SHORTFALL, shortfallAdapter } from './shortfall-adapter.js';

// The realization seam distinguishes four outcomes. A constraint can be bound,
// steered when the harness cannot realize or scope it, or routed to its own substrate.
// The local shortfall adapter exercises the unscopable branch without adding a
// second shipped implementation.
describe('bound — the harness realizes every event at the composed scope', () => {
  const constraint = {
    anchor: 'example-constraint',
    substrate: 'harness',
    events: ['tool.use.pre'],
    agents: ['example-agent'],
  } as const;


  it('omp carries the same event with no loss', () => {
    const r = realizationOf(constraint, ompHarnessAdapter);
    expect(r.mode).toBe('bound');
    expect(r.losses).toEqual([]);
  });
});

describe('steer — no peer for the event at all: degrade, do not fail', () => {
  // `file.read.pre` has no peer on omp.
  const orphan = {
    anchor: 'example-constraint',
    substrate: 'harness',
    events: ['file.read.pre'],
    agents: [],
  } as const;

  it('degrades to a steer rather than throwing', () => {
    expect(() => realizationOf(orphan, ompHarnessAdapter)).not.toThrow();
    expect(realizationOf(orphan, ompHarnessAdapter).mode).toBe('steer');
  });
  it('reports the loss as unrealizable, naming f · e · adapter', () => {
    const [loss, ...rest] = realizationOf(orphan, ompHarnessAdapter).losses;
    expect(rest).toEqual([]);
    expect(loss?.reason).toBe('unrealizable');
    expect(loss?.warning).toContain('stance'); // f
    expect(loss?.warning).toContain('file.read.pre'); // e
    expect(loss?.warning).toContain('omp'); // adapter
  });

});

describe('steer — fires it but cannot NAME the agent: degrade, do not widen', () => {
  // `turn.end` is realizable on the shortfall adapter, but cannot be narrowed to
  // an agent, so the composed constraint cannot be emitted selectively.
  const composed = {
    anchor: 'example-constraint',
    substrate: 'harness',
    events: ['turn.end'],
    agents: ['example-agent-a', 'example-agent-b'],
  } as const;

  it('asserts the two predicates genuinely diverge — else this tests nothing', () => {
    expect(shortfallAdapter.realizes('turn.end')).toBe(true);
    expect(shortfallAdapter.scopes('turn.end')).toBe(false);
  });

  it('degrades to a steer, reporting unscopable and naming f · e · adapter · a', () => {
    const r = realizationOf(composed, shortfallAdapter);
    expect(r.mode).toBe('steer');
    const [loss] = r.losses;
    expect(loss?.reason).toBe('unscopable');
    expect(loss?.warning).toContain('example-constraint'); // f
    expect(loss?.warning).toContain('turn.end'); // e
    expect(loss?.warning).toContain(SHORTFALL); // adapter
    expect(loss?.warning).toContain('example-agent-a'); // a
    expect(loss?.warning).toContain('example-agent-b'); // a
  });

  it('tells the operator the rule SURVIVES — the whole reason this is not fatal', () => {
    // A warning that only announced a loss would read as silent non-enforcement.
    // What makes it safe to continue is that the declaration still governs, and
    // the message has to say so or the operator cannot judge the risk.
    const [loss] = realizationOf(composed, shortfallAdapter).losses;
    expect(loss?.warning).toMatch(/declaration/i);
    expect(loss?.warning).toMatch(/steer, not a bound/i);
  });

  it('is distinguishable from unrealizable — the two have different remedies', () => {
    const unscopable = realizationOf(composed, shortfallAdapter).losses[0];
    const unrealizable = realizationOf(
      { ...composed, events: ['file.read.pre'] },
      shortfallAdapter,
    ).losses[0];
    expect(unscopable?.reason).not.toBe(unrealizable?.reason);
  });

  it('does not degrade on omp, which scopes what it realizes', () => {
    expect(realizationOf(composed, ompHarnessAdapter).mode).toBe('bound');
  });

  it('is not asked when no agent composes the constraint', () => {
    // A session-wide hook has nothing to narrow to. Silence here is a different
    // question answered, not this question skipped.
    const r = realizationOf({ ...composed, agents: [] }, shortfallAdapter);
    expect(r.mode).toBe('bound');
    expect(r.losses).toEqual([]);
  });
});

describe('one loss degrades the WHOLE constraint, never a subset of its events', () => {
  it('a mixed event set steers rather than half-mechanizing', () => {
    // tool.use.pre is realizable on omp; file.read.pre is not. Emitting the
    // mechanism for only the realizable half would enforce a constraint nobody
    // authored — binding on some occasions, silent on others, with no declaration
    // saying which. The declaration already covers every occasion.
    const r = realizationOf(
      {
        anchor: 'example-constraint',
        substrate: 'harness',
        events: ['tool.use.pre', 'file.read.pre'],
        agents: ['example-agent'],
      },
      ompHarnessAdapter,
    );
    expect(ompHarnessAdapter.realizes('tool.use.pre')).toBe(true);
    expect(r.mode).toBe('steer');
    expect(r.losses).toHaveLength(1);
    expect(r.losses[0]?.event).toBe('file.read.pre');
  });
});

describe('routed — another substrate: not this adapter’s concern, and not a loss', () => {
  // A git-substrate constraint belongs to git, not the harness adapter.
  const gitConstraint = {
    anchor: 'repo-continuity',
    substrate: 'git',
    events: ['vcs.commit.post'],
    agents: ['example-agent'],
  } as const;

  it('is recognised as someone else’s concern', () => {
    expect(routes(gitConstraint, ompHarnessAdapter)).toBe(true);
  });

  it('reports mode routed with no losses — routing is not degradation', () => {
    const r = realizationOf(gitConstraint, ompHarnessAdapter);
    expect(r.mode).toBe('routed');
    expect(r.losses).toEqual([]);
  });

  it('never consults either capability predicate for a routed constraint', () => {
    // If it did, routing would collapse into degradation.
    const spy = {
      ...ompHarnessAdapter,
      realizes: (e: never) => {
        asked = true;
        return ompHarnessAdapter.realizes(e);
      },
      scopes: (e: never) => {
        asked = true;
        return ompHarnessAdapter.scopes(e);
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
    'subagent.dispatch.pre',
  ] as const;

  it('every harness event the canon cells declare is realizable and scoped on omp', () => {
    for (const event of CANON_EVENTS) {
      expect(ompHarnessAdapter.realizes(event)).toBe(true);
      expect(ompHarnessAdapter.scopes(event)).toBe(true);
    }
  });

  it('honours MODEL `scopable ⇒ realizable` on omp and the shortfall adapter', () => {
    for (const adapter of [ompHarnessAdapter, shortfallAdapter]) {
      for (const event of CANON_EVENTS) {
        if (adapter.scopes(event)) expect(adapter.realizes(event)).toBe(true);
      }
    }
  });
});
