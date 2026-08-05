import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
// The legacy bucket is ONE bucket: `fold`'s cwd-less records and `node`'s
// unmeasurable (vanished-cwd) ones land in the same place. Imported from `fold`
// so the test proves the identity rather than restating the literal.
import { LEGACY_NODE } from '../src/fold.js';
import {
  DEFAULT_MARKERS,
  type NodeConfig,
  globMatch,
  loadNodeConfig,
  resolveNode,
  underOrEqual,
} from '../src/node.js';

let root: string;

/** A NodeConfig whose $HOME is a scratch dir that is NEVER an ancestor of the cwds under test. */
function cfg(overrides: Partial<NodeConfig> = {}): NodeConfig {
  return {
    markers: DEFAULT_MARKERS,
    currentHost: 'testhost',
    currentHome: join(root, 'home', 'tester'),
    hostHomes: {},
    ...overrides,
  };
}

beforeEach(() => {
  // Canonical root: node identities are realpaths (macOS tmpdir is symlinked).
  root = realpathSync(mkdtempSync(join(tmpdir(), 'node-resolve-')));
  mkdirSync(join(root, 'home', 'tester'), { recursive: true });
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('resolveNode — marker lattice (SPEC D3)', () => {
  it('reflexive: cwd = repo root resolves to that root (.git dir)', () => {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, '.git'), { recursive: true });
    expect(resolveNode(repo, 'testhost', cfg())).toEqual({
      node: repo,
      basis: '.git',
    });
  });

  it('a markerless cwd is its own boundary — NEVER $HOME', () => {
    const scratch = join(root, 'x');
    mkdirSync(scratch, { recursive: true });
    const r = resolveNode(scratch, 'testhost', cfg());
    expect(r).toEqual({ node: scratch, basis: 'markerless' });
    expect(r.node).not.toBe(cfg().currentHome);
  });

  it('nearest-ancestor: a subdir inside a repo resolves to the repo root', () => {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, '.git'), { recursive: true });
    const deep = join(repo, 'a', 'b', 'c');
    mkdirSync(deep, { recursive: true });
    expect(resolveNode(deep, 'testhost', cfg()).node).toBe(repo);
  });

  it('marker precedence is NEAREST-wins: PLAN.md in a package in a repo', () => {
    const repo = join(root, 'repo');
    const pkg = join(repo, 'packages', 'p');
    const plan = join(pkg, 'plans', 'x');
    mkdirSync(join(repo, '.git'), { recursive: true });
    mkdirSync(plan, { recursive: true });
    writeFileSync(join(pkg, 'package.json'), '{}', 'utf8');
    writeFileSync(join(plan, 'PLAN.md'), '# plan', 'utf8');

    // cwd in the plan dir → the plan node (nearest), not package, not repo.
    expect(resolveNode(plan, 'testhost', cfg())).toEqual({
      node: plan,
      basis: 'PLAN.md',
    });
    // cwd in the package (below the plan) → the package node.
    const src = join(pkg, 'src');
    mkdirSync(src, { recursive: true });
    expect(resolveNode(src, 'testhost', cfg())).toEqual({
      node: pkg,
      basis: 'package.json',
    });
    // cwd elsewhere in the repo → the repo node.
    const docs = join(repo, 'docs');
    mkdirSync(docs, { recursive: true });
    expect(resolveNode(docs, 'testhost', cfg()).node).toBe(repo);
  });

  it('a .git FILE (worktree) resolves through to the primary checkout node', () => {
    const primary = join(root, 'primary');
    mkdirSync(join(primary, '.git', 'worktrees', 'wt1'), { recursive: true });
    const worktree = join(root, 'wt1');
    mkdirSync(worktree, { recursive: true });
    writeFileSync(
      join(worktree, '.git'),
      `gitdir: ${join(primary, '.git', 'worktrees', 'wt1')}\n`,
      'utf8',
    );
    expect(resolveNode(worktree, 'testhost', cfg())).toEqual({
      node: primary,
      basis: '.git-file',
    });
    // Deep inside the worktree too.
    const deep = join(worktree, 'src', 'x');
    mkdirSync(deep, { recursive: true });
    expect(resolveNode(deep, 'testhost', cfg()).node).toBe(primary);
  });

  it('a nonexistent cwd folds to its nearest existing ancestor — WHERE A MARKER STANDS', () => {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, '.git'), { recursive: true });
    // Deleted-since-capture subdir: still the repo node.
    expect(
      resolveNode(join(repo, 'gone', 'deeper'), 'testhost', cfg()).node,
    ).toBe(repo);
  });

  // ── Face B (V3): the fold is INFERENCE. It may stand on a marker; it may not
  //    invent a `$HOME`/`markerless` boundary out of the walk running dry.
  it('a VANISHED cwd is never laundered into $HOME — it folds to the legacy bucket', () => {
    const home = cfg().currentHome;
    // The live shape on this box: `~/workspaces` exists and carries NO marker,
    // so a renamed-away repo under it walked clean through to `$HOME` and became
    // indistinguishable from a session genuinely run from `~`.
    const area = join(home, 'workspaces');
    mkdirSync(area, { recursive: true });
    expect(
      resolveNode(join(area, 'renamed-away', 'src'), 'testhost', cfg()),
    ).toEqual({ node: LEGACY_NODE, basis: 'vanished-cwd' });

    // Same shape with no home above it: a markerless ancestor is equally no evidence.
    const bare = join(root, 'bare');
    mkdirSync(bare, { recursive: true });
    expect(resolveNode(join(bare, 'never', 'was'), 'testhost', cfg())).toEqual({
      node: LEGACY_NODE,
      basis: 'vanished-cwd',
    });

    // The exonerating pair — the severance costs nothing that was measured.
    // A LIVE markerless dir under home is still `$HOME`…
    expect(resolveNode(area, 'testhost', cfg())).toEqual({
      node: home,
      basis: '$HOME',
    });
    // …and a vanished subdir of a LIVE repo is still that repo.
    const repo = join(area, 'repo');
    mkdirSync(join(repo, '.git'), { recursive: true });
    expect(resolveNode(join(repo, 'build', 'x'), 'testhost', cfg())).toEqual({
      node: repo,
      basis: '.git',
    });
  });

  it('$HOME is the user boundary: a markerless dir under home resolves to home', () => {
    const home = cfg().currentHome;
    const notes = join(home, 'Desktop', 'notes');
    mkdirSync(notes, { recursive: true });
    expect(resolveNode(notes, 'testhost', cfg())).toEqual({
      node: home,
      basis: '$HOME',
    });
    // But a NEARER marker under home still wins.
    const repo = join(home, 'work', 'repo');
    mkdirSync(join(repo, '.git'), { recursive: true });
    expect(resolveNode(repo, 'testhost', cfg()).node).toBe(repo);
  });

  it('a config glob SHIFTS resolution: memory.scopeMarkers marks a new boundary', () => {
    const repo = join(root, 'repo');
    const area = join(repo, 'area');
    const deep = join(area, 'deep');
    mkdirSync(join(repo, '.git'), { recursive: true });
    mkdirSync(deep, { recursive: true });
    writeFileSync(join(area, 'foo.workspace'), '', 'utf8');

    // Without the glob: the repo node.
    expect(resolveNode(deep, 'testhost', cfg()).node).toBe(repo);
    // With the glob: the marked dir, nearest-wins.
    const withGlob = cfg({
      markers: [...DEFAULT_MARKERS, '*.workspace'],
    });
    expect(resolveNode(deep, 'testhost', withGlob)).toEqual({
      node: area,
      basis: '*.workspace',
    });
  });

  it('is total: a hostless record resolves like a local one', () => {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, '.git'), { recursive: true });
    expect(resolveNode(repo, undefined, cfg()).node).toBe(repo);
  });
});

describe('resolveNode — foreign host (the local fs is not evidence)', () => {
  it('a foreign cwd under the config-known homedir resolves to that $HOME', () => {
    const c = cfg({ hostHomes: { upmav: '/Users/lcaraccioli' } });
    expect(
      resolveNode('/Users/lcaraccioli/workspaces/demo', 'upmav', c),
    ).toEqual({ node: '/Users/lcaraccioli', basis: '$HOME' });
  });

  it('a foreign cwd with no config home is its own boundary — never resolved against local markers', () => {
    // root exists locally and has NO markers; a foreign record pointing at a
    // LOCAL marker-bearing path must not pick up local markers either.
    const repo = join(root, 'repo');
    mkdirSync(join(repo, '.git'), { recursive: true });
    expect(resolveNode(repo, 'otherhost', cfg())).toEqual({
      node: repo,
      basis: 'foreign-cwd',
    });
  });
});

describe('loadNodeConfig', () => {
  it('reads memory.scopeMarkers and host.*.homedir; defaults survive', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nodecfg-'));
    const file = join(dir, '.agent-factory.config');
    writeFileSync(
      file,
      JSON.stringify({
        schema: 1,
        memory: { scopeMarkers: ['*.workspace'] },
        host: {
          upmav: { user: 'lcaraccioli', homedir: '/Users/lcaraccioli' },
          fire: { local: true },
        },
      }),
      'utf8',
    );
    const c = loadNodeConfig(file);
    expect(c.markers).toEqual([...DEFAULT_MARKERS, '*.workspace']);
    expect(c.hostHomes).toEqual({ upmav: '/Users/lcaraccioli' });
    rmSync(dir, { recursive: true, force: true });
  });

  it('no config → defaults only', () => {
    const c = loadNodeConfig(undefined);
    expect(c.markers).toEqual([...DEFAULT_MARKERS]);
    expect(c.hostHomes).toEqual({});
  });
});

describe('globMatch / underOrEqual', () => {
  it('anchored basename globs', () => {
    expect(globMatch('*.workspace', 'foo.workspace')).toBe(true);
    expect(globMatch('*.workspace', 'foo.workspaces')).toBe(false);
    expect(globMatch('PLAN.md', 'PLAN.md')).toBe(true);
    expect(globMatch('PLAN.md', 'xPLAN.md')).toBe(false);
    expect(globMatch('?.md', 'a.md')).toBe(true);
    expect(globMatch('?.md', 'ab.md')).toBe(false);
  });

  it('underOrEqual is prefix-on-the-lattice, not string prefix', () => {
    expect(underOrEqual('/a/b', '/a/b')).toBe(true);
    expect(underOrEqual('/a/b/c', '/a/b')).toBe(true);
    expect(underOrEqual('/a/bc', '/a/b')).toBe(false);
  });
});
