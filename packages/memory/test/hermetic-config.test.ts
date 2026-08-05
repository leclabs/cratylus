import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG_ENV, CONFIG_FILE, resolveConfigPath } from '../src/node.js';
import { AgentMemory } from '../src/strategy.js';

/**
 * THE CONVICTING SUITE for the hermetic-config sentinel in `test/setup.ts`.
 *
 * `resolveConfigPath` is `--config` ▸ `$AGENT_MEMORY_CONFIG` ▸ the nearest
 * `.cratylus.memory.json` at or above the cwd ▸ `$HOME/.cratylus.memory.json`.
 * The last arm reaches OUT OF THE SUITE: a developer with a real
 * `~/.cratylus.memory.json` would have its `projects` keys and `scopeMarkers`
 * silently steer any test that does not stub the sentinel. Nothing goes red —
 * the suite just answers differently on their machine than in CI. The machine
 * that landed the widening had no such file, so the leak could not be proven
 * either way, which is exactly the condition under which it stays hidden.
 *
 * So this file PLANTS one. `$HOME` is stubbed to a scratch directory holding a
 * config with distinctive content, the cwd is moved to a config-free scratch
 * directory (so the walk arm cannot reach it either — only the `$HOME` arm is
 * live), and the assertions are that the planted content reaches NOTHING.
 *
 * NOTE WHAT THIS FILE DOES NOT DO: it never stubs `AGENT_MEMORY_CONFIG`. That
 * is the point. The only thing standing between these assertions and the
 * planted config is `test/setup.ts`. Delete the `vi.stubEnv(CONFIG_ENV, '')`
 * line there and every `it` below goes red — verified, not asserted.
 */

/** A repo key no marker class and no other fixture in this package can produce. */
const PLANTED_REPO_KEY = 'quinctilius';
/** A scope marker filename likewise unique to this file. */
const PLANTED_SCOPE_MARKER = 'QUINCTILIUS-MARKER.txt';

let root: string;
let fakeHome: string;
let scratch: string;
let agentHome: string;
const origCwd = process.cwd();

beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'memory-hermetic-')));

  // (1) A stubbed $HOME carrying the operator's config. Sibling of `scratch`,
  // never an ancestor of it, so the cwd walk cannot reach it — if the planted
  // content shows up, it came through the `$HOME` arm and no other.
  fakeHome = join(root, 'fake-home');
  mkdirSync(fakeHome, { recursive: true });
  writeFileSync(
    join(fakeHome, CONFIG_FILE),
    `${JSON.stringify(
      {
        projects: [PLANTED_REPO_KEY],
        memory: { scopeMarkers: [PLANTED_SCOPE_MARKER] },
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  vi.stubEnv('HOME', fakeHome);
  vi.stubEnv('USERPROFILE', fakeHome); // win32 arm of os.homedir()

  // (2) A config-free cwd, so the walk arm resolves to nothing.
  scratch = join(root, 'scratch');
  mkdirSync(join(scratch, 'deep', 'dir'), { recursive: true });
  agentHome = join(root, 'agent-home');
  mkdirSync(agentHome, { recursive: true });
  process.chdir(scratch);
});

afterEach(() => {
  process.chdir(origCwd);
  rmSync(root, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe('the suite is sealed against the developer’s $HOME config', () => {
  it('the plant is real: $HOME is stubbed and the config is where resolution would find it', () => {
    // Guards the fixture itself. If this fails, every assertion below is vacuous
    // and would pass with the sentinel removed — a green test proving nothing.
    expect(homedir()).toBe(fakeHome);
    expect(resolveConfigPath(undefined)).not.toBe(join(fakeHome, CONFIG_FILE));
    // ...and the ONLY reason it is not found is the sentinel:
    expect(process.env[CONFIG_ENV]).toBe('');
  });

  it('resolution returns the sentinel, never the planted $HOME config', () => {
    expect(resolveConfigPath()).toBe('');
  });

  it('audit derives NO repo key from the planted config (a leaked key fires on prose)', () => {
    writeFileSync(
      join(agentHome, 'SEMANTIC.md'),
      [
        '# some-agent — semantic',
        `I trust ${PLANTED_REPO_KEY} to hold.`,
        '',
      ].join('\n'),
      'utf8',
    );
    const report = new AgentMemory({ home: agentHome }).audit();

    expect(report.scanned).toContain(join(agentHome, 'SEMANTIC.md'));
    expect(report.findings).toEqual([]);
    expect(JSON.stringify(report)).not.toContain(PLANTED_REPO_KEY);
  });

  it('node resolution ignores the planted scopeMarkers (a leaked marker moves the boundary)', () => {
    // A marker file whose pattern EXISTS ONLY in the planted config. Leak the
    // config and this ancestor becomes a boundary, moving the node up one level.
    writeFileSync(join(scratch, PLANTED_SCOPE_MARKER), '', 'utf8');
    const probe = join(scratch, 'deep', 'dir');

    const res = new AgentMemory({ home: agentHome }).node(probe);
    expect(res.node).toBe(probe);
    expect(res.basis).toBe('markerless');
  });
});

describe('the sentinel is an EMPTY STRING, not an unset var', () => {
  it("'' short-circuits the chain; deleting the var falls through to $HOME", () => {
    // The distinction `resolveConfigPath`'s `??` is built on, pinned so a future
    // "simplification" of setup.ts to `stubEnv(CONFIG_ENV, undefined)` fails here
    // rather than silently reopening the $HOME arm across the whole suite.
    expect(resolveConfigPath()).toBe('');

    vi.stubEnv(CONFIG_ENV, undefined as unknown as string);
    expect(process.env[CONFIG_ENV]).toBeUndefined();
    expect(resolveConfigPath()).toBe(join(fakeHome, CONFIG_FILE));
  });
});
