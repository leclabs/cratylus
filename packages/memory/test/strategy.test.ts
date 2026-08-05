import { mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runtimePlugin, seedTemplates } from '../src/index.js';
import { AgentMemory } from '../src/strategy.js';

let root: string;
let home: string;
const origCwd = process.cwd();

beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'memory-strategy-')));
  home = join(root, 'agent-home');
  mkdirSync(home, { recursive: true });
  vi.stubEnv('CRATYLUS_CONFIG', '');
  vi.stubEnv('AGENT_SESSION_ID', 'strategy-test-sess');
});

afterEach(() => {
  process.chdir(origCwd);
  rmSync(root, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe('home() — the c13e911 three-tier precedence, preserved EXACTLY', () => {
  it('explicit home (--home / homeOverride) WINS over $AGENT_HOME and name', () => {
    vi.stubEnv('AGENT_HOME', '/env/home');
    const mem = new AgentMemory({ name: 'nico', home });
    // bound home wins over both env and name
    expect(mem.home()).toBe(home);
    // an explicit override arg wins over everything, incl. the bound home
    expect(mem.home(undefined, '/explicit/x')).toBe('/explicit/x');
  });

  it('$AGENT_HOME wins over name when no explicit home is given', () => {
    vi.stubEnv('AGENT_HOME', '/env/home');
    const mem = new AgentMemory({ name: 'nico' });
    expect(mem.home()).toBe('/env/home');
    // ...but a name+no-env resolves the ~/.agents/<name> default
    vi.stubEnv('AGENT_HOME', '');
    expect(mem.home()).toBe(join(homedir(), '.agents', 'nico'));
  });

  it('name → ~/.agents/<name> is the lowest tier; none resolves ⇒ throws', () => {
    vi.stubEnv('AGENT_HOME', '');
    expect(new AgentMemory().home('nico')).toBe(
      join(homedir(), '.agents', 'nico'),
    );
    expect(() => new AgentMemory().home()).toThrow(/required/);
  });
});

describe('the strategy rehouses the verbs (bound to one home)', () => {
  it('init seeds the three stores; encode → read round-trips a record', () => {
    const mem = new AgentMemory({ home });
    const r = mem.init('nico');
    expect(r.home).toBe(home);
    expect(r.seeded.sort()).toEqual(
      ['EPISODIC.jsonl', 'PROCEDURAL.md', 'SEMANTIC.md'].sort(),
    );

    const id = mem.encode({ body: 'hello from the strategy' });
    expect(id).toHaveLength(26);

    const recs = mem.read();
    expect(recs).toHaveLength(1);
    expect(recs[0]?.id).toBe(id);
    expect(recs[0]?.body).toBe('hello from the strategy');
  });

  it('a second init leaves present stores untouched (never clobbered)', () => {
    const mem = new AgentMemory({ home });
    mem.init('nico');
    const again = mem.init('nico');
    expect(again.seeded).toEqual([]);
    expect(again.present.sort()).toEqual(
      ['EPISODIC.jsonl', 'PROCEDURAL.md', 'SEMANTIC.md'].sort(),
    );
  });
});

describe('the runtime plugin carries the MemoryStrategy', () => {
  it('runtimePlugin.name is "memory" and .memory implements the port verbs', () => {
    expect(runtimePlugin.name).toBe('memory');
    expect(runtimePlugin.memory).toBeDefined();
    for (const verb of [
      'home',
      'init',
      'encode',
      'read',
      'node',
      'fold',
      'lock',
      'session',
      'drain',
      'apply',
      'replace',
      'audit',
      'migrate',
    ] as const) {
      expect(typeof runtimePlugin.memory?.[verb]).toBe('function');
    }
  });

  it('exposes the seedTemplates the forge (S6) imports', () => {
    expect(seedTemplates.map(([f]) => f)).toEqual([
      'SEMANTIC.md',
      'PROCEDURAL.md',
      'EPISODIC.jsonl',
    ]);
  });
});
