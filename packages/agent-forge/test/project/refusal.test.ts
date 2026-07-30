import { describe, expect, it } from 'vitest';
import { claudeHarnessAdapter } from '../../src/adapters/claude/anatomy.js';
import { codexHarnessAdapter } from '../../src/adapters/codex/anatomy.js';
import {
  UnrealizableEventError,
  UnscopableEventError,
  assertRealizable,
  routes,
} from '../../src/project/refusal.js';

// FOUR CASES, NOT TWO. The law as first written conflated the rest and would have
// refused a perfectly correct git-substrate constraint on the claude adapter.
// Case 2b was later found hiding inside case 1: an adapter that FIRES an event but
// cannot narrow it to an agent was passing, and the codex adapter had grown a
// private `throw` to catch it — a second refusal site. Each case is exercised and
// OBSERVED below, and a gate never seen to fire is not a gate.

describe('case 1 — the adapter realizes the event: emit, do not refuse', () => {
  it('accepts a harness event the claude adapter maps natively', () => {
    expect(() =>
      assertRealizable(
        {
          anchor: 'stance',
          substrate: 'harness',
          events: ['tool.use.pre'],
          agents: [],
        },
        claudeHarnessAdapter,
      ),
    ).not.toThrow();
  });
});

describe('case 2 — obliged to realize and cannot: REFUSE, loudly', () => {
  // `file.read.pre` is a canonical event with no peer on EITHER harness — a
  // genuine unrealizable case. This fixture previously used codex + tool.use.pre,
  // on the false premise that codex realized nothing; codex has a full hook
  // surface and realizes tool.use.pre, so that fixture could no longer fire.
  it('throws, naming f · e · adapter so the reader need not search', () => {
    let err: unknown;
    try {
      assertRealizable(
        // Same substrate as the adapter, so it is genuinely this adapter's
        // obligation — and no harness maps this event.
        {
          anchor: 'stance',
          substrate: 'harness',
          events: ['file.read.pre'],
          agents: [],
        },
        codexHarnessAdapter,
      );
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(UnrealizableEventError);
    const message = (err as Error).message;
    expect(message).toContain('stance'); // f
    expect(message).toContain('file.read.pre'); // e
    expect(message).toContain('codex'); // adapter
  });

  it('refuses rather than warning — a warning is a silent-allow with a receipt', () => {
    expect(() =>
      assertRealizable(
        {
          anchor: 'x',
          substrate: 'harness',
          events: ['file.read.pre'],
          agents: [],
        },
        codexHarnessAdapter,
      ),
    ).toThrow(UnrealizableEventError);
  });
});

describe('case 2b — fires it but cannot NAME the agent: REFUSE, do not widen', () => {
  // Codex declares hooks in one global `hooks.json`. `turn.end → Stop` is
  // realizable there, and its hook input carries no agent identifier — so a
  // constraint composed into nico+mav could only be emitted for EVERYONE.
  // Fire-ability is not scopability, and this case is the proof: `realizes` says
  // yes and `scopes` says no for the SAME event on the SAME adapter.
  const composed = {
    anchor: 'stance-guardrail',
    substrate: 'harness',
    events: ['turn.end'],
    agents: ['mav', 'nico'],
  } as const;

  it('asserts the two predicates genuinely diverge — else this gate tests nothing', () => {
    expect(codexHarnessAdapter.realizes('turn.end')).toBe(true);
    expect(codexHarnessAdapter.scopes('turn.end')).toBe(false);
  });

  it('throws UnscopableEventError, naming f · e · adapter · a', () => {
    let err: unknown;
    try {
      assertRealizable(composed, codexHarnessAdapter);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(UnscopableEventError);
    const message = (err as Error).message;
    expect(message).toContain('stance-guardrail'); // f
    expect(message).toContain('turn.end'); // e
    expect(message).toContain('codex'); // adapter
    expect(message).toContain('nico'); // a
    expect(message).toContain('mav'); // a
  });

  it('is DISTINCT from unrealizable — the two have opposite remedies', () => {
    expect(
      () => assertRealizable(composed, codexHarnessAdapter),
      'widening and non-existence must not share an error type',
    ).not.toThrow(UnrealizableEventError);
  });

  it('does not fire on claude, which scopes by attachment', () => {
    expect(() =>
      assertRealizable(composed, claudeHarnessAdapter),
    ).not.toThrow();
  });

  it('is not asked when no agent composes the constraint', () => {
    // A session-wide hook has nothing to narrow to. Silence here is a different
    // question answered, not this question skipped.
    expect(() =>
      assertRealizable({ ...composed, agents: [] }, codexHarnessAdapter),
    ).not.toThrow();
  });
});

describe('case 3 — another substrate: ROUTE, do not refuse and do not warn', () => {
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

  it('does NOT refuse a correct git-substrate constraint on the claude adapter', () => {
    expect(() =>
      assertRealizable(gitConstraint, claudeHarnessAdapter),
    ).not.toThrow();
  });

  it('never consults `realizes` for a routed constraint', () => {
    // If it did, `vcs.commit.post` has no Claude peer and case 3 would collapse
    // into case 2 — which is exactly the conflation being fixed.
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
    assertRealizable(gitConstraint, spy);
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
    // tool.use.pre or turn.end, deploying it to codex REFUSES. That is the
    // designed answer, not a regression: codex cannot say which agent it fired
    // for, and a bound that governs every agent is not the bound that was
    // declared. The remedy is to split the constraint per harness — never to
    // weaken it everywhere so the weakest harness can carry it.
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
