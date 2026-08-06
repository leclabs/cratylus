// PACK-SMOKE gate — the four laws, over synthetic shapes and over the real tarballs.
//
// The predicates live in `tooling/pack-smoke/pack-smoke.ts` and are PURE, so every control
// here drives the exact function the live check drives. A control that reaches its verdict
// by a different path proves only that the path works.

import { describe, expect, it } from 'vitest';
import {
  type Packed,
  declaredTargets,
  findings,
  lifecycleScripts,
  protocolRanges,
  targetResolves,
} from '../tooling/pack-smoke/pack-smoke.js';

/** A well-formed packed package — the exonerating baseline every case mutates. */
const GOOD: Packed = {
  pkg: '@x/good',
  manifest: {
    name: '@x/good',
    version: '0.1.0',
    license: 'MIT',
    bin: { xx: './dist/bin.js' },
    exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js' } },
    dependencies: { cac: '^6.7.14', '@x/dep': '0.1.0' },
    scripts: { build: 'tsup', test: 'vitest run' },
  },
  entries: [
    'package.json',
    'LICENSE',
    'dist/bin.js',
    'dist/index.js',
    'dist/index.d.ts',
  ],
};

const mutate = (m: Record<string, unknown>, e?: string[]): Packed => ({
  pkg: GOOD.pkg,
  manifest: { ...GOOD.manifest, ...m },
  entries: e ?? [...GOOD.entries],
});

describe('PACK-SMOKE gate — the bytes a consumer receives', () => {
  it('EXONERATES a well-formed tarball — or every conviction below is meaningless', () => {
    expect(findings([GOOD])).toEqual([]);
  });

  it('CONVICTS a pnpm-only protocol, which npm cannot install', () => {
    const ws = mutate({ dependencies: { '@x/dep': 'workspace:*' } });
    expect(protocolRanges(ws.manifest)).toHaveLength(1);
    expect(findings([ws]).map((f) => f.law)).toEqual(['protocol']);
    const cat = mutate({ dependencies: { cac: 'catalog:' } });
    expect(findings([cat]).map((f) => f.law)).toEqual(['protocol']);
    // And it is TOTAL over the manifest, not a roster of today's fields: a protocol hiding
    // in a field nobody enumerated is the way this check goes dark.
    const odd = mutate({ pnpm: { overrides: { z: 'workspace:^' } } });
    expect(findings([odd]).map((f) => f.law)).toEqual(['protocol']);
  });

  it('CONVICTS a surviving lifecycle script — proof it was not packed by pnpm', () => {
    const p = mutate({
      scripts: {
        ...(GOOD.manifest.scripts as object),
        prepack: 'pnpm run build',
      },
    });
    expect(lifecycleScripts(p.manifest)).toHaveLength(1);
    expect(findings([p]).map((f) => f.law)).toEqual(['lifecycle']);
    // A non-publish script is not a finding — the law is about the obfuscation, not scripts.
    expect(findings([mutate({ scripts: { build: 'tsup' } })])).toEqual([]);
  });

  it('CONVICTS a declared target that is not in the tarball', () => {
    const missing = mutate({}, [
      'package.json',
      'LICENSE',
      'dist/index.js',
      'dist/index.d.ts',
    ]);
    expect(findings([missing]).map((f) => f.law)).toEqual(['target']);
    expect(findings([missing])[0]?.detail).toContain('./dist/bin.js');
  });

  it('CONVICTS a license claim with no license file', () => {
    const noLic = mutate(
      {},
      GOOD.entries.filter((e) => e !== 'LICENSE'),
    );
    expect(findings([noLic]).map((f) => f.law)).toEqual(['license']);
    // No claim, no finding — the law is about the CLAIM, not about shipping a license.
    const noClaim: Packed = {
      ...noLic,
      manifest: Object.fromEntries(
        Object.entries(noLic.manifest).filter(([k]) => k !== 'license'),
      ),
    };
    expect(findings([noClaim])).toEqual([]);
  });

  it('resolves WILDCARD subpaths — the shape an exact compare is dark on', () => {
    // forge ships `"./adapters/*"`. An exact-string checker finds no file called
    // `dist/adapters/*.js` and would convict a correct package — or be "fixed" by dropping
    // the case, taking every subpath forge actually ships out of the law's reach.
    const entries = ['dist/adapters/claude.js', 'dist/adapters/codex.js'];
    expect(targetResolves('./dist/adapters/*.js', entries)).toBe(true);
    expect(targetResolves('./dist/adapters/*.js', ['dist/other.js'])).toBe(
      false,
    );
    // A wildcard must not match across a path segment.
    expect(targetResolves('./dist/*.js', ['dist/deep/x.js'])).toBe(false);
    expect(
      declaredTargets({ exports: { './adapters/*': './dist/adapters/*.js' } }),
    ).toEqual([['$.exports["./adapters/*"]', './dist/adapters/*.js']]);
  });

  it('reads targets through nested conditions and arrays, not just the top level', () => {
    const t = declaredTargets({
      exports: {
        '.': { node: { import: './dist/a.js' }, default: ['./dist/b.js'] },
      },
    }).map(([, v]) => v);
    expect(t).toContain('./dist/a.js');
    expect(t).toContain('./dist/b.js');
  });
});
