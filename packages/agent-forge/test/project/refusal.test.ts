import { describe, expect, it } from 'vitest';
import { claudeHarnessAdapter } from '../../src/adapters/claude/anatomy.js';
import { codexHarnessAdapter } from '../../src/adapters/codex/anatomy.js';
import {
  UnrealizableEventError,
  assertRealizable,
  routes,
} from '../../src/project/refusal.js';

// S3 — THREE CASES, NOT TWO. The law as first written conflated the last two and
// would have refused a perfectly correct git-substrate constraint on the claude
// adapter. Each case is exercised and OBSERVED below; the middle one is the gate,
// and a gate never seen to fire is not a gate.

describe('case 1 — the adapter realizes the event: emit, do not refuse', () => {
  it('accepts a harness event the claude adapter maps natively', () => {
    expect(() =>
      assertRealizable(
        { anchor: 'stance', substrate: 'harness', events: ['tool.use.pre'] },
        claudeHarnessAdapter,
      ),
    ).not.toThrow();
  });
});

describe('case 2 — obliged to realize and cannot: REFUSE, loudly', () => {
  it('throws, naming f · e · adapter so the reader need not search', () => {
    let err: unknown;
    try {
      assertRealizable(
        // Same substrate as the adapter, so it is genuinely this adapter's
        // obligation — and codex realizes nothing.
        { anchor: 'stance', substrate: 'harness', events: ['tool.use.pre'] },
        codexHarnessAdapter,
      );
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(UnrealizableEventError);
    const message = (err as Error).message;
    expect(message).toContain('stance'); // f
    expect(message).toContain('tool.use.pre'); // e
    expect(message).toContain('codex'); // adapter
  });

  it('refuses rather than warning — a warning is a silent-allow with a receipt', () => {
    expect(() =>
      assertRealizable(
        { anchor: 'x', substrate: 'harness', events: ['tool.use.pre'] },
        codexHarnessAdapter,
      ),
    ).toThrow(UnrealizableEventError);
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
    };
    assertRealizable(gitConstraint, spy);
    expect(asked).toBe(false);
  });
});

describe('the live corpus is unaffected — no cell hits case 2 today', () => {
  it('every harness event the canon cells declare is realizable on claude', () => {
    // Measured, not assumed: session.start · tool.use.pre · turn.end ·
    // subagent.end all map. The refusal is therefore latent, not a live
    // behaviour change — which is why it can land without confirmation.
    for (const event of [
      'session.start',
      'tool.use.pre',
      'turn.end',
      'subagent.end',
    ] as const) {
      expect(claudeHarnessAdapter.realizes(event)).toBe(true);
    }
  });
});
