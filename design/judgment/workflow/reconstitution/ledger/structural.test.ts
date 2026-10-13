// Judgment-only workflow/reconstitution cases 1, 2 and 5.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type ExecutionFixture,
  builder,
  commit,
  completionHook,
  concurrentLifecycle,
  entries,
  fixture,
  ledger,
  pair,
  returnedPair,
  state,
  statuses,
  verdict,
} from '../../../../../packages/cli/test/reconstitution/ledger/fixture.js';
let f: ExecutionFixture;
beforeEach(() => {
  f = fixture();
});
afterEach(() => {
  f.dispose();
});

describe('held-out ledger', () => {
  it('held-out workflow/1 — concurrent transitions each append one exclusive immutable entry', async () => {
    pair(f);
    const before = ledger(f);
    const events = ['shoot', 'edit'].map((name) => ({
      kind: 'dispatched',
      transition: `concurrent-${name}`,
      cut: 'film',
      workPackage: name,
      role: 'builder',
      run: name,
    }));
    const results = await Promise.all(
      events.map((event) => concurrentLifecycle(f, event)),
    );
    for (const result of results)
      expect(result.code, `both events recorded: ${result.stderr}`).toBe(0);
    const after = ledger(f);
    for (const [name, bytes] of Object.entries(before))
      expect(after[name], 'neither rewrites an earlier event').toBe(bytes);
    const added = Object.keys(after).filter((name) => !(name in before));
    expect(added, 'each has its own exclusively created entry').toHaveLength(2);
    for (const name of added)
      expect(name, 'entries ordered like journal ULIDs').toMatch(
        /^[0-9A-HJKMNP-TV-Z]{26}\.json$/,
      );
    expect(
      added.map((name) => JSON.parse(after[name]!).transition).sort(),
      'both distinct transitions remain',
    ).toEqual(events.map((event) => event.transition).sort());
    expect(
      entries(f).filter((entry) =>
        events.some((event) => event.transition === entry.transition),
      ),
      'neither overwrites the other',
    ).toHaveLength(2);
  });
  it('held-out workflow/2 — completion warning reads only the named cut', () => {
    returnedPair(f);
    for (const assayer of ['first', 'second'])
      verdict(f, assayer, { shoot: true, edit: true });
    pair(f, 'sound');
    builder(f, 'shoot', 'dispatched', 'sound');
    expect(state(f).phase, 'film complete').toBe('complete');
    expect(state(f, 'sound').phase, 'sound in flight').toBe('in flight');
    completionHook(f);
    const before = ledger(f);
    const warning = commit(f, 'feat(cut:sound): complete the sound cut');
    expect(warning, 'warning concerns sound').toContain('sound');
    expect(warning, 'sound own phase').toContain('in flight');
    for (const name of ['shoot', 'edit'])
      expect(warning, 'sound own unapproved packages').toContain(name);
    expect(warning, 'never film state').not.toContain('film');
    expect(ledger(f), 'completion check is read-only').toEqual(before);
  });
  it.each([
    ['pass', 'fail'],
    ['fail', 'pass'],
  ])(
    'held-out workflow/5 — assayer disagreement stays disputed in arrival order %s then %s',
    (first, second) => {
      returnedPair(f);
      for (const result of [first, second])
        verdict(f, result, { shoot: true, edit: result === 'pass' });
      expect(
        statuses(state(f)),
        'disagreement is a meaning question, neither verdict silently settles it',
      ).toEqual({ shoot: 'approved', edit: 'disputed' });
      expect(state(f).phase, 'disagreement never completes the cut').toBe(
        'in flight',
      );
    },
  );
});
