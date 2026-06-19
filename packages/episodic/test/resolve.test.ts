import { describe, expect, it } from 'vitest';
import {
  type HostEnv,
  assertScope,
  createHostEnv,
  parseScope,
  resolveFile,
} from '../src/resolve.js';

/** Two simulated hosts differing only in home root — the portability scenario. */
function hostFor(homeRoot: string): HostEnv {
  return createHostEnv(`${homeRoot}/.claude/agents/mav`, {
    polis: `${homeRoot}/workspaces/polis`,
  });
}

const LEX = hostFor('/Users/lex');
const LCAR = hostFor('/Users/lcaraccioli');

describe('parseScope', () => {
  it('parses user and project scopes', () => {
    expect(parseScope('user')).toEqual({ tier: 'user' });
    expect(parseScope('project:polis')).toEqual({
      tier: 'project',
      key: 'polis',
    });
  });

  it('rejects unknown or malformed scopes', () => {
    expect(() => parseScope('global')).toThrow();
    expect(() => parseScope('project:')).toThrow();
    expect(() => assertScope('nope')).toThrow();
  });
});

describe('resolveFile', () => {
  it('resolves user scope to agentHome()/path', () => {
    expect(resolveFile(LEX, 'user', 'EPISODIC.jsonl')).toBe(
      '/Users/lex/.claude/agents/mav/EPISODIC.jsonl',
    );
  });

  it('resolves project scope to projectRoot(key)/path', () => {
    expect(resolveFile(LEX, 'project:polis', 'notes/EPISODIC.jsonl')).toBe(
      '/Users/lex/workspaces/polis/notes/EPISODIC.jsonl',
    );
  });

  it('PORTABILITY GATE: same (scope, path) → same logical store on two home roots', () => {
    // The stored identity is (scope, path); each host derives its own absolute
    // path. Strip the host-specific home prefix and the logical store is identical.
    const rel = (
      host: HostEnv,
      scope: 'user' | `project:${string}`,
      p: string,
    ) => resolveFile(host, scope, p);

    const lexUser = rel(LEX, 'user', 'EPISODIC.jsonl');
    const lcarUser = rel(LCAR, 'user', 'EPISODIC.jsonl');
    expect(lexUser).toBe('/Users/lex/.claude/agents/mav/EPISODIC.jsonl');
    expect(lcarUser).toBe(
      '/Users/lcaraccioli/.claude/agents/mav/EPISODIC.jsonl',
    );
    // Same logical suffix beneath each host's agent home.
    expect(lexUser.replace('/Users/lex', '')).toBe(
      lcarUser.replace('/Users/lcaraccioli', ''),
    );

    const lexProj = rel(LEX, 'project:polis', 'sub/EPISODIC.jsonl');
    const lcarProj = rel(LCAR, 'project:polis', 'sub/EPISODIC.jsonl');
    expect(lexProj.replace('/Users/lex', '')).toBe(
      lcarProj.replace('/Users/lcaraccioli', ''),
    );
  });

  it('rejects absolute paths (no absolute-path storage)', () => {
    expect(() => resolveFile(LEX, 'user', '/etc/passwd')).toThrow(/absolute/);
  });

  it('rejects paths that escape the scope base', () => {
    expect(() => resolveFile(LEX, 'user', '../../../etc/passwd')).toThrow(
      /escape/,
    );
    expect(() => resolveFile(LEX, 'user', '..')).toThrow(/escape/);
  });

  it('normalizes interior . and intermediate .. that stay within base', () => {
    expect(resolveFile(LEX, 'user', './a/b/../EPISODIC.jsonl')).toBe(
      '/Users/lex/.claude/agents/mav/a/EPISODIC.jsonl',
    );
  });

  it('rejects empty path and unknown project key', () => {
    expect(() => resolveFile(LEX, 'user', '')).toThrow();
    expect(() => resolveFile(LEX, 'project:unknown', 'x')).toThrow(
      /Unknown project/,
    );
  });

  it('createHostEnv requires absolute roots', () => {
    expect(() => createHostEnv('relative/home')).toThrow(/absolute/);
  });
});
