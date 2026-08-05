// P5 — `resolve()` carries per-node PROVENANCE (the source-attributed fold that
// `explain` renders). Falsifier: against a 2-plugin + patch fixture, each resolved
// fragment records, IN FOLD ORDER, which plugin/patch each contribution came from,
// whether it reset the base (`replace`) or accumulated (`append`/`merge`), and its
// value — so a cold read decodes "why this fragment won its final value".

import { describe, expect, it } from 'vitest';
import {
  type Fragment,
  type LoadedPlugin,
  type PatchEntry,
  resolve,
} from '../../src/resolve/resolve.js';

const FScalar: Fragment = { id: 'title', valueShape: 'scalar' };
const FSet: Fragment = { id: 'tags', valueShape: 'set' };
const FStruct: Fragment = { id: 'meta', valueShape: 'structured' };

const plugin = (name: string, contributions: PatchEntry[]): LoadedPlugin => ({
  name,
  contributions,
});

describe('resolve provenance (NORTH-STAR §5 — explain source)', () => {
  it('attributes each contribution to its plugin/patch in fold order', () => {
    const base = plugin('base', [
      { target: FScalar, op: 'replace', value: 'from-base' },
      { target: FSet, op: 'replace', value: ['a'] },
      { target: FStruct, op: 'replace', value: { x: 1 } },
    ]);
    const ext = plugin('ext', [
      { target: FSet, op: 'append', value: ['b'] },
      { target: FStruct, op: 'merge', value: { y: 2 } },
    ]);
    const patches: PatchEntry[] = [
      { target: FSet, op: 'append', value: ['c'] },
      { target: FScalar, op: 'replace', value: 'from-patch' },
    ];

    const set = resolve({ extends: [base, ext], patches });

    // scalar: base replace then patch replace — TWO resets, last wins.
    const scalar = set.fragments.get(FScalar);
    expect(scalar?.value).toBe('from-patch');
    expect(scalar?.provenance).toEqual([
      {
        source: { kind: 'plugin', name: 'base' },
        op: 'replace',
        value: 'from-base',
        reset: true,
      },
      {
        source: { kind: 'patch', index: 1 },
        op: 'replace',
        value: 'from-patch',
        reset: true,
      },
    ]);

    // set: base replace (the ONE reset) then two accumulating appends.
    const setFrag = set.fragments.get(FSet);
    expect(setFrag?.value).toEqual(['a', 'b', 'c']);
    expect(setFrag?.provenance.map((c) => c.source)).toEqual([
      { kind: 'plugin', name: 'base' },
      { kind: 'plugin', name: 'ext' },
      { kind: 'patch', index: 0 },
    ]);
    expect(setFrag?.provenance.map((c) => c.reset)).toEqual([
      true,
      false,
      false,
    ]);

    // the consumer PATCH is visibly attributed on the set fragment.
    const patchContrib = setFrag?.provenance.find(
      (c) => c.source.kind === 'patch',
    );
    expect(patchContrib?.op).toBe('append');
    expect(patchContrib?.value).toEqual(['c']);
  });

  it('records force priority and folds the forced entry LAST in provenance', () => {
    const base = plugin('base', [
      { target: FScalar, op: 'replace', value: 'plain-later' },
      { target: FScalar, op: 'replace', value: 'forced-first', force: 5 },
    ]);
    const set = resolve({ extends: [base] });
    const f = set.fragments.get(FScalar);
    expect(f?.value).toBe('forced-first');
    // Authored [plain, forced]; forced folds last → provenance order [plain, forced].
    expect(f?.provenance.map((c) => c.value)).toEqual([
      'plain-later',
      'forced-first',
    ]);
    expect(f?.provenance[1]?.force).toBe(5);
    expect(f?.provenance[0]?.force).toBeUndefined();
  });
});
