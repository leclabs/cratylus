// The ledger fold, pure: statuses from the harness's builder events and the
// assayers' latest verdicts, the cut's phase, readiness and figures.

import { describe, expect, it } from 'vitest';
import { foldCut } from '../../src/capabilities/work-package/fold.js';
import type {
  LedgerDraft,
  LedgerEntry,
} from '../../src/capabilities/work-package/ledger.js';

/** A draft without the fields the helper stamps, per kind. */
type Bare = LedgerDraft extends infer D
  ? D extends LedgerDraft
    ? Omit<D, 'cut' | 'transition'>
    : never
  : never;

let n = 0;
/** `drafts` stamped as ledger entries of cut `film`, in order. */
const ledger = (...drafts: Bare[]) =>
  drafts.map(
    (d) =>
      ({
        ...d,
        cut: 'film',
        transition: `t${n}`,
        id: String(n++).padStart(26, '0'),
        at: '',
      }) as LedgerEntry,
  );
const submit = (workPackage: string, dependsOn: string[] = []) =>
  ({
    kind: 'submit',
    workPackage,
    outputs: [`${workPackage}/`],
    concepts: [workPackage],
    dependsOn,
    needs: [],
  }) as const;
const builder = (kind: 'dispatched' | 'returned', workPackage: string) =>
  ({ kind, workPackage, role: 'builder', run: workPackage }) as const;
const verdict = (assayer: string, results: Record<string, boolean>) =>
  ({
    kind: 'verdict',
    assayer,
    run: assayer,
    verdicts: Object.entries(results).map(([workPackage, passes]) => ({
      workPackage,
      concept: workPackage,
      passes,
      evidence: 'checked',
      ...(passes ? {} : { finding: 'fails' }),
    })),
    hardeningNotes: [],
  }) as const;
const statuses = (entries: LedgerEntry[]) =>
  Object.fromEntries(
    [...foldCut(entries, 'film').packages.values()].map((p) => [
      p.name,
      p.status,
    ]),
  );
const returned = [
  submit('shoot'),
  submit('edit', ['shoot']),
  builder('dispatched', 'shoot'),
  builder('returned', 'shoot'),
  builder('dispatched', 'edit'),
  builder('returned', 'edit'),
] as const;

describe('the ledger fold', () => {
  it('computes open, readiness, and in flight from the first dispatch of any role', () => {
    const open = foldCut(
      ledger(submit('shoot'), submit('edit', ['shoot'])),
      'film',
    );
    expect(open.phase).toBe('open');
    expect(open.ready).toEqual(['shoot']);
    const lead = foldCut(
      ledger(submit('shoot'), { kind: 'dispatched', role: 'lead', run: 'l' }),
      'film',
    );
    expect(lead.phase).toBe('in flight');
    expect(lead.ready).toEqual(['shoot']);
  });

  it('approves only on two distinct assayers all passing; one passing stays returned', () => {
    expect(
      statuses(ledger(...returned, verdict('a', { shoot: true }))),
    ).toEqual({
      shoot: 'returned',
      edit: 'returned',
    });
    const both = ledger(
      ...returned,
      verdict('a', { shoot: true, edit: true }),
      verdict('b', { shoot: true, edit: true }),
    );
    expect(statuses(both)).toEqual({ shoot: 'approved', edit: 'approved' });
    expect(foldCut(both, 'film').phase).toBe('complete');
  });

  it('fails when every latest verdict has a finding, disputes when they disagree', () => {
    expect(
      statuses(
        ledger(
          ...returned,
          verdict('a', { shoot: false, edit: true }),
          verdict('b', { shoot: false, edit: false }),
        ),
      ),
    ).toEqual({ shoot: 'failing', edit: 'disputed' });
  });

  it('reads only each assayer’s latest verdict', () => {
    expect(
      statuses(
        ledger(
          ...returned,
          verdict('a', { shoot: false }),
          verdict('b', { shoot: true }),
          verdict('a', { shoot: true }),
        ),
      ).shoot,
    ).toBe('approved');
  });

  it('a failing package’s builder dispatched again is dispatched, and its old verdicts no longer count', () => {
    const failing = [
      ...returned,
      verdict('a', { edit: false }),
      verdict('b', { edit: false }),
    ] as const;
    expect(statuses(ledger(...failing)).edit).toBe('failing');
    expect(
      statuses(ledger(...failing, builder('dispatched', 'edit'))).edit,
    ).toBe('dispatched');
    expect(
      statuses(
        ledger(
          ...failing,
          builder('dispatched', 'edit'),
          builder('returned', 'edit'),
        ),
      ).edit,
    ).toBe('returned');
  });

  it('counts one agent run per return, with the tokens reported', () => {
    const { figures } = foldCut(
      ledger(
        { kind: 'returned', role: 'lead', run: 'l', tokens: 5 },
        { kind: 'returned', role: 'builder', run: 'b' },
        { kind: 'check', failures: ['x'] },
        { kind: 'check', failures: ['x'] },
      ),
      'film',
    );
    expect(figures).toEqual({
      agentRuns: { total: 2, byRole: { lead: 1, builder: 1 } },
      rounds: 2,
      wholeCheckRuns: 2,
      tokens: 5,
      noProgressRounds: [2],
    });
  });

  it('keeps the lead’s latest report, and ignores another cut’s entries', () => {
    const entries = [
      ...ledger({ kind: 'reported', run: 'l', report: { a: 1 } }),
      {
        ...ledger({ kind: 'reported', run: 'l', report: { a: 2 } })[0],
        cut: 'other',
      } as LedgerEntry,
    ];
    expect(foldCut(entries, 'film').report).toEqual({ a: 1 });
  });
});
