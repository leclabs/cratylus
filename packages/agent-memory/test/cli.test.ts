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
  vi.stubEnv('AGENT_SESSION_ID', 'cli-test-sess');
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

  it('REFUSES a caller-supplied --cwd, and derives cwd on the clean path', () => {
    const session = join(root, 'real-cwd');
    mkdirSync(session, { recursive: true });
    process.chdir(session);

    const r = main(['encode', '--home', home, '--body', 'x']);
    expect(r.code).toBe(0);
    const [rec] = logRecords();
    expect(rec?.cwd).toBe(process.cwd());
    expect(rec?.cwd).not.toBe('/evil');

    const spoof = main([
      'encode',
      '--home',
      home,
      '--cwd',
      '/evil',
      '--body',
      'x',
    ]);
    expect(spoof.code).toBe(2);
    expect(spoof.err).toContain('--cwd');
    expect(logRecords()).toHaveLength(1);
  });

  it('a destructive verb REFUSES to run when probed for usage', () => {
    main(['encode', '--home', home, '--body', 'keep me']);
    expect(logRecords()).toHaveLength(1);

    const probe = main(['drain', '--home', home, '--help']);
    expect(probe.code).toBe(0);
    expect(probe.out).toContain('memory drain');
    expect(logRecords()).toHaveLength(1);

    const typo = main(['drain', '--home', home, '--completed']);
    expect(typo.code).toBe(2);
    expect(typo.err).toContain('--completed');
    expect(logRecords()).toHaveLength(1);
  });

  it('a --scope value is an INERT tags entry — any shape accepted, never validated, never routing', () => {
    // v1 grammar shapes AND arbitrary shapes both pass (the tag grammar retired).
    for (const scope of ['user', 'project:demo', 'plan:demo/x', 'whatever!']) {
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
      ['project:demo'],
      ['plan:demo/x'],
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
    main(['encode', '--home', home, '--scope', 'project:demo', '--body', 'p']);
    main(['encode', '--home', home, '--scope', 'user', '--body', 'u']);
    const r = main(['read', '--home', home, '--scope', 'project:demo']);
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
      `${JSON.stringify({ id: '01BX5ZZKBKACTAV9WEVGEMMVRZ', scope: 'plan:demo/x', body: 'old' })}\n`,
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

  // The dream cell declares `lock-precondition ≜ acquire(lock) before any write
  // to {SEMANTIC · PROCEDURAL} ∨ any drain`. These pin that the CODE makes it true.
  describe('partition guard — the shared-partition writes obey the lock', () => {
    it('REFUSES a drain while another session holds the lock', () => {
      main(['encode', '--home', home, '--session', 'mine', '--body', 'keep']);
      main(['lock', 'acquire', '--home', home, '--session', 'someone-else']);

      const r = main(['drain', '--home', home, '--session', 'mine']);
      expect(r.code).toBe(1);
      expect(r.err).toMatch(/held by another session/);
      expect(logRecords()).toHaveLength(1);
    });

    it('proceeds under MY lock and leaves it held for the rest of the ritual', () => {
      main(['encode', '--home', home, '--session', 'mine', '--body', 'gone']);
      main(['lock', 'acquire', '--home', home, '--session', 'mine']);

      const r = main(['drain', '--home', home, '--session', 'mine']);
      expect(r.code).toBe(0);
      expect(main(['lock', 'status', '--home', home]).out).toMatch(/held/);
    });

    it('auto-acquires and releases when no lock is held', () => {
      main(['encode', '--home', home, '--session', 'mine', '--body', 'gone']);

      const r = main(['drain', '--home', home, '--session', 'mine']);
      expect(r.code).toBe(0);
      expect(main(['lock', 'status', '--home', home]).out.trim()).toBe('free');
    });
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

describe('apply — land the agent’s dream route decisions', () => {
  it('applies listed decisions (land + drop) and RETAINS unlisted records', () => {
    const a = main(['encode', '--home', home, '--body', 'ident']).out.trim();
    const b = main(['encode', '--home', home, '--body', 'scaffold']).out.trim();
    const c = main(['encode', '--home', home, '--body', 'unlisted']).out.trim();
    const routes = JSON.stringify([
      { id: a, targets: [{ store: 'SEMANTIC', content: 'who-i-am' }] },
      { id: b, targets: [] }, // drop
    ]);
    const r = main(['apply', '--home', home, '--routes', routes]);
    expect(r.code).toBe(0);
    expect(readFileSync(join(home, 'SEMANTIC.md'), 'utf8')).toContain(
      'who-i-am',
    );
    // a consumed (landed SEMANTIC), b consumed (dropped) — c is UNLISTED, retained.
    expect(logRecords().map((rec) => rec.id)).toEqual([c]);
  });

  it('an EPISODIC target retains the listed record too', () => {
    const a = main([
      'encode',
      '--home',
      home,
      '--body',
      'next-step',
    ]).out.trim();
    const routes = JSON.stringify([
      { id: a, targets: [{ store: 'EPISODIC' }] },
    ]);
    expect(main(['apply', '--home', home, '--routes', routes]).code).toBe(0);
    expect(logRecords().map((rec) => rec.id)).toEqual([a]);
  });

  it('routes content to PROCEDURAL as well', () => {
    const a = main(['encode', '--home', home, '--body', 'x']).out.trim();
    const routes = JSON.stringify([
      { id: a, targets: [{ store: 'PROCEDURAL', content: 'a-lesson' }] },
    ]);
    const r = main(['apply', '--home', home, '--routes', routes]);
    expect(r.code).toBe(0);
    expect(readFileSync(join(home, 'PROCEDURAL.md'), 'utf8')).toContain(
      'a-lesson',
    );
  });

  it('rejects a route to a retired/unknown store loudly', () => {
    const id = main(['encode', '--home', home, '--body', 'x']).out.trim();
    const routes = JSON.stringify([
      { id, targets: [{ store: 'SELF', content: 'q' }] },
    ]);
    const r = main(['apply', '--home', home, '--routes', routes]);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/not a store/);
  });

  it('errors on a non-array --routes', () => {
    const r = main(['apply', '--home', home, '--routes', '{"id":"x"}']);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/array/);
  });
});

describe('replace — whole-file supersede of a prose store', () => {
  it('overwrites SEMANTIC.md with the body (supersede, not append)', () => {
    writeFileSync(join(home, 'SEMANTIC.md'), 'OLD CONTENT\n', 'utf8');
    const r = main([
      'replace',
      '--home',
      home,
      '--store',
      'SEMANTIC',
      '--body',
      'NEW BODY',
    ]);
    expect(r.code).toBe(0);
    expect(readFileSync(join(home, 'SEMANTIC.md'), 'utf8')).toBe('NEW BODY\n');
  });

  it('rejects EPISODIC loudly (raw log, not a whole-file prose store)', () => {
    const r = main([
      'replace',
      '--home',
      home,
      '--store',
      'EPISODIC',
      '--body',
      'x',
    ]);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/EPISODIC is the raw log/);
  });

  it('rejects an unknown/retired store loudly', () => {
    const r = main([
      'replace',
      '--home',
      home,
      '--store',
      'SELF',
      '--body',
      'x',
    ]);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/not a store/);
  });

  it('needs a body source', () => {
    const r = main(['replace', '--home', home, '--store', 'PROCEDURAL']);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/--body/);
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
      'apply',
      'replace',
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

  it('install is RETIRED — an unknown command (runtime placed per host by deploy)', () => {
    const r = main(['install']);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/unknown command: install/);
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
  it('MINTS a session when none is resolvable — a capture is never lost', () => {
    vi.stubEnv('AGENT_SESSION_ID', '');
    const r = main(['encode', '--home', home, '--body', 'x']);
    expect(r.code).toBe(0);
    const [rec] = logRecords();
    expect(rec?.session).toMatch(/^[0-9a-f-]{36}$/);

    // …and the minted id is registered, so the next encode binds to the SAME
    // session rather than minting a second one.
    const again = main(['encode', '--home', home, '--body', 'y']);
    expect(again.code).toBe(0);
    const recs = logRecords();
    expect(recs[1]?.session).toBe(rec?.session);
  });

  it('still REFUSES an ambiguous session (>1 live) rather than picking one', () => {
    vi.stubEnv('AGENT_SESSION_ID', '');
    main(['session', 'register', '--home', home, '--session', 'live-a']);
    main(['session', 'register', '--home', home, '--session', 'live-b']);
    const r = main(['encode', '--home', home, '--body', 'x']);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/ambiguous session/);
  });

  it('falls back to the sole live registered session', () => {
    vi.stubEnv('AGENT_SESSION_ID', '');
    main(['session', 'register', '--home', home, '--session', 'only-live']);
    const r = main(['encode', '--home', home, '--body', 'bound']);
    expect(r.code).toBe(0);
    const [rec] = logRecords();
    expect(rec?.session).toBe('only-live');
  });
});

describe('get — the prose-store reader, counterpart of replace', () => {
  it('hands back the whole current text, unchanged', () => {
    main(['replace', '--home', home, '--store', 'SEMANTIC', '--body', 'hi']);
    const r = main(['get', '--home', home, '--store', 'SEMANTIC']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('hi\n');
  });

  it('is empty, not an error, for a store not yet written', () => {
    const r = main(['get', '--home', home, '--store', 'PROCEDURAL']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('');
  });

  it('REFUSES EPISODIC — that is a record log, not a document', () => {
    const r = main(['get', '--home', home, '--store', 'EPISODIC']);
    expect(r.code).toBe(2);
  });
});

describe('rollover — land, drain and re-seed with no gap between them', () => {
  /** Encode one record and return its id. */
  function encoded(body: string): string {
    main(['encode', '--home', home, '--session', 'mine', '--body', body]);
    const recs = logRecords();
    return recs[recs.length - 1]?.id as string;
  }

  it('lands the routed content, empties the log, and re-seeds the residue', () => {
    const id = encoded('a durable law');
    const routes = JSON.stringify([
      { id, targets: [{ store: 'PROCEDURAL', content: 'a durable law' }] },
    ]);
    const r = main([
      'rollover',
      '--home',
      home,
      '--session',
      'mine',
      '--routes',
      routes,
      '--residue',
      JSON.stringify(['carry this forward']),
    ]);
    expect(r.code).toBe(0);

    // landed
    expect(
      main(['get', '--home', home, '--store', 'PROCEDURAL']).out,
    ).toContain('a durable law');
    // drained AND re-seeded: only the residue remains, nothing was lost
    const after = logRecords();
    expect(after).toHaveLength(1);
    expect(after[0]?.body).toBe('carry this forward');
  });

  it('re-seeds nothing when no residue is carried', () => {
    const id = encoded('consumed');
    const routes = JSON.stringify([
      { id, targets: [{ store: 'PROCEDURAL', content: 'consumed' }] },
    ]);
    const r = main([
      'rollover',
      '--home',
      home,
      '--session',
      'mine',
      '--routes',
      routes,
    ]);
    expect(r.code).toBe(0);
    expect(logRecords()).toHaveLength(0);
  });

  it('REFUSES entirely while another session holds the lock', () => {
    const id = encoded('untouched');
    main(['lock', 'acquire', '--home', home, '--session', 'someone-else']);
    const r = main([
      'rollover',
      '--home',
      home,
      '--session',
      'mine',
      '--routes',
      JSON.stringify([
        { id, targets: [{ store: 'PROCEDURAL', content: 'x' }] },
      ]),
    ]);
    expect(r.code).toBe(1);
    // nothing landed, nothing drained — the whole operation is refused, not half-run
    expect(main(['get', '--home', home, '--store', 'PROCEDURAL']).out).toBe('');
    expect(logRecords()).toHaveLength(1);
  });
});

describe('drain — "nothing archived" distinguishes empty from all-retained', () => {
  it('says RETAINED, not empty, when a live sibling holds the log', () => {
    main(['session', 'register', '--home', home, '--session', 'sibling']);
    main([
      'encode',
      '--home',
      home,
      '--session',
      'sibling',
      '--body',
      'theirs',
    ]);

    const r = main([
      'drain',
      '--home',
      home,
      '--session',
      'mine',
      '--for-session',
      'mine',
    ]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/1 record\(s\) retained/);
    expect(r.out).not.toMatch(/empty/);
    expect(logRecords()).toHaveLength(1); // theirs survived
  });

  it('still says EMPTY when the log really is', () => {
    main(['encode', '--home', home, '--session', 'mine', '--body', 'x']);
    main(['drain', '--home', home, '--session', 'mine']);
    const r = main(['drain', '--home', home, '--session', 'mine']);
    expect(r.out).toMatch(/empty/);
  });
});
