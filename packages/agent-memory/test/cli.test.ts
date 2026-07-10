import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { main } from '../src/cli.js';
import { shortHost } from '../src/node.js';
import { parseLines } from '../src/store.js';

let root: string;
let home: string;
const origCwd = process.cwd();

beforeEach(() => {
  // Canonical root: recorded cwds are realpaths (macOS tmpdir is symlinked).
  root = realpathSync(mkdtempSync(join(tmpdir(), 'memory-cli-')));
  home = join(root, 'agent-home');
  mkdirSync(home, { recursive: true });
  // Hermetic: no developer-shell config, no cwd-present config pickup.
  vi.stubEnv('AGENT_FACTORY_CONFIG', '');
  // encode binds a session (never sessionless); the harness env supplies it.
  vi.stubEnv('CLAUDE_SESSION_ID', 'cli-test-sess');
});

afterEach(() => {
  process.chdir(origCwd);
  rmSync(root, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

const logRecords = () =>
  parseLines(readFileSync(join(home, 'EPISODIC.jsonl'), 'utf8'));

describe('encode — the tool derives, the caller never supplies', () => {
  it('mints a ULID, derives {host, cwd}, appends one record, and prints the id', () => {
    const session = join(root, 'session-dir');
    mkdirSync(session, { recursive: true });
    process.chdir(session);

    const r = main(['encode', '--home', home, '--body', 'hello']);
    expect(r.code).toBe(0);
    const id = r.out.trim();
    expect(id).toHaveLength(26);

    const [rec] = logRecords();
    expect(rec?.id).toBe(id);
    expect(rec?.body).toBe('hello');
    // Derived from the REAL process, not from any flag.
    expect(rec?.cwd).toBe(process.cwd());
    expect(rec?.host).toBe(shortHost(hostname()));
  });

  it('IGNORES a caller-supplied --cwd (cwd is derived, never an input)', () => {
    const session = join(root, 'real-cwd');
    mkdirSync(session, { recursive: true });
    process.chdir(session);

    const r = main(['encode', '--home', home, '--cwd', '/evil', '--body', 'x']);
    expect(r.code).toBe(0);
    const [rec] = logRecords();
    expect(rec?.cwd).toBe(process.cwd());
    expect(rec?.cwd).not.toBe('/evil');
  });

  it('a --scope value is an INERT tags entry — any shape accepted, never validated, never routing', () => {
    // v1 grammar shapes AND arbitrary shapes both pass (the tag grammar retired).
    for (const scope of [
      'user',
      'project:polis',
      'plan:polis/x',
      'whatever!',
    ]) {
      const r = main([
        'encode',
        '--home',
        home,
        '--scope',
        scope,
        '--body',
        'b',
      ]);
      expect(r.code).toBe(0);
    }
    const recs = logRecords();
    expect(recs.map((r) => r.tags)).toEqual([
      ['user'],
      ['project:polis'],
      ['plan:polis/x'],
      ['whatever!'],
    ]);
    // Scope is not STORED as a field (SPEC D2).
    for (const rec of recs) expect(rec.scope).toBeUndefined();
  });

  it('accepts --tags as a comma list plus a JSON body', () => {
    const r = main([
      'encode',
      '--home',
      home,
      '--tags',
      'a, b',
      '--body-json',
      '{"k":1}',
    ]);
    expect(r.code).toBe(0);
    const [rec] = logRecords();
    expect(rec?.tags).toEqual(['a', 'b']);
    expect(rec?.body).toEqual({ k: 1 });
  });

  it('appends in order across calls (records stay ULID-sortable)', () => {
    for (const b of ['1', '2', '3'])
      main(['encode', '--home', home, '--body', b]);
    const ids = logRecords().map((r) => r.id);
    expect([...ids].sort()).toEqual(ids);
  });

  it('errors without a body source', () => {
    const r = main(['encode', '--home', home]);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/--body/);
  });

  it('errors without --home', () => {
    const r = main(['encode', '--body', 'x']);
    expect(r.code).not.toBe(0);
    expect(r.err).toMatch(/--home/);
  });

  it('capture never writes into the project tree (single-store)', () => {
    const project = join(root, 'proj');
    mkdirSync(join(project, '.git'), { recursive: true });
    process.chdir(project);
    const r = main(['encode', '--home', home, '--body', 'in-project']);
    expect(r.code).toBe(0);
    expect(existsSync(join(project, 'EPISODIC.jsonl'))).toBe(false);
    expect(logRecords()).toHaveLength(1);
  });
});

describe('read', () => {
  it('prints the record count with --count', () => {
    main(['encode', '--home', home, '--body', 'a']);
    main(['encode', '--home', home, '--body', 'b']);
    const r = main(['read', '--home', home, '--count']);
    expect(r.code).toBe(0);
    expect(r.out.trim()).toBe('2');
  });

  it('returns 0 for an absent store', () => {
    const r = main(['read', '--home', home, '--count']);
    expect(r.code).toBe(0);
    expect(r.out.trim()).toBe('0');
  });

  it('--scope still filters (inert field/tag match — compat shape)', () => {
    main(['encode', '--home', home, '--scope', 'project:polis', '--body', 'p']);
    main(['encode', '--home', home, '--scope', 'user', '--body', 'u']);
    const r = main(['read', '--home', home, '--scope', 'project:polis']);
    expect(r.code).toBe(0);
    expect(r.out.trim().split('\n')).toHaveLength(1);
    expect(r.out).toContain('"p"');
  });

  it('--under filters same-host records by node prefix; foreign-host + legacy report as counts', () => {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, '.git'), { recursive: true });
    const inside = join(repo, 'src');
    mkdirSync(inside, { recursive: true });
    const outside = join(root, 'elsewhere');
    mkdirSync(outside, { recursive: true });

    process.chdir(inside);
    main(['encode', '--home', home, '--body', 'inside-repo']);
    process.chdir(outside);
    main(['encode', '--home', home, '--body', 'outside-repo']);

    // Seed a foreign-host record and a legacy (cwd-less v1) record directly.
    appendFileSync(
      join(home, 'EPISODIC.jsonl'),
      `${JSON.stringify({
        id: '01BX5ZZKBKACTAV9WEVGEMMVRZ',
        host: 'otherhost',
        cwd: '/Users/other/work',
        body: 'foreign',
      })}\n${JSON.stringify({
        id: '01BX5ZZKBKACTAV9WEVGEMMVS0',
        scope: 'user',
        body: 'legacy v1',
      })}\n`,
      'utf8',
    );

    // process.cwd() may sit under a symlinked tmpdir; encode recorded the
    // process-reported cwd, so query --under with the recorded repo prefix.
    const recordedRepo = logRecords()[0]?.cwd?.replace(/\/src$/, '') as string;
    const r = main(['read', '--home', home, '--under', recordedRepo]);
    expect(r.code).toBe(0);
    const listed = r.out.trim().split('\n');
    expect(listed).toHaveLength(1);
    expect(r.out).toContain('inside-repo');
    expect(r.out).not.toContain('outside-repo');
    expect(r.err).toMatch(/1 matched/);
    expect(r.err).toMatch(/foreign-host: otherhost=1/);
    expect(r.err).toMatch(/legacy: 1/);
  });
});

describe('node (CLI)', () => {
  it('default output is the BARE node path, newline-terminated, nothing else', () => {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, '.git'), { recursive: true });
    const deep = join(repo, 'a', 'b');
    mkdirSync(deep, { recursive: true });
    const r = main(['node', deep]);
    expect(r.code).toBe(0);
    expect(r.out).toBe(`${repo}\n`); // exact: bare path + newline, no envelope
  });

  it('--json opts into the {node, basis} envelope', () => {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, '.git'), { recursive: true });
    const r = main(['node', repo, '--json']);
    expect(r.code).toBe(0);
    const parsed = JSON.parse(r.out) as { node: string; basis: string };
    expect(parsed.node).toBe(repo);
    expect(parsed.basis).toBe('.git');
  });

  it('COMPOSES: read --under "$(node <repo-path>)" loads the in-node record (the wake load line)', () => {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, '.git'), { recursive: true });
    process.chdir(repo);
    main(['encode', '--home', home, '--body', 'in-node event']);

    // The composition exactly as the wake ritual shells it: the node verb's
    // stdout (trimmed by $(...)), fed as the --under filter.
    const nodeOut = main(['node', repo]).out.trim();
    const composed = main([
      'read',
      '--home',
      home,
      '--under',
      nodeOut,
      '--count',
    ]);
    expect(composed.out.trim()).toBe('1');

    // Falsifier: the JSON envelope as the filter matches ZERO records — the
    // exact G1 silent-under-load defect the bare-path contract kills.
    const envelope = main(['node', repo, '--json']).out.trim();
    const broken = main([
      'read',
      '--home',
      home,
      '--under',
      envelope,
      '--count',
    ]);
    expect(broken.out.trim()).toBe('0');
  });

  it('needs a path positional', () => {
    const r = main(['node']);
    expect(r.code).toBe(2);
  });
});

describe('fold (CLI)', () => {
  it('emits {id, node, basis} per record in log order; cwd-less lands in legacy; byte-deterministic', () => {
    const repo = join(root, 'repo');
    mkdirSync(join(repo, '.git'), { recursive: true });
    process.chdir(repo);
    main(['encode', '--home', home, '--body', 'in-repo']);
    // Seed a legacy v1 record (no cwd) — fold must not throw.
    appendFileSync(
      join(home, 'EPISODIC.jsonl'),
      `${JSON.stringify({ id: '01BX5ZZKBKACTAV9WEVGEMMVRZ', scope: 'plan:polis/x', body: 'old' })}\n`,
      'utf8',
    );

    const r1 = main(['fold', '--home', home]);
    expect(r1.code).toBe(0);
    const lines = r1.out.trim().split('\n');
    expect(lines).toHaveLength(2);
    const first = JSON.parse(lines[0] as string) as Record<string, string>;
    const second = JSON.parse(lines[1] as string) as Record<string, string>;
    expect(first.node).toBe(logRecords()[0]?.cwd); // the repo root, as recorded
    expect(first.basis).toBe('.git');
    expect(second).toEqual({
      id: '01BX5ZZKBKACTAV9WEVGEMMVRZ',
      node: 'legacy',
      basis: 'no-cwd',
    });

    // Same log ⇒ byte-identical manifest.
    const r2 = main(['fold', '--home', home]);
    expect(r2.out).toBe(r1.out);
  });

  it('an empty log folds to an empty manifest', () => {
    const r = main(['fold', '--home', home]);
    expect(r.code).toBe(0);
    expect(r.out).toBe('');
  });
});

describe('lock (CLI)', () => {
  it('acquire → held conflict → release → free', () => {
    expect(main(['lock', 'acquire', '--home', home]).code).toBe(0);
    const conflict = main(['lock', 'acquire', '--home', home]);
    expect(conflict.code).toBe(1);
    expect(conflict.err).toMatch(/lock held/);
    expect(main(['lock', 'status', '--home', home]).out).toMatch(/held/);
    expect(main(['lock', 'release', '--home', home]).code).toBe(0);
    expect(main(['lock', 'status', '--home', home]).out.trim()).toBe('free');
  });

  it('steals a stale lock (mtime older than 2h)', () => {
    expect(main(['lock', 'acquire', '--home', home]).code).toBe(0);
    // Backdate the lock file beyond the stale threshold.
    const lockFile = join(home, 'dream.lock');
    const old = (Date.now() - (2 * 60 * 60 * 1000 + 60_000)) / 1000;
    utimesSync(lockFile, old, old);
    const r = main(['lock', 'acquire', '--home', home]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/stole stale lock/);
  });

  it('needs an action', () => {
    const r = main(['lock', '--home', home]);
    expect(r.code).toBe(2);
  });
});

describe('migrate', () => {
  it('converts a markdown EPISODIC.md to JSONL and reports the item count', () => {
    const src = join(root, 'EPISODIC.md');
    writeFileSync(src, '## Stream\n- item one\n- item two\n', 'utf8');
    const dest = join(root, 'EPISODIC.jsonl');
    const r = main(['migrate', src, dest]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/migrated: 2 items/);
    const recs = parseLines(readFileSync(dest, 'utf8'));
    expect(recs).toHaveLength(2);
    // Migrated records are cwd-less → the legacy bucket by construction.
    for (const rec of recs) expect(rec.cwd).toBeUndefined();
  });

  it('dry-run writes nothing', () => {
    const src = join(root, 'EPISODIC.md');
    writeFileSync(src, '## Stream\n- item\n', 'utf8');
    const dest = join(root, 'out.jsonl');
    const r = main(['migrate', src, dest, '--dry-run']);
    expect(r.code).toBe(0);
    expect(existsSync(dest)).toBe(false);
  });

  it('needs both positionals', () => {
    const r = main(['migrate', 'only-src.md']);
    expect(r.code).toBe(2);
  });
});

describe('dispatch', () => {
  it('help prints usage naming the v2 verb surface', () => {
    const r = main(['--help']);
    expect(r.code).toBe(0);
    for (const verb of [
      'encode',
      'read',
      'node',
      'fold',
      'lock',
      'drain',
      'audit',
      'migrate',
    ])
      expect(r.out).toContain(verb);
  });

  it('unknown command errors with usage', () => {
    const r = main(['frobnicate']);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/unknown command/);
  });

  it('--version prints a version', () => {
    const r = main(['--version']);
    expect(r.code).toBe(0);
    expect(r.out.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('install is a documented no-op self-check', () => {
    const r = main(['install']);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/installed as a PATH tool/);
  });
});

describe('init (fresh home provisioning)', () => {
  it('seeds the three stores into a fresh home', () => {
    const fresh = join(root, 'fresh-home');
    const r = main(['init', '--home', fresh]);
    expect(r.code).toBe(0);
    for (const f of ['SEMANTIC.md', 'PROCEDURAL.md', 'EPISODIC.jsonl'])
      expect(existsSync(join(fresh, f))).toBe(true);
    // idempotent: a second init clobbers nothing.
    writeFileSync(join(fresh, 'SEMANTIC.md'), 'MINE', 'utf8');
    main(['init', '--home', fresh]);
    expect(readFileSync(join(fresh, 'SEMANTIC.md'), 'utf8')).toBe('MINE');
  });
});

describe('encode session binding (never sessionless)', () => {
  it('errors when no session is resolvable (no env, no live session)', () => {
    vi.stubEnv('CLAUDE_SESSION_ID', '');
    const r = main(['encode', '--home', home, '--body', 'x']);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/no session bound/);
  });

  it('falls back to the sole live registered session', () => {
    vi.stubEnv('CLAUDE_SESSION_ID', '');
    main(['session', 'register', '--home', home, '--session', 'only-live']);
    const r = main(['encode', '--home', home, '--body', 'bound']);
    expect(r.code).toBe(0);
    const [rec] = logRecords();
    expect(rec?.session).toBe('only-live');
  });
});
