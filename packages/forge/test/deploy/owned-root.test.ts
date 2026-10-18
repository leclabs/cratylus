import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { ompHarnessAdapter } from '../../src/adapters/omp/index.js';
import {
  type InstallationRecord,
  linkOwnedRoot,
  ownedRootIn,
} from '../../src/deploy/owned-root.js';

const tmp: string[] = [];
afterEach(() => {
  for (const dir of tmp.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

/** A host: its home, omp's directory in it, the owned root, and the two reference
 *  places omp loads the root from. */
interface Host {
  readonly home: string;
  readonly harnessDir: string;
  readonly root: string;
  readonly link: string;
  readonly manifest: string;
}
function host(): Host {
  const home = mkdtempSync(join(tmpdir(), 'owned-root-'));
  tmp.push(home);
  const harnessDir = join(home, '.omp');
  const root = ownedRootIn(ompHarnessAdapter, home);
  mkdirSync(root, { recursive: true });
  const plugins = join(harnessDir, 'plugins');
  return {
    home,
    harnessDir,
    root,
    link: join(plugins, 'node_modules/cratylus-omp'),
    manifest: join(plugins, 'package.json'),
  };
}
const link = (h: Host, prior: InstallationRecord | null = null) =>
  linkOwnedRoot({
    adapter: ompHarnessAdapter,
    harnessDir: h.harnessDir,
    root: h.root,
    scope: 'user',
    prior,
    dry: false,
  });

describe('install and upgrade claim only the reference places still theirs', () => {
  it('places both references on a host holding neither, and records them', () => {
    const h = host();
    const report = link(h);
    expect(readlinkSync(h.link)).toBe(h.root);
    expect(JSON.parse(readFileSync(h.manifest, 'utf8')).dependencies).toEqual({
      'cratylus-omp': pathToFileURL(h.root).href,
    });
    expect(report.references.map((r) => r.kind)).toEqual([
      'link',
      'dependency',
    ]);
    expect(report.left).toEqual([]);
  });

  it('changes nothing where both references already point into the root', () => {
    const h = host();
    const first = link(h);
    const again = link(h, { references: first.references });
    expect(again.changed).toEqual([]);
    expect(again.references).toEqual(first.references);
  });

  it('leaves a link the host has redirected, records no reference there, and says what to do', () => {
    const h = host();
    const first = link(h);
    const mine = join(h.home, 'mira-plugin');
    mkdirSync(mine);
    rmSync(h.link);
    symlinkSync(mine, h.link, 'dir');
    const again = link(h, { references: first.references });
    expect(readlinkSync(h.link)).toBe(mine);
    expect(again.references.map((r) => r.kind)).toEqual(['dependency']);
    expect(again.changed).not.toContain(h.link);
    expect(again.left).toHaveLength(1);
    expect(again.left[0]?.what).toBe(h.link);
    expect(again.left[0]?.why).toContain(mine);
    expect(again.left[0]?.why).toMatch(/move it away and install again/);
  });

  it('leaves a link the host has replaced by a directory of its own', () => {
    const h = host();
    mkdirSync(h.link, { recursive: true });
    writeFileSync(join(h.link, 'index.ts'), 'mira');
    const report = link(h);
    expect(lstatSync(h.link).isDirectory()).toBe(true);
    expect(readFileSync(join(h.link, 'index.ts'), 'utf8')).toBe('mira');
    expect(report.references.some((r) => r.kind === 'link')).toBe(false);
    expect(report.left[0]?.why).toMatch(/not a link/);
  });

  it('leaves a dependency entry the host has pointed elsewhere, keeping the rest of the manifest', () => {
    const h = host();
    const first = link(h);
    const doc = {
      dependencies: { 'cratylus-omp': 'file:///mira/own', other: '1.0.0' },
    };
    writeFileSync(h.manifest, JSON.stringify(doc));
    const before = readFileSync(h.manifest, 'utf8');
    const again = link(h, { references: first.references });
    expect(readFileSync(h.manifest, 'utf8')).toBe(before);
    expect(again.references.map((r) => r.kind)).toEqual(['link']);
    expect(again.left).toEqual([
      {
        what: `${h.manifest}: dependencies.cratylus-omp`,
        why: expect.stringMatching(
          /file:\/\/\/mira\/own.*take that entry out and install again/,
        ),
      },
    ]);
  });

  it('adds its entry beside the host’s own dependencies where it has none', () => {
    const h = host();
    mkdirSync(join(h.harnessDir, 'plugins'), { recursive: true });
    writeFileSync(
      h.manifest,
      JSON.stringify({ dependencies: { other: '1.0.0' } }),
    );
    const report = link(h);
    expect(JSON.parse(readFileSync(h.manifest, 'utf8')).dependencies).toEqual({
      other: '1.0.0',
      'cratylus-omp': pathToFileURL(h.root).href,
    });
    expect(report.references).toContainEqual({
      kind: 'dependency',
      path: 'plugins/package.json',
      name: 'cratylus-omp',
      created: false,
    });
  });
});
