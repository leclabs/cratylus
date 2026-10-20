// `enumeratePluginValueCatalogs` — the multi-plugin value discovery. Proves:
// (1) it enumerates values across ≥2 plugins as NODES with namespaced ids;
// (2) two distinct plugins sharing a term do NOT collide (distinct node objects);
// (3) node identity is the ADDRESS (object-import addressing);
// (4) a cross-plugin reference cycle throws the named ReferenceCycleError — the
//     resolved reference graph is required to be ACYCLIC, and the failure is a
//     named error rather than a stack overflow;
// (5) a dangling cross-plugin reference throws DanglingReferenceError;
// (6) two roots claiming ONE namespace are REJECTED, not silently last-write-wins.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  DuplicateNamespaceError,
  type PluginValueCatalogs,
  enumeratePluginValueCatalogs,
} from '../../src/catalog/index.js';
import {
  DanglingReferenceError,
  ReferenceCycleError,
} from '../../src/resolve/resolve.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

/** Write a branded-string value module `export const <name> = '<body>'`. */
function writeStringValue(
  dir: string,
  factor: string,
  file: string,
  exportName: string,
  body: string,
): void {
  const d = join(dir, factor);
  mkdirSync(d, { recursive: true });
  writeFileSync(
    join(d, `${file}.ts`),
    `export const ${exportName} = ${JSON.stringify(body)};\n`,
  );
}

describe('enumeratePluginValueCatalogs — namespaced multi-plugin discovery', () => {
  let root: string;
  let plugins: PluginValueCatalogs;

  beforeAll(async () => {
    root = mkdtempSync(join(tmpdir(), 'forge-discover-'));
    const alphaDir = join(root, 'alpha');
    const betaDir = join(root, 'beta');

    // Both plugins name a concept `parsimony` under `objective` — a shared TERM.
    writeStringValue(
      alphaDir,
      'objective',
      'parsimony',
      'parsimony',
      'parsimony',
    );
    writeStringValue(
      betaDir,
      'objective',
      'parsimony',
      'parsimony',
      'parsimony',
    );
    // Each also carries a distinct value so enumeration is non-trivial.
    writeStringValue(alphaDir, 'objective', 'insight', 'insight', 'insight');
    writeStringValue(betaDir, 'role', 'builder', 'builder', 'the builder');

    plugins = await enumeratePluginValueCatalogs(
      [
        { name: 'alpha', factorsDir: alphaDir },
        { name: 'beta', factorsDir: betaDir },
      ],
      FIXTURE_MANIFEST,
    );
  });

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it('enumerates values across BOTH plugins, keyed by namespace in root order', () => {
    expect([...plugins.keys()]).toEqual(['alpha', 'beta']);
    expect(
      plugins
        .get('alpha')
        ?.map((f) => f.node.id)
        .sort(),
    ).toEqual(['alpha:objective/insight', 'alpha:objective/parsimony']);
    expect(
      plugins
        .get('beta')
        ?.map((f) => f.node.id)
        .sort(),
    ).toEqual(['beta:objective/parsimony', 'beta:role/builder']);
  });

  it('namespaces ids by plugin — a shared term does NOT collide', () => {
    const aPars = plugins.get('alpha')?.find((f) => f.body === 'parsimony');
    const bPars = plugins.get('beta')?.find((f) => f.body === 'parsimony');

    // Same term, same body — but DISTINCT namespaced ids AND distinct node objects.
    expect(aPars?.node.id).toBe('alpha:objective/parsimony');
    expect(bPars?.node.id).toBe('beta:objective/parsimony');
    expect(aPars?.node).not.toBe(bPars?.node); // object identity = the address
  });

  it('files each value under its factor with value shape from arity', () => {
    const builder = plugins
      .get('beta')
      ?.find((f) => f.node.id.endsWith('/builder'));
    expect(builder?.factor).toBe('role'); // role is scalar arity → scalar value shape
    expect(builder?.node.valueShape).toBe('scalar');
    const insight = plugins
      .get('alpha')
      ?.find((f) => f.node.id.endsWith('/insight'));
    expect(insight?.factor).toBe('objective');
  });
});

describe('enumeratePluginValueCatalogs — namespace uniqueness', () => {
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'forge-discover-dup-'));
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  // THE FIXTURE MUST BE ABLE TO SUCCEED. Both roots carry a REAL, DISTINCT value,
  // so absent the guard this call returns — and returns ONE catalog, the second root's,
  // with the first root's `dup:objective/first` silently gone. That is the exact
  // last-write-wins the rejection replaces, and asserting only `rejects.toThrow` on two
  // empty dirs would have proved nothing about it.
  it('rejects two roots claiming ONE namespace — never last-write-wins', async () => {
    const firstDir = join(root, 'first');
    const secondDir = join(root, 'second');
    writeStringValue(firstDir, 'objective', 'first', 'first', 'the first');
    writeStringValue(
      secondDir,
      'objective',
      'second',
      'second',
      'the second',
    );

    const roots = [
      { name: 'dup', factorsDir: firstDir },
      { name: 'dup', factorsDir: secondDir },
    ];
    await expect(
      enumeratePluginValueCatalogs(roots, FIXTURE_MANIFEST),
    ).rejects.toThrow(DuplicateNamespaceError);

    // The report NAMES the namespace and BOTH roots — a duplicate is unfixable
    // without knowing which two dirs claimed it.
    let err: unknown;
    try {
      await enumeratePluginValueCatalogs(roots, FIXTURE_MANIFEST);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(DuplicateNamespaceError);
    const dup = err as DuplicateNamespaceError;
    expect(dup.namespace).toBe('dup');
    expect(dup.factorsDirs).toEqual([firstDir, secondDir]);

    // NEGATIVE CONTROL: the same two dirs under DISTINCT namespaces enumerate fine,
    // so the rejection is keyed on the namespace and not on anything else the fixture
    // happens to share.
    const ok = await enumeratePluginValueCatalogs(
      [
        { name: 'first', factorsDir: firstDir },
        { name: 'second', factorsDir: secondDir },
      ],
      FIXTURE_MANIFEST,
    );
    expect([...ok.keys()]).toEqual(['first', 'second']);
    expect(ok.get('first')?.map((f) => f.node.id)).toEqual([
      'first:objective/first',
    ]);
  });
});

describe('enumeratePluginValueCatalogs — cross-plugin reference acyclicity', () => {
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'forge-discover-cyc-'));
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it('THROWS ReferenceCycleError on a cross-plugin reference cycle', async () => {
    const aDir = join(root, 'A');
    const bDir = join(root, 'B');
    const aObjDir = join(aDir, 'objective');
    const bObjDir = join(bDir, 'objective');
    mkdirSync(aObjDir, { recursive: true });
    mkdirSync(bObjDir, { recursive: true });

    const bPath = join(bObjDir, 'b.ts');
    const aPath = join(aObjDir, 'a.ts');
    // B has no imports (loads fully first); A imports B's node and wires BOTH edges
    // after B is initialized — a real object-identity cycle, no TDZ.
    writeFileSync(
      bPath,
      "export const b = { id: 'B:objective/b', valueShape: 'scalar', references: [] };\n",
    );
    writeFileSync(
      aPath,
      [
        `import { b } from ${JSON.stringify(pathToFileURL(bPath).href)};`,
        "export const a = { id: 'A:objective/a', valueShape: 'scalar', references: [b] };",
        'b.references.push(a); // close the cycle A → B → A',
        '',
      ].join('\n'),
    );

    await expect(
      enumeratePluginValueCatalogs(
        [
          { name: 'A', factorsDir: aDir },
          { name: 'B', factorsDir: bDir },
        ],
        FIXTURE_MANIFEST,
      ),
    ).rejects.toThrow(ReferenceCycleError);
  });

  it('THROWS DanglingReferenceError on a reference to an undiscovered node', async () => {
    const cDir = join(root, 'C');
    const cObjDir = join(cDir, 'objective');
    mkdirSync(cObjDir, { recursive: true });
    // References a ghost node that no scanned plugin exports.
    writeFileSync(
      join(cObjDir, 'c.ts'),
      [
        "const ghost = { id: 'ghost', valueShape: 'scalar' };",
        "export const c = { id: 'C:objective/c', valueShape: 'scalar', references: [ghost] };",
        '',
      ].join('\n'),
    );
    await expect(
      enumeratePluginValueCatalogs(
        [{ name: 'C', factorsDir: cDir }],
        FIXTURE_MANIFEST,
      ),
    ).rejects.toThrow(DanglingReferenceError);
  });
});
