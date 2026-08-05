// `discoverPluginFragments` — the multi-plugin fragment discovery (P3). Proves:
// (1) it enumerates fragments across ≥2 plugins as NODES with namespaced ids;
// (2) two distinct plugins sharing an anchor do NOT collide (distinct node objects);
// (3) node identity is the ADDRESS the resolver keys by (object-import addressing);
// (4) a cross-plugin reference cycle throws the named ReferenceCycleError (§3);
// (5) a dangling cross-plugin reference throws DanglingReferenceError.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  type DiscoveredPlugin,
  discoverPluginFragments,
} from '../../src/catalog/index.js';
import {
  DanglingReferenceError,
  ReferenceCycleError,
} from '../../src/resolve/resolve.js';
import { FIXTURE_ANATOMY } from '../fixture-anatomy.js';

/** Write a branded-string fragment module `export const <name> = '<body>'`. */
function writeStringFragment(
  dir: string,
  dimension: string,
  file: string,
  exportName: string,
  body: string,
): void {
  const d = join(dir, dimension);
  mkdirSync(d, { recursive: true });
  writeFileSync(
    join(d, `${file}.ts`),
    `export const ${exportName} = ${JSON.stringify(body)};\n`,
  );
}

describe('discoverPluginFragments — namespaced multi-plugin discovery', () => {
  let root: string;
  let plugins: DiscoveredPlugin[];

  beforeAll(async () => {
    root = mkdtempSync(join(tmpdir(), 'forge-discover-'));
    const alphaDir = join(root, 'alpha');
    const betaDir = join(root, 'beta');

    // Both plugins name a concept `parsimony` under `objective` — a shared ANCHOR.
    writeStringFragment(
      alphaDir,
      'objective',
      'parsimony',
      'parsimony',
      'parsimony',
    );
    writeStringFragment(
      betaDir,
      'objective',
      'parsimony',
      'parsimony',
      'parsimony',
    );
    // Each also carries a distinct fragment so enumeration is non-trivial.
    writeStringFragment(alphaDir, 'objective', 'insight', 'insight', 'insight');
    writeStringFragment(betaDir, 'role', 'builder', 'builder', 'the builder');

    plugins = await discoverPluginFragments(
      [
        { name: 'alpha', fragmentsDir: alphaDir },
        { name: 'beta', fragmentsDir: betaDir },
      ],
      FIXTURE_ANATOMY,
    );
  });

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it('enumerates fragments across BOTH plugins', () => {
    expect(plugins.map((p) => p.name)).toEqual(['alpha', 'beta']);
    const alpha = plugins.find((p) => p.name === 'alpha');
    const beta = plugins.find((p) => p.name === 'beta');
    expect(alpha?.fragments.map((f) => f.node.id).sort()).toEqual([
      'alpha:objective/insight',
      'alpha:objective/parsimony',
    ]);
    expect(beta?.fragments.map((f) => f.node.id).sort()).toEqual([
      'beta:objective/parsimony',
      'beta:role/builder',
    ]);
  });

  it('namespaces ids by plugin — a shared anchor does NOT collide', () => {
    const aPars = plugins
      .find((p) => p.name === 'alpha')
      ?.fragments.find((f) => f.body === 'parsimony');
    const bPars = plugins
      .find((p) => p.name === 'beta')
      ?.fragments.find((f) => f.body === 'parsimony');

    // Same anchor, same body — but DISTINCT namespaced ids AND distinct node objects.
    expect(aPars?.node.id).toBe('alpha:objective/parsimony');
    expect(bPars?.node.id).toBe('beta:objective/parsimony');
    expect(aPars?.node).not.toBe(bPars?.node); // object identity = the address
  });

  it('files each fragment under its dimension with kind from arity', () => {
    const beta = plugins.find((p) => p.name === 'beta');
    const builder = beta?.fragments.find((f) => f.node.id.endsWith('/builder'));
    expect(builder?.dimension).toBe('role'); // role is scalar arity → scalar kind
    expect(builder?.node.kind).toBe('scalar');
    const insight = plugins
      .find((p) => p.name === 'alpha')
      ?.fragments.find((f) => f.node.id.endsWith('/insight'));
    expect(insight?.dimension).toBe('objective');
  });
});

describe('discoverPluginFragments — cross-plugin reference acyclicity (§3)', () => {
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
      "export const b = { id: 'B:objective/b', kind: 'scalar', references: [] };\n",
    );
    writeFileSync(
      aPath,
      [
        `import { b } from ${JSON.stringify(pathToFileURL(bPath).href)};`,
        "export const a = { id: 'A:objective/a', kind: 'scalar', references: [b] };",
        'b.references.push(a); // close the cycle A → B → A',
        '',
      ].join('\n'),
    );

    await expect(
      discoverPluginFragments(
        [
          { name: 'A', fragmentsDir: aDir },
          { name: 'B', fragmentsDir: bDir },
        ],
        FIXTURE_ANATOMY,
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
        "const ghost = { id: 'ghost', kind: 'scalar' };",
        "export const c = { id: 'C:objective/c', kind: 'scalar', references: [ghost] };",
        '',
      ].join('\n'),
    );
    await expect(
      discoverPluginFragments(
        [{ name: 'C', fragmentsDir: cDir }],
        FIXTURE_ANATOMY,
      ),
    ).rejects.toThrow(DanglingReferenceError);
  });
});
