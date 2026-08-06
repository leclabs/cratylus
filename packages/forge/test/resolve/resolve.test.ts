import { describe, expect, it } from 'vitest';
import {
  DanglingReferenceError,
  ForcePriorityTieError,
  type Fragment,
  IllegalOpForValueShapeError,
  type LoadedPlugin,
  MissingExtendsTargetError,
  type PatchEntry,
  ReferenceCycleError,
  resolve,
} from '../../src/resolve/resolve.js';

// ── Fixture fragment nodes (identity = the imported binding) ─────────────────
const FScalar: Fragment = { id: 'title', valueShape: 'scalar' };
const FSet: Fragment = { id: 'tags', valueShape: 'set' };
const FStruct: Fragment = { id: 'meta', valueShape: 'structured' };

const plugin = (name: string, contributions: PatchEntry[]): LoadedPlugin => ({
  name,
  contributions,
});

describe('resolve — the ordered fold', () => {
  it('folds a 2-plugin + patches fixture deterministically', () => {
    // base (plugin A) sets the fragments; extension (plugin B) accumulates; a
    // consumer patch replaces the scalar.
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
      { target: FStruct, op: 'merge', value: { x: 9 } },
      { target: FScalar, op: 'replace', value: 'from-patch' },
    ];

    const set = resolve({ extends: [base, ext], patches });

    // replace RESETS — the patch's scalar erases the base's prior.
    expect(set.fragments.get(FScalar)?.value).toBe('from-patch');
    // append ACCUMULATES in order across base → ext → patches.
    expect(set.fragments.get(FSet)?.value).toEqual(['a', 'b', 'c']);
    // merge ACCUMULATES key-wise; later wins on key collision (x: 1 → 9).
    expect(set.fragments.get(FStruct)?.value).toEqual({ x: 9, y: 2 });
  });

  it('force folds LAST regardless of authored position', () => {
    // A forced replace authored FIRST still folds after all non-forced entries.
    const base = plugin('base', [
      { target: FScalar, op: 'replace', value: 'forced-first', force: 1 },
      { target: FScalar, op: 'replace', value: 'plain-later' },
    ]);
    const set = resolve({ extends: [base] });
    expect(set.fragments.get(FScalar)?.value).toBe('forced-first');
  });

  it('higher force priority folds last among forced entries', () => {
    const base = plugin('base', [
      { target: FScalar, op: 'replace', value: 'lo', force: 1 },
      { target: FScalar, op: 'replace', value: 'hi', force: 10 },
    ]);
    const set = resolve({ extends: [base] });
    expect(set.fragments.get(FScalar)?.value).toBe('hi');
  });

  // ── LOUD validation — each throws a NAMED error ────────────────────────────

  it('THROWS MissingExtendsTargetError on a patch to an undefined fragment', () => {
    const base = plugin('base', [
      { target: FScalar, op: 'replace', value: 'x' },
    ]);
    const orphan: Fragment = { id: 'orphan', valueShape: 'scalar' };
    expect(() =>
      resolve({
        extends: [base],
        patches: [{ target: orphan, op: 'replace', value: 'y' }],
      }),
    ).toThrow(MissingExtendsTargetError);
  });

  it('THROWS IllegalOpForValueShapeError on merge over a scalar', () => {
    const base = plugin('base', [
      { target: FScalar, op: 'merge', value: { a: 1 } },
    ]);
    expect(() => resolve({ extends: [base] })).toThrow(
      IllegalOpForValueShapeError,
    );
  });

  it('THROWS IllegalOpForValueShapeError on append over a structured', () => {
    const base = plugin('base', [
      { target: FStruct, op: 'append', value: [1] },
    ]);
    expect(() => resolve({ extends: [base] })).toThrow(
      IllegalOpForValueShapeError,
    );
  });

  it('THROWS ForcePriorityTieError on two forced entries at one priority', () => {
    const base = plugin('base', [
      { target: FScalar, op: 'replace', value: 'a', force: 5 },
      { target: FScalar, op: 'replace', value: 'b', force: 5 },
    ]);
    expect(() => resolve({ extends: [base] })).toThrow(ForcePriorityTieError);
  });

  it('THROWS ReferenceCycleError on a reference cycle', () => {
    // A ⇄ B — build the cycle after construction (readonly refs, so cast once).
    const a: Fragment = { id: 'A', valueShape: 'scalar', references: [] };
    const b: Fragment = { id: 'B', valueShape: 'scalar', references: [] };
    (a.references as Fragment[]).push(b);
    (b.references as Fragment[]).push(a);
    const base = plugin('base', [
      { target: a, op: 'replace', value: 1 },
      { target: b, op: 'replace', value: 2 },
    ]);
    expect(() => resolve({ extends: [base] })).toThrow(ReferenceCycleError);
  });

  it('THROWS DanglingReferenceError on an edge to an undefined fragment', () => {
    const ghost: Fragment = { id: 'ghost', valueShape: 'scalar' };
    const a: Fragment = { id: 'A', valueShape: 'scalar', references: [ghost] };
    const base = plugin('base', [{ target: a, op: 'replace', value: 1 }]);
    expect(() => resolve({ extends: [base] })).toThrow(DanglingReferenceError);
  });

  it('accepts an acyclic reference graph', () => {
    const leaf: Fragment = { id: 'leaf', valueShape: 'scalar' };
    const root: Fragment = {
      id: 'root',
      valueShape: 'scalar',
      references: [leaf],
    };
    const base = plugin('base', [
      { target: root, op: 'replace', value: 1 },
      { target: leaf, op: 'replace', value: 2 },
    ]);
    expect(() => resolve({ extends: [base] })).not.toThrow();
  });
});
